// A class on bad Wi-Fi, with the teacher's two roles, against a running site
// (local dev or deployed):
//
//   node scripts/simulate.mjs [base-url] [players] [--all-poll]
//
// --all-poll: every student over long-polling, and the number of HTTP
// requests reported (the Free plan's budget on a network without
// WebSockets).
//
// The upload's tab is the Projector and steers itself; a phone takes the
// Remote and steers from then on (docs/user-flow.md §1). 25 students join; a
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
// After the final ranking the roles are put through their cases: the phone
// comes back as the Remote; "again" opens a new class with the same code and
// the old class's tablets are told it has finished; the Remote leaves; a tab
// on HTTP takes the Projector from the one that steers itself, which becomes
// the Remote; that Remote shows the projector itself; once the next class
// has a student, a new tab at /teacher gets no steering; the quiz is deleted.

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const ALL_POLL = process.argv.includes("--all-poll");
const BASE = (args[0] ?? "http://127.0.0.1:8788").replace(/\/$/, "");
const N = Number(args[1] ?? 25);
let requests = 0;
const WS_BASE = BASE.replace(/^http/, "ws");

const QUIZ = `Title: Simulation

1. Q one?
- a
+ b
- c
- d

2. Q two, two right?
+ a
+ b
- c

3. Q three?
+ a
- b
- c

4. Q four (to be voided)?
- a
+ b

5. Q five (to be skipped)?
+ a
- b

6. Q six?
- a
- b
+ c
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
const T0 = Date.now();

async function post(path, body) {
  requests++;
  const res = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
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
        const r = await post(`/api/i/${this.instance}/poll`, { auth: this.auth, v: this.v });
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

const up = await post("/api/quiz", { text: QUIZ });
if (!up.body.ok) throw new Error("upload failed: " + JSON.stringify(up.body));
const { id: instance, code, token: screenToken } = up.body;
check(/^\d{5}$/.test(code), `the upload returns the quiz's code (${code})`);
log("uploaded", instance.slice(0, 8), "code", code);

// The pasting tab: the Projector, steering itself while no Remote is there.
const projector = new Device("projector", instance, { role: "screen", token: screenToken }, "ws");
projector.start();
projector.tickEvery(15_000);
await until(() => projector.view, 5000, "projector view");
check(projector.view.role === "screen" && projector.view.phase === "lobby", "the upload opens a lobby on the Projector");
check(!!projector.view.steer, "the Projector steers while no Remote is there");
check(projector.view.code === code, "the Projector shows the quiz's code");
const skipped = await projector.send({ op: "setSkip", q: 4, value: true });
check(skipped.ok, "the steering Projector can fix a question");

// The teacher's phone: /teacher, the code, Remote.
async function guestTakes(name, role, mode) {
  const r = await post("/api/join", { code });
  const d = new Device(name, r.body.instance, { role: "guest" }, mode);
  let offered = null;
  d.on((m) => {
    if (m.t === "choose" && !offered) {
      offered = m;
      void d.send({ op: "takeRole", role });
    }
    if (m.t === "role") d.reconnectAs({ role: m.role, token: m.token });
  });
  d.start();
  // On HTTP, the guest's poll held at the time runs out first (up to 25 s);
  // the page itself would have moved to its role's page at once.
  await until(() => d.view, mode === "poll" ? 30_000 : 8000, `${name} holding the ${role}`);
  return { d, offered };
}
const phone = (await guestTakes("phone", "remote", "ws")).d;
check(phone.view.role === "teacher", "the phone's tab is the Remote");
await until(() => projector.view.steer === null && projector.view.remote === "present", 5000, "the Projector to stop steering");
const refused = await projector.send({ op: "setVoid", q: 0, value: true });
check(!refused.ok, "the Projector doesn't steer while the Remote is there");

let remoteSteers = true;
const tv = () => (remoteSteers ? phone.view : projector.view?.steer);
const steerer = () => (remoteSteers ? phone : projector);

// Students
const players = [];
async function joinPlayer(name, mode, claimId = null, acked = {}, timeout = 15000) {
  const r = await post("/api/join", { code });
  if (!r.body.instance) throw new Error("join failed " + JSON.stringify(r.body));
  const d = new Device(name, r.body.instance, { role: "guest" }, mode);
  const p = { name, d, id: null, acked, view: null, joining: false };
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
    }
    if (m.t === "state" && m.view.role === "player") {
      p.view = m.view;
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
  const key = `${p.name}:${v.question.q}`;
  if (answering.has(key)) return;
  answering.add(key);
  const q = v.question.q;
  void (async () => {
    await sleep(rnd(100, 1500));
    const n = v.question.answers.length;
    const tries = Math.random() < 0.25 ? 2 : 1; // some change their mind
    for (let i = 0; i < tries; i++) {
      // Like client/play.ts: a tap only while the device shows this question,
      // naming the view it was made on. A device that is offline still shows it.
      const shown = p.view;
      if (shown.phase !== "question" || shown.question?.q !== q) break;
      const choice = Math.floor(Math.random() * n);
      const seq = Date.now() * 10 + i;
      // Some answers are sent just before the device drops: the line must resend them.
      const dropAfter = p.d.mode === "ws" && Math.random() < 0.15;
      const sent = p.d.send({ op: "answer", q, choice, seq, v: shown.v });
      if (dropAfter) void p.d.drop(rnd(300, 2500));
      sent.then((a) => {
        if (a.ok) {
          const prev = p.acked[q];
          if (!prev || prev.seq < seq) p.acked[q] = { choice, seq };
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

// Random sleep and Wi-Fi loss during the quiz.
let chaos = true;
void (async () => {
  while (chaos) {
    await sleep(rnd(200, 700));
    const p = players[Math.floor(Math.random() * players.length)];
    if (!p.dead && p.d.online) void p.d.drop(rnd(500, 5000));
  }
})();

const at = () => ({ phase: tv().phase, current: tv().current });
const active = () => players.filter((p) => !p.dead).length;
let qi = 0;
await steerer().send({ op: "begin", at: at() });
let deadPlayer = null;
let revival = null;
let lateTap = null;
for (;;) {
  await until(() => tv().phase === "question", 5000, "question");
  const current = tv().current;
  // Wait until the class has answered (or 12 s: some devices are asleep).
  const t = Date.now();
  while (tv().run.answered < active() && Date.now() - t < 12000) await sleep(100);
  await sleep(800); // stragglers changing their mind
  if (current === 2) {
    // Item 15: a tablet taps while offline, the teacher reveals, then the tap
    // arrives. The tablet showed the question as open, so the tap counts.
    // A tablet on WebSockets if there is one (with --all-poll only a revived one may be).
    const ready = (x) => !x.dead && x.d.online && x.view?.phase === "question";
    const p = players.find((x) => x.d.mode === "ws" && ready(x)) ?? players.find(ready);
    void p.d.drop(3000);
    const choice = 0;
    const seq = Date.now() * 10 + 9;
    lateTap = p.d.send({ op: "answer", q: current, choice, seq, v: p.view.v }).then((a) => {
      check(a.ok, `${p.name}: a tap made before the reveal and delivered after it counts`);
      if (a.ok && (!p.acked[current] || p.acked[current].seq < seq)) p.acked[current] = { choice, seq };
    });
    log(`${p.name} taps while offline; the reveal goes out before the tap arrives`);
  }
  log(`question ${current + 1}: ${tv().run.answered}/${tv().run.players.length} answered, revealing (${remoteSteers ? "Remote" : "Projector"})`);
  // A double tap on Reveal (or a retry) must not skip anything.
  const a1 = steerer().send({ op: "reveal", at: at() });
  const a2 = steerer().send({ op: "reveal", at: at() });
  await Promise.all([a1, a2]);
  await until(() => tv().phase === "reveal", 5000, "reveal");
  if (current === 0) {
    // The key was wrong: answer "c" counts instead of "b".
    await steerer().send({ op: "setCounts", q: 0, counts: [false, false, true, false] });
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
for (const p of players) {
  const expected = scored.filter((q) => p.acked[q] && fixes[q].counts[p.acked[q].choice]).length;
  const got = byId.get(p.id)?.score;
  total += expected;
  check(got === expected, `${p.name}: score ${got}, expected ${expected}`);
}
log(`final: ${players.length} students, ${total} points in total, ranking top: ${fin.run.ranking.top.map((e) => `${e.place}.${e.score}`).join(" ")}`);

// Students still connected see their own result.
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
log("the phone is back as the Remote");

// Again with another class: same code, a fresh lobby; the old class's tablets are told it has finished.
const old = players.find((p) => !p.dead && p.d.mode === "ws" && p.d.ws) ?? players.find((p) => !p.dead && !p.d.stopped);
const oldGone = new Promise((res) => old.d.on((m) => m.t === "gone" && res(m.reason)));
const again = await phone2.send({ op: "again", at: { phase: "final", current: phone2.view.current } });
check(again.ok, "again is acknowledged");
await until(() => phone2.view.phase === "lobby" && phone2.view.run.players.length === 0, 5000, "the new class's lobby");
check(phone2.view.code === code, "the new class keeps the code");
check(phone2.view.questions[0].answers[2].counts && !phone2.view.questions[0].answers[1].counts, "the new class keeps the corrections");
const reason = await Promise.race([oldGone, sleep(5000).then(() => "nothing")]);
check(reason === "This quiz has finished.", `an old class's tablet is told the quiz has finished (${reason})`);
// A tablet of the old class that was asleep, coming back with its token.
const sleeper = await post(`/api/i/${instance}/poll`, { auth: { role: "player", token: "not-in-this-class", run: old.run }, v: -1 });
check((sleeper.body.messages ?? []).some((m) => m.t === "gone"), "an old class's tablet coming back doesn't slip into the new lobby");
for (const p of players) p.d.kill();
log("again: new lobby, same code, old tablets finished");

// The Remote leaves: the Projector steers again at once.
await phone2.send({ op: "leave" });
phone2.kill();
await until(() => projector.view.steer, 5000, "the Projector to steer after the Remote left");
check(projector.view.remote === "none", "no Remote after it left");

// Another tab, on HTTP only, takes the Projector from the one that steers
// itself; that one becomes the Remote (the phone pasted, the laptop takes the wall).
const projGotRole = new Promise((res) => projector.on((m) => m.t === "role" && res(m)));
projector.on((m) => m.t === "role" && projector.reconnectAs({ role: m.role, token: m.token }));
clearInterval(projector.ticker);
const { d: wall, offered } = await guestTakes("wall", "screen", "poll");
check(offered.screen === "movable" && offered.remote === "free", `the self-steering Projector is offered as movable (${offered.screen}/${offered.remote})`);
const moved = await Promise.race([projGotRole, sleep(5000).then(() => null)]);
check(moved?.role === "remote", "the old Projector's tab is told it is the Remote now");
await until(() => projector.view?.role === "teacher", 5000, "the old Projector as the Remote");
await until(() => wall.view?.role === "screen" && wall.view.steer === null, 8000, "the new Projector not steering");
log("a tab on HTTP took the Projector; the old one is the Remote");

// That Remote shows the projector itself: the HTTP Projector, waiting in a poll, is told it lost the role.
const wallLost = new Promise((res) => wall.on((m) => m.t === "lost" && res(true)));
const here = await projector.send({ op: "projectorHere" });
check(here.ok, "show the projector here is acknowledged");
check(await Promise.race([wallLost, sleep(30_000).then(() => false)]), "the Projector on HTTP hears it lost its role");
await until(() => projector.view?.role === "screen" && projector.view.steer, 5000, "the Remote's tab as the Projector that steers itself");
log("the Remote's tab is the Projector again; the HTTP one let go");

// The next class joins; from now on no new tab gets the steering.
const newKid = await joinPlayer("next-class", "ws");
check(newKid.run !== old.run, "a student of the new class joins it");
await until(() => projector.view?.players?.length === 1, 5000, "the new student on the Projector");
{
  const r = await post("/api/join", { code });
  const g = new Device("child", r.body.instance, { role: "guest" }, "ws");
  let offered = null;
  g.on((m) => m.t === "choose" && (offered ??= m));
  g.start();
  await until(() => offered, 5000, "the child's choice");
  check(offered.remote === "closed" && offered.screen === "taken", `once students are in, a new tab is offered no steering (${offered.screen}/${offered.remote})`);
  const takeRemote = await g.send({ op: "takeRole", role: "remote" });
  const takeScreen = await g.send({ op: "takeRole", role: "screen" });
  check(!takeRemote.ok && !takeScreen.ok, "once students are in, a new tab can't take the Remote or the self-steering Projector");
  check(projector.view?.role === "screen" && !!projector.view.steer, "the Projector still steers");
  g.kill();
}
log("the next class is in; a new tab at /teacher gets no steering");

const ended = await projector.send({ op: "endInstance" });
check(ended.ok, "ending the instance is acknowledged");
const after = await post(`/api/i/${instance}/poll`, { auth: projector.auth, v: -1 });
check((after.body.messages ?? []).some((m) => m.t === "gone"), "after the end, the instance is gone");
const joinAfter = await post("/api/join", { code });
check(joinAfter.status === 404, "after the end, the code opens nothing");
newKid.d.kill();
projector.kill();
wall.kill();

if (ALL_POLL) log(`HTTP requests by all devices: ${requests}`);
if (failures.length) {
  console.log(`\nFAILED (${failures.length}):\n- ` + failures.join("\n- "));
  process.exit(1);
}
console.log("\nOK: every score matches the acknowledged answers and the fixes; the roles behaved.");
process.exit(0);
