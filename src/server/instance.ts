// One uploaded quiz and its classes (docs/decisions.md, "Lifetime of a quiz
// instance"; docs/user-flow.md for the roles). Holds the game state and the
// quiz's code, talks to every tab of the class over WebSockets (hibernating,
// so an idle instance costs nothing) or long-polling, and deletes everything
// when the instance ends.

import { DurableObject } from "cloudflare:workers";
import { imageKey, parseQuiz, type Quiz, type Problem } from "../quiz/format.ts";
import * as G from "./game.ts";
import { matchImages, type StoredImage, type UploadedImage } from "./images.ts";
import type {
  Auth,
  ChoiceState,
  ClientMessage,
  Command,
  ImageRef,
  PlayerView,
  Presence,
  QuizInfo,
  RankingView,
  RoleName,
  ScreenView,
  ServerMessage,
  TeacherView,
  View,
} from "../shared/protocol.ts";
import { MAX_IMAGES, MAX_QUIZ_BYTES, MAX_UPLOAD_BYTES, viewKey, type ClockView, type UploadResult } from "../shared/protocol.ts";
import type { Env } from "./env.ts";
import { randomCode, randomToken } from "./random.ts";
import { CLASS_IDLE_MS, SITE_FULL, isQuotaError } from "../shared/limits.ts";

/** An instance ends this long after its last activity (upload, a teacher's step, a role taken). */
export const INSTANCE_IDLE_MS = 48 * 3600_000;
/** A class's players, answers and scores are deleted this long after its final ranking. */
export const RUN_KEEP_MS = 3600_000;
/** A long-poll is answered after this long even when nothing changed. */
const POLL_HOLD_MS = 25_000;
/**
 * A tab not heard from for this long is away: the device died or slept
 * without its socket closing (clients ping every 20 s; the runtime answers
 * without waking the object and notes the time). A role whose tab is away is
 * free for another tab (user flow, rule 5).
 */
const FRESH_MS = 45_000;
/** A role's tab not heard from for this long is "quiet": the choice screen says it frees up soon. */
const QUIET_MS = 25_000;
/** Join command ids remembered per class, to answer a resent join with the same player. */
const JOINS_KEPT = 300;
/** The code is claimed for this long beyond the instance's end, and claimed again before that runs out. */
const CODE_SLACK_MS = 12 * 3600_000;

/** Written once at upload. */
interface QuizRecord {
  quiz: Quiz;
  warnings: Problem[];
  /**
   * The quiz's pictures by `imageKey`; each file is stored under `img:<n>`.
   * Absent on quizzes uploaded before pictures existed.
   */
  images?: Record<string, StoredImage>;
  /** Part of every picture's address, so the instance id alone doesn't open them. */
  imageSecret?: string;
}

/** Small; written with every change. */
interface Meta {
  /** Kept by the device that pasted the quiz: it may delete it from the root page. */
  secret: string;
  /** The quiz's code, for its whole life. Absent on instances made before codes were per quiz. */
  code?: string;
  /** Until when the code is claimed in its JoinCode object. */
  codeUntil?: number;
  /** The token of the tab holding each role. */
  roles?: Record<RoleName, string | null>;
  lastActivity: number;
  v: number;
}

type Session =
  /** since: when this socket said hello (a tab that never pings is away after FRESH_MS). */
  | { role: "screen"; token: string; since: number }
  | { role: "remote"; token: string; since: number }
  | { role: "player"; player: string; since?: number }
  | { role: "guest" }
  | { role: null };

interface Waiter {
  session: Session;
  resolve: (msgs: ServerMessage[]) => void;
  /** For a guest: the choice it was last given. */
  chooseKey?: string;
}

export class Instance extends DurableObject<Env> {
  private meta: Meta | null = null;
  private quizRecord: QuizRecord | null = null;
  private game: G.Game | null = null;
  private waiters = new Set<Waiter>();
  /** Last poll per player id, or per "screen:<token>" / "remote:<token>". */
  private lastPoll = new Map<string, number>();
  /**
   * What each student device was last sent. A student's view only changes
   * with their own answer or the teacher's steps, not with classmates'
   * answers; sending only changes keeps a polling class from waking 25
   * devices per answer (the Free plan's request budget).
   */
  private sentToSocket = new WeakMap<WebSocket, string>();
  private sentToPoller = new Map<string, { key: string; v: number }>();
  /**
   * "<role>:<old token>" → what a tab still holding that token is told: its
   * Projector moved to another tab and it is the Remote now, or it lost the
   * role. Kept for a tab that was between polls, or reconnecting, when it
   * happened; in memory only, which covers the seconds that matter.
   */
  private moved = new Map<string, ServerMessage>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Answered by the runtime without waking the object: keeps proxies and
    // NAT tables from dropping an idle socket.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
    ctx.blockConcurrencyWhile(() => this.load());
  }

  /** The instance as stored; also after a write failed, so nothing shows that isn't stored. */
  private async load(): Promise<void> {
    const storage = this.ctx.storage;
    const [meta, record, fixes, run] = await Promise.all([
      storage.get<Meta>("meta"),
      storage.get<QuizRecord>("quiz"),
      storage.get<G.Fix[]>("fixes"),
      storage.get<G.Run | null>("run"),
    ]);
    if (meta && record && fixes) {
      this.meta = meta;
      this.quizRecord = record;
      this.game = { quiz: record.quiz, fixes, run: run ?? null };
    }
  }

  /** The instance holds a quiz made with per-quiz codes and roles; older ones are left to expire. */
  private live(): boolean {
    return !!(this.meta && this.game && this.meta.code && this.meta.roles);
  }

  // -------------------------------------------------------------------------
  // RPC from the API functions

  /**
   * Parses the uploaded text here rather than in the API function: a Durable
   * Object has far more CPU time per request than a Function on the Free
   * plan. Nothing is stored when the quiz has errors. On success the quiz
   * has its code and its first class's lobby, and the tab that pasted it
   * holds the Projector (user flow, rule 3).
   */
  async create(
    text: string,
    images: UploadedImage[] = [],
    /** The teacher chose to run the quiz without the pictures that didn't come with it. */
    leaveOutMissing = false,
  ): Promise<
    | { ok: true; secret: string; code: string; token: string }
    | { ok: false; errors: Problem[]; warnings: Problem[]; missingImages?: string[]; error?: string }
  > {
    if (this.meta) throw new Error("instance exists");
    const r = parseQuiz(text);
    if (!r.ok) return { ok: false, errors: r.errors, warnings: r.warnings };
    const pictures = matchImages(r.quiz, images, leaveOutMissing);
    if (!pictures.ok) return { ok: false, errors: pictures.errors, warnings: r.warnings, missingImages: pictures.missing };
    const now = Date.now();
    const secret = randomToken();
    const token = randomToken();
    const codeUntil = now + INSTANCE_IDLE_MS + CODE_SLACK_MS;
    // The site's share of the free plan: uploads today, bytes stored at once.
    const bytes = new TextEncoder().encode(text).byteLength + Object.values(pictures.files).reduce((s, f) => s + f.byteLength, 0);
    if (!(await this.budget().reserve(this.ctx.id.toString(), bytes, codeUntil))) return { ok: false, errors: [], warnings: [], error: SITE_FULL };
    const code = await this.claimCode(codeUntil);
    this.quizRecord = { quiz: r.quiz, warnings: [...r.warnings, ...pictures.warnings], images: pictures.index, imageSecret: randomToken() };
    this.meta = { secret, code, codeUntil, roles: { screen: token, remote: null }, lastActivity: now, v: 1 };
    // The pasting tab is about to open the Projector with it.
    this.lastPoll.set(`screen:${token}`, now);
    this.game = G.newGame(r.quiz);
    G.startRun(this.game, code, randomToken(9), Math.random);
    // The alarm goes first: should the write below fail halfway, the alarm
    // finds an instance without meta and deletes whatever was written.
    await this.scheduleAlarm();
    try {
      await this.ctx.storage.put({ ...pictures.files, quiz: this.quizRecord, meta: this.meta, fixes: this.game.fixes, run: this.game.run });
    } catch (e) {
      await this.budget().release(this.ctx.id.toString()).catch(() => {});
      throw e;
    }
    return { ok: true, secret, code, token };
  }

  /**
   * The upload with pictures, as multipart/form-data: "text", "leaveOut",
   * and per picture an "image" file with its "imageName" (a text field: a
   * non-ASCII file name in a multipart header isn't decoded reliably).
   */
  private async createFromForm(req: Request): Promise<Response> {
    const fail = (message: string) => json({ ok: false, errors: [{ message }], warnings: [] } satisfies UploadResult);
    const len = Number(req.headers.get("content-length") ?? "NaN");
    if (!(len <= MAX_UPLOAD_BYTES)) return json({ error: "The quiz with its pictures is too large." }, 413);
    if (this.meta) return json({ error: "instance exists" }, 409);
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return json({ error: "The upload couldn't be read." }, 400);
    }
    const text = form.get("text");
    if (typeof text !== "string" || text.trim() === "") return fail("The quiz text is empty.");
    if (new TextEncoder().encode(text).byteLength > MAX_QUIZ_BYTES) return fail(`This text is longer than a quiz can be (${Math.round(MAX_QUIZ_BYTES / 1000)} KB).`);
    const files = form.getAll("image");
    const names = form.getAll("imageName");
    if (files.length > MAX_IMAGES) return fail(`The quiz has more than ${MAX_IMAGES} pictures.`);
    if (names.length !== files.length || files.some((f) => typeof f === "string") || names.some((n) => typeof n !== "string")) {
      return json({ error: "The upload couldn't be read." }, 400);
    }
    const images = await Promise.all(files.map(async (f, i) => ({ name: names[i] as string, bytes: new Uint8Array(await (f as File).arrayBuffer()) })));
    const r = await this.create(text, images, form.get("leaveOut") === "missing");
    const body: UploadResult = r.ok ? { ok: true, id: this.ctx.id.toString(), secret: r.secret, code: r.code, token: r.token } : r;
    return json(body);
  }

  private budget() {
    return this.env.BUDGET.get(this.env.BUDGET.idFromName("site"));
  }

  /** GET …/img/<secret>/<n>: a picture, for a device that was sent a view naming it. */
  private async image(secret: string, n: string): Promise<Response> {
    const record = this.quizRecord;
    const info = record?.images && Object.values(record.images).find((i) => String(i.n) === n);
    if (!record?.imageSecret || secret !== record.imageSecret || !info) return new Response("not found", { status: 404 });
    const bytes = await this.ctx.storage.get<Uint8Array>(`img:${info.n}`);
    if (!bytes) return new Response("not found", { status: 404 });
    return new Response(bytes, {
      headers: {
        "content-type": info.type,
        // Not even the browser keeps it: a shared school laptop holds nothing once the page is gone.
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; sandbox",
      },
    });
  }

  /** Where a question's picture is fetched, and its size, for the views. */
  private imageRef(name: string): ImageRef | null {
    const record = this.quizRecord;
    const info = name ? record?.images?.[imageKey(name)] : undefined;
    if (!info || !record?.imageSecret) return null;
    return { src: `/api/i/${this.ctx.id.toString()}/img/${record.imageSecret}/${info.n}`, w: info.w, h: info.h };
  }

  /** For the code directory: does this code still open this quiz? */
  async opens(code: string): Promise<boolean> {
    return this.live() && this.meta!.code === code;
  }

  // -------------------------------------------------------------------------
  // HTTP: WebSocket upgrade, the long-polling fallback, the pasting device's calls

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const parts = url.pathname.split("/");
    const action = parts[parts.length - 1];
    if (action === "quiz" && req.method === "POST") return this.createFromForm(req);
    if (parts[parts.length - 3] === "img" && req.method === "GET") return this.image(parts[parts.length - 2], action);
    if (action === "ws") {
      if (req.headers.get("Upgrade") !== "websocket") return new Response("expected a WebSocket", { status: 426 });
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      pair[1].serializeAttachment({ role: null } satisfies Session);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (req.method !== "POST") return new Response("not found", { status: 404 });
    let body: { auth?: Auth; v?: number; cmd?: { id: string; cmd: Command }; secret?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "bad request" }, 400);
    }
    if (action === "info" || action === "end") return this.forOwner(action, body.secret);
    if (!body.auth) return json({ error: "bad request" }, 400);
    const out: ServerMessage[] = [];
    const session = this.authenticate(body.auth, out);
    // Gone, or a role that moved: the tab hears it with the reply, whatever it asked.
    if (session.role === null) return json({ messages: out });
    this.notePoll(session);
    if (action === "cmd" && body.cmd && session.role !== null) {
      // A command over HTTP: the reply is its acknowledgement plus, for a
      // guest becoming a player or taking a role, who it is now.
      const replies = await this.command(session, body.cmd.id, body.cmd.cmd);
      return json({ messages: [...out, ...replies.direct] });
    }
    if (action === "poll") {
      if (session.role === null) return json({ messages: out });
      const known = typeof body.v === "number" ? body.v : -1;
      if (session.role === "guest") {
        // The first poll gets the choice at once (it's in `out`); later ones
        // are held until the choice changes, instead of being answered at
        // once over and over (the tab would spin and redraw its buttons).
        if (known === -1) return json({ messages: out });
        const chooseKey = JSON.stringify(this.chooseMessage());
        const msgs = await this.hold(session, chooseKey);
        const fresh = this.chooseMessage();
        return json({ messages: msgs.length > 0 ? msgs : JSON.stringify(fresh) !== chooseKey ? [fresh] : [] });
      }
      if (session.role === "player") {
        const pid = session.player;
        const view = this.viewFor(session) as PlayerView;
        const sent = this.sentToPoller.get(pid);
        // Answer at once when the device's view changed, or when it didn't
        // get the last one (its version is older than what was sent).
        if (!sent || known < sent.v || sent.key !== viewKey(view)) {
          this.sentToPoller.set(pid, { key: viewKey(view), v: view.v });
          return json({ messages: [...out, { t: "state", view }] });
        }
        const msgs = await this.hold(session);
        this.notePoll(session);
        return json({ messages: msgs });
      }
      const view = this.viewFor(session);
      if (view && view.v > known) return json({ messages: [...out, { t: "state", view }] });
      const msgs = await this.hold(session);
      this.notePoll(session);
      return json({ messages: msgs });
    }
    return json({ error: "not found" }, 404);
  }

  /** The device that pasted the quiz: how long it stays (root page), or delete it now. */
  private async forOwner(action: "info" | "end", secret: unknown): Promise<Response> {
    if (!this.live() || typeof secret !== "string" || !safeEqual(secret, this.meta!.secret)) return json({ error: "gone" }, 404);
    if (action === "end") {
      await this.endInstance();
      return json({ ok: true });
    }
    const meta = this.meta!;
    return json({ title: this.game!.quiz.title, code: meta.code!, closes: meta.lastActivity + INSTANCE_IDLE_MS } satisfies QuizInfo);
  }

  private notePoll(session: Session): void {
    if (session.role === "player") this.lastPoll.set(session.player, Date.now());
    else if (session.role === "screen" || session.role === "remote") this.lastPoll.set(`${session.role}:${session.token}`, Date.now());
  }

  /** Holds a long-poll until the tab's view changes, or POLL_HOLD_MS. */
  private hold(session: Session, chooseKey?: string): Promise<ServerMessage[]> {
    return new Promise<ServerMessage[]>((resolve) => {
      const w: Waiter = { session, resolve, chooseKey };
      this.waiters.add(w);
      setTimeout(() => {
        if (this.waiters.delete(w)) resolve([]);
      }, POLL_HOLD_MS);
    });
  }

  // -------------------------------------------------------------------------
  // WebSocket handlers (the object may have hibernated in between)

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    if (typeof raw !== "string" || raw.length > 10_000) return;
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.t === "hello") {
      const out: ServerMessage[] = [];
      let session = this.authenticate(msg.auth, out);
      if (session.role === "player") session = { ...session, since: Date.now() };
      ws.serializeAttachment(session);
      for (const m of out) send(ws, m);
      if (session.role === null) {
        ws.close(4000, "gone");
        return;
      }
      if (session.role !== "guest") this.sendView(ws, session);
      // Someone arrived: the teacher's tabs show who, guests which roles are free.
      if (session.role !== "guest") this.broadcastStaff();
      return;
    }
    if (msg.t === "cmd") {
      const session = ws.deserializeAttachment() as Session;
      if (!session || session.role === null) return;
      const replies = await this.command(session, msg.id, msg.cmd, ws);
      let next = replies.session;
      if (next && next.role === "player") next = { ...next, since: Date.now() };
      if (next) ws.serializeAttachment(next);
      for (const m of replies.direct) send(ws, m);
      if (next && next.role === "player") {
        this.sendView(ws, next);
        this.broadcastStaff();
      }
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const session = ws.deserializeAttachment() as Session | null;
    if (!session || session.role === null || session.role === "guest") return;
    // A teacher's tab that closed its socket (reload, a phone locking its
    // screen) fades like one that went quiet: away after FRESH_MS, not at
    // once, so a reload doesn't flip the steering to the Projector and back.
    if (session.role === "screen" || session.role === "remote") this.lastPoll.set(`${session.role}:${session.token}`, Date.now());
    this.broadcastStaff(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  // -------------------------------------------------------------------------
  // Who is this tab?

  private authenticate(auth: Auth, out: ServerMessage[]): Session {
    if (!this.meta || !this.game) {
      out.push({ t: "gone", reason: "This quiz has ended." });
      return { role: null };
    }
    if (!this.live()) {
      out.push({ t: "gone", reason: "This quiz was made with an earlier version of the site. Paste it again." });
      return { role: null };
    }
    const meta = this.meta;
    const game = this.game;
    if (auth.role === "screen" || auth.role === "remote") {
      const held = meta.roles![auth.role];
      if (typeof auth.token === "string" && held && safeEqual(auth.token, held)) return { role: auth.role, token: held, since: Date.now() };
      // The role went to another tab while this one was away, or between its polls.
      const moved = typeof auth.token === "string" ? this.moved.get(`${auth.role}:${auth.token}`) : undefined;
      out.push(moved ?? { t: "lost", role: auth.role });
      return { role: null };
    }
    if (auth.role === "player") {
      const run = game.run;
      if (run && typeof auth.token === "string") {
        // A known player comes back, also after the end: a reloaded tablet
        // still shows its final place.
        const p = Object.values(run.players).find((pl) => safeEqual(pl.token, auth.token));
        if (p) return { role: "player", player: p.id };
        // A tablet of an earlier class doesn't slip into this one.
        if (typeof auth.run === "string" && auth.run !== run.id) {
          out.push({ t: "gone", reason: "This quiz has finished." });
          return { role: null };
        }
      }
    }
    // A guest is told what it can be: a player (or, once the quiz is under
    // way, one of the players whose devices are away), or a free role.
    out.push(this.chooseMessage());
    return { role: "guest" };
  }

  // -------------------------------------------------------------------------
  // Roles (user flow §1)

  /** Whether the tab holding a role is there, quiet (soon away), or away; "none" when nobody holds it. */
  private presence(role: RoleName, exclude?: WebSocket): "none" | "present" | "quiet" | "away" {
    const token = this.meta?.roles?.[role];
    if (!token) return "none";
    let last = this.lastPoll.get(`${role}:${token}`) ?? 0;
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude || ws.readyState !== WebSocket.OPEN) continue;
      const s = ws.deserializeAttachment() as Session | null;
      if (!s || s.role !== role || s.token !== token) continue;
      const pinged = this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime() ?? 0;
      last = Math.max(last, pinged, s.since);
    }
    const age = Date.now() - last;
    return age < QUIET_MS ? "present" : age < FRESH_MS ? "quiet" : "away";
  }

  private shown(role: RoleName, exclude?: WebSocket): Presence {
    const p = this.presence(role, exclude);
    return p === "quiet" ? "present" : p;
  }

  /** The Projector steers while no Remote is there (rule 4). */
  private steering(exclude?: WebSocket): boolean {
    const p = this.presence("remote", exclude);
    return p === "none" || p === "away";
  }

  /**
   * Once the class has a student, no new tab gets the steering: not the
   * Remote, not a Projector that would steer itself, not by taking over the
   * one that does (backlog item 18: children must not take the remote by
   * accident). A tab that holds a role keeps it and comes back to it; a dead
   * phone means the wall steers; another computer can still take a free
   * Projector while a Remote steers. "Again with another class" opens a
   * lobby without students, so the roles are open again.
   */
  private classIn(): boolean {
    const run = this.game?.run;
    return !!run && G.activePlayers(run).length > 0;
  }

  private choiceState(role: RoleName): ChoiceState {
    const p = this.presence(role);
    const steers = role === "remote" || this.steering();
    if (p === "none" || p === "away") return steers && this.classIn() ? "closed" : "free";
    if (role === "screen" && this.steering()) return this.classIn() ? "taken" : "movable";
    // Quiet means "free soon"; not when it would come back closed.
    return p === "quiet" && !(steers && this.classIn()) ? "quiet" : "taken";
  }

  /**
   * Tells the tabs holding a role's old token what happened (they lost it, or
   * hold another role now) and closes their line: the tab reconnects as what
   * it is now.
   */
  private evict(role: RoleName, token: string, msg: ServerMessage): void {
    for (const ws of this.ctx.getWebSockets()) {
      const s = ws.deserializeAttachment() as Session | null;
      if (!s || s.role !== role || s.token !== token) continue;
      send(ws, msg);
      ws.serializeAttachment({ role: null } satisfies Session);
      ws.close(4001, "role moved");
    }
    for (const w of [...this.waiters]) {
      if (w.session.role === role && w.session.token === token) {
        this.waiters.delete(w);
        w.resolve([msg]);
      }
    }
    this.lastPoll.delete(`${role}:${token}`);
    this.moved.set(`${role}:${token}`, msg);
    if (this.moved.size > 20) this.moved.delete(this.moved.keys().next().value!);
  }

  /** A role handed to a tab that is about to connect with it counts as there from now. */
  private hand(role: RoleName, token: string): void {
    this.meta!.roles![role] = token;
    this.lastPoll.set(`${role}:${token}`, Date.now());
  }

  /** A guest takes a role, if it's free; the Projector also when it steers itself (rule 4). */
  private takeRole(role: RoleName): string | null {
    const roles = this.meta!.roles!;
    const state = this.choiceState(role);
    if (state !== "free" && state !== "movable") return null;
    const token = randomToken();
    const old = roles[role];
    if (old) {
      if (state === "movable") {
        // The tab that had the Projector becomes the Remote.
        const remote = randomToken();
        this.hand("remote", remote);
        this.evict(role, old, { t: "role", role: "remote", token: remote });
      } else {
        this.evict(role, old, { t: "lost", role });
      }
    }
    this.hand(role, token);
    return token;
  }

  // -------------------------------------------------------------------------
  // Commands

  private async command(
    session: Session,
    id: string,
    cmd: Command,
    ws?: WebSocket,
  ): Promise<{ direct: ServerMessage[]; session?: Session }> {
    const game = this.game;
    const meta = this.meta;
    if (!game || !meta || !this.live() || session.role === null) return { direct: [{ t: "gone", reason: "This quiz has ended." }] };
    const roles = meta.roles!;
    const ack = (ok: boolean, error?: string, result?: unknown): ServerMessage => ({ t: "ack", id, ok, error, result });
    const now = Date.now();
    const at = (c: { at: { phase: string; current: number; reading?: boolean } }) => {
      const run = game.run;
      const phase = run ? run.phase : "idle";
      const current = run ? run.current : -1;
      if (!c.at || c.at.phase !== phase || c.at.current !== current) return false;
      // Go and Reveal are steps within one phase: a doubled Go mustn't reveal.
      return typeof c.at.reading !== "boolean" || c.at.reading === (G.answering(game) === "reading");
    };

    try {
      // --- a guest: play, pick an avatar back, or take a role
      if (session.role === "guest") {
        if (cmd.op === "tick") return { direct: [ack(true), this.chooseMessage()] };
        if (cmd.op === "takeRole") {
          if (cmd.role !== "screen" && cmd.role !== "remote") return { direct: [ack(false, "unknown role")] };
          const token = this.takeRole(cmd.role);
          if (!token) {
            const error = this.classIn() ? "Students have joined: the steering stays where it is." : cmd.role === "screen" ? "Another screen shows the quiz." : "Another device steers the quiz.";
            return { direct: [ack(false, error), this.chooseMessage()] };
          }
          await this.afterTeacherChange(["meta"]);
          return { direct: [ack(true), { t: "role", role: cmd.role, token }], session: { role: cmd.role, token, since: now } };
        }
        if (cmd.op !== "newPlayer" && cmd.op !== "claim") return { direct: [ack(false, "not joined")] };
        const run = game.run;
        if (!run || run.phase === "final") return { direct: [ack(false, "This quiz has finished."), this.chooseMessage()] };
        // Joining after the start may be a student whose device lost its
        // player; they can pick their avatar back (decisions.md).
        if (cmd.op === "newPlayer") {
          // A join resent after its answer was lost gets the same player.
          const earlier = typeof id === "string" && run.joins && Object.hasOwn(run.joins, id) ? G.playerById(run, run.joins[id]) : null;
          if (earlier && !earlier.removed) {
            return { direct: [ack(true), { t: "welcome", player: earlier.id, token: earlier.token, run: run.id }], session: { role: "player", player: earlier.id } };
          }
          const p = G.addPlayer(game, randomToken(12), randomToken(), now, Math.random);
          const joins = (run.joins ??= {});
          joins[id] = p.id;
          const keys = Object.keys(joins);
          if (keys.length > JOINS_KEPT) delete joins[keys[0]];
          await this.persist(["run"]);
          // The first student in: from now on this class can be left behind
          // (CLASS_IDLE_MS); later joins only move that time, which the alarm
          // reads when it fires.
          if (Object.keys(run.players).length === 1) await this.scheduleAlarm();
          this.broadcast();
          return { direct: [ack(true), { t: "welcome", player: p.id, token: p.token, run: run.id }], session: { role: "player", player: p.id } };
        }
        const p = G.playerById(run, cmd.player);
        if (!p || p.removed || !this.awayPlayers().includes(p)) return { direct: [ack(false, "That avatar is taken.")] };
        p.token = randomToken();
        await this.persist(["run"]);
        return { direct: [ack(true), { t: "welcome", player: p.id, token: p.token, run: run.id }], session: { role: "player", player: p.id } };
      }

      // --- a student
      if (session.role === "player") {
        if (cmd.op === "tick") return { direct: [ack(true)] };
        if (cmd.op !== "answer") return { direct: [ack(false, "not allowed")] };
        const view = typeof cmd.v === "number" ? cmd.v : Infinity;
        // The tablet names the answer by its place on screen; it is stored by its place in the text.
        const choice = Number.isInteger(cmd.choice) ? (G.orderOf(game, cmd.q)[cmd.choice] ?? -1) : -1;
        // Only a tap that changed the recorded answer is stored: a resend or
        // the same button again isn't (children hammer buttons; each write
        // comes out of the account's daily allowance).
        const outcome = G.answerOutcome(game, session.player, cmd.q, choice, cmd.seq, view, now, typeof cmd.ms === "number" ? cmd.ms : undefined);
        if (outcome === "recorded") {
          // Everyone present has answered: the countdown ends now rather
          // than leaving the class to watch it run out.
          if (G.runningClock(game) && this.allAnswered()) {
            G.closeAnswers(game, this.nextView());
            await this.persist(["run"]);
            await this.scheduleAlarm();
          } else await this.persist(["run"]);
          this.broadcast();
        }
        return { direct: [ack(outcome !== "refused")] };
      }

      // --- a teacher role: still the tab holding it?
      if (roles[session.role] !== session.token) return { direct: [ack(false), { t: "lost", role: session.role }] };
      if (cmd.op === "tick") {
        const view = this.viewFor(session);
        return { direct: view ? [ack(true), { t: "state", view }] : [ack(true)] };
      }
      if (cmd.op === "leave") {
        roles[session.role] = null;
        this.lastPoll.delete(`${session.role}:${session.token}`);
        await this.afterTeacherChange(["meta"]);
        return { direct: [ack(true)], session: { role: null } };
      }
      if (session.role === "screen") {
        if (cmd.op === "advance") {
          // The clicker in the room works whoever steers.
          if (!at(cmd)) return { direct: [ack(true, undefined, "stale")] };
          G.advance(game, now, this.nextView());
          await this.afterTeacherChange(["run"]);
          return { direct: [ack(true)] };
        }
        if (cmd.op === "zoom") {
          // Like the clicker: the teacher at the projector points at the picture, whoever steers.
          if (!at(cmd)) return { direct: [ack(true, undefined, "stale")] };
          G.setZoom(game, !!cmd.value);
          await this.afterTeacherChange(["run"]);
          return { direct: [ack(true)] };
        }
        if (cmd.op === "steerHere") {
          const old = roles.remote;
          if (old) this.evict("remote", old, { t: "lost", role: "remote" });
          roles.remote = null;
          await this.afterTeacherChange(["meta"]);
          return { direct: [ack(true)] };
        }
        if (!this.steering()) return { direct: [ack(false, "The remote steers the quiz. To steer here: ⋯, Steer from here.")] };
      } else if (cmd.op === "projectorHere") {
        // The Remote becomes the Projector that steers itself.
        const old = roles.screen;
        if (old) this.evict("screen", old, { t: "lost", role: "screen" });
        const token = randomToken();
        this.hand("screen", token);
        roles.remote = null;
        this.moved.set(`remote:${session.token}`, { t: "role", role: "screen", token });
        await this.afterTeacherChange(["meta"]);
        return { direct: [ack(true), { t: "role", role: "screen", token }], session: { role: null } };
      }

      // --- steering
      let changed: ("run" | "fixes" | "meta")[] = [];
      switch (cmd.op) {
        case "again": {
          // A new class with the same code. The previous class's data goes
          // now: its ranking has been shown. Only from the final ranking, and
          // only once: a resend must not wipe a class that has started joining.
          if (!at(cmd) || (game.run && game.run.phase !== "final")) return { direct: [ack(true, undefined, "stale")] };
          this.newClass();
          changed = ["run"];
          break;
        }
        case "begin":
        case "go":
        case "stopClock":
        case "reveal":
        case "next":
        case "ranking":
        case "finish":
        case "skipCurrent": {
          if (!at(cmd)) return { direct: [ack(true, undefined, "stale")] };
          if (cmd.op === "begin") G.begin(game, now);
          else if (cmd.op === "go") G.go(game, now);
          else if (cmd.op === "stopClock") G.stopClock(game);
          else if (cmd.op === "reveal") G.reveal(game, this.nextView());
          else if (cmd.op === "next") G.next(game, now);
          else if (cmd.op === "ranking") G.showRanking(game);
          else if (cmd.op === "finish") G.finish(game, now);
          else {
            G.skipCurrent(game, now);
            changed.push("fixes");
          }
          changed.push("run");
          break;
        }
        case "tempo":
          G.setTempo(game, cmd.tempo);
          changed = ["run"];
          break;
        case "nudge":
          // No `at`: two presses are meant as two, and one sent at the reveal
          // that lands after Next acts on the same question, now being read.
          G.nudge(game, cmd.by, now, this.nextView());
          changed = ["run"];
          break;
        case "setCounts":
          // In screen order, like everything the teacher's views show.
          G.setCounts(game, cmd.q, this.fromScreen(cmd.q, cmd.counts));
          changed = ["fixes"];
          break;
        case "setVoid":
          G.setVoid(game, cmd.q, !!cmd.value);
          changed = ["fixes"];
          break;
        case "setSkip":
          G.setSkip(game, cmd.q, !!cmd.value);
          changed = ["fixes"];
          break;
        case "setHidePicture":
          G.setHidePicture(game, cmd.q, !!cmd.value);
          changed = ["fixes"];
          break;
        case "zoom":
          if (!at(cmd)) return { direct: [ack(true, undefined, "stale")] };
          G.setZoom(game, !!cmd.value);
          changed = ["run"];
          break;
        case "remove":
          G.removePlayer(game, cmd.player);
          changed = ["run"];
          break;
        case "endInstance":
          // The teacher's tabs hear that it worked before their sockets close.
          await this.endInstance(id);
          return { direct: [ack(true)] };
        default:
          return { direct: [ack(false, "unknown command")] };
      }
      await this.afterTeacherChange(changed);
      return { direct: [ack(true)] };
    } catch (e) {
      if (e instanceof G.GameError) return { direct: [ack(false, e.message)] };
      // The account's daily allowance is spent: the tab says so rather than
      // looking offline (decisions.md, hardening). What's in memory may be
      // ahead of storage now; reload it, so nothing shows that isn't stored.
      if (isQuotaError(e)) {
        await this.load().catch(() => {});
        return { direct: [ack(false, "quota"), { t: "quota" }] };
      }
      throw e;
    }
  }

  /** A fresh lobby with the same code; the tablets of the class before are told it has finished. */
  private newClass(): void {
    const game = this.game!;
    G.startRun(game, this.meta!.code!, randomToken(9), Math.random);
    this.sentToPoller.clear();
    for (const [k] of this.lastPoll) if (!k.includes(":")) this.lastPoll.delete(k);
    for (const ws of this.ctx.getWebSockets()) {
      const s = ws.deserializeAttachment() as Session | null;
      if (s?.role === "player") {
        send(ws, { t: "gone", reason: "This quiz has finished." });
        ws.close(4000, "gone");
      }
    }
    for (const w of [...this.waiters]) {
      if (w.session.role === "player") {
        this.waiters.delete(w);
        w.resolve([{ t: "gone", reason: "This quiz has finished." }]);
      }
    }
  }

  private async afterTeacherChange(changed: ("run" | "fixes" | "meta")[]): Promise<void> {
    this.meta!.lastActivity = Date.now();
    await this.refreshCode();
    await this.persist([...new Set([...changed, "meta" as const])]);
    await this.scheduleAlarm();
    this.broadcast();
  }

  /** The version the views get with the next persist(): the first to show what just changed. */
  private nextView(): number {
    return this.meta!.v + 1;
  }

  /** Writes what changed; the quiz text itself was written once at upload. */
  private async persist(keys: ("run" | "fixes" | "meta")[]): Promise<void> {
    const meta = this.meta!;
    const game = this.game!;
    meta.v++;
    const entries: Record<string, unknown> = { meta };
    if (keys.includes("run")) entries.run = game.run;
    if (keys.includes("fixes")) entries.fixes = game.fixes;
    await this.ctx.storage.put(entries);
  }

  // -------------------------------------------------------------------------
  // The code

  private async claimCode(until: number): Promise<string> {
    const id = this.ctx.id.toString();
    for (let i = 0; i < 20; i++) {
      const code = randomCode(5);
      const stub = this.env.JOIN.get(this.env.JOIN.idFromName(code));
      if (await stub.claim(id, until)) return code;
    }
    throw new Error("No free code was found.");
  }

  /** The code stays claimed while the instance lives: renewed when the instance's end moves near the claim's. */
  private async refreshCode(): Promise<void> {
    const meta = this.meta!;
    const end = meta.lastActivity + INSTANCE_IDLE_MS;
    if (!meta.code || (meta.codeUntil ?? 0) > end + CODE_SLACK_MS / 2) return;
    const until = end + CODE_SLACK_MS;
    const stub = this.env.JOIN.get(this.env.JOIN.idFromName(meta.code));
    if (await stub.claim(this.ctx.id.toString(), until)) meta.codeUntil = until;
    // The site's booking of this quiz's storage lives as long.
    await this.budget().renew(this.ctx.id.toString(), until).catch(() => {});
  }

  private async releaseCode(): Promise<void> {
    const code = this.meta?.code;
    if (!code) return;
    const stub = this.env.JOIN.get(this.env.JOIN.idFromName(code));
    await stub.release(this.ctx.id.toString());
  }

  // -------------------------------------------------------------------------
  // Lifetime

  private async scheduleAlarm(): Promise<void> {
    const meta = this.meta;
    if (!meta) return;
    let at = meta.lastActivity + INSTANCE_IDLE_MS;
    const ended = this.game?.run?.ended;
    if (ended != null) at = Math.min(at, ended + RUN_KEEP_MS);
    const idle = this.classIdleFrom();
    if (idle != null) at = Math.min(at, idle + CLASS_IDLE_MS);
    // A running countdown: time's up is the server's step, as the reveal is the teacher's.
    const deadline = this.game ? G.deadline(this.game) : null;
    if (deadline != null) at = Math.min(at, deadline);
    await this.ctx.storage.setAlarm(at);
  }

  /**
   * A class nobody steers any more: since when, or null when there is none
   * to end (no class, already over, or an empty lobby, which may wait from
   * the evening before). The clock runs from the teacher's last step or the
   * last student joining, whichever is later, so a lobby filling for a
   * lesson hours after the upload isn't cleared under the students.
   */
  private classIdleFrom(): number | null {
    const run = this.game?.run;
    const meta = this.meta;
    if (!run || !meta || run.ended != null) return null;
    const players = Object.values(run.players);
    if (run.phase === "lobby" && players.length === 0) return null;
    return Math.max(meta.lastActivity, ...players.map((p) => p.joined));
  }

  async alarm(): Promise<void> {
    const meta = this.meta;
    if (!meta) {
      await this.ctx.storage.deleteAll();
      return;
    }
    const now = Date.now();
    if (now >= meta.lastActivity + INSTANCE_IDLE_MS || !this.live()) {
      await this.endInstance();
      return;
    }
    const deadline = G.deadline(this.game!);
    if (deadline != null && now >= deadline) {
      // Time's up: answering closes; the reveal waits for the teacher.
      G.closeAnswers(this.game!, this.nextView());
      await this.persist(["run"]);
      this.broadcast();
    }
    const idle = this.classIdleFrom();
    if (idle != null && now >= idle + CLASS_IDLE_MS) {
      // Left behind: the lesson is over, but its tablets would keep their
      // line open (and, on the HTTP fallback, keep polling) for the quiz's 48
      // hours. A class under way ends with its final ranking, whose data goes
      // an hour later; a lobby with students opens empty again.
      if (this.game!.run!.phase === "lobby") this.newClass();
      else G.finish(this.game!, now);
      await this.persist(["run"]);
      this.broadcast();
    }
    const run = this.game?.run;
    if (run && run.ended != null && now >= run.ended + RUN_KEEP_MS) {
      // The class's players and answers go; the quiz waits in a fresh lobby.
      this.newClass();
      await this.persist(["run"]);
      this.broadcast();
    }
    await this.scheduleAlarm();
  }

  /** Everything goes: quiz, classes, players, answers, pictures (decisions.md). */
  private async endInstance(ackId?: string): Promise<void> {
    await this.releaseCode().catch(() => {});
    await this.budget().release(this.ctx.id.toString()).catch(() => {});
    for (const ws of this.ctx.getWebSockets()) {
      const s = ws.deserializeAttachment() as Session | null;
      if (ackId && (s?.role === "screen" || s?.role === "remote")) send(ws, { t: "ack", id: ackId, ok: true });
      send(ws, { t: "gone", reason: "The teacher has ended this quiz." });
      ws.close(4000, "gone");
    }
    for (const w of this.waiters) w.resolve([{ t: "gone", reason: "The teacher has ended this quiz." }]);
    this.waiters.clear();
    this.meta = null;
    this.game = null;
    this.quizRecord = null;
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }

  // -------------------------------------------------------------------------
  // Views

  /** Players whose device was heard from recently: an open socket that still pings, or a recent poll. */
  private connectedPlayers(exclude?: WebSocket): Set<string> {
    const ids = new Set<string>();
    const now = Date.now();
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude || ws.readyState !== WebSocket.OPEN) continue;
      const s = ws.deserializeAttachment() as Session | null;
      if (!s || s.role !== "player") continue;
      const pinged = this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime() ?? 0;
      if (now - Math.max(pinged, s.since ?? 0) < FRESH_MS) ids.add(s.player);
    }
    for (const [pid, t] of this.lastPoll) if (!pid.includes(":") && now - t < FRESH_MS) ids.add(pid);
    return ids;
  }

  private chooseMessage(): Extract<ServerMessage, { t: "choose" }> {
    const run = this.game?.run;
    const away = run && run.phase !== "lobby" && run.phase !== "final" ? this.awayPlayers() : [];
    return {
      t: "choose",
      title: this.game?.quiz.title ?? "",
      phase: run ? run.phase : "idle",
      avatars: away.map((p) => ({ id: p.id, avatar: p.avatar })),
      screen: this.choiceState("screen"),
      remote: this.choiceState("remote"),
    };
  }

  private awayPlayers(): G.Player[] {
    const run = this.game?.run;
    if (!run) return [];
    const connected = this.connectedPlayers();
    return G.activePlayers(run).filter((p) => !connected.has(p.id));
  }

  private ranking(): RankingView | null {
    const game = this.game!;
    if (!game.run) return null;
    const st = G.standings(game);
    return {
      top: st.filter((s) => s.place <= 3).slice(0, 10).map(({ avatar, score, place }) => ({ avatar, score, place })),
      ...G.classResult(game),
      of: G.scoringQuestions(game).length,
      players: st.length,
      speed: G.speedScale(game),
    };
  }

  /** Every player whose device is there has answered the open question (and someone has). */
  private allAnswered(): boolean {
    const run = this.game?.run;
    if (!run || run.current < 0) return false;
    const given = run.answers[run.current] ?? {};
    const connected = this.connectedPlayers();
    const active = G.activePlayers(run);
    return active.some((p) => Object.hasOwn(given, p.id)) && active.every((p) => Object.hasOwn(given, p.id) || !connected.has(p.id));
  }

  /** The open question's countdown as the screens draw it: running, or run out; null without one (or stopped). */
  private clockView(): ClockView | null {
    const run = this.game?.run;
    const clock = run && run.phase === "question" ? run.clocks?.[run.current] : undefined;
    if (!clock || clock.stopped) return null;
    return { ms: clock.ms, leftMs: clock.closed ? 0 : Math.max(0, clock.at + clock.ms - Date.now()) };
  }

  private answeredNow(): number {
    const run = this.game?.run;
    return run && run.current >= 0 ? G.activeAnswers(run, run.current).length : 0;
  }

  /** Per-answer values of question q, from the text's order into the order on screen. */
  private onScreen<T>(q: number, values: T[]): T[] {
    return G.orderOf(this.game!, q).map((i) => values[i]);
  }

  /** Per-answer values in the order on screen, back into the text's order. */
  private fromScreen<T>(q: number, values: T[]): T[] {
    const order = G.orderOf(this.game!, q);
    if (!Array.isArray(values) || values.length !== order.length) return values;
    const out = new Array<T>(order.length);
    order.forEach((i, pos) => (out[i] = values[pos]));
    return out;
  }

  private screenView(cache: ViewCache, exclude?: WebSocket): ScreenView {
    const game = this.game!;
    const meta = this.meta!;
    const run = game.run;
    const active = run ? G.activePlayers(run) : [];
    const phase = run ? run.phase : "idle";
    const q = run && run.current >= 0 ? game.quiz.questions[run.current] : null;
    const prog = G.progress(game);
    const showQ = q && (phase === "question" || phase === "reveal");
    const shownImage = (i: number) => (game.fixes[i].hidePicture ? "" : game.quiz.questions[i].image);
    const pictures = new Set<string>();
    for (const name of [game.quiz.background, ...game.quiz.questions.flatMap((x, i) => (game.fixes[i].skip ? [] : [shownImage(i), x.background]))]) {
      const ref = this.imageRef(name);
      if (ref) pictures.add(ref.src);
    }
    const image = showQ ? this.imageRef(shownImage(run!.current)) : null;
    return {
      role: "screen",
      v: meta.v,
      title: game.quiz.title,
      code: meta.code!,
      background: this.imageRef(game.quiz.background),
      pictures: [...pictures],
      zoom: !!image && G.zoomed(game),
      tempo: G.tempoOf(game),
      phase,
      current: run ? run.current : -1,
      players: active.map((p) => ({ id: p.id, avatar: p.avatar })),
      answered: this.answeredNow(),
      question: showQ
        ? {
            q: run!.current,
            n: prog.n,
            total: prog.total,
            text: q!.text,
            answers: this.onScreen(run!.current, q!.answers.map((a) => a.text)),
            image,
            background: this.imageRef(q!.background || game.quiz.background),
            // After the reveal the answers are open as far as the wall goes.
            answering: G.answering(game) ?? "open",
            clock: this.clockView(),
          }
        : null,
      reveal:
        run && phase === "reveal"
          ? { counts: this.onScreen(run.current, game.fixes[run.current].counts), dist: this.onScreen(run.current, G.distribution(game, run.current)), void: game.fixes[run.current].void }
          : null,
      ranking: phase === "ranking" || phase === "final" ? this.ranking() : null,
      remote: this.shown("remote", exclude),
      steer: this.steering(exclude) ? (cache.teacher ??= this.teacherView(exclude)) : null,
    };
  }

  private teacherView(exclude?: WebSocket): TeacherView {
    const game = this.game!;
    const meta = this.meta!;
    const run = game.run;
    const connected = this.connectedPlayers(exclude);
    const scores = G.scores(game);
    const prog = G.progress(game);
    return {
      role: "teacher",
      v: meta.v,
      id: this.ctx.id.toString(),
      title: game.quiz.title,
      code: meta.code!,
      background: this.imageRef(game.quiz.background),
      warnings: this.quizRecord?.warnings ?? [],
      questions: game.quiz.questions.map((q, i) => {
        const fix = game.fixes[i];
        let status: "upcoming" | "current" | "revealed" | "skipped" = "upcoming";
        if (fix.skip) status = "skipped";
        else if (run && run.revealed.includes(i)) status = "revealed";
        else if (run && run.current === i && run.phase === "question") status = "current";
        return {
          text: q.text,
          image: this.imageRef(q.image),
          pictureHidden: !!fix.hidePicture,
          background: this.imageRef(q.background || game.quiz.background),
          answers: this.onScreen(i, q.answers.map((a, j) => ({ text: a.text, counts: fix.counts[j], marked: a.correct }))),
          void: fix.void,
          skip: fix.skip,
          status,
          seconds: G.secondsFor(game, i),
        };
      }),
      phase: run ? run.phase : "idle",
      current: run ? run.current : -1,
      screen: this.shown("screen", exclude),
      remote: this.shown("remote", exclude),
      zoom: G.zoomed(game) && !game.fixes[run!.current].hidePicture && !!this.imageRef(game.quiz.questions[run!.current].image),
      tempo: G.tempoOf(game),
      timed: G.timed(game),
      adjust: run?.adjust ?? 0,
      countdown: G.nudgeSeconds(game),
      playing: run && run.phase === "question" && run.current >= 0 ? G.playedAt(game, run.current) : null,
      answering: G.answering(game),
      clock: this.clockView(),
      run: run
        ? {
            n: prog.n,
            total: prog.total,
            players: G.activePlayers(run).map((p) => ({ id: p.id, avatar: p.avatar, connected: connected.has(p.id), score: scores.get(p.id) ?? 0 })),
            answered: this.answeredNow(),
            dist: run.current >= 0 && (run.phase === "question" || run.phase === "reveal") ? this.onScreen(run.current, G.distribution(game, run.current)) : null,
            ranking: this.ranking(),
          }
        : null,
    };
  }

  private playerViews(): (player: string) => PlayerView {
    const game = this.game!;
    const meta = this.meta!;
    const run = game.run;
    const st = run ? G.standings(game) : [];
    const byId = new Map(st.map((s) => [s.id, s]));
    const prog = G.progress(game);
    const now = Date.now();
    const clock = this.clockView();
    const clockRec = run && run.phase === "question" ? run.clocks?.[run.current] : undefined;
    // The bonus is shown for a question played with points for speed.
    const speed = !!run && run.current >= 0 && G.playedAt(game, run.current) === "speed";
    const ans = G.answering(game) ?? "open";
    return (player: string): PlayerView => {
      const p = run ? G.playerById(run, player) : null;
      const phase = run ? run.phase : "idle";
      const stored = run && run.current >= 0 ? (run.answers[run.current]?.[player]?.choice ?? null) : null;
      const mine = stored === null ? null : G.orderOf(game, run!.current).indexOf(stored);
      const q = run && run.current >= 0 ? game.quiz.questions[run.current] : null;
      const s = byId.get(player);
      return {
        role: "player",
        v: meta.v,
        phase,
        current: run ? run.current : -1,
        removed: !p || p.removed,
        me: p && s ? { avatar: p.avatar, score: s.score, place: s.place, of: st.length } : p ? { avatar: p.avatar, score: 0, place: 0, of: st.length } : null,
        question:
          q && (phase === "question" || phase === "reveal")
            ? {
                q: run!.current,
                n: prog.n,
                total: prog.total,
                // Not while the class reads the question: the tablet points at the board instead.
                answers: ans === "reading" ? [] : this.onScreen(run!.current, q.answers.map((a) => a.text)),
                mine,
                answering: ans,
                clock,
                sinceMs: clockRec ? Math.max(0, now - clockRec.at) : null,
              }
            : null,
        reveal:
          run && phase === "reveal"
            ? {
                counts: this.onScreen(run.current, game.fixes[run.current].counts),
                mine,
                void: game.fixes[run.current].void,
                points: speed ? G.pointsFor(game, run.current, player) : null,
              }
            : null,
      };
    };
  }

  private viewFor(session: Session, cache: ViewCache = {}, exclude?: WebSocket): View | null {
    if (!this.live()) return null;
    if (session.role === "remote") return (cache.teacher ??= this.teacherView(exclude));
    if (session.role === "screen") return (cache.screen ??= this.screenView(cache, exclude));
    if (session.role === "player") {
      const f = (cache.player ??= this.playerViews());
      return f(session.player);
    }
    return null;
  }

  /** Sends a socket its view; a student's only when it changed. */
  private sendView(ws: WebSocket, session: Session, cache?: ViewCache, exclude?: WebSocket): void {
    const view = this.viewFor(session, cache, exclude);
    if (!view) return;
    if (view.role === "player") {
      const key = viewKey(view);
      if (this.sentToSocket.get(ws) === key) return;
      this.sentToSocket.set(ws, key);
    }
    send(ws, { t: "state", view });
  }

  /** Sends every connected tab its newest view (or choice), where it changed. */
  private broadcast(exclude?: WebSocket, onlyStaff = false): void {
    if (!this.live()) return;
    const cache: ViewCache = {};
    let choose: ServerMessage | null = null;
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude) continue;
      const s = ws.deserializeAttachment() as Session | null;
      if (!s || s.role === null) continue;
      if (s.role === "guest") {
        choose ??= this.chooseMessage();
        const key = JSON.stringify(choose);
        if (this.sentToSocket.get(ws) === key) continue;
        this.sentToSocket.set(ws, key);
        send(ws, choose);
        continue;
      }
      if (onlyStaff && s.role === "player") continue;
      this.sendView(ws, s, cache, exclude);
    }
    for (const w of [...this.waiters]) {
      if (w.session.role === "guest") {
        choose ??= this.chooseMessage();
        if (JSON.stringify(choose) === w.chooseKey) continue;
        this.waiters.delete(w);
        w.resolve([choose]);
        continue;
      }
      if (onlyStaff && w.session.role === "player") continue;
      const view = this.viewFor(w.session, cache, exclude);
      if (view && view.role === "player" && w.session.role === "player") {
        const key = viewKey(view);
        const sent = this.sentToPoller.get(w.session.player);
        if (sent && sent.key === key) continue;
        this.sentToPoller.set(w.session.player, { key, v: view.v });
      }
      this.waiters.delete(w);
      w.resolve(view ? [{ t: "state", view }] : []);
    }
  }

  /** Someone arrived or left: the teacher's tabs show who, guests which roles are free. */
  private broadcastStaff(exclude?: WebSocket): void {
    this.broadcast(exclude, true);
  }
}

type ViewCache = { screen?: ScreenView; teacher?: TeacherView; player?: (id: string) => PlayerView };

function send(ws: WebSocket, msg: ServerMessage): void {
  try {
    ws.send(JSON.stringify(msg));
  } catch {
    // The socket is closing; the tab gets the newest view when it reconnects.
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
