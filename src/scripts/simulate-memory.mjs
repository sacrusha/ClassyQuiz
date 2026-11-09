// A class whose instance loses its memory, against a running site, local or
// deployed (docs/design/open-period-in-memory.md):
//
//   node scripts/simulate-memory.mjs [base-url] --restart "<command>"
//   node scripts/simulate-memory.mjs [base-url] --quiet <seconds>
//
// --restart: the memory is lost by running the command (one that restarts
// the state Worker, or a deploy) in the lobby and with each question open;
// every socket closes and the devices come back. --quiet: nothing but
// pings for that long, as often, so the object can hibernate (Cloudflare:
// about 10 s without events) with its sockets open; the poller is away
// meanwhile, since a held poll keeps the object in memory. Either way the
// run fails unless the memory was in fact lost each time (the instance's
// QuizInfo.memory, new with each start of its object), so a pass can't come
// from a loss that didn't happen.
//
// Four students: two on WebSockets, one of them closing its socket after
// each tap (a phone locked: its input is written when the line ends), one
// over long-polling, and one that goes away before the loss and comes back
// only after the lock-in (a straggler: its tap counts, made on a view that
// showed answering open). Each dresses in the lobby and answers both
// questions. At the end the wall's looks are the ones each tablet had
// acknowledged, and every score is what the acknowledged answers give.

import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const RESTART = flag("--restart");
const QUIET = flag("--quiet");
const BASE = (args.find((a, i) => !a.startsWith("--") && !["--restart", "--quiet"].includes(args[i - 1])) ?? "http://127.0.0.1:8788").replace(/\/+$/, "");
const WS_BASE = BASE.replace(/^http/, "ws");
if (!RESTART === !QUIET) {
  console.error('Name one way to lose the memory: --restart "<command>" or --quiet <seconds>.');
  process.exit(2);
}

const QUIZ = `Title: Memory check

1. One?
+ a
- b
- c

2. Two?
- a
+ b
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
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

async function post(path, body, signal) {
  const res = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
  return { status: res.status, body: await res.json() };
}

/** A tab's line, like client/net.ts: commands resent until acknowledged, the input last taken sent with every hello and poll. */
class Device {
  constructor(name, instance, auth, mode) {
    Object.assign(this, { name, instance, auth, mode });
    this.pending = new Map();
    this.online = true;
    this.view = null;
    this.v = -1;
    this.n = 0;
    this.held = null;
    this.onWelcome = null;
  }
  start() {
    if (this.mode === "ws") this.connect();
    else void this.pollLoop();
  }
  heldNow() {
    const h = this.held;
    if (!h || this.auth.role !== "player" || this.auth.token !== h.token) return undefined;
    // Like client/net.ts: a dress on its way carries a newer look than the copy.
    if (h.look && [...this.pending.values()].some((p) => p.cmd.op === "dress")) {
      const { look, ...rest } = h;
      return rest.answer ? rest : undefined;
    }
    return h;
  }
  took(cmd, result) {
    if (this.auth.role !== "player") return;
    let h = this.held?.token === this.auth.token ? this.held : { token: this.auth.token };
    if (cmd.op === "dress") h = { ...h, look: { b: cmd.b, h: cmd.h, t: cmd.t ?? 0 } };
    else if (cmd.op === "answer" && result?.record?.seq === cmd.seq) h = { ...h, answer: { q: cmd.q, choice: cmd.choice, seq: cmd.seq, v: cmd.v, ms: cmd.ms } };
    else return;
    this.held = h;
  }
  connect() {
    if (!this.online) return;
    const ws = new WebSocket(`${WS_BASE}/api/i/${this.instance}/ws`);
    this.ws = ws;
    let pinger;
    ws.onopen = () => {
      ws.send(JSON.stringify({ t: "hello", auth: this.auth, held: this.heldNow() }));
      for (const [id, p] of this.pending) ws.send(JSON.stringify({ t: "cmd", id, cmd: p.cmd }));
      pinger = setInterval(() => ws.readyState === 1 && ws.send("ping"), 20_000);
    };
    ws.onmessage = (e) => e.data !== "pong" && this.handle(JSON.parse(e.data));
    ws.onclose = () => {
      clearInterval(pinger);
      if (this.ws !== ws) return;
      this.ws = null;
      if (this.online) setTimeout(() => this.connect(), 500);
    };
    ws.onerror = () => {};
  }
  /** The line closes (a phone locked); with back, it comes back after ms. */
  away(ms) {
    this.online = false;
    const ws = this.ws;
    this.ws = null;
    ws?.close();
    if (ms !== undefined) setTimeout(() => this.back(), ms);
  }
  back() {
    this.online = true;
    if (this.mode === "ws") this.connect();
  }
  handle(m) {
    if (m.t === "ack" && this.pending.has(m.id)) {
      const { cmd, resolve } = this.pending.get(m.id);
      this.pending.delete(m.id);
      if (m.ok) this.took(cmd, m.result);
      resolve(m);
    }
    if (m.t === "welcome") {
      this.auth = { role: "player", token: m.token };
      this.onWelcome?.(m);
    }
    if (m.t === "state") {
      this.v = Math.max(this.v, m.view.v);
      this.view = m.view;
    }
  }
  send(cmd) {
    const id = `${this.name}-${++this.n}`;
    return new Promise((resolve) => {
      this.pending.set(id, { cmd, resolve });
      if (this.mode === "ws") {
        if (this.ws?.readyState === 1 && this.online) this.ws.send(JSON.stringify({ t: "cmd", id, cmd }));
      } else void this.flushHttp();
    });
  }
  async flushHttp() {
    if (this.flushing) return;
    this.flushing = true;
    while (this.pending.size > 0) {
      const [id, { cmd }] = this.pending.entries().next().value;
      try {
        const r = await post(`/api/i/${this.instance}/cmd`, { auth: this.auth, cmd: { id, cmd } });
        if (r.status >= 500) throw new Error(String(r.status));
        for (const m of r.body.messages ?? []) this.handle(m);
        if (this.pending.has(id)) this.pending.get(id).resolve({ t: "ack", id, ok: false }), this.pending.delete(id);
      } catch {
        await sleep(500);
      }
    }
    this.flushing = false;
  }
  async pollLoop() {
    for (;;) {
      if (!this.online) {
        await sleep(200);
        continue;
      }
      try {
        const r = await post(`/api/i/${this.instance}/poll`, { auth: this.auth, v: this.v, held: this.heldNow() });
        if (r.status >= 500) throw new Error(String(r.status));
        const msgs = r.body.messages ?? [];
        for (const m of msgs) this.handle(m);
        if (msgs.length === 0) await sleep(300);
      } catch {
        await sleep(500);
      }
    }
  }
}

/** The instance's memory, new with each start of its object (QuizInfo.memory). */
async function memoryNow() {
  const r = await post(`/api/i/${instance}/info`, { secret: up.body.secret });
  if (typeof r.body.memory !== "string") throw new Error("the site doesn't say which memory it is in: " + JSON.stringify(r.body));
  return r.body.memory;
}

/** The memory goes, by the command or the quiet; a run in which it didn't has tested nothing, and fails. */
async function loseMemory(when) {
  const before = await memoryNow();
  await loseMemoryBy(when);
  const after = await memoryNow();
  check(after !== before, `the memory was lost (${when}): it wasn't, so nothing was tested there${QUIET ? "; a longer --quiet may let the object hibernate" : ""}`);
  log(after !== before ? `the memory was lost (${when})` : `the memory was NOT lost (${when})`);
}

async function loseMemoryBy(when) {
  if (RESTART) {
    log(`the memory goes (${when}): ${RESTART}`);
    const r = spawnSync(RESTART, { shell: true, stdio: "inherit" });
    if (r.status !== 0) throw new Error(`the restart command failed (${r.status})`);
    // DEVELOPING.md: right after a start the site's calls can fail for a while.
    for (let i = 0; i < 90; i++) {
      const j = await post("/api/join", { code: "00000" }).catch(() => ({ status: 0 }));
      if (j.status === 404) break;
      await sleep(1000);
    }
  } else {
    // A held poll keeps the object in memory: the poller is away meanwhile (its poll's end writes what it held).
    const pollers = players.filter((p) => p.mode === "poll");
    for (const p of pollers) p.d.away();
    log(`quiet for ${QUIET} s (${when}): the object may hibernate`);
    await sleep(Number(QUIET) * 1000);
    for (const p of pollers) p.d.back();
  }
}

// ---------------------------------------------------------------------------

const up = await post("/api/quiz", { text: QUIZ, probe: true });
if (!up.body.ok) throw new Error("upload failed: " + JSON.stringify(up.body));
const instance = up.body.id;
const wall = new Device("wall", instance, { role: "screen", token: up.body.token }, "ws");
wall.start();
await until(() => wall.view, 10_000, "the wall's view");
check((await wall.send({ op: "letIn" })).ok, "the wall lets the class in");

const kinds = [
  { name: "steady", mode: "ws" },
  { name: "locker", mode: "ws" },
  { name: "poller", mode: "poll" },
  { name: "straggler", mode: "ws" },
];
const players = [];
for (const k of kinds) {
  const d = new Device(k.name, instance, { role: "guest" }, k.mode);
  const p = { ...k, d, id: null, look: null, acked: {}, texts: {} };
  d.onWelcome = (m) => (p.id = m.player);
  d.start();
  await sleep(300);
  check((await d.send({ op: "newPlayer" })).ok, `${k.name} joins`);
  if (k.mode === "poll") await sleep(500);
  players.push(p);
}
const [, locker, , straggler] = players;
await until(() => players.every((p) => p.d.view?.me), 15_000, "every tablet's view");

// The lobby: everyone dresses; the locker's line ends after it; the straggler is away during the loss.
for (const p of players) {
  const look = { b: 1 + Math.floor(Math.random() * 5), h: 1 + Math.floor(Math.random() * 8), t: 1 + Math.floor(Math.random() * 6) };
  const a = await p.d.send({ op: "dress", ...look });
  check(a.ok, `${p.name}: the look is taken`);
  if (a.ok) p.look = look;
}
locker.d.away(4000);
straggler.d.away();
await loseMemory("in the lobby");
straggler.d.back();
await sleep(3000);
await until(() => wall.view?.players.length === 4, 15_000, "the wall to show the class").catch(() => {});
for (const p of players) {
  const w = wall.view.players.find((x) => x.id === p.id)?.avatar ?? {};
  check((w.b ?? 0) === p.look.b && (w.h ?? 0) === p.look.h && (w.t ?? 0) === p.look.t, `${p.name}: after the loss the wall shows the look acknowledged (${JSON.stringify(w)} vs ${JSON.stringify(p.look)})`);
}
log("the lobby's looks came through");

const at = () => ({ phase: wall.view.phase, current: wall.view.current, reading: wall.view.question?.answering === "reading", votes: !!wall.view.votes });
check((await wall.send({ op: "begin", at: at() })).ok, "Start");
await until(() => wall.view.phase === "question", 5000, "the first question");

async function question(q, lose) {
  check((await wall.send({ op: "play", at: at() })).ok, `q${q}: the answers are shown`);
  await until(() => players.every((p) => p.d.view?.question?.answering === "open"), 15_000, "the answers on every tablet");
  for (const p of players) {
    const view = p.d.view;
    const choice = Math.floor(Math.random() * view.question.answers.length);
    p.texts[q] = view.question.answers;
    const cmd = { op: "answer", q, choice, seq: Date.now(), v: view.v, ms: 1000 };
    const a = await p.d.send(cmd);
    const r = a.result?.record;
    if (r) p.acked[q] = r.choice;
    if (p === locker) locker.d.away(4000);
  }
  if (lose) {
    straggler.d.away();
    await loseMemory(`question ${q + 1} open`);
  }
  // Lock in with the straggler still away; it comes back during the spread.
  await sleep(1500);
  check((await wall.send({ op: "play", at: at() })).ok, `q${q}: locked in`);
  straggler.d.back();
  await until(() => straggler.d.view?.question?.votes || straggler.d.view?.phase === "reveal", 15_000, "the straggler back").catch(() => {});
  await sleep(1500);
  const given = wall.view.answered;
  check(given === 4, `q${q}: the wall counts every acknowledged answer, the straggler's too (${given} of 4)`);
  check((await wall.send({ op: "play", at: at() })).ok, `q${q}: the solution`);
  await sleep(1000);
  for (const p of players) {
    const mine = p.d.view?.reveal?.mine;
    check(mine === p.acked[q], `${p.name}: q${q}'s solution shows the answer acknowledged (${mine} vs ${p.acked[q]})`);
  }
}

await question(0, true);
check((await wall.send({ op: "play", at: at() })).ok, "the ranking");
check((await wall.send({ op: "play", at: at() })).ok, "the next question");
await until(() => wall.view.phase === "question" && wall.view.current === 1, 5000, "the second question");
await question(1, true);
check((await wall.send({ op: "play", at: at() })).ok, "the final ranking");
await until(() => wall.view.phase === "final", 5000, "the final ranking");
await sleep(1500);
// The right answers by their text (the order on screen is shuffled): "a", then "b".
for (const p of players) {
  const want = [0, 1].filter((q) => p.texts[q]?.[p.acked[q]] === ["a", "b"][q]).length;
  check(p.d.view?.me?.score === want, `${p.name}: the final score is what the acknowledged answers give (${p.d.view?.me?.score} vs ${want})`);
}

check((await wall.send({ op: "endInstance" })).ok, "the quiz ends");

if (failures.length) {
  console.log(`\nFAILED (${failures.length}):`);
  for (const f of failures) console.log(`- ${f}`);
  process.exit(1);
}
console.log("\nOK: the looks and every acknowledged answer came through the memory's loss.");
process.exit(0);
