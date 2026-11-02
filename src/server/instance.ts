// One uploaded quiz and its runs (docs/decisions.md, "Lifetime of a quiz
// instance"). Holds the game state, talks to every device of the class over
// WebSockets (hibernating, so an idle instance costs nothing) or long-polling,
// and deletes everything when the instance ends.

import { DurableObject } from "cloudflare:workers";
import { parseQuiz, type Quiz, type Problem } from "../quiz/format.ts";
import * as G from "./game.ts";
import type {
  Auth,
  ClientMessage,
  Command,
  Grant,
  PlayerView,
  RankingView,
  ScreenView,
  ServerMessage,
  TeacherView,
  View,
} from "../shared/protocol.ts";
import { PAIR_CODE } from "../shared/protocol.ts";
import type { Env } from "./env.ts";
import { randomCode, randomToken } from "./random.ts";

/** An instance ends this long after its last activity (upload, run start, any teacher action). */
export const INSTANCE_IDLE_MS = 48 * 3600_000;
/** A run's players, answers and scores are deleted this long after it ends. */
export const RUN_KEEP_MS = 3600_000;
/** A long-poll is answered after this long even when nothing changed. */
const POLL_HOLD_MS = 25_000;
/** A player seen polling within this window counts as connected. */
const POLL_FRESH_MS = 35_000;
/**
 * A WebSocket whose device hasn't pinged for this long counts as away: the
 * device died or slept without the socket closing (clients ping every 20 s;
 * the runtime answers without waking the object and notes the time).
 */
const WS_FRESH_MS = 45_000;
/** Join command ids remembered per run, to answer a resent join with the same player. */
const JOINS_KEPT = 300;

/** Written once at upload. */
interface QuizRecord {
  quiz: Quiz;
  warnings: Problem[];
}

/** Small; written with every change. */
interface Meta {
  secret: string;
  screens: string[];
  lastActivity: number;
  v: number;
}

type Session =
  | { role: "teacher" }
  | { role: "screen" }
  /** since: when this socket said hello (a device that never pings is away after WS_FRESH_MS). */
  | { role: "player"; player: string; since?: number }
  | { role: "chooser" }
  | { role: null };

interface Waiter {
  session: Session;
  resolve: (msgs: ServerMessage[]) => void;
  /** For a student device without a player: the choice it was last given. */
  chooseKey?: string;
}

export class Instance extends DurableObject<Env> {
  private meta: Meta | null = null;
  private quizRecord: QuizRecord | null = null;
  private game: G.Game | null = null;
  private waiters = new Set<Waiter>();
  private lastPoll = new Map<string, number>();
  /**
   * What each student device was last sent. A student's view only changes
   * with their own answer or the teacher's steps, not with classmates'
   * answers; sending only changes keeps a polling class from waking 25
   * devices per answer (the Free plan's request budget).
   */
  private sentToSocket = new WeakMap<WebSocket, string>();
  private sentToPoller = new Map<string, { key: string; v: number }>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Answered by the runtime without waking the object: keeps proxies and
    // NAT tables from dropping an idle socket.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
    ctx.blockConcurrencyWhile(async () => {
      const [meta, record, fixes, run] = await Promise.all([
        ctx.storage.get<Meta>("meta"),
        ctx.storage.get<QuizRecord>("quiz"),
        ctx.storage.get<G.Fix[]>("fixes"),
        ctx.storage.get<G.Run | null>("run"),
      ]);
      if (meta && record && fixes) {
        this.meta = meta;
        this.quizRecord = record;
        this.game = { quiz: record.quiz, fixes, run: run ?? null };
      }
    });
  }

  // -------------------------------------------------------------------------
  // RPC from the API functions

  /**
   * Parses the uploaded text here rather than in the API function: a Durable
   * Object has far more CPU time per request than a Function on the Free
   * plan. Nothing is stored when the quiz has errors.
   */
  async create(text: string): Promise<{ ok: true; secret: string } | { ok: false; errors: Problem[]; warnings: Problem[] }> {
    if (this.meta) throw new Error("instance exists");
    const r = parseQuiz(text);
    if (!r.ok) return { ok: false, errors: r.errors, warnings: r.warnings };
    const now = Date.now();
    const secret = randomToken();
    this.quizRecord = { quiz: r.quiz, warnings: r.warnings };
    this.meta = { secret, screens: [], lastActivity: now, v: 1 };
    this.game = G.newGame(r.quiz);
    await this.ctx.storage.put({ quiz: this.quizRecord, meta: this.meta, fixes: this.game.fixes, run: null });
    await this.scheduleAlarm();
    return { ok: true, secret };
  }

  /** For the join code directory: is this code the instance's running class? */
  async hasRun(code: string): Promise<boolean> {
    return this.game?.run?.code === code && this.game.run.phase !== "final";
  }

  // -------------------------------------------------------------------------
  // HTTP: WebSocket upgrade and the long-polling fallback

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();
    if (action === "ws") {
      if (req.headers.get("Upgrade") !== "websocket") return new Response("expected a WebSocket", { status: 426 });
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      pair[1].serializeAttachment({ role: null } satisfies Session);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (req.method !== "POST") return new Response("not found", { status: 404 });
    let body: { auth?: Auth; v?: number; cmd?: { id: string; cmd: Command } };
    try {
      body = await req.json();
    } catch {
      return json({ error: "bad request" }, 400);
    }
    if (!body.auth) return json({ error: "bad request" }, 400);
    const out: ServerMessage[] = [];
    const session = this.authenticate(body.auth, out);
    if (action === "cmd" && body.cmd && session.role !== null) {
      // A command over HTTP: the reply is its acknowledgement plus, for a
      // student joining, who they are.
      const replies = await this.command(session, body.cmd.id, body.cmd.cmd);
      return json({ messages: [...out, ...replies.direct] });
    }
    if (action === "poll") {
      if (session.role === null) return json({ messages: out });
      const known = typeof body.v === "number" ? body.v : -1;
      if (session.role === "chooser") {
        // The first poll gets the choice at once (it's in `out`); later ones
        // are held until the choice changes, instead of being answered at
        // once over and over (the device would spin and redraw its buttons).
        if (known === -1) return json({ messages: out });
        const chooseKey = JSON.stringify(this.chooseMessage());
        const msgs = await this.hold(session, chooseKey);
        const fresh = this.chooseMessage();
        return json({ messages: msgs.length > 0 ? msgs : JSON.stringify(fresh) !== chooseKey ? [fresh] : [] });
      }
      if (session.role === "player") {
        const pid = session.player;
        this.lastPoll.set(pid, Date.now());
        const view = this.viewFor(session) as PlayerView;
        const sent = this.sentToPoller.get(pid);
        // Answer at once when the device's view changed, or when it didn't
        // get the last one (its version is older than what was sent).
        if (!sent || known < sent.v || sent.key !== viewKey(view)) {
          this.sentToPoller.set(pid, { key: viewKey(view), v: view.v });
          return json({ messages: [...out, { t: "state", view }] });
        }
        const msgs = await this.hold(session);
        this.lastPoll.set(pid, Date.now());
        return json({ messages: msgs });
      }
      const view = this.viewFor(session);
      if (view && view.v > known) return json({ messages: [...out, { t: "state", view }] });
      return json({ messages: await this.hold(session) });
    }
    return json({ error: "not found" }, 404);
  }

  /** Holds a long-poll until the device's view changes, or POLL_HOLD_MS. */
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
      if (session.role !== "chooser") this.sendView(ws, session);
      if (session.role === "player" || session.role === "screen") this.broadcastTeacher();
      return;
    }
    if (msg.t === "cmd") {
      const session = ws.deserializeAttachment() as Session;
      if (!session || session.role === null) return;
      const replies = await this.command(session, msg.id, msg.cmd);
      let next = replies.session;
      if (next && next.role === "player") next = { ...next, since: Date.now() };
      if (next) ws.serializeAttachment(next);
      for (const m of replies.direct) send(ws, m);
      if (next && next.role === "player") {
        this.sendView(ws, next);
        this.broadcastTeacher();
      }
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const session = ws.deserializeAttachment() as Session | null;
    if (session && (session.role === "player" || session.role === "screen")) this.broadcastTeacher(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  // -------------------------------------------------------------------------
  // Who is this device?

  private authenticate(auth: Auth, out: ServerMessage[]): Session {
    const meta = this.meta;
    const game = this.game;
    if (!meta || !game) {
      out.push({ t: "gone", reason: "This quiz has ended or its link is wrong." });
      return { role: null };
    }
    if (auth.role === "teacher") {
      if (typeof auth.secret === "string" && safeEqual(auth.secret, meta.secret)) return { role: "teacher" };
    } else if (auth.role === "screen") {
      if ("secret" in auth && typeof auth.secret === "string" && safeEqual(auth.secret, meta.secret)) return { role: "screen" };
      if ("token" in auth && typeof auth.token === "string" && meta.screens.some((t) => safeEqual(t, auth.token))) return { role: "screen" };
    } else if (auth.role === "player") {
      const run = game.run;
      if (run && "token" in auth && typeof auth.token === "string") {
        // A known player comes back, also after the end: a reloaded tablet
        // still shows its final place.
        const p = Object.values(run.players).find((pl) => safeEqual(pl.token, auth.token));
        if (p) return { role: "player", player: p.id };
        // A token from another run (a shared tablet) falls through to joining.
      }
      if (!run || run.phase === "final") {
        out.push({ t: "gone", reason: "This quiz has finished." });
        return { role: null };
      }
      // A device without a player is told whom it might be: nobody in the
      // lobby (it then asks for a new player), or the avatars of players
      // whose devices are away once the quiz is under way.
      out.push(this.chooseMessage());
      return { role: "chooser" };
    }
    out.push({ t: "gone", reason: "This link doesn't open anything any more." });
    return { role: null };
  }

  // -------------------------------------------------------------------------
  // Commands

  private async command(
    session: Session,
    id: string,
    cmd: Command,
  ): Promise<{ direct: ServerMessage[]; session?: Session }> {
    const game = this.game;
    const meta = this.meta;
    if (!game || !meta || session.role === null) return { direct: [{ t: "gone", reason: "This quiz has ended." }] };
    const ack = (ok: boolean, error?: string, result?: unknown): ServerMessage => ({ t: "ack", id, ok, error, result });
    const now = Date.now();
    const at = (c: { at: { phase: string; current: number } }) => {
      const run = game.run;
      const phase = run ? run.phase : "idle";
      const current = run ? run.current : -1;
      return c.at && c.at.phase === phase && c.at.current === current;
    };

    try {
      // --- a student device without a player yet
      if (session.role === "chooser") {
        if (cmd.op === "choose") return { direct: [ack(true), this.chooseMessage()] };
        if (cmd.op !== "newPlayer" && cmd.op !== "claim") return { direct: [ack(false, "not joined")] };
        const run = game.run;
        if (!run || run.phase === "final") return { direct: [ack(false), { t: "gone", reason: "This quiz has finished." }] };
        // Joining after the start may be a student whose device lost its
        // player; they can pick their avatar back (decisions.md).
        if (cmd.op === "newPlayer") {
          // A join resent after its answer was lost gets the same player.
          const earlier = typeof id === "string" && run.joins && Object.hasOwn(run.joins, id) ? G.playerById(run, run.joins[id]) : null;
          if (earlier && !earlier.removed) {
            return { direct: [ack(true), { t: "welcome", player: earlier.id, token: earlier.token }], session: { role: "player", player: earlier.id } };
          }
          const p = G.addPlayer(game, randomToken(12), randomToken(), now, Math.random);
          const joins = (run.joins ??= {});
          joins[id] = p.id;
          const keys = Object.keys(joins);
          if (keys.length > JOINS_KEPT) delete joins[keys[0]];
          await this.persist(["run"]);
          this.broadcast();
          return { direct: [ack(true), { t: "welcome", player: p.id, token: p.token }], session: { role: "player", player: p.id } };
        }
        const p = G.playerById(run, cmd.player);
        if (!p || p.removed || !this.awayPlayers().includes(p)) return { direct: [ack(false, "That avatar is taken.")] };
        p.token = randomToken();
        await this.persist(["run"]);
        return { direct: [ack(true), { t: "welcome", player: p.id, token: p.token }], session: { role: "player", player: p.id } };
      }

      // --- a student
      if (session.role === "player") {
        if (cmd.op !== "answer") return { direct: [ack(false, "not allowed")] };
        const view = typeof cmd.v === "number" ? cmd.v : Infinity;
        const recorded = G.answer(game, session.player, cmd.q, cmd.choice, cmd.seq, view, now);
        if (recorded) {
          await this.persist(["run"]);
          this.broadcast();
        }
        return { direct: [ack(recorded)] };
      }

      // --- the projector: the clicker key, and connecting a device (the
      // teacher's phone died and a new one shows a code: typed in at the
      // projector computer, in the room).
      if (session.role === "screen") {
        if (cmd.op === "pair") {
          const role = await this.pair(cmd.code);
          await this.afterTeacherChange(["meta"]);
          return { direct: [ack(true, undefined, role)] };
        }
        if (cmd.op !== "advance") return { direct: [ack(false, "not allowed")] };
        if (!at(cmd)) return { direct: [ack(true, undefined, "stale")] };
        G.advance(game, now, this.nextView());
        await this.afterTeacherChange(["run"]);
        return { direct: [ack(true)] };
      }

      // --- the teacher
      let changed: ("run" | "fixes" | "meta")[] = [];
      let result: unknown;
      switch (cmd.op) {
        case "startRun": {
          // A new class with this quiz. The previous run's data goes now:
          // its ranking has been shown. Only from "no run" or the final
          // ranking, and only once: a resend must not wipe a class that
          // has started joining.
          if (!at(cmd) || (game.run && game.run.phase !== "final")) return { direct: [ack(true, undefined, "stale")] };
          await this.releaseCode();
          G.startRun(game, await this.claimCode());
          changed = ["run"];
          break;
        }
        case "begin":
        case "reveal":
        case "next":
        case "ranking":
        case "finish":
        case "skipCurrent": {
          if (!at(cmd)) return { direct: [ack(true, undefined, "stale")] };
          if (cmd.op === "begin") G.begin(game, now);
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
        case "setCounts":
          G.setCounts(game, cmd.q, cmd.counts);
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
        case "remove":
          G.removePlayer(game, cmd.player);
          changed = ["run"];
          break;
        case "pair":
          result = await this.pair(cmd.code);
          changed = ["meta"];
          break;
        case "endInstance":
          // The teacher's devices hear that it worked before their sockets close.
          await this.endInstance(id);
          return { direct: [ack(true)] };
        default:
          return { direct: [ack(false, "unknown command")] };
      }
      await this.afterTeacherChange(changed);
      return { direct: [ack(true, undefined, result)] };
    } catch (e) {
      if (e instanceof G.GameError || e instanceof PairError) return { direct: [ack(false, e.message)] };
      throw e;
    }
  }

  private async afterTeacherChange(changed: ("run" | "fixes" | "meta")[]): Promise<void> {
    this.meta!.lastActivity = Date.now();
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
  // Join codes and pairing

  private async claimCode(): Promise<string> {
    const id = this.ctx.id.toString();
    for (let i = 0; i < 20; i++) {
      const code = randomCode(5);
      const stub = this.env.JOIN.get(this.env.JOIN.idFromName(code));
      if (await stub.claim(id, Date.now() + INSTANCE_IDLE_MS + RUN_KEEP_MS)) return code;
    }
    throw new G.GameError("No free join code was found; try again.");
  }

  private async releaseCode(): Promise<void> {
    const code = this.game?.run?.code;
    if (!code) return;
    const stub = this.env.JOIN.get(this.env.JOIN.idFromName(code));
    await stub.release(this.ctx.id.toString());
  }

  private async pair(code: string): Promise<string> {
    if (typeof code !== "string" || !PAIR_CODE.test(code)) throw new PairError("A device code has 6 digits.");
    const stub = this.env.PAIR.get(this.env.PAIR.idFromName(code));
    const role = await stub.wanted();
    if (role === null) throw new PairError("No device is showing this code. Check the digits, or open the page on the other device again.");
    const meta = this.meta!;
    let grant: Grant;
    if (role === "screen") {
      const token = randomToken();
      meta.screens.push(token);
      if (meta.screens.length > 20) meta.screens.shift();
      grant = { instance: this.ctx.id.toString(), role, token };
    } else {
      grant = { instance: this.ctx.id.toString(), role, secret: meta.secret };
    }
    if (!(await stub.deliver(grant))) throw new PairError("That code has just expired; open the page on the other device again.");
    return role;
  }

  // -------------------------------------------------------------------------
  // Lifetime

  private async scheduleAlarm(): Promise<void> {
    const meta = this.meta;
    if (!meta) return;
    let at = meta.lastActivity + INSTANCE_IDLE_MS;
    const ended = this.game?.run?.ended;
    if (ended != null) at = Math.min(at, ended + RUN_KEEP_MS);
    await this.ctx.storage.setAlarm(at);
  }

  async alarm(): Promise<void> {
    const meta = this.meta;
    if (!meta) {
      await this.ctx.storage.deleteAll();
      return;
    }
    const now = Date.now();
    if (now >= meta.lastActivity + INSTANCE_IDLE_MS) {
      await this.endInstance();
      return;
    }
    const run = this.game?.run;
    if (run && run.ended != null && now >= run.ended + RUN_KEEP_MS) {
      await this.releaseCode();
      this.game!.run = null;
      for (const ws of this.ctx.getWebSockets()) {
        const s = ws.deserializeAttachment() as Session | null;
        if (s && (s.role === "player" || s.role === "chooser")) {
          send(ws, { t: "gone", reason: "This quiz has finished." });
          ws.close(4000, "gone");
        }
      }
      await this.persist(["run"]);
      this.broadcast();
    }
    await this.scheduleAlarm();
  }

  /** Everything goes: quiz, runs, players, answers (decisions.md). */
  private async endInstance(ackId?: string): Promise<void> {
    await this.releaseCode().catch(() => {});
    for (const ws of this.ctx.getWebSockets()) {
      const s = ws.deserializeAttachment() as Session | null;
      if (ackId && s?.role === "teacher") send(ws, { t: "ack", id: ackId, ok: true });
      send(ws, { t: "gone", reason: "The teacher has ended this quiz." });
      ws.close(4000, "gone");
    }
    for (const w of this.waiters) w.resolve([{ t: "gone", reason: "The teacher has ended this quiz." }]);
    this.waiters.clear();
    this.meta = null;
    this.game = null;
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
      if (now - Math.max(pinged, s.since ?? 0) < WS_FRESH_MS) ids.add(s.player);
    }
    for (const [pid, t] of this.lastPoll) if (now - t < POLL_FRESH_MS) ids.add(pid);
    return ids;
  }

  private chooseMessage(): ServerMessage {
    const run = this.game?.run;
    const away = run && run.phase !== "lobby" ? this.awayPlayers() : [];
    return { t: "choose", avatars: away.map((p) => ({ id: p.id, avatar: p.avatar })) };
  }

  private awayPlayers(): G.Player[] {
    const run = this.game?.run;
    if (!run) return [];
    const connected = this.connectedPlayers();
    return G.activePlayers(run).filter((p) => !connected.has(p.id));
  }

  private screenCount(exclude?: WebSocket): number {
    let n = 0;
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude || ws.readyState !== WebSocket.OPEN) continue;
      const s = ws.deserializeAttachment() as Session | null;
      if (s && s.role === "screen") n++;
    }
    return n;
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
    };
  }

  private answeredNow(): number {
    const run = this.game?.run;
    return run && run.current >= 0 ? G.activeAnswers(run, run.current).length : 0;
  }

  private screenView(): ScreenView {
    const game = this.game!;
    const meta = this.meta!;
    const run = game.run;
    const active = run ? G.activePlayers(run) : [];
    const phase = run ? run.phase : "idle";
    const q = run && run.current >= 0 ? game.quiz.questions[run.current] : null;
    const prog = G.progress(game);
    const showQ = q && (phase === "question" || phase === "reveal");
    return {
      role: "screen",
      v: meta.v,
      title: game.quiz.title,
      phase,
      current: run ? run.current : -1,
      code: run ? run.code : null,
      players: active.map((p) => ({ id: p.id, avatar: p.avatar })),
      answered: this.answeredNow(),
      question: showQ ? { q: run!.current, n: prog.n, total: prog.total, text: q!.text, answers: q!.answers.map((a) => a.text) } : null,
      reveal:
        run && phase === "reveal"
          ? { counts: game.fixes[run.current].counts, dist: G.distribution(game, run.current), void: game.fixes[run.current].void }
          : null,
      ranking: phase === "ranking" || phase === "final" ? this.ranking() : null,
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
      quizNote: game.quiz.note,
      warnings: this.quizRecord?.warnings ?? [],
      questions: game.quiz.questions.map((q, i) => {
        const fix = game.fixes[i];
        let status: "upcoming" | "current" | "revealed" | "skipped" = "upcoming";
        if (fix.skip) status = "skipped";
        else if (run && run.revealed.includes(i)) status = "revealed";
        else if (run && run.current === i && run.phase === "question") status = "current";
        return {
          text: q.text,
          answers: q.answers.map((a, j) => ({ text: a.text, counts: fix.counts[j], marked: a.correct })),
          note: q.note,
          void: fix.void,
          skip: fix.skip,
          status,
        };
      }),
      expires: meta.lastActivity + INSTANCE_IDLE_MS,
      screens: this.screenCount(exclude),
      phase: run ? run.phase : "idle",
      current: run ? run.current : -1,
      run: run
        ? {
            code: run.code,
            n: prog.n,
            total: prog.total,
            players: G.activePlayers(run).map((p) => ({ id: p.id, avatar: p.avatar, connected: connected.has(p.id), score: scores.get(p.id) ?? 0 })),
            answered: this.answeredNow(),
            dist: run.current >= 0 && (run.phase === "question" || run.phase === "reveal") ? G.distribution(game, run.current) : null,
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
    return (player: string): PlayerView => {
      const p = run?.players[player];
      const phase = run ? run.phase : "idle";
      const mine = run && run.current >= 0 ? (run.answers[run.current]?.[player]?.choice ?? null) : null;
      const q = run && run.current >= 0 ? game.quiz.questions[run.current] : null;
      const s = byId.get(player);
      return {
        role: "player",
        v: meta.v,
        phase,
        current: run ? run.current : -1,
        removed: !p || p.removed,
        me: p && s ? { avatar: p.avatar, score: s.score, place: s.place, of: st.length } : p ? { avatar: p.avatar, score: 0, place: 0, of: st.length } : null,
        question: q && (phase === "question" || phase === "reveal") ? { q: run!.current, n: prog.n, total: prog.total, answers: q.answers.map((a) => a.text), mine } : null,
        reveal: run && phase === "reveal" ? { counts: game.fixes[run.current].counts, mine, void: game.fixes[run.current].void } : null,
      };
    };
  }


  private viewFor(session: Session, cache?: ViewCache, exclude?: WebSocket): View | null {
    if (!this.meta || !this.game) return null;
    if (session.role === "teacher") return cache ? (cache.teacher ??= this.teacherView(exclude)) : this.teacherView(exclude);
    if (session.role === "screen") return cache ? (cache.screen ??= this.screenView()) : this.screenView();
    if (session.role === "player") {
      const f = cache ? (cache.player ??= this.playerViews()) : this.playerViews();
      return f(session.player);
    }
    return null;
  }

  /** Sends a socket its view; a student's only when it changed. */
  private sendView(ws: WebSocket, session: Session, cache?: ViewCache): void {
    const view = this.viewFor(session, cache);
    if (!view) return;
    if (view.role === "player") {
      const key = viewKey(view);
      if (this.sentToSocket.get(ws) === key) return;
      this.sentToSocket.set(ws, key);
    }
    send(ws, { t: "state", view });
  }

  /** Sends every connected device its newest view, where it changed. */
  private broadcast(exclude?: WebSocket): void {
    if (!this.meta || !this.game) return;
    const cache: ViewCache = {};
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude) continue;
      const s = ws.deserializeAttachment() as Session | null;
      if (!s || s.role === null || s.role === "chooser") continue;
      this.sendView(ws, s, cache);
    }
    let choose: ServerMessage | null = null;
    for (const w of [...this.waiters]) {
      if (w.session.role === "chooser") {
        choose ??= this.chooseMessage();
        if (JSON.stringify(choose) === w.chooseKey) continue;
        this.waiters.delete(w);
        w.resolve([choose]);
        continue;
      }
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

  /** Only the teacher's view changed (someone connected or left). */
  private broadcastTeacher(exclude?: WebSocket): void {
    if (!this.meta || !this.game) return;
    let view: TeacherView | null = null;
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude) continue;
      const s = ws.deserializeAttachment() as Session | null;
      if (s && s.role === "teacher") send(ws, { t: "state", view: (view ??= this.teacherView(exclude)) });
    }
    for (const w of [...this.waiters]) {
      if (w.session.role === "teacher") {
        this.waiters.delete(w);
        w.resolve([{ t: "state", view: (view ??= this.teacherView(exclude)) }]);
      }
    }
  }

}

type ViewCache = { screen?: ScreenView; teacher?: TeacherView; player?: (id: string) => PlayerView };

/** A student's view without its version: what the device actually shows. */
function viewKey(view: PlayerView): string {
  return JSON.stringify({ ...view, v: 0 });
}

class PairError extends Error {}

function send(ws: WebSocket, msg: ServerMessage): void {
  try {
    ws.send(JSON.stringify(msg));
  } catch {
    // The socket is closing; the device gets the newest view when it reconnects.
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
