// A class on bad Wi-Fi, with the teacher's two roles, against a running site
// (local dev or deployed):
//
//   node scripts/simulate.mjs [base-url] [players] [--all-poll] [--tempo]
//
// --all-poll: every student over long-polling, and the number of HTTP
// requests reported (the Free plan's budget on a network without
// WebSockets).
// --tempo: the class plays with a 10 s countdown ("Time: 10") and points for
// speed; on the first question the teacher presses +5 and -5 while the class
// reads, and the length must come back to 10 s. Each
// question is read first; the teacher presses Go (twice: a doubled Go must
// not reveal); answering closes when everyone present has answered or time
// is up, and only then does the teacher reveal. Taps carry the device's own
// time, and the scores are checked against it.
//
// The upload's tab is the Projector and steers itself; a phone comes in with
// the teacher code, is asked, steers from here, and steers from then on
// (docs/user-flow.md §1, docs/after-upload.md §4). 25 students join; a
// fifth of them only get through over HTTP long-polling (as on a network that
// blocks WebSockets). During the quiz, devices drop their connection and come
// back (sleep, Wi-Fi), answers sent just before a drop are resent, one tablet
// dies silently (its socket just goes quiet) and its student picks their
// avatar back on another device, a stray avatar is removed, and the teacher
// changes a key after the reveal, voids one question and skips another. The
// phone dies silently too, and the Projector takes the steering back.
//
// At the end every student's score must equal what their acknowledged
// answers and the teacher's fixes say. That is the constraint "survives
// school Wi-Fi" made checkable: nothing lost, nothing counted twice.
//
// After the final ranking the roles are put through their cases
// (docs/after-upload.md §4): the phone comes back as the Remote, and a third
// device is told both tabs are there; "again" opens a new class with the
// same code and the old class's tablets are told it has finished; the Remote
// leaves; a tab on HTTP answers "Show the quiz here" and the one that steered
// itself becomes the Remote; ⇄ Swap three times, from either side; once the
// next class has a student, the class code reaches no role, the teacher code
// still does, and so does the uploading device's secret; with nothing there,
// a device takes the Projector and steers. Last, wrong teacher codes: the
// fifth from one device locks its teacher codes, the secret still gets in.
// The quiz is deleted.

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const ALL_POLL = process.argv.includes("--all-poll");
const TEMPO = process.argv.includes("--tempo");
// --no-dress: the class doesn't dress in the lobby (to measure what dressing costs).
const DRESS = !process.argv.includes("--no-dress");
const SECONDS = 10;
// shared/tempo.ts
const POINTS_RIGHT = 10;
const SPEED_BONUS = 5;
const speedBonus = (ms, clockMs) => Math.round(SPEED_BONUS * Math.max(0, Math.min(1, 1 - ms / clockMs)));
const BASE = (args[0] ?? "http://127.0.0.1:8788").replace(/\/$/, "");
const N = Number(args[1] ?? 25);
let requests = 0;
const WS_BASE = BASE.replace(/^http/, "ws");

const QUIZ = `Title: Simulation

1. Q one?
- ant
+ bee
- cat
- dog

2. Q two, two right?
+ ant
+ bee
- cat

3. Q three?
+ ant
- bee
- cat

4. Q four (to be voided)?
- ant
+ bee

5. Q five (to be skipped)?
+ ant
- bee

6. Q six?
- ant
- bee
+ cat
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
const T0 = Date.now();

async function post(path, body, signal) {
  requests++;
  const res = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
  return { status: res.status, body: await res.json() };
}

/** A tab's line, like client/net.ts: WebSocket or long-poll, commands resent until acknowledged. */
class Device {
  constructor(name, instance, auth, mode) {
    Object.assign(this, { name, instance, auth, mode });
    this.pending = new Map();
    this.handlers = [];
    this.online = true;
    this.stopped = false;
    this.v = -1;
    this.seq = 0;
    this.view = null;
    this.got = [];
  }
  on(f) {
    this.handlers.push(f);
  }
  start() {
    if (this.mode === "ws") this.connect();
    else this.pollLoop();
  }
  connect() {
    if (this.stopped || !this.online) return;
    const ws = new WebSocket(`${WS_BASE}/api/i/${this.instance}/ws`);
    this.ws = ws;
    let pinger;
    ws.onopen = () => {
      ws.send(JSON.stringify({ t: "hello", auth: this.auth }));
      for (const [id, p] of this.pending) ws.send(JSON.stringify({ t: "cmd", id, cmd: p.cmd }));
      // Like client/net.ts: a ping every 20 s, answered by the runtime.
      pinger = setInterval(() => {
        if (!this.frozen && ws.readyState === 1) ws.send("ping");
      }, 20_000);
    };
    ws.onmessage = (e) => {
      if (this.frozen || e.data === "pong") return;
      this.handle(JSON.parse(e.data));
    };
    ws.onclose = (e) => {
      clearInterval(pinger);
      if (this.ws === ws) this.ws = null;
      // Like client/net.ts: 4000 is "gone", 4001 "your role moved"; the page decides.
      if (e.code === 4000 || e.code === 4001) return;
      if (!this.stopped && this.online && !this.frozen) setTimeout(() => this.connect(), 500);
    };
  }
  /** The device sleeps or loses Wi-Fi: no messages either way for a while. */
  async drop(ms) {
    this.online = false;
    const ws = this.ws;
    this.ws = null;
    if (ws) ws.close();
    await sleep(ms);
    this.online = true;
    if (this.mode === "ws") this.connect();
  }
  /** Like a page that navigates to its new role: the same tab, a new line with the new auth. */
  reconnectAs(auth) {
    this.auth = auth;
    this.v = -1;
    this.view = null;
    this.stopped = false;
    if (this.mode === "ws") {
      const ws = this.ws;
      this.ws = null;
      if (ws) ws.close();
      this.connect();
    } else if (!this.polling) this.pollLoop();
  }
  /** Like client/net.ts `repoll`: a guest became a player; a poll held as the guest is let go. */
  repoll() {
    this.pollAbort?.abort();
  }
  kill() {
    this.stopped = true;
    this.online = false;
    clearInterval(this.ticker);
    if (this.ws) this.ws.close();
  }
  /** The battery dies: no goodbye. The socket stays open on the server's side and simply goes quiet. */
  freeze() {
    this.frozen = true;
    this.stopped = true;
    clearInterval(this.ticker);
  }
  /** Like the teacher pages: ask for the view now and then, since presence changes with time. */
  tickEvery(ms) {
    this.ticker = setInterval(() => !this.stopped && void this.send({ op: "tick" }), ms);
  }
  handle(m) {
    this.got.push(m.t);
    if (m.t === "ack" && this.pending.has(m.id)) {
      const resolve = this.pending.get(m.id).resolve;
      this.pending.delete(m.id);
      resolve(m);
    }
    if (m.t === "state") {
      this.v = Math.max(this.v, m.view.v);
      this.view = m.view;
    }
    if (m.t === "choose" && this.v < 0) this.v = 0;
    if (m.t === "gone" || m.t === "lost") {
      // Like client/net.ts: nothing pending can succeed any more.
      for (const [id, p] of this.pending) p.resolve({ t: "ack", id, ok: false, error: m.t });
      this.pending.clear();
      this.stopped = true;
      clearInterval(this.ticker);
    }
    for (const f of this.handlers) f(m);
  }
  send(cmd) {
    const id = `${this.name}-${++this.seq}`;
    return new Promise((resolve) => {
      this.pending.set(id, { cmd, resolve });
      if (this.mode === "ws") {
        if (this.ws && this.ws.readyState === 1 && this.online) this.ws.send(JSON.stringify({ t: "cmd", id, cmd }));
      } else void this.flushHttp();
    });
  }
  async flushHttp() {
    if (this.flushing) return;
    this.flushing = true;
    while (this.pending.size > 0 && !this.stopped) {
      if (!this.online) {
        await sleep(200);
        continue;
      }
      const [id, { cmd }] = this.pending.entries().next().value;
      try {
        const r = await post(`/api/i/${this.instance}/cmd`, { auth: this.auth, cmd: { id, cmd } });
        for (const m of r.body.messages ?? []) this.handle(m);
        if (this.pending.has(id)) {
          const p = this.pending.get(id);
          this.pending.delete(id);
          p.resolve({ t: "ack", id, ok: false, error: "no answer" });
        }
      } catch {
        await sleep(500);
      }
    }
    this.flushing = false;
  }
  async pollLoop() {
    this.polling = true;
    while (!this.stopped) {
      if (!this.online) {
        await sleep(200);
        continue;
      }
      try {
        this.pollAbort = new AbortController();
        const r = await post(`/api/i/${this.instance}/poll`, { auth: this.auth, v: this.v }, this.pollAbort.signal).catch((e) => {
          // Like client/net.ts: let go on purpose, ask again at once.
          if (this.pollAbort?.signal.aborted) return { body: { messages: [] }, repolled: true };
          throw e;
        });
        if (r.repolled) continue;
        const msgs = r.body.messages ?? [];
        for (const m of msgs) this.handle(m);
        if (msgs.some((m) => m.t === "gone" || m.t === "lost")) break;
        if (msgs.length === 0) await sleep(300);
      } catch {
        await sleep(500);
      }
    }
    this.polling = false;
  }
}

// ---------------------------------------------------------------------------

const failures = [];
const check = (cond, msg) => {
  if (!cond) failures.push(msg);
};
const until = async (cond, ms, what) => {
  const t = Date.now();
  while (!cond()) {
    if (Date.now() - t > ms) throw new Error(`timeout waiting for ${what}`);
    await sleep(50);
  }
};

const up = await post("/api/quiz", { text: TEMPO ? QUIZ.replace("\n\n", `\nTime: ${SECONDS}\n\n`) : QUIZ });
if (!up.body.ok) throw new Error("upload failed: " + JSON.stringify(up.body));
const { id: instance, code, token: screenToken, teacher } = up.body;
check(/^\d{5}$/.test(code), `the upload returns the quiz's code (${code})`);
check(/^\d{2}$/.test(teacher), `the upload returns the teacher code's two digits (${teacher})`);
log("uploaded", instance.slice(0, 8), "code", code);

// The pasting tab: the Projector, steering itself while no Remote is there.
const projector = new Device("projector", instance, { role: "screen", token: screenToken }, "ws");
projector.start();
projector.tickEvery(15_000);
await until(() => projector.view, 5000, "projector view");
check(projector.view.role === "screen" && projector.view.phase === "lobby", "the upload opens a lobby on the Projector");
check(!!projector.view.steer, "the Projector steers while no Remote is there");
check(projector.view.code === code, "the Projector shows the quiz's code");
check(projector.view.teacher === teacher && projector.view.steer.teacher === teacher, "the Projector's views carry the teacher code");
{
  const ok = await post("/api/join", { code: code + teacher });
  check(ok.status === 200 && ok.body.instance === instance, `the teacher code opens the quiz at /api/join (${ok.status})`);
  const bad = await post("/api/join", { code: code + (teacher === "00" ? "01" : "00") });
  check(bad.status === 404 && bad.body.error === "teacher", `a wrong teacher code is told so (${bad.status} ${bad.body.error})`);
}
const skipped = await projector.send({ op: "setSkip", q: 4, value: true });
check(skipped.ok, "the steering Projector can fix a question");

// The teacher's phone: the teacher code in the code box, then "Steer it from here".
async function guestTakes(name, role, mode, creds = { teacher }) {
  const r = await post("/api/join", { code: code + teacher });
  const d = new Device(name, r.body.instance, { role: "guest" }, mode);
  let offered = null;
  d.on((m) => {
    if (m.t === "choose" && !offered) {
      offered = m;
      void d.send({ op: "takeRole", role, ...creds });
    }
    if (m.t === "role") {
      d.roleMsg ??= m;
      d.reconnectAs({ role: m.role, token: m.token });
    }
  });
  d.start();
  // On HTTP, the guest's poll held at the time runs out first (up to 25 s);
  // the page itself would have moved to its role's page at once.
  await until(() => d.view, mode === "poll" ? 30_000 : 8000, `${name} holding the ${role}`);
  return { d, offered };
}
const firstPhone = await guestTakes("phone", "remote", "ws");
const phone = firstPhone.d;
check(firstPhone.offered.entry === "ask", `the phone is asked while one tab shows and steers (${firstPhone.offered.entry})`);
check(phone.view.role === "teacher", "the phone's tab is the Remote");
await until(() => projector.view.steer === null && projector.view.remote === "present", 5000, "the Projector to stop steering");
const refused = await projector.send({ op: "setVoid", q: 0, value: true });
check(!refused.ok, "the Projector doesn't steer while the Remote is there");

// A teacher device that comes in and takes a role on demand; extra: its credentials.
async function guestTry(name, role, extra = {}) {
  const r = await post("/api/join", { code });
  const d = new Device(name, r.body.instance, { role: "guest" }, "ws");
  let offered = null;
  let roleMsg = null;
  d.on((m) => {
    if (m.t === "choose") offered ??= m;
    if (m.t === "role") {
      roleMsg ??= m;
      d.reconnectAs({ role: m.role, token: m.token });
    }
  });
  d.start();
  await until(() => offered, 5000, `${name}'s choice`);
  const ack = await d.send({ op: "takeRole", role, ...extra });
  if (ack.ok) await until(() => d.view, 8000, `${name} holding the ${role}`);
  return { d, offered, ack, roleMsg };
}

// What a device that came in now would be told, without acting on it.
async function offeredTo(name) {
  const r = await post(`/api/i/${instance}/poll`, { auth: { role: "guest" }, v: -1 });
  return (r.body.messages ?? []).find((m) => m.t === "choose") ?? { entry: "none", name };
}

let remoteSteers = true;
const tv = () => (remoteSteers ? phone.view : projector.view?.steer);
const steerer = () => (remoteSteers ? phone : projector);

// Students
const players = [];
async function joinPlayer(name, mode, claimId = null, acked = {}, timeout = 15000) {
  const r = await post("/api/join", { code });
  if (!r.body.instance) throw new Error("join failed " + JSON.stringify(r.body));
  const d = new Device(name, r.body.instance, { role: "guest" }, mode);
  const p = { name, d, id: null, acked, view: null, joining: false, shown: {} };
  let refresh = null;
  d.on((m) => {
    if (m.t === "choose" && !p.joining) {
      if (claimId) {
        // Coming back: wait until the old avatar is offered (its device
        // counts as away), asking again now and then like client/play.ts.
        if (!m.avatars.some((a) => a.id === claimId)) {
          refresh ??= setInterval(() => !p.joining && void d.send({ op: "tick" }), 5000);
          return;
        }
        clearInterval(refresh);
        p.joining = true;
        void d.send({ op: "claim", player: claimId });
        return;
      }
      p.joining = true;
      void d.send({ op: "newPlayer" });
    }
    if (m.t === "welcome") {
      p.id = m.player;
      p.run = m.run;
      p.token = m.token;
      d.auth = { role: "player", token: m.token, run: m.run };
      d.repoll();
    }
    if (m.t === "state" && m.view.role === "player") {
      p.view = m.view;
      // Like client/play.ts: when the answers appeared on this device, per question.
      const q = m.view.question;
      if (q && q.answering !== "reading" && q.sinceMs !== null && p.shown[q.q] === undefined) p.shown[q.q] = Date.now() - q.sinceMs;
      maybeAnswer(p);
    }
  });
  d.start();
  await until(() => p.id, timeout, `${name} welcome`);
  return p;
}

const answering = new Set();
function maybeAnswer(p) {
  const v = p.view;
  if (!v || v.phase !== "question" || !v.question || p.dead) return;
  // Countdown: nothing to tap while the class reads; the open view comes with Go.
  if (v.question.answering !== "open") return;
  const key = `${p.name}:${v.question.q}`;
  if (answering.has(key)) return;
  answering.add(key);
  const q = v.question.q;
  void (async () => {
    await sleep(rnd(100, 1500));
    const n = v.question.answers.length;
    const tries = Math.random() < 0.25 ? 2 : 1; // some change their mind
    let last = -1;
    for (let i = 0; i < tries; i++) {
      // Like client/play.ts: a tap only while the device shows this question,
      // naming the view it was made on. A device that is offline still shows it.
      const shown = p.view;
      if (shown.phase !== "question" || shown.question?.q !== q || shown.question.answering !== "open") break;
      const choice = Math.floor(Math.random() * n);
      // Like client/play.ts: the answer already chosen isn't sent again (the
      // server would keep the first tap, and its time, anyway).
      if (choice === last) continue;
      last = choice;
      const seq = Date.now() * 10 + i;
      const ms = p.shown[q] !== undefined ? Date.now() - p.shown[q] : undefined;
      // Some answers are sent just before the device drops: the line must resend them.
      const dropAfter = p.d.mode === "ws" && Math.random() < 0.15;
      const sent = p.d.send({ op: "answer", q, choice, seq, v: shown.v, ms });
      if (dropAfter) void p.d.drop(rnd(300, 2500));
      sent.then((a) => {
        if (a.ok) {
          const prev = p.acked[q];
          // The same answer again keeps its first tap's time, as on the server.
          if (!prev || prev.seq < seq) p.acked[q] = prev?.choice === choice ? { ...prev, seq } : { choice, seq, ms };
        }
      });
      await sleep(rnd(200, 600));
    }
  })();
}

for (let i = 0; i < N; i++) {
  players.push(await joinPlayer(`s${i}`, ALL_POLL || i % 5 === 4 ? "poll" : "ws"));
}
// A stray avatar (a double tab), removed by the teacher.
const ghost = await joinPlayer("ghost", "ws");
await until(() => tv().run.players.length === N + 1, 5000, "all players in the Remote's view");
await phone.send({ op: "remove", player: ghost.id });
ghost.d.kill();
log(`${N} students joined (${players.filter((p) => p.d.mode === "poll").length} over long-polling), ghost removed`);

// Dressing in the lobby (backlog v2 item 5, docs/avatars.md). Like
// client/play.ts: one `dress` in flight per device, the latest pick sent
// next, so a burst of taps sends the first and the last. Every student
// picks a few looks; the server stores the class's looks once a second.
const looks = new Map(); // player id → the look last acknowledged
const sameLook = (x, y) => (x.b ?? 0) === (y.b ?? 0) && (x.h ?? 0) === (y.h ?? 0);
function dresser(p) {
  let want = null;
  let inFlight = false;
  const pump = () => {
    if (inFlight || !want) return;
    const sent = want;
    inFlight = true;
    void p.d.send({ op: "dress", b: sent.b, h: sent.h }).then((a) => {
      inFlight = false;
      if (a.ok) looks.set(p.id, sent);
      else want = null; // refused: the device shows what is stored
      if (want === sent) want = null;
      pump();
    });
  };
  return { pick: (look) => ((want = look), pump()), idle: () => !inFlight && !want };
}
if (DRESS) {
const requestsBeforeDressing = requests;
const dressStarted = Date.now();
let taps = 0;
const dressers = players.map((p) => ({ p, d: dresser(p) }));
await Promise.all(
  dressers.map(async ({ p, d }) => {
    const n = 1 + Math.floor(Math.random() * 6);
    for (let i = 0; i < n; i++) {
      await sleep(rnd(50, 600));
      d.pick({ b: Math.floor(Math.random() * 6), h: Math.floor(Math.random() * 9) });
      taps++;
    }
  }),
);
await until(() => dressers.every(({ d }) => d.idle()), 20_000, "the looks to be stored");
const dressSends = requests - requestsBeforeDressing;
// Every screen shows the look each student last had acknowledged.
await until(
  () => players.every((p) => !looks.has(p.id) || (p.view?.me && sameLook(p.view.me.avatar, looks.get(p.id)))),
  10_000,
  "every tablet to show its look",
).catch(() => {});
await until(() => projector.view.players.every((w) => !looks.has(w.id) || sameLook(w.avatar, looks.get(w.id))), 10_000, "the wall to show the looks").catch(() => {});
for (const p of players) {
  const want = looks.get(p.id) ?? { b: 0, h: 0 };
  check(!!p.view?.me && sameLook(p.view.me.avatar, want), `${p.name}: the tablet shows the look acknowledged (${JSON.stringify(p.view?.me?.avatar)} vs ${JSON.stringify(want)})`);
  const onWall = projector.view.players.find((w) => w.id === p.id);
  check(!!onWall && sameLook(onWall.avatar, want), `${p.name}: the wall shows the look acknowledged`);
  const onRemote = tv().run.players.find((w) => w.id === p.id);
  check(!!onRemote && sameLook(onRemote.avatar, want) && onRemote.avatar.a === p.view?.me?.avatar.a && onRemote.avatar.c === p.view?.me?.avatar.c, `${p.name}: the Remote shows the look, on the same animal and colour`);
}
log(`dressing: ${taps} taps by ${players.length} students in ${((Date.now() - dressStarted) / 1000).toFixed(1)} s${ALL_POLL ? `, ${dressSends} HTTP requests` : ""}`);

// A device that doesn't wait for its answers (not our page): the server
// stores MAX_LOOK_CHANGES (30) changes per student and refuses the rest.
{
  // Over a WebSocket, so the 40 arrive in order and each one is a change.
  const rogue = [...players].reverse().find((p) => p.d.mode === "ws") ?? players[players.length - 1];
  const before = looks.get(rogue.id) ?? { b: 0, h: 0 };
  const flips = Array.from({ length: 40 }, (_, i) => ({ b: (before.b + 1 + (i % 2)) % 6, h: before.h }));
  const acks = await Promise.all(flips.map((l) => rogue.d.send({ op: "dress", ...l })));
  // Taken until the changes are spent; after that only the look already
  // stored is acknowledged (nothing to store), every change refused.
  const first = acks.findIndex((a) => !a.ok);
  const kept = first > 0 ? flips[first - 1] : null;
  check(first > 0 && first <= 30, `a hammering device: changes taken until they are spent (the first refused: ${first + 1} of 40)`);
  check(!!kept && acks.every((a, i) => i < first || a.ok === sameLook(flips[i], kept)), "after that, every change is refused");
  // What counts is what is stored; the Remote's view says which.
  await sleep(1500);
  const shown = tv().run.players.find((w) => w.id === rogue.id).avatar;
  looks.set(rogue.id, { b: shown.b ?? 0, h: shown.h ?? 0 });
  await until(() => rogue.view?.me && sameLook(rogue.view.me.avatar, shown), 10_000, "the hammering tablet to show the stored look").catch(() => {});
  check(sameLook(rogue.view.me.avatar, shown), "the hammering tablet shows the look that is stored");
}
}

// Random sleep and Wi-Fi loss during the quiz.
let chaos = true;
void (async () => {
  while (chaos) {
    await sleep(rnd(200, 700));
    const p = players[Math.floor(Math.random() * players.length)];
    if (!p.dead && p.d.online) void p.d.drop(rnd(500, 5000));
  }
})();

const at = () => ({ phase: tv().phase, current: tv().current, reading: tv().answering === "reading", votes: tv().votes });
const active = () => players.filter((p) => !p.dead).length;
let qi = 0;
if (TEMPO) {
  const t = await steerer().send({ op: "tempo", tempo: "speed" });
  check(t.ok, "the tempo is set in the lobby");
  await until(() => tv().tempo === "speed", 5000, "the tempo in the teacher's view");
  check(tv().questions.every((q) => q.seconds === SECONDS), "the quiz's Time: line gives every question its length");
  check(tv().countdown === null, "no -5/+5 in the lobby");
}
await steerer().send({ op: "begin", at: at() });
{
  // The look is fixed at Start.
  const p = players[0];
  const now = looks.get(p.id) ?? { b: 0, h: 0 };
  const late = await p.d.send({ op: "dress", b: (now.b + 1) % 6, h: now.h });
  check(!late.ok, "dressing is refused once the quiz has started");
}
let closedByAll = 0;
let closedByTime = 0;
let deadPlayer = null;
let revival = null;
let lateTap = null;
for (;;) {
  await until(() => tv().phase === "question", 5000, "question");
  const current = tv().current;
  if (TEMPO) {
    check(tv().answering === "reading", `question ${current + 1} opens for reading (${tv().answering})`);
    await sleep(rnd(300, 1200)); // the teacher reads it out
    if (current === 0) {
      check(tv().countdown === SECONDS, `the pair shows this question's ${SECONDS} s (${tv().countdown})`);
      await steerer().send({ op: "nudge", by: 5 });
      await until(() => tv().countdown === SECONDS + 5, 5000, "+5 while reading");
      await steerer().send({ op: "nudge", by: -5 });
      await until(() => tv().countdown === SECONDS, 5000, "-5 back again");
    }
    const readAt = { ...at() };
    // A double tap on Go (or a retry) must not reveal.
    await Promise.all([steerer().send({ op: "go", at: readAt }), steerer().send({ op: "go", at: readAt })]);
    await until(() => tv().answering !== "reading", 5000, "Go");
    await sleep(300);
    check(tv().phase === "question", `a doubled Go doesn't reveal question ${current + 1} (${tv().phase})`);
  }
  // Wait until the class has answered (or 12 s: some devices are asleep).
  // With the countdown: until answering closes, by everyone present having
  // answered or by time's up.
  const t = Date.now();
  if (TEMPO && current === 2) {
    // The late tap below needs the answers open: the teacher reveals early, with the clock still running.
    await sleep(400);
    check(tv().answering === "open", `question 3 still open 0.4 s after Go (${tv().answering})`);
  } else if (TEMPO) {
    await until(() => tv().answering === "closed", (SECONDS + 5) * 1000, `answering to close on question ${current + 1}`);
    const took = Date.now() - t;
    if (took < SECONDS * 1000 - 300) closedByAll++;
    else closedByTime++;
    check(took < SECONDS * 1000 + 3000, `time's up comes on time (${took} ms after Go for a ${SECONDS} s countdown)`);
  } else {
    while (tv().run.answered < active() && Date.now() - t < 12000) await sleep(100);
    await sleep(800); // stragglers changing their mind
  }
  if (current === 2) {
    // Item 15: a tablet taps while offline, the teacher reveals, then the tap
    // arrives. The tablet showed the question as open, so the tap counts.
    // A tablet on WebSockets if there is one (with --all-poll only a revived one may be).
    const ready = (x) => !x.dead && x.d.online && x.view?.phase === "question" && (!TEMPO || x.view.question?.answering === "open");
    const p = players.find((x) => x.d.mode === "ws" && ready(x)) ?? players.find(ready);
    void p.d.drop(3000);
    const choice = 0;
    const seq = Date.now() * 10 + 9;
    const ms = p.shown[current] !== undefined ? Date.now() - p.shown[current] : undefined;
    lateTap = p.d.send({ op: "answer", q: current, choice, seq, v: p.view.v, ms }).then((a) => {
      check(a.ok, `${p.name}: a tap made before the reveal and delivered after it counts`);
      const prev = p.acked[current];
      if (a.ok && (!prev || prev.seq < seq)) p.acked[current] = prev?.choice === choice ? { ...prev, seq } : { choice, seq, ms };
    });
    log(`${p.name} taps while offline; the reveal goes out before the tap arrives`);
  }
  log(`question ${current + 1}: ${tv().run.answered}/${tv().run.players.length} answered, revealing (${remoteSteers ? "Remote" : "Projector"})`);
  // The wall's "who has answered" (v2 item 7): exactly the answers counted, of no more than the class.
  {
    const w = projector.view;
    check(w.answeredBy.length === w.answered && w.answered <= w.of && w.of <= w.players.length, `question ${current + 1}: the wall shows ${w.answeredBy.length} avatars for ${w.answered} answers of ${w.of} (${w.players.length} players)`);
  }
  if (current === 3) {
    // A Remote page from before the votes step reveals straight from the question.
    await steerer().send({ op: "reveal", at: { phase: "question", current } });
    await until(() => tv().phase === "reveal", 5000, "reveal without the votes");
  } else {
    // Spread, then key (v2 item 6); a double tap on either (or a retry) must not skip anything.
    const v0 = at();
    await Promise.all([steerer().send({ op: "votes", at: v0 }), steerer().send({ op: "votes", at: v0 })]);
    await until(() => tv().votes, 5000, "the votes");
    await sleep(300);
    check(tv().phase === "question" && tv().answering === "closed", `a doubled press on the votes doesn't show question ${current + 1}'s key (${tv().phase}, ${tv().answering})`);
    await until(() => projector.view?.votes, 5000, "the votes on the wall");
    check(!projector.view.reveal && projector.view.votes.reduce((a, b) => a + b, 0) <= projector.view.answered, `question ${current + 1}: the wall shows the votes without the key`);
    const v1 = at();
    const a1 = steerer().send({ op: "reveal", at: v1 });
    const a2 = steerer().send({ op: "reveal", at: v1 });
    await Promise.all([a1, a2]);
    await until(() => tv().phase === "reveal", 5000, "reveal");
  }
  if (current === 0) {
    // The key was wrong: "cat" counts instead of "bee". The teacher's view
    // lists the answers in the order on screen, which the command follows.
    const shown = tv().questions[0].answers.map((x) => x.text);
    await steerer().send({ op: "setCounts", q: 0, counts: shown.map((t) => t === "cat") });
  }
  if (current === 1) {
    // A tablet dies without a goodbye; its student comes back on another
    // device and picks their avatar once the old device counts as away.
    // A device that is connected right now: one mid-drop would just be away.
    deadPlayer = players.find((p) => p.d.mode === (ALL_POLL ? "poll" : "ws") && !p.dead && p.d.online && (ALL_POLL || p.d.ws?.readyState === 1));
    deadPlayer.dead = true;
    deadPlayer.d.freeze();
    log(`device of ${deadPlayer.name} dies silently`);
    const dead = deadPlayer;
    revival = (async () => {
      await sleep(1500);
      const back = await joinPlayer(`${dead.name}-again`, "ws", dead.id, dead.acked, 120_000);
      check(back.id === dead.id, `the dead device's student got their avatar back (${back.id} vs ${dead.id})`);
      players[players.indexOf(dead)] = back;
      await until(() => back.view?.me, 10_000, "the revived student's view").catch(() => {});
      check(sameLook(back.view?.me?.avatar ?? { b: -1 }, looks.get(dead.id) ?? {}), "the student back on another device has their look");
      log(`${dead.name} is back on another device as the same avatar`);
    })();
  }
  if (current === 3) await steerer().send({ op: "setVoid", q: 3, value: true });
  if (qi === 1) {
    await steerer().send({ op: "ranking", at: at() });
    await until(() => tv().phase === "ranking", 5000, "ranking");
    // The phone's battery dies, silently: after about 45 s the Projector
    // steers again by itself (user flow, rule 6).
    phone.freeze();
    const t0 = Date.now();
    log("the phone dies silently");
    await until(() => projector.view?.steer, 120_000, "the Projector to steer again");
    remoteSteers = false;
    check(projector.view.remote === "away", `the Projector shows the Remote as away (${projector.view.remote})`);
    // A new phone with the teacher code would take the steering without a question.
    const offered = await offeredTo("new-phone");
    check(offered.entry === "remote", `with the Remote gone, a new device is sent to it (${offered.entry})`);
    log(`the Projector steers again after ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  qi++;
  const before = { ...at() };
  await steerer().send({ op: "next", at: before });
  await steerer().send({ op: "next", at: before }); // a retried Next is ignored
  await until(() => tv().phase !== "reveal" && tv().phase !== "ranking", 5000, "next");
  if (revival && tv().phase === "question" && tv().current === 2) {
    // The teacher waits for the student to be back before going on.
    await revival;
    revival = null;
  }
  if (tv().phase === "final") break;
}
chaos = false;
await lateTap;
await sleep(500);

// Expected scores from acknowledged answers and the final fixes.
const fin = tv();
const fixes = fin.questions.map((q) => ({ counts: q.answers.map((a) => a.counts), void: q.void, skip: q.skip, status: q.status }));
const scored = fixes.map((f, i) => (f.status === "revealed" && !f.void && !f.skip ? i : -1)).filter((i) => i >= 0);
check(JSON.stringify(scored) === JSON.stringify([0, 1, 2, 5]), `scored questions ${scored}`);
const byId = new Map(fin.run.players.map((p) => [p.id, p]));
check(fin.run.players.length === N, `players in the final view: ${fin.run.players.length}, expected ${N}`);
let total = 0;
const pts = (a) => (TEMPO ? POINTS_RIGHT + speedBonus(a.ms, SECONDS * 1000) : 1);
for (const p of players) {
  const expected = scored.filter((q) => p.acked[q] && fixes[q].counts[p.acked[q].choice]).reduce((sum, q) => sum + pts(p.acked[q]), 0);
  const got = byId.get(p.id)?.score;
  total += expected;
  check(got === expected, `${p.name}: score ${got}, expected ${expected}`);
}
for (const p of players) {
  const got = byId.get(p.id)?.avatar;
  check(!!got && sameLook(got, looks.get(p.id) ?? {}), `${p.name}: the look at the end is the one from the lobby`);
}
for (const e of fin.run.ranking.top) check(e.avatar && [...byId.values()].some((p) => p.avatar.a === e.avatar.a && p.avatar.c === e.avatar.c && sameLook(p.avatar, e.avatar)), "the ranking shows the avatars dressed");
log(`final: ${players.length} students, ${total} points in total, ranking top: ${fin.run.ranking.top.map((e) => `${e.place}.${e.score}`).join(" ")}`);
if (TEMPO) {
  log(`answering closed: ${closedByAll} times by everyone present having answered, ${closedByTime} times by time's up`);
  check(fin.run.ranking.speed === true, "the ranking knows the scores include speed");
}

// Students still connected see their own result. A drop the chaos started
// just before the end lasts up to 5 s; wait it out rather than count a
// device that is still asleep as one that missed the view.
await until(() => players.every((p) => p.dead || p.d.online), 6000, "the last drops to end").catch(() => {});
await sleep(1500);
const withView = players.filter((p) => !p.dead && p.view && p.view.phase === "final");
check(withView.length >= players.length - 3, `final view reached ${withView.length}/${players.length} devices`);

// --- the roles' cases (user flow §1)

// The phone comes back (charged): it is the Remote again, and the Projector stops steering.
const phone2 = new Device("phone-back", instance, phone.auth, "ws");
phone2.start();
phone2.tickEvery(20_000);
await until(() => phone2.view, 5000, "the phone's view on coming back");
check(phone2.view.role === "teacher", "a Remote coming back after being away resumes");
await until(() => projector.view.steer === null, 5000, "the Projector to hand the steering back");
{
  // Both tabs there: a third device pushes nobody aside.
  const third = await guestTry("third", "remote", { teacher });
  check(third.offered.entry === "full" && !third.ack.ok && third.ack.error === "changed", `with both tabs there, a third device takes nothing (${third.offered.entry}, ${third.ack.error})`);
  third.d.kill();
}
log("the phone is back as the Remote; a third device is told both are there");

// Again with another class: same code, a fresh lobby; the old class's tablets are told it has finished.
const old = players.find((p) => !p.dead && p.d.mode === "ws" && p.d.ws) ?? players.find((p) => !p.dead && !p.d.stopped);
const oldGone = new Promise((res) => old.d.on((m) => m.t === "gone" && res(m.reason)));
const again = await phone2.send({ op: "again", at: { phase: "final", current: phone2.view.current } });
check(again.ok, "again is acknowledged");
await until(() => phone2.view.phase === "lobby" && phone2.view.run.players.length === 0, 5000, "the new class's lobby");
check(phone2.view.code === code, "the new class keeps the code");
const q0 = Object.fromEntries(phone2.view.questions[0].answers.map((x) => [x.text, x.counts]));
check(q0.cat && !q0.bee, "the new class keeps the corrections");
const reason = await Promise.race([oldGone, sleep(5000).then(() => "nothing")]);
check(reason === "This quiz has finished.", `an old class's tablet is told the quiz has finished (${reason})`);
// A tablet of the old class that was asleep, coming back with its token.
const sleeper = await post(`/api/i/${instance}/poll`, { auth: { role: "player", token: "not-in-this-class", run: old.run }, v: -1 });
check((sleeper.body.messages ?? []).some((m) => m.t === "gone"), "an old class's tablet coming back doesn't slip into the new lobby");
// The same token on a page opened anew (the tablet was off between lessons): the next class's newcomer.
const reopened = await post(`/api/i/${instance}/poll`, { auth: { role: "player", token: "not-in-this-class", run: old.run, fresh: true }, v: -1 });
const reopenedMsgs = reopened.body.messages ?? [];
check(!reopenedMsgs.some((m) => m.t === "gone") && reopenedMsgs.some((m) => m.t === "choose" && m.stale === true && m.phase === "lobby"), "an old class's token on a page opened anew is offered the new lobby");
for (const p of players) p.d.kill();
log("again: new lobby, same code, old tablets finished");

// The Remote leaves: the Projector steers again at once.
await phone2.send({ op: "leave" });
phone2.kill();
await until(() => projector.view.steer, 5000, "the Projector to steer after the Remote left");
check(projector.view.remote === "none", "no Remote after it left");

// Another tab, on HTTP only, answers "Show the quiz here": the one that
// steered itself becomes the Remote (the phone uploaded, the laptop takes the wall).
projector.on((m) => m.t === "role" && projector.reconnectAs({ role: m.role, token: m.token }));
clearInterval(projector.ticker);
const projGotRole = new Promise((res) => projector.on((m) => m.t === "role" && res(m)));
const { d: wall, offered } = await guestTakes("wall", "screen", "poll");
check(offered.entry === "ask", `the self-steering Projector's quiz asks the new tab (${offered.entry})`);
const moved = await Promise.race([projGotRole, sleep(5000).then(() => null)]);
check(moved?.role === "remote", "the old Projector's tab is told it is the Remote now");
await until(() => projector.view?.role === "teacher", 5000, "the old Projector as the Remote");
await until(() => wall.view?.role === "screen" && wall.view.steer === null, 8000, "the new Projector not steering");
log("a tab on HTTP showed the quiz; the old one is the Remote");

// ⇄ Swap: from the Remote, back from the wall (on HTTP), and again from the Remote.
async function swapFrom(from, to, n) {
  const fromRole = from.view?.role === "teacher" ? "remote" : "screen";
  const heard = new Promise((res) => to.on((m) => m.t === "role" && res(m)));
  const ack = await from.send({ op: "swap" });
  check(ack.ok, `swap ${n} is acknowledged`);
  const msg = await Promise.race([heard, sleep(30_000).then(() => null)]);
  check(msg?.role === fromRole, `swap ${n}: the other tab is told it is the ${fromRole} now (${msg?.role})`);
  const want = fromRole === "remote" ? "screen" : "teacher";
  await until(() => from.view?.role === want && to.view?.role === (want === "screen" ? "teacher" : "screen"), 30_000, `swap ${n} on both tabs`);
}
await swapFrom(projector, wall, 1);
await swapFrom(wall, projector, 2);
await swapFrom(projector, wall, 3);
check(projector.view.role === "screen" && projector.view.steer === null, "after three swaps the first tab is the wall, not steering");
await wall.send({ op: "leave" });
wall.kill();
await until(() => projector.view?.steer, 5000, "the wall to steer once the other tab left");
log("swapped three times, from either side; the other tab left");

// The next class joins: the class code reaches no role; the teacher code does.
const newKid = await joinPlayer("next-class", "ws");
check(newKid.run !== old.run, "a student of the new class joins it");
await until(() => projector.view?.players?.length === 1, 5000, "the new student on the Projector");
{
  const child = await guestTry("child", "remote", {});
  check(!child.ack.ok && child.ack.error === "That isn't this quiz's teacher code.", `the class code alone takes no role (${child.ack.error})`);
  check(projector.view?.role === "screen" && !!projector.view.steer, "the Projector still steers");
  child.d.kill();
  const own = await guestTry("own-phone", "remote", { secret: up.body.secret });
  check(own.ack.ok, "with the quiz's secret, the uploading device takes the Remote, no digits needed");
  await until(() => !projector.view?.steer, 5000, "the Projector to stop steering for the returning phone");
  await own.d.send({ op: "leave" });
  own.d.kill();
  await until(() => projector.view?.steer, 5000, "the Projector to steer after the returning phone left");
  const next = await guestTry("borrowed-phone", "remote", { teacher });
  check(next.offered.entry === "ask" && next.ack.ok, `with students in, the teacher code takes the Remote (${next.offered.entry})`);
  await until(() => !projector.view?.steer, 5000, "the Projector to stop steering for the new phone");
  await next.d.send({ op: "leave" });
  next.d.kill();
  await until(() => projector.view?.steer, 5000, "the Projector to steer again");
}
log("the class code reached no role; the secret and the teacher code did");

// Nothing there (the self-steering Projector left with the class in): a device takes the Projector and steers.
await projector.send({ op: "leave" });
projector.kill();
const anyone = await guestTry("any-laptop", "screen", { teacher });
check(anyone.offered.entry === "screen", `with nothing there, a device is sent to the Projector (${anyone.offered.entry})`);
check(anyone.ack.ok, "with nothing there, a device takes the Projector");
await until(() => anyone.d.view?.steer, 5000, "the new Projector to steer itself");
log("nothing was there; a device took the Projector and steers");

// Wrong teacher codes: the fifth within a minute locks this device's teacher codes for the quiz.
{
  const wrongDigits = teacher === "00" ? "01" : "00";
  const statuses = [];
  for (let i = 0; i < 5; i++) statuses.push((await post("/api/join", { code: code + wrongDigits })).status);
  check(JSON.stringify(statuses) === JSON.stringify([404, 404, 404, 404, 429]), `five wrong teacher codes, the fifth locks (${statuses})`);
  const right = await post("/api/join", { code: code + teacher });
  check(right.status === 429 && right.body.error === "locked", `while locked, the right teacher code is refused too (${right.status})`);
  const viaRole = await guestTry("locked-out", "remote", { teacher });
  check(!viaRole.ack.ok && viaRole.ack.error === "Too many wrong codes for this quiz. Try again in a few minutes.", `while locked, takeRole is refused too (${viaRole.ack.error})`);
  viaRole.d.kill();
  const owner = await post("/api/join", { code: code + teacher, secret: up.body.secret });
  check(owner.status === 200, `the uploading device's secret still gets in (${owner.status})`);
  const students = await post("/api/join", { code });
  check(students.status === 200, "the class code still opens the quiz for students");
}
log("wrong teacher codes: locked after five; the secret and the class code unaffected");

const ended = await anyone.d.send({ op: "endInstance" });
check(ended.ok, "ending the instance is acknowledged");
const after = await post(`/api/i/${instance}/poll`, { auth: anyone.d.auth, v: -1 });
check((after.body.messages ?? []).some((m) => m.t === "gone"), "after the end, the instance is gone");
const joinAfter = await post("/api/join", { code });
check(joinAfter.status === 404, "after the end, the code opens nothing");
newKid.d.kill();
anyone.d.kill();

if (ALL_POLL) log(`HTTP requests by all devices: ${requests}`);
if (failures.length) {
  console.log(`\nFAILED (${failures.length}):\n- ` + failures.join("\n- "));
  process.exit(1);
}
console.log("\nOK: every score matches the acknowledged answers and the fixes; the roles behaved.");
process.exit(0);
