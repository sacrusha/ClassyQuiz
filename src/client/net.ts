// The device's line to its quiz instance (docs/design/connections.md, "Transport: WebSocket first, long-polling when the network breaks it").
//
// - A socket counts as working only once a message has arrived: some school
//   filters block the upgrade, others accept it and then drop the frames.
//   Then long-polling over plain HTTP takes over for the rest of the page's
//   life. Same messages, same views.
// - Commands are kept until the server acknowledges them and are resent after
//   a reconnect; the server ignores repeats (shared/protocol.ts).

import type { Auth, ClientMessage, Command, ServerMessage } from "../shared/protocol.ts";
import { viewKey } from "../shared/protocol.ts";
import { SLEEP_AFTER_MS, quotaMessage } from "../shared/limits.ts";
import { hideNotice, showNotice } from "./notice.ts";
import { pauseAwake } from "./dom.ts";

export type LineStatus = "connecting" | "live" | "offline";

export interface LineOptions {
  instance: string;
  auth: () => Auth;
  onMessage: (m: ServerMessage) => void;
  onStatus?: (s: LineStatus) => void;
}

interface Pending {
  id: string;
  cmd: Command;
  resolve: (m: Extract<ServerMessage, { t: "ack" }>) => void;
  sent: boolean;
}

const PING_EVERY = 20_000;
const PONG_WITHIN = 8_000;
/** The server answers a hello at once; an open socket that stays silent this long doesn't work. */
const FIRST_MESSAGE_WITHIN = 8_000;
/** Polls never follow each other faster than this, whatever the server answers. */
const MIN_POLL_GAP = 300;
/** Out of the daily allowance: ask again this often, not every few seconds. */
const QUOTA_RETRY = 60_000;

/** The site answered that its daily allowance is spent. */
class QuotaError extends Error {}

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
  /** When the view last changed, or someone touched the page. */
  private lastChange = Date.now();
  private lastKey = "";
  /** Out of the allowance: "http" when the site turned requests away, "write" when the quiz couldn't store. */
  private quota: "http" | "write" | null = null;
  /** The poll being held, to let go of when the tab's identity changes. */
  private pollAbort: AbortController | null = null;

  private opts: LineOptions;

  constructor(opts: LineOptions) {
    this.opts = opts;
    const kick = () => {
      if (this.stopped) return;
      if (document.visibilityState !== "visible") return;
      // A tablet switched back on: the student is back.
      if (this.asleep) this.wake();
      else this.reconnectNow();
    };
    document.addEventListener("visibilitychange", kick);
    window.addEventListener("online", () => {
      if (!this.asleep) kick();
    });
    window.addEventListener("pageshow", kick);
    const touched = () => {
      this.lastChange = Date.now();
    };
    document.addEventListener("pointerdown", touched, { passive: true });
    document.addEventListener("keydown", touched);
    window.setInterval(() => {
      if (!this.stopped && !this.asleep && Date.now() - this.lastChange > SLEEP_AFTER_MS) this.sleep();
    }, 60_000);
  }

  /** Closes the line until a tap; the page underneath stays as it was. A tablet left on after the lesson doesn't keep its line, or its polling, all day. */
  private sleep(): void {
    this.asleep = true;
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
    showNotice("sleep", "Tap to continue", () => this.wake());
  }

  private wake(): void {
    if (!this.asleep) return;
    this.asleep = false;
    this.lastChange = Date.now();
    hideNotice("sleep");
    pauseAwake(false);
    this.backoff = 500;
    this.connect();
    this.flush();
  }

  private setQuota(q: "http" | "write" | null): void {
    if (q === this.quota) return;
    this.quota = q;
    if (q) showNotice("quota", quotaMessage());
    else hideNotice("quota");
  }

  start(): void {
    this.connect();
  }

  /**
   * The tab is someone else now (a guest became a player): a poll held under
   * the old identity is let go, and the next one asks as the new one. Over
   * HTTP the guest's poll would otherwise be held until the guest's choice
   * changed, and the tablet's own view with it. Nothing to do on a socket.
   */
  repoll(): void {
    this.pollAbort?.abort();
  }

  stop(): void {
    this.stopped = true;
    clearTimeout(this.retryTimer);
    this.clearPing();
    this.ws?.close();
    this.ws = null;
  }


  send(cmd: Command): Promise<Extract<ServerMessage, { t: "ack" }>> {
    if (this.asleep) {
      // A page's timer asking how things are doesn't wake the line; anything else is someone at the device.
      if (cmd.op === "tick") return Promise.resolve({ t: "ack", id: "", ok: false, error: "asleep" });
      this.wake();
    }
    if (cmd.op !== "tick") this.lastChange = Date.now();
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
      this.raw({ t: "hello", auth: this.opts.auth() });
      for (const p of this.pending) p.sent = false;
      this.flush();
      this.schedulePing();
      silence = window.setTimeout(() => {
        if (this.ws === ws && !heard) {
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
    if (!worked) this.wsFailures++;
    if (this.wsFailures >= 3) {
      this.mode = "poll";
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
    clearTimeout(this.pongTimer);
    this.pongTimer = window.setTimeout(() => {
      // No answer: the line is dead even though the socket thinks it's open.
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
      return true;
    } catch {
      return false;
    }
  }

  private handle(m: ServerMessage): void {
    if (m.t === "ack") {
      const i = this.pending.findIndex((p) => p.id === m.id);
      if (i >= 0) {
        const [p] = this.pending.splice(i, 1);
        // Something was stored again: the allowance is back.
        if (m.ok && p.cmd.op !== "tick" && this.quota === "write") this.setQuota(null);
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
        this.lastChange = Date.now();
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

  private flush(): void {
    if (this.mode === "ws") {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      for (const p of this.pending) {
        if (!p.sent && this.raw({ t: "cmd", id: p.id, cmd: p.cmd })) p.sent = true;
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
        const res = await post(`/api/i/${this.opts.instance}/cmd`, { auth: this.opts.auth(), cmd: { id: p.id, cmd: p.cmd } });
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

  private async pollLoop(): Promise<void> {
    if (this.polling) return;
    this.polling = true;
    let delay = 500;
    let first = true;
    while (!this.stopped && !this.asleep) {
      try {
        const t0 = Date.now();
        const ctl = new AbortController();
        this.pollAbort = ctl;
        let res: { messages?: ServerMessage[] };
        try {
          res = await post(`/api/i/${this.opts.instance}/poll`, { auth: this.opts.auth(), v: first ? -1 : this.v }, ctl.signal);
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
        let gone = false;
        const msgs = res.messages ?? [];
        for (const m of msgs) {
          this.handle(m);
          if (m.t === "gone") gone = true;
        }
        if (gone) break;
        // A quick empty answer is not a reason to ask again at once, and no
        // answer at all makes this loop spin.
        const took = Date.now() - t0;
        if (msgs.length === 0 && took < 1000) await sleep(1500);
        else if (took < MIN_POLL_GAP) await sleep(MIN_POLL_GAP - took);
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
 * An API answer's body (`json: false` when it wasn't JSON, e.g. a school
 * filter's page). When the site's daily allowance is spent it comes back with
 * `quota` and the words to show in `error`: our functions say
 * `{error: "quota"}`; past the request allowance Cloudflare answers itself,
 * with its error 1027 (a best reading of its docs, unverified; a 429 counts
 * too).
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
  const quota = parsed ? parsed.error === "quota" : res.status === 429 || /\b1027\b/.test(text);
  if (quota) return { ...(parsed ?? ({} as T)), quota: true, error: quotaMessage() } as ApiBody<T>;
  return parsed ?? ({ json: false } as ApiBody<T>);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
