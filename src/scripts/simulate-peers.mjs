// A Peers room (docs/design/peers.md) against a running site, local or
// deployed:
//
//   node scripts/simulate-peers.mjs [base-url] [--empty]
//
// Four friends: whoever uploads comes in as the room's first player, three
// join with the code, one of them over HTTP long-polling, whose polls the
// others' answers don't answer (who the room waits for comes with the
// poll's end). Nobody steers.
// Each question closes once everyone present has answered and the next
// comes once everyone present is done with the solution; resends change
// nothing. A phone goes silent with its socket open (a battery dying): after
// FRESH_MS the room moves on without it, by the instance's alarm, and when
// it comes back the room waits for it again. A tab that closes its socket
// is let go at once. Whoever opened the room changes a solution and removes
// an avatar; the others can't. Start's time runs on every device, the
// polling one included, a friend dressing on meanwhile, before the first
// question comes. A friend who is done starts a Countdown, on
// the question and on its solution: the polling device it waits for hears
// of it at once, and the room goes on at its end, not before. At the end
// every score must be what the answers and the fixes give, and nobody ends
// the room. Takes about two and a half minutes (the silent phone, the poll's
// end, Start's time, two Countdowns). With --empty it then leaves the final ranking and
// waits for the room to end by itself, ten minutes more.

const BASE = (process.argv[2]?.startsWith("http") ? process.argv[2] : "http://127.0.0.1:8788").replace(/\/+$/, "");
const EMPTY = process.argv.includes("--empty");
/** server/instance.ts: a Peers room ends once nobody has been at its final ranking for this long. */
const PEERS_EMPTY_MS = 10 * 60_000;
/** shared/tempo.ts: Countdown's length. */
const LAST_CALL_MS = 15_000;
/** shared/tempo.ts: from Start to the first question. */
const START_MS = 10_000;
const WS_BASE = BASE.replace(/^http/, "ws");
/** server/instance.ts: a device not heard from for this long is away. */
const FRESH_MS = 45_000;

const QUIZ = `Title: Peers check

1. One?
+ a
- b
- c

2. Two?
- a
+ b

3. Three?
+ a
- b

4. Four?
- a
+ b
`;

let failed = 0;
function check(ok, what) {
  console.log(`${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failed++;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(path, body, signal) {
  const res = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, body: json };
}

/** A friend's device: a player over a WebSocket, or over HTTP long-polling. */
class Device {
  constructor(name, instance, poll = false) {
    this.name = name;
    this.instance = instance;
    this.poll = poll;
    this.auth = { role: "guest" };
    this.view = null;
    this.acks = new Map();
    this.n = 0;
    this.gone = null;
    this.silent = false;
  }

  async open(token) {
    if (token) this.auth = { role: "player", token };
    if (this.poll) {
      this.polling = true;
      void this.pollLoop();
      if (!token) await this.join();
      return;
    }
    this.ws = new WebSocket(`${WS_BASE}/api/i/${this.instance}/ws`);
    await new Promise((res, rej) => {
      this.ws.addEventListener("open", res, { once: true });
      this.ws.addEventListener("error", rej, { once: true });
    });
    this.ws.addEventListener("message", (e) => {
      if (e.data === "pong") return;
      this.take(JSON.parse(e.data));
    });
    this.ws.send(JSON.stringify({ t: "hello", auth: this.auth }));
    // The page pings every 20 s; a silent phone doesn't.
    this.pinger = setInterval(() => !this.silent && this.ws.readyState === 1 && this.ws.send("ping"), 20_000);
    if (!token) await this.join();
  }

  async join() {
    const a = await this.send({ op: "newPlayer" });
    if (!a.ok) throw new Error(`${this.name} couldn't join: ${a.error}`);
  }

  take(m) {
    if (m.t === "state") {
      this.view = m.view;
      this.states = (this.states ?? 0) + 1;
    } else if (m.t === "welcome") {
      this.auth = { role: "player", token: m.token };
      this.id = m.player;
    }
    else if (m.t === "ack") this.acks.get(m.id)?.(m);
    else if (m.t === "gone") this.gone = m;
  }

  send(cmd) {
    const id = `${this.name}-${++this.n}`;
    if (this.poll) {
      return post(`/api/i/${this.instance}/cmd`, { auth: this.auth, cmd: { id, cmd } }).then((r) => {
        let ack = { ok: false, error: `status ${r.status}` };
        for (const m of r.body?.messages ?? []) {
          if (m.t === "ack" && m.id === id) ack = m;
          else this.take(m);
        }
        return ack;
      });
    }
    return new Promise((res) => {
      this.acks.set(id, res);
      this.ws.send(JSON.stringify({ t: "cmd", id, cmd }));
      setTimeout(() => res({ ok: false, error: "no acknowledgement" }), 10_000);
    });
  }

  async pollLoop() {
    while (this.polling) {
      const r = await post(`/api/i/${this.instance}/poll`, { auth: this.auth, v: this.view?.v ?? -1 }).catch(() => null);
      for (const m of r?.body?.messages ?? []) this.take(m);
      if (this.gone) return;
      await sleep(300);
    }
  }

  close() {
    clearInterval(this.pinger);
    this.polling = false;
    this.ws?.close();
  }

  /** Waits until this device's view satisfies `ok`. */
  async until(ok, what, ms = 8000) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (this.view && ok(this.view)) return true;
      await sleep(100);
    }
    check(false, `${this.name}: ${what} (phase ${this.view?.phase}, question ${this.view?.current})`);
    return false;
  }

  answer(text) {
    const q = this.view.question;
    return this.send({ op: "answer", q: q.q, choice: q.answers.indexOf(text), seq: Date.now(), v: this.view.v });
  }
}

const at = (v) => ({ phase: v.phase, current: v.current });

// --- The room opens: whoever uploads is its first player, there is no Projector.

const up = await post("/api/quiz", { text: QUIZ, mode: "peers", probe: true });
if (!up.body?.ok) {
  console.log("upload failed", up.status, up.body);
  process.exit(1);
}
const { id: instance, code, player } = up.body;
check(typeof player === "string" && player.length > 0 && up.body.token === "", "the upload in Peers gives a player, not a Projector");
check((await post("/api/join", { code: code + up.body.teacher })).status !== 200, "a Peers room takes no teacher code");

const host = new Device("host", instance);
await host.open(player);
await host.until((v) => v.peers?.host === true && v.phase === "lobby", "the opener is the room's host, in the lobby");
check(host.view.peers.code === code, "the opener's view carries the code for the others");

const friends = [new Device("ann", instance), new Device("ben", instance, true), new Device("cat", instance)];
for (const f of friends) {
  const j = await post("/api/join", { code });
  check(j.status === 200 && j.body.instance === instance, `${f.name} finds the room by its code`);
  await f.open();
}
const all = [host, ...friends];
const [ann, ben, cat] = friends;
await host.until((v) => v.peers.players.length === 4, "everyone in, on the opener's device");
check(ann.view.peers.host === false && !!ann.view.peers.hostAvatar, "the others see whose Start it is");
check((await ann.send({ op: "begin", at: { phase: "lobby", current: -1 } })).ok === false, "nobody else starts it");
check((await host.send({ op: "begin", at: { phase: "lobby", current: -1 } })).ok, "the opener starts it");
const started = Date.now();
for (const d of all) await d.until((v) => !!v.starts && v.phase === "lobby", "Start's time on every device, the polling one too");
const again = await host.send({ op: "begin", at: { phase: "lobby", current: -1 } });
check(again.ok && again.result === "stale", `a second Start while its time runs changes nothing (${again.result ?? "taken"})`);
check((await ann.send({ op: "dress", b: 2, h: 3, t: 0 })).ok, "a friend dresses on while Start's time runs");
for (const d of all) await d.until((v) => v.phase === "question" && v.question?.answering === "open", "question 1, its choices with it", START_MS + 8000);
check(Date.now() - started >= START_MS - 500, `question 1 comes START_MS after Start (${Date.now() - started} ms)`);
check((ann.view.me.avatar.b ?? 0) === 2 && (ann.view.me.avatar.h ?? 0) === 3, "the look dressed during Start's time is kept");
check((await ann.send({ op: "dress", b: 1, h: 1, t: 0 })).ok === false, "then the dressing is over");
check(!!ann.view.peers.question?.text, "the question itself is on each device");

/** Answers the open question on the given devices with the answer of that text. */
async function answerAll(devices, text) {
  for (const d of devices) {
    await d.until((v) => v.phase === "question" && v.question?.answers.length > 0, "the choices are open");
    const a = await d.answer(text);
    check(a.ok, `${d.name} answers "${text}"`);
  }
}
async function readyAll(devices, q) {
  for (const d of devices) check((await d.send({ op: "ready", q })).ok, `${d.name} is done with the solution of ${q + 1}`);
}

// --- Question 1: closes once all four answered; resends change nothing.
//     The polling device isn't woken by the others' answers: who the room
//     waits for comes with its poll's end (docs/design/hosting-and-limits.md,
//     "What a Peers room costs").

await answerAll([ben], "a");
await ben.until((v) => v.question?.mine !== null, "ben's answer stored, on his device");
await sleep(500);
const benStates = ben.states;
await answerAll([host, ann], "a");
await sleep(1500);
check(ben.states === benStates, `the others' answers don't answer the polling device's poll (${ben.states - benStates} views)`);
check(host.view.phase === "question", "three of four answered: the room waits");
check(JSON.stringify(host.view.peers.waitingFor) === JSON.stringify([cat.id]), "the room says who it waits for, on a socket at once");
await ben.until((v) => JSON.stringify(v.peers.waitingFor) === JSON.stringify([cat.id]), "who the room waits for, on the polling device with its poll's end", 30_000);
await answerAll([cat], "b");
for (const d of all) await d.until((v) => v.phase === "reveal", "the solution once everyone answered");
check(JSON.stringify(host.view.peers.dist) === JSON.stringify(host.view.question.answers.map((t) => (t === "a" ? 3 : t === "b" ? 1 : 0))), "the spread on each device");
check(host.view.peers.winners.length === 3, "three winners jump");
await readyAll([host, ann, ben], 0);
check((await ben.send({ op: "ready", q: 0 })).ok, "a resent done changes nothing");
await sleep(500);
check(host.view.phase === "reveal" && host.view.peers.ready === true && ann.view.peers.ready, "three done: the room waits for the fourth");
await readyAll([cat], 0);
for (const d of all) await d.until((v) => v.phase === "question" && v.current === 1, "question 2 once everyone is done, no ranking step");

// --- Question 2: a phone goes silent, its socket open. The room moves on without it.

cat.silent = true;
const silentFrom = Date.now();
await answerAll([host, ann, ben], "b");
await sleep(1000);
check(host.view.phase === "question", "the silent phone is still counted present at first");
await host.until((v) => v.phase === "reveal", "the solution once the silent phone is away", FRESH_MS + 30_000);
console.log(`     (moved on ${Math.round((Date.now() - silentFrom) / 1000)} s after the phone went silent)`);
await readyAll([host, ann, ben], 1);
for (const d of [host, ann, ben]) await d.until((v) => v.phase === "question" && v.current === 2, "question 3 without the silent phone");

// --- It comes back: the room waits for it again.

cat.close();
const cat2 = new Device("cat", instance);
await cat2.open(cat.auth.token);
await cat2.until((v) => v.phase === "question" && v.current === 2, "the phone comes back to its avatar");
await answerAll([host, ann, ben], "a");
await sleep(800);
check(host.view.phase === "question", "back again: the room waits for it");
await answerAll([cat2], "a");
await host.until((v) => v.phase === "reveal", "the solution once it answered too");

// --- The opener changes the solution; the others can't.

check((await ann.send({ op: "setCounts", q: 2, counts: [true, true] })).ok === false, "nobody else changes a solution");
const shown = host.view.question.answers;
check((await host.send({ op: "setCounts", q: 2, counts: shown.map((t) => t === "b") })).ok, "the opener changes the solution of 3 to b");
await host.until((v) => v.peers.winners.length === 0, "the winners follow the fix");

// --- A tab that closes its line is let go at once; the opener removes an avatar.

await readyAll([host, ann, ben], 2);
await sleep(300);
check(host.view.phase === "reveal", "cat hasn't tapped on");
cat2.close();
await host.until((v) => v.phase === "question" && v.current === 3, "question 4 once cat's tab closed", 3000);
host.id = host.view.peers.player;
check(host.id === host.view.peers.players[0].id && ben.view.peers.player === ben.id, "each view names its own player");
check((await ann.send({ op: "remove", player: ben.id })).ok === false, "nobody else removes an avatar");
check((await host.send({ op: "remove", player: ann.id })).ok, "the opener removes an avatar");

// --- Countdown: anyone done starts it for those the room waits for; the room goes on at its end.

await ben.until((v) => v.peers.players.length === 3, "the removed avatar gone from the polling device");
const notYet = await ben.send({ op: "lastCall", at: at(ben.view) });
check(notYet.result === "stale" && !ben.view.peers.countdown, "not answered: no Countdown of ben's");
await answerAll([host], "b");
await sleep(300);
check(host.view.phase === "question", "the room waits for ben, not for the removed avatar");
const pressed = Date.now();
check((await host.send({ op: "lastCall", at: at(host.view) })).ok, "the opener, done, starts a Countdown");
await ben.until((v) => !!v.peers.countdown, "the polling device it waits for hears of it at once", 3000);
check(JSON.stringify(ben.view.peers.countdown.by) === JSON.stringify(host.view.peers.players[0].avatar), "and whose it is");
check((await host.send({ op: "lastCall", at: at(host.view) })).result === "stale", "once per step");
await sleep(LAST_CALL_MS - 3000);
check(host.view.phase === "question", "the room doesn't go on before its end");
await host.until((v) => v.phase === "reveal", "the solution at the Countdown's end, ben not answered", 8000);
console.log(`     (the solution ${Math.round((Date.now() - pressed) / 1000)} s after the press)`);
check(!host.view.peers.countdown, "the question's Countdown went with it");
await ben.until((v) => v.phase === "reveal", "the solution on the polling device", 3000);
await readyAll([ben], 3);
check((await ben.send({ op: "lastCall", at: at(ben.view) })).ok, "ben, done with the solution, starts one for the opener");
await host.until((v) => !!v.peers.countdown, "the opener sees it", 3000);
await host.until((v) => v.phase === "final", "the final ranking at its end", LAST_CALL_MS + 8000);

// --- The scores, from the answers and the fix: 3 was a, fixed to b.
//     host a b a b = 3; ben a b a - = 2; cat b - a - = 0; ann removed.

const scores = Object.fromEntries(host.view.peers.ranking.top.map((t) => [t.id, t.score]));
check(scores[host.id] === 3 && scores[ben.id] === 2 && scores[cat.id] === 0, `scores follow the answers and the fix (${JSON.stringify(Object.values(scores))})`);
check(!(ann.id in scores) && !host.view.peers.players.some((p) => p.id === ann.id), "the removed avatar is out of the ranking");

// --- Nobody ends the room: each device leaves when it likes.

for (const d of [host, ben]) check((await d.send({ op: "endInstance" })).ok === false, `${d.name} doesn't end it for the others`);
await sleep(500);
check(!ben.gone && ben.view.phase === "final", "the polling device stays on the final ranking");
for (const d of [host, ann, ben]) d.close();
if (EMPTY) {
  // Nobody at the final ranking: the room ends by itself.
  const left = Date.now();
  await sleep(PEERS_EMPTY_MS - 60_000);
  check((await post("/api/join", { code })).status === 200, "the room is still there a minute before");
  let gone = false;
  while (!gone && Date.now() - left < PEERS_EMPTY_MS + 90_000) {
    await sleep(10_000);
    gone = (await post("/api/join", { code })).status !== 200;
  }
  check(gone, `the room ends once nobody has been at its final ranking for a while (${Math.round((Date.now() - left) / 1000)} s)`);
}
console.log(failed ? `${failed} FAILED` : "all ok");
process.exit(failed ? 1 : 0);
