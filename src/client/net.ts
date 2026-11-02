// The device's line to its quiz instance (docs/decisions.md, "Transport").
//
// - WebSocket first. A ping every 20 s keeps proxies from dropping an idle
//   socket; a missing pong means the line is dead and we reconnect.
// - If WebSockets don't carry messages on this network (some school filters
//   block the upgrade, others accept it and then drop the frames), long-
//   polling over plain HTTP takes over for the rest of the page's life. Same
//   messages, same views.
// - Waking from sleep, coming back online, or the tab becoming visible
//   reconnects at once instead of waiting out a backoff.
// - Commands are kept until the server acknowledges them and are resent after
//   a reconnect; the server ignores repeats (shared/protocol.ts).

import type { Auth, ClientMessage, Command, ServerMessage } from "../shared/protocol.ts";

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

  private opts: LineOptions;

  constructor(opts: LineOptions) {
    this.opts = opts;
    const kick = () => {
      if (this.stopped) return;
      if (document.visibilityState === "visible") this.reconnectNow();
    };
    document.addEventListener("visibilitychange", kick);
    window.addEventListener("online", kick);
    window.addEventListener("pageshow", kick);
  }

  start(): void {
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    clearTimeout(this.retryTimer);
    this.clearPing();
    this.ws?.close();
    this.ws = null;
  }


  send(cmd: Command): Promise<Extract<ServerMessage, { t: "ack" }>> {
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
    if (this.stopped) return;
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
    if (this.stopped) return;
    this.setStatus("offline");
    if (!worked) this.wsFailures++;
    if (this.wsFailures >= 3) {
      // WebSockets don't get through on this network; plain HTTP it is.
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
        p.resolve(m);
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
    while (this.pending.length > 0 && !this.stopped) {
      const p = this.pending[0];
      try {
        const res = await post(`/api/i/${this.opts.instance}/cmd`, { auth: this.opts.auth(), cmd: { id: p.id, cmd: p.cmd } });
        this.setStatus("live");
        delay = 500;
        for (const m of res.messages ?? []) this.handle(m);
        // An HTTP reply always carries the ack; make sure it's settled.
        const still = this.pending.indexOf(p);
        if (still >= 0) {
          this.pending.splice(still, 1);
          p.resolve({ t: "ack", id: p.id, ok: false, error: "no answer" });
        }
      } catch {
        this.setStatus("offline");
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
    while (!this.stopped) {
      try {
        const t0 = Date.now();
        const res = await post(`/api/i/${this.opts.instance}/poll`, { auth: this.opts.auth(), v: first ? -1 : this.v });
        first = false;
        delay = 500;
        this.setStatus("live");
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
      } catch {
        this.setStatus("offline");
        await sleep(delay);
        delay = Math.min(delay * 2, 5000);
      }
    }
    this.polling = false;
  }
}

async function post(path: string, body: unknown): Promise<{ messages?: ServerMessage[] }> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 35_000);
  try {
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal });
    if (!res.ok && res.status >= 500) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function api<T>(path: string, body: unknown): Promise<{ status: number; body: T }> {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  let parsed: T;
  try {
    parsed = await res.json();
  } catch {
    parsed = {} as T;
  }
  return { status: res.status, body: parsed };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
