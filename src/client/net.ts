// - Commands are kept until the server acknowledges them and are resent after
//   a reconnect; the server ignores repeats.
// - A player's input as the server last took it (its look, its answer) is
//   kept, across a reload too, and sent with every hello and poll: the
//   server holds it in memory and rebuilds from it what an instance restart
//   lost.

import type { AnswerAck, Auth, ClientMessage, Command, DeviceHeld, ServerMessage } from "../shared/protocol.ts";
import { viewKey } from "../shared/protocol.ts";
import { REST_AFTER_MS, REST_EVERY_MS, SLEEP_AFTER_MS } from "../shared/limits.ts";
import { hideNotice, showNotice } from "./notice.ts";
import { pauseAwake } from "./dom.ts";
import { emptyLine, readLine, type LineCounts } from "../shared/line.ts";

export type LineStatus = "connecting" | "live" | "offline";

export interface LineOptions {
  instance: string;
  auth: () => Auth;
  onMessage: (m: ServerMessage) => void;
  onStatus?: (s: LineStatus) => void;
  words: { asleep: string; quota: () => string };
  /** Keys what the line keeps across a reload: "" for the page's one line, ".1" and ".2" for the places added at a shared device. */
  slot?: string;
}

interface Pending {
  id: string;
  cmd: Command;
  resolve: (m: Extract<ServerMessage, { t: "ack" }>) => void;
  sent: boolean;
}

const PING_EVERY = 20_000;
const PONG_WITHIN = 8_000;
const FIRST_MESSAGE_WITHIN = 8_000;
const MIN_POLL_GAP = 300;
/** Commands whose acknowledgement means "held" in memory, not "stored". */
const HELD_OPS = new Set<Command["op"]>(["tick", "answer", "dress", "ready"]);
const QUOTA_RETRY = 60_000;

class QuotaError extends Error {}

/** A shared device has one line per place; they sleep together, and one notice's tap wakes them all. */
const pageLines = new Set<Line>();
let lastChange = Date.now();

export class Line {
  private ws: WebSocket | null = null;
  private mode: "ws" | "poll" = "ws";
  private wsFailures = 0;
  private status: LineStatus = "connecting";
  private pending: Pending[] = [];
  private v = -1;
  private backoff = 500;
  private retryTimer: number | undefined;
  private pingTimer: number | undefined;
  private pongTimer: number | undefined;
  private stopped = false;
  private polling = false;
  private flushing = false;
  private seq = 0;
  private asleep = false;
  private forgotten = false;
  private lastKey = "";
  /** "http" when the site turned requests away, "write" when the quiz couldn't store. */
  private quota: "http" | "write" | null = null;
  private pollAbort: AbortController | null = null;
  private held: DeviceHeld | null = null;
  /** Its pollS is kept as pollMs and pollSince while the page lives. */
  private line: LineCounts;
  private pollMs = 0;
  /** Set while polling, and neither asleep nor at rest. */
  private pollSince: number | null = null;
  /** The server's word with a poll's answer: no class is in this quiz, so a poller left alone may rest. */
  private mayRest = false;
  /** No poll is held and the line asks every REST_EVERY_MS; to the others a player's device then counts as away. */
  private resting = false;
  /** Ends a rest's wait before its time. */
  private stir: (() => void) | null = null;

  private opts: LineOptions;

  constructor(opts: LineOptions) {
    this.opts = opts;
    this.held = readHeld(this.keyed());
    this.line = readCounts(this.keyed()) ?? emptyLine();
    pageLines.add(this);
    this.pollMs = this.line.pollS * 1000;
    // Stored as the page goes too: a reload would otherwise lose what was
    // counted since the last message (the socket that worked, its pings).
    window.addEventListener("pagehide", () => {
      if (!this.forgotten) void this.lineNow();
    });
    // Counted, never described: an error's message can carry quiz text.
    const failed = () => {
      this.line.errors++;
    };
    window.addEventListener("error", failed);
    window.addEventListener("unhandledrejection", failed);
    const kick = () => {
      if (this.stopped) return;
      if (document.visibilityState !== "visible") return;
      if (this.asleep) this.wake();
      else this.reconnectNow();
    };
    document.addEventListener("visibilitychange", kick);
    window.addEventListener("online", () => {
      if (!this.asleep) kick();
    });
    window.addEventListener("pageshow", kick);
    const touched = () => {
      lastChange = Date.now();
      this.stir?.();
    };
    document.addEventListener("pointerdown", touched, { passive: true });
    document.addEventListener("keydown", touched);
    window.setInterval(() => {
      if (!this.stopped && !this.asleep && Date.now() - lastChange > SLEEP_AFTER_MS) this.sleep();
    }, 60_000);
  }

  /** A tablet left on after the lesson doesn't keep its line, or its polling, all day. */
  private sleep(): void {
    this.asleep = true;
    this.line.slept++;
    if (this.pollSince !== null) this.pollMs += Date.now() - this.pollSince;
    this.pollSince = null;
    this.resting = false;
    this.stir?.();
    clearTimeout(this.retryTimer);
    this.clearPing();
    const ws = this.ws;
    this.ws = null;
    try {
      ws?.close(1000, "asleep");
    } catch {
      /* already closed */
    }
    pauseAwake(true);
    this.setStatus("offline");
    showNotice("sleep", this.opts.words.asleep, () => {
      for (const l of pageLines) l.wake();
    });
  }

  private wake(): void {
    if (!this.asleep) return;
    this.asleep = false;
    lastChange = Date.now();
    if (this.mode === "poll") this.pollSince = Date.now();
    hideNotice("sleep");
    pauseAwake(false);
    this.backoff = 500;
    this.connect();
    this.flush();
  }

  private setQuota(q: "http" | "write" | null): void {
    if (q === this.quota) return;
    if (q && !this.quota) this.line.quota++;
    this.quota = q;
    if (q) showNotice("quota", this.opts.words.quota());
    else hideNotice("quota");
  }

  start(): void {
    this.connect();
  }

  /**
   * The tab is someone else now (a guest became a player): over HTTP the
   * guest's held poll would otherwise be held until the guest's choice
   * changed, and the tablet's own view with it.
   */
  repoll(): void {
    this.pollAbort?.abort();
    this.stir?.();
  }

  stop(): void {
    this.stopped = true;
    pageLines.delete(this);
    clearTimeout(this.retryTimer);
    this.clearPing();
    this.ws?.close();
    this.ws = null;
    this.pollAbort?.abort();
    this.stir?.();
  }

  forget(): void {
    this.stop();
    this.forgotten = true;
    forgetKept(this.keyed());
  }

  private keyed(): string {
    return `${this.opts.instance}${this.opts.slot ?? ""}`;
  }


  /** own: the page asking by itself (its timer's tick, a refused join asked again), which neither wakes the line nor ends its rest. */
  send(cmd: Command, own = cmd.op === "tick"): Promise<Extract<ServerMessage, { t: "ack" }>> {
    if (own && (this.asleep || this.resting)) return Promise.resolve({ t: "ack", id: "", ok: false, error: "asleep" });
    if (this.asleep) this.wake();
    if (!own) {
      lastChange = Date.now();
      this.stir?.();
    }
    return new Promise((resolve) => {
      const p: Pending = { id: `${Date.now().toString(36)}-${(++this.seq).toString(36)}-${Math.random().toString(36).slice(2, 7)}`, cmd, resolve, sent: false };
      this.pending.push(p);
      this.flush();
    });
  }

  private setStatus(s: LineStatus): void {
    if (s === this.status) return;
    this.status = s;
    this.opts.onStatus?.(s);
  }

  private reconnectNow(): void {
    if (this.mode === "ws") {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // The socket may be dead after sleep without knowing it: test it.
        this.ping();
        return;
      }
      clearTimeout(this.retryTimer);
      this.backoff = 500;
      this.connect();
    } else {
      this.flush();
      this.stir?.();
    }
  }

  private connect(): void {
    if (this.stopped || this.asleep) return;
    if (this.mode === "poll") {
      this.pollLoop();
      return;
    }
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    this.setStatus(this.status === "live" ? "offline" : this.status);
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    let ws: WebSocket;
    try {
      ws = new WebSocket(`${proto}//${location.host}/api/i/${this.opts.instance}/ws`);
    } catch {
      this.onWsFail(false);
      return;
    }
    this.ws = ws;
    // A socket counts as working once a message arrived through it, not when
    // it opened: some proxies accept the upgrade and then drop every frame.
    let heard = false;
    let silence: number | undefined;
    ws.onopen = () => {
      const held = this.heldNow();
      // The hello counts its own socket as working: a tab that sends nothing
      // after it (a Projector while a Remote steers) would otherwise never
      // count it. If the socket proves silent, the next hello or poll says so.
      this.raw({ t: "hello", auth: this.opts.auth(), ...(held ? { held } : {}), ...this.lineNow({ opened: 1, sent: 1 }) });
      for (const p of this.pending) p.sent = false;
      this.flush();
      this.schedulePing();
      silence = window.setTimeout(() => {
        if (this.ws === ws && !heard) {
          this.line.silent++;
          this.ws = null;
          this.clearPing();
          try {
            ws.close();
          } catch {
            /* already closed */
          }
          this.onWsFail(false);
        }
      }, FIRST_MESSAGE_WITHIN);
    };
    ws.onmessage = (e) => {
      if (!heard) {
        heard = true;
        this.line.opened++;
        clearTimeout(silence);
        this.wsFailures = 0;
        this.backoff = 500;
      }
      if (e.data === "pong") {
        clearTimeout(this.pongTimer);
        return;
      }
      let m: ServerMessage;
      try {
        m = JSON.parse(e.data);
      } catch {
        return;
      }
      this.setStatus("live");
      this.handle(m);
    };
    ws.onclose = (e) => {
      clearTimeout(silence);
      if (this.ws !== ws) return;
      this.ws = null;
      this.clearPing();
      if (e.code === 4000 || e.code === 4001) {
        // The server said "gone", or that this tab's role moved; the page has been told and decides.
        this.setStatus("offline");
        return;
      }
      this.onWsFail(heard);
    };
  }

  private onWsFail(worked: boolean): void {
    if (this.stopped || this.asleep) return;
    this.setStatus("offline");
    if (!worked) {
      this.wsFailures++;
      this.line.failed++;
    }
    if (this.wsFailures >= 3) {
      this.mode = "poll";
      this.pollSince = Date.now();
      this.connect();
      return;
    }
    this.retryTimer = window.setTimeout(() => this.connect(), this.backoff);
    this.backoff = Math.min(this.backoff * 2, 5000);
  }

  private schedulePing(): void {
    this.clearPing();
    this.pingTimer = window.setInterval(() => this.ping(), PING_EVERY);
  }

  private ping(): void {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send("ping");
    } catch {
      return;
    }
    this.line.pings++;
    clearTimeout(this.pongTimer);
    this.pongTimer = window.setTimeout(() => {
      if (this.ws === ws) {
        this.ws = null;
        this.clearPing();
        try {
          ws.close();
        } catch {
          /* already closed */
        }
        this.onWsFail(true);
      }
    }, PONG_WITHIN);
  }

  private clearPing(): void {
    clearInterval(this.pingTimer);
    clearTimeout(this.pongTimer);
  }

  private raw(m: ClientMessage): boolean {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(m));
      this.line.sent++;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Not a guest's, which the server keeps nowhere. Stored for a reload on
   * the way. ahead: what the message carrying it adds once it is sent
   * (itself, its socket), counted in what is sent and not in what is stored.
   */
  private lineNow(ahead: { opened?: number; sent?: number } = {}): { line?: LineCounts } {
    if (this.opts.auth().role === "guest") return {};
    const line: LineCounts = { ...this.line, mode: this.mode, pollS: Math.floor((this.pollMs + (this.pollSince !== null ? Date.now() - this.pollSince : 0)) / 1000) };
    writeCounts(this.keyed(), line);
    return { line: { ...line, opened: line.opened + (ahead.opened ?? 0), sent: line.sent + (ahead.sent ?? 0) } };
  }

  private handle(m: ServerMessage): void {
    if (m.t === "ack") {
      const i = this.pending.findIndex((p) => p.id === m.id);
      if (i >= 0) {
        const [p] = this.pending.splice(i, 1);
        // Something was stored again: the allowance is back. A player's tap
        // is held in memory, not stored, so its acknowledgement doesn't say.
        if (m.ok && !HELD_OPS.has(p.cmd.op) && this.quota === "write") this.setQuota(null);
        if (m.ok) this.took(p.cmd, m.result);
        p.resolve(m);
      }
    }
    if (m.t === "quota") {
      this.setQuota(this.quota ?? "write");
      return;
    }
    if (m.t === "state" || m.t === "choose") {
      // What the page shows, without the version: a change keeps the line awake.
      const key = m.t === "state" ? viewKey(m.view) : JSON.stringify(m);
      if (key !== this.lastKey) {
        this.lastKey = key;
        // At rest, only something stored ends the rest (a step, a join, a
        // role taken: the view's version moves). Who is there changes with
        // time and is drawn without ending it: a player's device at rest
        // counts as away, and two that woke at each other's coming and going
        // would keep each other from resting.
        if (!this.resting || (m.t === "state" && m.view.v > this.v)) lastChange = Date.now();
      } else if (this.resting) {
        // A rest's poll is answered with what the page shows already: nothing to draw again.
        if (m.t === "state") this.v = Math.max(this.v, m.view.v);
        return;
      }
    }
    if (m.t === "state") {
      if (m.view.v < this.v && this.mode === "poll") return;
      this.v = m.view.v;
    }
    // A tab that hasn't a view yet (choosing a role or an avatar) has been
    // told its choice: its next poll waits for a change instead of being
    // answered at once, which would spin and redraw the buttons under a finger.
    if (m.t === "choose" && this.v < 0) this.v = 0;
    if (m.t === "gone") {
      for (const p of this.pending) p.resolve({ t: "ack", id: p.id, ok: false, error: m.reason });
      this.pending = [];
    }
    this.opts.onMessage(m);
  }

  /**
   * The input to send: only the player's whose token the tab holds now. The
   * look stays out while a dress is on its way: that one is newer, and a
   * look carries no sequence number to tell the two apart, so a hello sent
   * before the resent dress would put the older look back for a moment.
   */
  private heldNow(): DeviceHeld | null {
    const auth = this.opts.auth();
    let h = this.held;
    if (!h || auth.role !== "player" || auth.token !== h.token) return null;
    if (h.look && this.pending.some((p) => p.cmd.op === "dress")) {
      const { look: _, ...rest } = h;
      h = rest;
    }
    return h.look || h.answer || h.ready !== undefined ? h : null;
  }

  private took(cmd: Command, result: unknown): void {
    const auth = this.opts.auth();
    if (auth.role !== "player") return;
    let h = this.held && this.held.token === auth.token ? this.held : { token: auth.token };
    if (cmd.op === "dress") h = { ...h, look: { b: cmd.b, h: cmd.h, t: cmd.t ?? 0 } };
    else if (cmd.op === "answer") {
      const r = (result as AnswerAck | undefined)?.record;
      if (!r || r.seq !== cmd.seq) return;
      h = { ...h, answer: { q: cmd.q, choice: cmd.choice, seq: cmd.seq, v: cmd.v, ...(typeof cmd.ms === "number" ? { ms: cmd.ms } : {}) } };
    } else if (cmd.op === "ready") h = { ...h, ready: cmd.q };
    else return;
    this.held = h;
    writeHeld(this.keyed(), h);
  }

  private flush(): void {
    if (this.mode === "ws") {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      for (const p of this.pending) {
        if (!p.sent && this.raw({ t: "cmd", id: p.id, cmd: p.cmd, ...this.lineNow({ sent: 1 }) })) p.sent = true;
      }
      return;
    }
    void this.flushHttp();
  }

  private async flushHttp(): Promise<void> {
    if (this.flushing) return;
    this.flushing = true;
    let delay = 500;
    while (this.pending.length > 0 && !this.stopped && !this.asleep) {
      const p = this.pending[0];
      try {
        this.line.http++;
        const res = await post(`/api/i/${this.opts.instance}/cmd`, { auth: this.opts.auth(), cmd: { id: p.id, cmd: p.cmd }, ...this.lineNow() });
        this.setStatus("live");
        if (this.quota === "http") this.setQuota(null);
        delay = 500;
        for (const m of res.messages ?? []) this.handle(m);
        // An HTTP reply always carries the ack; make sure it's settled.
        const still = this.pending.indexOf(p);
        if (still >= 0) {
          this.pending.splice(still, 1);
          p.resolve({ t: "ack", id: p.id, ok: false, error: "no answer" });
        }
      } catch (e) {
        this.setStatus("offline");
        if (e instanceof QuotaError) {
          this.setQuota("http");
          await sleep(QUOTA_RETRY);
          continue;
        }
        await sleep(delay);
        delay = Math.min(delay * 2, 5000);
      }
    }
    this.flushing = false;
  }

  /** Seconds at rest aren't seconds polling (`pollS`): no poll is held. */
  private rest(on: boolean): void {
    if (on === this.resting) return;
    this.resting = on;
    const now = Date.now();
    if (on && this.pollSince !== null) this.pollMs += now - this.pollSince;
    this.pollSince = on ? null : now;
  }

  private restWait(): Promise<void> {
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(t);
        this.stir = null;
        resolve();
      };
      const t = setTimeout(done, REST_EVERY_MS);
      this.stir = done;
    });
  }

  private async pollLoop(): Promise<void> {
    if (this.polling) return;
    this.polling = true;
    let delay = 500;
    let first = true;
    while (!this.stopped && !this.asleep) {
      try {
        const t0 = Date.now();
        this.rest(this.mayRest && t0 - lastChange > REST_AFTER_MS);
        const resting = this.resting;
        const ctl = new AbortController();
        this.pollAbort = ctl;
        let res: { messages?: ServerMessage[]; rest?: boolean };
        try {
          const held = this.heldNow();
          this.line.http++;
          res = await post(`/api/i/${this.opts.instance}/poll`, { auth: this.opts.auth(), v: first ? -1 : this.v, ...(resting ? { rest: true } : {}), ...(held ? { held } : {}), ...this.lineNow() }, ctl.signal);
        } catch (e) {
          // Let go on purpose (repoll): ask again at once, as whoever the tab is now.
          if (ctl.signal.aborted && !this.stopped) continue;
          throw e;
        } finally {
          this.pollAbort = null;
        }
        if (this.asleep) break;
        first = false;
        delay = 500;
        this.setStatus("live");
        if (this.quota === "http") this.setQuota(null);
        this.mayRest = res.rest === true;
        let gone = false;
        const msgs = res.messages ?? [];
        for (const m of msgs) {
          this.handle(m);
          if (m.t === "gone") gone = true;
        }
        if (gone) break;
        if (resting) {
          if (this.mayRest && lastChange < t0) await this.restWait();
          continue;
        }
        // A quick empty answer is not a reason to ask again at once, and no
        // answer at all makes this loop spin.
        const took = Date.now() - t0;
        if (msgs.length === 0 && took < 1000) await sleep(1500);
        else if (took < MIN_POLL_GAP) await sleep(MIN_POLL_GAP - took);
      } catch (e) {
        // Stopped: its held poll was let go with it.
        if (this.stopped) break;
        this.setStatus("offline");
        if (e instanceof QuotaError) {
          this.setQuota("http");
          await sleep(QUOTA_RETRY);
          continue;
        }
        await sleep(delay);
        delay = Math.min(delay * 2, 5000);
      }
    }
    this.polling = false;
  }
}

async function post(path: string, body: unknown, signal?: AbortSignal): Promise<{ messages?: ServerMessage[] }> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 35_000);
  signal?.addEventListener("abort", () => ctl.abort(), { once: true });
  try {
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal });
    const r = await readApi<{ messages?: ServerMessage[] }>(res);
    if (r.quota) throw new QuotaError();
    if (!res.ok && res.status >= 500) throw new Error(`HTTP ${res.status}`);
    if (r.json === false) throw new Error("not JSON");
    return r;
  } finally {
    clearTimeout(t);
  }
}

export type ApiBody<T> = T & { quota?: boolean; error?: string; json?: false };

export async function api<T>(path: string, body: unknown): Promise<{ status: number; body: ApiBody<T> }> {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: res.status, body: await readApi<T>(res) };
}

/**
 * A body that isn't JSON isn't the site's (a school filter's page, say) and
 * comes back as `json: false`, its status saying nothing about a quiz; or as
 * `quota` when it reads as the daily allowance spent: our functions'
 * `{error: "quota"}`, or what Cloudflare answers in the Function's place
 * past the day's requests.
 */
export async function readApi<T>(res: Response): Promise<ApiBody<T>> {
  const text = await res.text().catch(() => "");
  let parsed: ApiBody<T> | null = null;
  try {
    const v = JSON.parse(text);
    parsed = v && typeof v === "object" ? v : null;
  } catch {
    parsed = null;
  }
  const quota = parsed ? parsed.error === "quota" : res.status === 429 || (res.status === 405 && text === "") || /\b1027\b/.test(text);
  if (quota) return { ...(parsed ?? ({} as T)), quota: true } as ApiBody<T>;
  return parsed ?? ({ json: false } as ApiBody<T>);
}

/** Survives a reload: an iPad reloads a tab it put away. */
function readHeld(key: string): DeviceHeld | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(`cq.held.${key}`) ?? "null");
    return v && typeof v === "object" && typeof v.token === "string" ? v : null;
  } catch {
    return null;
  }
}

function writeHeld(key: string, h: DeviceHeld): void {
  try {
    sessionStorage.setItem(`cq.held.${key}`, JSON.stringify(h));
  } catch {
    // Storage blocked: the line still holds it while the page lives.
  }
}

function readCounts(key: string): LineCounts | null {
  try {
    return readLine(JSON.parse(sessionStorage.getItem(`cq.line.${key}`) ?? "null"));
  } catch {
    return null;
  }
}

function writeCounts(key: string, line: LineCounts): void {
  try {
    sessionStorage.setItem(`cq.line.${key}`, JSON.stringify(line));
  } catch {
    // Storage blocked: the count starts again with a reload.
  }
}

function forgetKept(key: string): void {
  try {
    sessionStorage.removeItem(`cq.held.${key}`);
    sessionStorage.removeItem(`cq.line.${key}`);
  } catch {
    /* nothing was kept */
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
