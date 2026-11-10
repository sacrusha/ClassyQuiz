// One uploaded quiz and its class (docs/design/hosting-and-limits.md, "What lives, and
// for how long"; docs/design/teacher-devices.md for the roles). Holds the game state and the
// quiz's code, talks to every tab of the class over WebSockets (hibernating,
// so an idle instance costs nothing) or long-polling, and deletes everything
// when the instance ends.

import { DurableObject } from "cloudflare:workers";
import { imageKey, parseQuiz, type Quiz, type Problem } from "../quiz/format.ts";
import * as G from "./game.ts";
import { bundles, matchImages, type StoredImage, type UploadedImage } from "./images.ts";
import type {
  AnswerAck,
  Auth,
  ClientMessage,
  Command,
  DeviceHeld,
  Entry,
  ImageRef,
  PackPic,
  PeersView,
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
import { MAX_IMAGES, MAX_QUIZ_BYTES, MAX_UPLOAD_BYTES, TOO_MANY_CODES, WRONG_TEACHER_CODE, viewKey, type ClockView, type UploadResult } from "../shared/protocol.ts";
import type { Env } from "./env.ts";
import { randomCode, randomDigits, randomToken } from "./random.ts";
import { CLASS_FULL, CLASS_STARTED, DAY_FOR_CLASSES, LINE_WRITE_MS, LOBBY_WAIT_MS, MAX_LINE_WRITES, ROOM_FULL, ROOM_STARTED, classesFullMessage, isQuotaError, roomsFullMessage, siteFullMessage, type Cost, type SiteFull } from "../shared/limits.ts";
import { add, ahead, asCost, atLetIn, grown, room, spent, tail, uploadRows, type ClassNow } from "./rows.ts";
import { readLine, type LineCounts } from "../shared/line.ts";
import { summarize, type ClassUse, type RoomKind } from "./telemetry.ts";
import { LOOK_SHOW_MS } from "../shared/looks.ts";

/**
 * An instance ends this long after its last activity (upload, a teacher's
 * step, a role taken). Keeping it serves one purpose: a device that lost its
 * connection gets back into the quiz. Three hours span the longest break a
 * lesson plausibly resumes after, lunch, and the same three hours everywhere
 * are easy to say (docs/design/hosting-and-limits.md, "What lives, and for
 * how long").
 */
export const INSTANCE_IDLE_MS = 3 * 3600_000;
/** A long-poll is answered after this long even when nothing changed. */
const POLL_HOLD_MS = 25_000;
/**
 * A tab not heard from for this long is away: the device died or slept
 * without its socket closing (clients ping every 20 s; the runtime answers
 * without waking the object and notes the time). A role whose tab is away is
 * free for another tab (docs/design/teacher-devices.md, "When a device is gone").
 */
const FRESH_MS = 45_000;
/**
 * A role's tab not heard from for this long is "quiet", as is one whose line
 * closed and hasn't come back: a teacher code takes a quiet Remote (entry()).
 */
const QUIET_MS = 25_000;
/**
 * Wrong teacher codes, counted in the instance's storage (a count in memory
 * would reset when the instance idles). Per device: GUESS_MAX wrong endings
 * within GUESS_WINDOW_MS refuse that device's teacher codes for GUESS_LOCK_MS.
 * Per quiz: at most QUIZ_GUESSES, one more allowed every QUIZ_GUESS_EVERY_MS;
 * used up, every teacher code is refused, the right one too. The uploading
 * device's secret is exempt. Why, and what a device is:
 * docs/design/teacher-devices.md, "Wrong teacher codes".
 */
const GUESS_MAX = 5;
const GUESS_WINDOW_MS = 60_000;
const GUESS_LOCK_MS = 10 * 60_000;
const QUIZ_GUESSES = 10;
const QUIZ_GUESS_EVERY_MS = 6 * 60_000;
/** Devices counted at once; beyond it the oldest entries go (the quiz's allowance bounds many addresses). */
const GUESS_KEYS = 500;
/** Join command ids remembered, to answer a resent join with the same player. */
const JOINS_KEPT = 300;
/** The code is claimed for this long beyond the instance's end, and claimed again before that runs out. */
const CODE_SLACK_MS = 12 * 3600_000;

/** Written once at upload. */
interface QuizRecord {
  quiz: Quiz;
  warnings: Problem[];
  /** The quiz's pictures by `imageKey`; each file is stored under `img:<n>`. */
  images: Record<string, StoredImage>;
  /** Part of every picture's address, so the instance id alone doesn't open them. */
  imageSecret: string;
  /** The answer pictures' small copies for the students' devices, stored as `pack:<p>`; absent without picture answers. */
  packs?: number;
  /**
   * Part of the packs' address. Not the imageSecret: the students' devices
   * get this one, and it opens the packs only, not the questions' pictures.
   */
  packSecret?: string;
}

/** Wrong teacher codes (GUESS_MAX, QUIZ_GUESSES). Written on a wrong one, and by the alarm when a device's count runs out. */
interface Guesses {
  /** Salts the devices' addresses before they are counted; drawn per quiz, deleted with it. */
  salt: string;
  /** Per device (its salted hash): wrong endings within the window, and until when it is refused. */
  devs: Record<string, { fails: number[]; until: number }>;
  /** Wrong endings the quiz still allows, as of `at`. */
  left: number;
  at: number;
}

/** Small; written with every change. */
interface Meta {
  /** Kept by the device that pasted the quiz: it may delete it from the root page. */
  secret: string;
  /** The quiz's code, for its whole life. */
  code: string;
  /** Until when the code is claimed in its JoinCode object. */
  codeUntil: number;
  /** The token of the tab holding each role. */
  roles: Record<RoleName, string | null>;
  /**
   * The teacher code's two digits after the class code (docs/design/teacher-devices.md,
   * "One entry: the teacher code"). Drawn at upload.
   */
  teacher: string;
  lastActivity: number;
  v: number;
  /**
   * The class's booking of the day's allowances, from letting it in
   * (docs/design/hosting-and-limits.md, "Running classes finish"), and the
   * rows it wrote since. booked: what the site's ledger holds for it (absent
   * on a booking from before requests and duration were booked); at: when it
   * was booked; lapsed: no student came within LOBBY_WAIT_MS, or none was
   * there at the start, and the booking holds only what was spent until a
   * student comes; settled: done at the final ranking.
   */
  rows?: { written: number; booked?: Cost; at?: number; lapsed?: true; settled?: true };
  /** The day's ledger across the site, as last heard (at upload, at letting in): the check's warning. */
  day?: Cost;
  /** Uploaded by a simulator or a probe, which said so (`probe` on the upload): its class is kept apart in the telemetry (docs/design/telemetry.md). */
  probe?: true;
}

type Session =
  /** since: when this socket said hello (a tab that never pings is away after FRESH_MS). */
  /** line: the device's newest count of its line (`takeLine`), back in memory at a wake. */
  | { role: "screen"; token: string; since: number; line?: LineCounts }
  | { role: "remote"; token: string; since: number; line?: LineCounts }
  /** held: a copy of the player's input the server holds (G.heldOf), on the player's newest socket only (`mirror`). */
  | { role: "player"; player: string; since?: number; held?: G.Held | null; line?: LineCounts }
  /** dev: the device, as counted for wrong teacher codes (GUESS_MAX). */
  | { role: "guest"; dev?: string }
  | { role: null; dev?: string };

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
   * devices per answer (the Free plan's request budget). A Peers view does
   * change with everyone's answer (who the room waits for); a socket gets
   * that at once, a poller with its poll's end (`pollKey`).
   */
  private sentToSocket = new WeakMap<WebSocket, string>();
  private sentToPoller = new Map<string, Sent>();
  /**
   * The quiz was ended by a hand (Exit), and what a device that asks now is
   * told: go home, as the devices whose line was open were. For a device
   * between two polls then; in memory only, which covers the seconds that
   * matter.
   */
  private endedBy: ServerMessage | null = null;
  /**
   * "<role>:<old token>" → what a tab still holding that token is told: its
   * Projector moved to another tab and it is the Remote now, or it lost the
   * role. Kept for a tab that was between polls, or reconnecting, when it
   * happened; in memory only, which covers the seconds that matter.
   */
  private moved = new Map<string, ServerMessage>();
  /**
   * Players whose input (a look, an answer, a Peers tap on) the server holds
   * and storage doesn't have yet (docs/design/open-period-in-memory.md). Any
   * write of the run carries it; a line ending with input here writes it
   * sooner (`lineEnded`).
   */
  private unwritten = new Set<string>();
  /**
   * Players whose input this memory has taken, or put back from a socket's
   * copy, since it was loaded: what it holds of them is newer than the copy
   * their device sends with a hello or a poll, which can arrive after a
   * newer tap (a look carries no sequence number). Lost with the memory,
   * which is when the device's copy is wanted.
   */
  private takenHere = new Set<string>();
  private lineTimer: ReturnType<typeof setTimeout> | null = null;
  /** Player id → when their line ended with input unwritten, for the line write (`lineEnded`). */
  private lineEnds = new Map<string, number>();
  /**
   * New with each start of the object (after a hibernation, a restart, a
   * deploy): told to the pasting device (QuizInfo.memory) so that
   * scripts/simulate-memory.mjs knows the memory was in fact lost. Random,
   * about no one.
   */
  private memory = randomToken();
  /** The lobby's looks go out to the screens at most every LOOK_SHOW_MS (`showSoon`). */
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  /** Wrong teacher codes, as stored; a quiz without any keeps a salt in memory until its first. */
  private guesses: Guesses = { salt: randomToken(), devs: {}, left: QUIZ_GUESSES, at: 0 };
  /**
   * "<role>:<token>" → when that teacher tab's line closed (webSocketClose),
   * the same time as its lastPoll then: until it is heard from again, the
   * role is quiet rather than present (a closed tab, a phone locked), so the
   * teacher code takes it at once rather than answering "full" until it is
   * away (FRESH_MS).
   */
  private closed = new Map<string, number>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Answered by the runtime without waking the object: keeps proxies and
    // NAT tables from dropping an idle socket.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
    ctx.blockConcurrencyWhile(() => this.load());
  }

  /**
   * The instance as stored, with the input the players' sockets keep a copy
   * of (a hibernating object loses its memory, not its sockets); also after
   * a write failed, so nothing shows that isn't stored or held. A poller's
   * input comes back with its next poll, any device's with its next hello
   * (docs/design/open-period-in-memory.md).
   */
  private async load(): Promise<void> {
    await this.loadStored();
    this.unwritten.clear();
    this.takenHere.clear();
    if (!this.game?.run) return;
    for (const ws of this.ctx.getWebSockets()) {
      const s = ws.deserializeAttachment() as Session | null;
      const key = s ? lineKey(s) : null;
      if (key && s && "line" in s && s.line) this.game.run.lines = { ...this.game.run.lines, [key]: s.line };
    }
    for (const ws of this.ctx.getWebSockets()) {
      const s = ws.deserializeAttachment() as Session | null;
      if (s?.role !== "player" || !s.held) continue;
      this.takenHere.add(s.player);
      if (G.restoreHeld(this.game, s.player, s.held)) this.unwritten.add(s.player);
    }
  }

  private async loadStored(): Promise<void> {
    const storage = this.ctx.storage;
    const [meta, record, fixes, run, guesses] = await Promise.all([
      storage.get<Meta>("meta"),
      storage.get<QuizRecord>("quiz"),
      storage.get<G.Fix[]>("fixes"),
      storage.get<G.Run | null>("run"),
      storage.get<Guesses>("guesses"),
    ]);
    if (guesses) this.guesses = guesses;
    if (meta && record && fixes) {
      this.meta = meta;
      this.quizRecord = record;
      this.game = { quiz: record.quiz, fixes, run: run ?? null };
    }
  }

  /** The instance holds a quiz: not yet uploaded to, or already ended, it doesn't. */
  private live(): boolean {
    return !!(this.meta && this.game);
  }

  /**
   * Parses the uploaded text here rather than in the API function: a Durable
   * Object has far more CPU time per request than a Function on the Free
   * plan. Nothing is stored when the quiz has errors. On success the quiz
   * has its code and its first class's lobby, and the tab that pasted it
   * holds the Projector (docs/design/teacher-devices.md, "The single tab: check, then join").
   */
  async create(
    text: string,
    images: UploadedImage[] = [],
    /** The teacher chose to run the quiz without the pictures that didn't come with it. */
    leaveOutMissing = false,
    /** The answer pictures' small copies, for the students' devices. */
    smalls: UploadedImage[] = [],
    /** The fixes made on the local check before the upload, as the browser sent them (G.applyFixes checks them). */
    fixes: unknown = null,
    /** "peers": a room that runs on its own, its opener a player (docs/design/peers.md); anything else: a room someone steers. */
    mode: unknown = null,
    /** The upload said it is a simulator's or a probe's; a page never says so. */
    probe = false,
  ): Promise<
    | { ok: true; secret: string; code: string; teacher: string; token: string; player?: string }
    | { ok: false; errors: Problem[]; warnings: Problem[]; missingImages?: string[]; error?: string; full?: SiteFull }
  > {
    if (this.meta) throw new Error("instance exists");
    const r = parseQuiz(text);
    if (!r.ok) return { ok: false, errors: r.errors, warnings: r.warnings };
    const pictures = matchImages(r.quiz, images, leaveOutMissing, smalls);
    if (!pictures.ok) return { ok: false, errors: pictures.errors, warnings: r.warnings, missingImages: pictures.missing };
    const now = Date.now();
    const secret = randomToken();
    const token = randomToken();
    const codeUntil = now + INSTANCE_IDLE_MS + CODE_SLACK_MS;
    // The site's share of the free plan: uploads today, bytes stored at once.
    const bytes = new TextEncoder().encode(text).byteLength + Object.values(pictures.files).reduce((s, f) => s + f.byteLength, 0);
    const booked = await this.budget().reserve(this.ctx.id.toString(), bytes, codeUntil, uploadRows(Object.keys(pictures.files).length));
    if (typeof booked === "string") return { ok: false, errors: [], warnings: [], error: siteFullMessage(booked), full: booked };
    const peers = mode === "peers";
    // Peers: the others join with the code at once, so the class is booked
    // now; a steered room books it when the class is let in.
    let rows: { day: Cost } | "rows" | null = null;
    const cost = atLetIn(r.quiz.questions.length);
    if (peers) {
      try {
        rows = await this.budget().bookRows(this.ctx.id.toString(), cost, codeUntil, probe);
      } catch (e) {
        // The ledger can't be reached: the room opens unbooked rather than be stopped by the site's own bookkeeping.
        console.error("rows not booked:", e instanceof Error ? e.message : String(e));
      }
      if (rows === "rows") {
        await this.budget().release(this.ctx.id.toString()).catch(() => {});
        return { ok: false, errors: [], warnings: [], error: roomsFullMessage() };
      }
    }
    const code = await this.claimCode(codeUntil);
    this.quizRecord = {
      quiz: r.quiz,
      warnings: [...r.warnings, ...pictures.warnings],
      images: pictures.index,
      imageSecret: randomToken(),
      ...(pictures.packs > 0 ? { packs: pictures.packs, packSecret: randomToken() } : {}),
    };
    const teacher = randomDigits(2);
    this.meta = { secret, code, codeUntil, roles: { screen: peers ? null : token, remote: null }, teacher, lastActivity: now, v: 1, day: booked.day, ...(probe ? { probe: true as const } : {}) };
    this.endedBy = null;
    if (rows) {
      this.meta.day = rows.day;
      this.meta.rows = { written: 0, booked: cost, at: now };
    }
    // The pasting tab is about to open the Projector with it.
    if (!peers) this.lastPoll.set(`screen:${token}`, now);
    this.game = G.newGame(r.quiz);
    G.applyFixes(this.game, fixes);
    G.startRun(this.game, code, randomToken(9), Math.random);
    const run = this.game.run!;
    let player: string | undefined;
    if (peers) {
      // The pasting tab is about to come in as this player, the room's opener.
      player = randomToken();
      run.peers = { host: G.addPlayer(this.game, randomToken(12), player, now, Math.random).id };
    } else {
      // Teacher devices come in any time; the class once the teacher lets it in.
      run.waiting = true;
    }
    // The alarm goes first: should the write below fail halfway, the alarm
    // finds an instance without meta and deletes whatever was written.
    await this.scheduleAlarm();
    try {
      // The guesses' salt with it, so a device's count keeps its key after the object idles.
      await this.ctx.storage.put({ ...pictures.files, quiz: this.quizRecord, meta: this.meta, fixes: this.game.fixes, run: this.game.run, guesses: this.guesses });
    } catch (e) {
      await this.budget().release(this.ctx.id.toString()).catch(() => {});
      throw e;
    }
    return { ok: true, secret, code, teacher, token: peers ? "" : token, ...(player ? { player } : {}) };
  }

  /**
   * The upload with pictures, as multipart/form-data: "text", "leaveOut",
   * "fixes" (JSON, the local check's), "mode", and per picture an "image" file with its "imageName" (a text field: a
   * non-ASCII file name in a multipart header isn't decoded reliably); per
   * answer picture also a "small" file with its "smallName".
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
    const smallFiles = form.getAll("small");
    const smallNames = form.getAll("smallName");
    if (smallFiles.length > MAX_IMAGES) return fail(`The quiz has more than ${MAX_IMAGES} pictures.`);
    if (smallNames.length !== smallFiles.length || smallFiles.some((f) => typeof f === "string") || smallNames.some((n) => typeof n !== "string")) {
      return json({ error: "The upload couldn't be read." }, 400);
    }
    const read = (list: unknown[], names: unknown[]) =>
      Promise.all(list.map(async (f, i) => ({ name: names[i] as string, bytes: new Uint8Array(await (f as File).arrayBuffer()) })));
    const images = await read(files, names);
    const smalls = await read(smallFiles, smallNames);
    const r = await this.create(text, images, form.get("leaveOut") === "missing", smalls, readFixes(form.get("fixes")), form.get("mode"));
    const body: UploadResult = r.ok ? { ok: true, id: this.ctx.id.toString(), secret: r.secret, code: r.code, teacher: r.teacher, token: r.token, ...(r.player ? { player: r.player } : {}) } : r;
    return json(body);
  }

  private budget() {
    return this.env.BUDGET.get(this.env.BUDGET.idFromName("site"));
  }

  /**
   * GET …/img/<secret>/<n>: a picture, for a device that was sent a view
   * naming it; …/img/<packSecret>/p<k>: a pack of answer pictures' small
   * copies, for the students' devices; …/img/<secret>/b<k>: a bundle of the
   * questions' pictures and the backgrounds, for a Peers room's devices
   * (`bundles`), one after another as the view's offsets say.
   */
  private async image(secret: string, n: string): Promise<Response> {
    const record = this.quizRecord;
    const bundle = n.match(/^b(\d{1,3})$/);
    if (bundle) {
      const list = record && secret === record.imageSecret ? bundles(record.quiz, record.images)[Number(bundle[1])] : undefined;
      if (!list) return new Response("not found", { status: 404 });
      const got = await this.ctx.storage.get<Uint8Array>(list.map((k) => `img:${k}`));
      const parts = list.map((k) => got.get(`img:${k}`));
      if (parts.some((b) => !b)) return new Response("not found", { status: 404 });
      const out = new Uint8Array(parts.reduce((s, b) => s + b!.byteLength, 0));
      let o = 0;
      for (const b of parts) {
        out.set(b!, o);
        o += b!.byteLength;
      }
      return new Response(out, {
        headers: { "content-type": "application/octet-stream", "cache-control": "no-store", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; sandbox" },
      });
    }
    const pack = n.match(/^p(\d{1,3})$/);
    if (pack) {
      const k = Number(pack[1]);
      if (!record?.packSecret || secret !== record.packSecret || k >= (record.packs ?? 0)) return new Response("not found", { status: 404 });
      const bytes = await this.ctx.storage.get<Uint8Array>(`pack:${k}`);
      if (!bytes) return new Response("not found", { status: 404 });
      return new Response(bytes, {
        headers: { "content-type": "application/octet-stream", "cache-control": "no-store", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; sandbox" },
      });
    }
    const info = record && Object.values(record.images).find((i) => String(i.n) === n);
    if (!record || secret !== record.imageSecret || !info) return new Response("not found", { status: 404 });
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
    const info = name ? record?.images[imageKey(name)] : undefined;
    if (!info || !record) return null;
    return { src: this.imageSrc(record, info.n), w: info.w, h: info.h };
  }

  private imageSrc(record: QuizRecord, n: number | string): string {
    return `/api/i/${this.ctx.id.toString()}/img/${record.imageSecret}/${n}`;
  }

  /** The packs of answer pictures' small copies, for the students' devices; absent without picture answers. */
  private packUrls(): string[] | undefined {
    const record = this.quizRecord;
    if (!record?.packs || !record.packSecret) return undefined;
    return Array.from({ length: record.packs }, (_, k) => `/api/i/${this.ctx.id.toString()}/img/${record.packSecret}/p${k}`);
  }

  /**
   * A Peers device's packs (docs/design/peers.md, "The pictures"): the
   * answer pictures' small copies as a tablet gets them, then the bundles
   * of the questions' pictures and backgrounds. `inPacks`: where each
   * bundled picture sits, under the address its views name it by.
   */
  private peersPacks(): { packs: string[]; inPacks: { src: string; pic: PackPic }[] } {
    const record = this.quizRecord!;
    const packs = this.packUrls() ?? [];
    const byN = new Map(Object.values(record.images).map((i) => [i.n, i]));
    const inPacks: { src: string; pic: PackPic }[] = [];
    bundles(record.quiz, record.images).forEach((list, k) => {
      const p = packs.length;
      packs.push(this.imageSrc(record, `b${k}`));
      let o = 0;
      for (const n of list) {
        const info = byN.get(n)!;
        inPacks.push({ src: this.imageSrc(record, n), pic: { p, o, l: info.l!, type: info.type, w: info.w, h: info.h } });
        o += info.l!;
      }
    });
    return { packs, inPacks };
  }

  /** Question q's answer pictures in the order on screen, for the wall; absent when it has none. */
  private answerPics(q: number): (ImageRef | null)[] | undefined {
    const answers = this.game!.quiz.questions[q].answers;
    if (!answers.some((a) => a.image !== undefined)) return undefined;
    return this.onScreen(q, answers.map((a) => (a.image ? this.imageRef(a.image) : null)));
  }

  /** The same on a student's device: where each small copy sits in the packs. */
  private answerSmalls(q: number): (PackPic | null)[] | undefined {
    const record = this.quizRecord;
    const answers = this.game!.quiz.questions[q].answers;
    if (!answers.some((a) => a.image !== undefined)) return undefined;
    return this.onScreen(
      q,
      answers.map((a) => {
        const s = a.image ? record?.images[imageKey(a.image)]?.small : undefined;
        return s ? { p: s.p, o: s.o, l: s.l, type: s.type, w: s.w, h: s.h } : null;
      }),
    );
  }

  /** For the code directory: does this code still open this quiz? */
  async opens(code: string): Promise<boolean> {
    return this.live() && this.meta!.code === code;
  }

  /**
   * For the code box: are these the teacher code's last two digits? ip: the
   * requesting device's address, for the limit on wrong ones; secret: the
   * uploading device's, which needs no digits and isn't limited.
   */
  async teacherCheck(digits: string, ip: string | null, secret?: string): Promise<"ok" | "wrong" | "locked"> {
    if (!this.live()) return "wrong";
    // A Peers room has no teacher devices: every device is a player's.
    if (this.game!.run?.peers) return "wrong";
    if (typeof secret === "string" && safeEqual(secret, this.meta!.secret)) return "ok";
    return this.checkTeacher(digits, await this.deviceKey(ip));
  }

  /** A device as the limit on wrong teacher codes counts it: its address, salted and hashed; the quiz itself without one. */
  private async deviceKey(ip: string | null): Promise<string> {
    if (!ip) return "quiz";
    const d = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${this.guesses.salt}|${ip}`)));
    return btoa(String.fromCharCode(...d.slice(0, 12)));
  }

  /** The quiz's allowance of wrong endings now: one more per QUIZ_GUESS_EVERY_MS since `at`, up to QUIZ_GUESSES. */
  private allowance(now: number): number {
    const g = this.guesses;
    if (g.left >= QUIZ_GUESSES) return QUIZ_GUESSES;
    const grown = Math.max(0, Math.floor((now - g.at) / QUIZ_GUESS_EVERY_MS));
    return Math.min(QUIZ_GUESSES, g.left + grown);
  }

  /** Devices whose count has run out are forgotten; true when one was. */
  private pruneGuesses(now: number): boolean {
    let changed = false;
    for (const [k, d] of Object.entries(this.guesses.devs)) {
      const fails = d.fails.filter((t) => now - t < GUESS_WINDOW_MS);
      if (d.until <= now && fails.length === 0) {
        delete this.guesses.devs[k];
        changed = true;
      } else if (fails.length !== d.fails.length) {
        d.fails = fails;
        changed = true;
      }
    }
    return changed;
  }

  /** When the next device's count runs out, for the alarm; null when none is counted. */
  private guessesExpire(): number | null {
    let at: number | null = null;
    for (const d of Object.values(this.guesses.devs)) {
      const end = Math.max(d.until, ...d.fails.map((t) => t + GUESS_WINDOW_MS));
      if (at === null || end < at) at = end;
    }
    return at;
  }

  /**
   * Checks the two digits, counting a wrong one against the device
   * (GUESS_MAX) and the quiz (QUIZ_GUESSES), stored before the answer goes.
   * A right code or a refusal writes nothing.
   */
  private async checkTeacher(digits: unknown, dev: string): Promise<"ok" | "wrong" | "locked"> {
    const now = Date.now();
    const g = this.guesses;
    if ((g.devs[dev]?.until ?? 0) > now) return "locked";
    const left = this.allowance(now);
    if (left < 1) return "locked";
    const teacher = this.meta?.teacher;
    if (typeof digits === "string" && teacher && safeEqual(digits, teacher)) return "ok";
    // No two digits at all (the class code alone) is no guess at them.
    if (typeof digits !== "string" || !/^\d{2}$/.test(digits)) return "wrong";
    this.pruneGuesses(now);
    const d = g.devs[dev] ?? { fails: [], until: 0 };
    d.fails.push(now);
    if (d.fails.length >= GUESS_MAX) {
      d.until = now + GUESS_LOCK_MS;
      d.fails = [];
    }
    // Last in the order, so GUESS_KEYS drops the oldest.
    delete g.devs[dev];
    g.devs[dev] = d;
    const keys = Object.keys(g.devs);
    if (keys.length > GUESS_KEYS) delete g.devs[keys[0]];
    // A full allowance grows again from this one; a part-spent one keeps its rhythm.
    if (left >= QUIZ_GUESSES) g.at = now;
    else g.at += Math.floor((now - g.at) / QUIZ_GUESS_EVERY_MS) * QUIZ_GUESS_EVERY_MS;
    g.left = left - 1;
    await this.ctx.storage.put("guesses", g);
    // The alarm forgets the device once its count runs out.
    if (this.meta) await this.scheduleAlarm();
    return d.until > now || g.left < 1 ? "locked" : "wrong";
  }

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
      // The device, should it come with a teacher code (GUESS_MAX); the address is Cloudflare's, not the browser's.
      pair[1].serializeAttachment({ role: null, dev: await this.deviceKey(req.headers.get("cf-connecting-ip")) } satisfies Session);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (req.method !== "POST") return new Response("not found", { status: 404 });
    let body: { auth?: Auth; v?: number; cmd?: { id: string; cmd: Command }; secret?: string; held?: DeviceHeld; line?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: "bad request" }, 400);
    }
    if (action === "info") return this.forOwner(body.secret);
    if (action === "replaced") return this.replaced(body.secret);
    if (!body.auth) return json({ error: "bad request" }, 400);
    const out: ServerMessage[] = [];
    const session = this.authenticate(body.auth, out);
    // Gone, or a role that moved: the tab hears it with the reply, whatever it asked.
    if (session.role === null) return json({ messages: out });
    // The device's address, passed on by the API function (GUESS_MAX).
    if (session.role === "guest" && action === "cmd") session.dev = await this.deviceKey(req.headers.get("x-cq-ip"));
    this.notePoll(session);
    this.takeLine(session, body.line);
    if (action === "cmd" && body.cmd && session.role !== null) {
      // A command over HTTP: the reply is its acknowledgement plus, for a
      // guest becoming a player or taking a role, who it is now.
      const replies = await this.command(session, body.cmd.id, body.cmd.cmd);
      // A guest that became a player: its view comes with the welcome, as
      // over a WebSocket. Its poll may still be held as a guest's, which a
      // new player doesn't change: the tablet would stay on a spinner for up
      // to POLL_HOLD_MS (the page also asks again as the player, client/net.ts
      // `repoll`).
      const next = replies.session;
      if (next?.role === "player") {
        const view = this.viewFor(next) as PlayerView | null;
        if (view) {
          this.sentToPoller.set(next.player, sent(view));
          return json({ messages: [...out, ...replies.direct, { t: "state", view }] });
        }
      }
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
        // The device's input, as it was last taken: back in memory if the instance lost it.
        await this.fromDevice(pid, body.held);
        const view = this.viewFor(session) as PlayerView;
        const last = this.sentToPoller.get(pid);
        // Answer at once when the device's view changed, or when it didn't
        // get the last one (its version is older than what was sent).
        if (!last || known < last.v || last.poll !== pollKey(view)) {
          this.sentToPoller.set(pid, sent(view));
          return json({ messages: [...out, { t: "state", view }] });
        }
        const msgs = await this.hold(session);
        this.notePoll(session);
        if (msgs.length > 0 || !this.live()) return json({ messages: msgs });
        // A poll that ran out is all the server knows of a poller's line ending.
        this.lineEnded(pid);
        // The hold ran out: what changed without ending it (pollKey) comes
        // with its end, which costs no request of its own.
        const now = this.viewFor(session) as PlayerView | null;
        const before = this.sentToPoller.get(pid);
        if (!now || (before && before.key === viewKey(now))) return json({ messages: [] });
        this.sentToPoller.set(pid, sent(now));
        return json({ messages: [{ t: "state", view: now }] });
      }
      const view = this.viewFor(session);
      if (view && view.v > known) return json({ messages: [...out, { t: "state", view }] });
      const msgs = await this.hold(session);
      this.notePoll(session);
      return json({ messages: msgs });
    }
    return json({ error: "not found" }, 404);
  }

  /** The device that pasted the quiz: where it stands, for the root page's resume card. */
  private async forOwner(secret: unknown): Promise<Response> {
    if (!this.live() || typeof secret !== "string" || !safeEqual(secret, this.meta!.secret)) return json({ error: "gone" }, 404);
    const meta = this.meta!;
    const game = this.game!;
    const stands = { phase: game.run ? game.run.phase : ("idle" as const), ...G.progress(game) };
    return json({ title: game.quiz.title, code: meta.code, teacher: meta.teacher, stands, ...(game.run?.peers ? { peers: true as const } : {}), memory: this.memory } satisfies QuizInfo);
  }

  /**
   * The device that uploaded this quiz uploaded another: a device holds one
   * quiz that hasn't started (docs/design/hosting-and-limits.md, "Running
   * classes finish"), so this one ends if it never left the lobby, with its
   * booking. A started quiz stays, so one paused over lunch survives a new
   * zip tried on the same laptop.
   */
  private async replaced(secret: unknown): Promise<Response> {
    if (!this.live() || typeof secret !== "string" || !safeEqual(secret, this.meta!.secret)) return json({ error: "gone" }, 404);
    const run = this.game!.run;
    if (run && run.phase !== "lobby") return json({ ended: false });
    await this.endInstance();
    return json({ ended: true });
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

  // The object may have hibernated between handlers: the session is read back
  // from the socket's attachment.
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
      if (session.role === "player") {
        session = { ...session, since: Date.now() };
        ws.serializeAttachment(session);
        await this.fromDevice(session.player, msg.held, ws);
        // This socket is the player's newest: it keeps the copy of their input.
        this.mirror(session.player, ws);
        session = ws.deserializeAttachment() as Session;
      }
      // A guest keeps the device it connected from, for a teacher code it may send.
      if (session.role === "guest") session = { role: "guest", dev: (ws.deserializeAttachment() as { dev?: string } | null)?.dev };
      ws.serializeAttachment(session);
      this.takeLine(session, msg.line, ws);
      for (const m of out) send(ws, m);
      if (session.role === null) {
        ws.close(4000, "gone");
        return;
      }
      if (session.role !== "guest") this.sendView(ws, session);
      // Someone arrived: the teacher's tabs show who, guests which roles are
      // free; in a Peers room every device shows who is in.
      if (session.role !== "guest") this.broadcast(undefined, !this.game?.run?.peers);
      return;
    }
    if (msg.t === "cmd") {
      const session = ws.deserializeAttachment() as Session;
      if (!session || session.role === null) return;
      const replies = await this.command(session, msg.id, msg.cmd, ws);
      let next = replies.session;
      if (next && next.role === "player") next = { ...next, since: Date.now() };
      if (next) ws.serializeAttachment(next);
      // A player who came in here (an avatar taken back may have held input): this socket keeps the copy.
      if (next?.role === "player") this.mirror(next.player, ws);
      this.takeLine(next ?? session, msg.line, ws);
      for (const m of replies.direct) send(ws, m);
      if (next && next.role === "player") {
        this.sendView(ws, next);
        this.broadcast(undefined, !this.game?.run?.peers);
      }
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const session = ws.deserializeAttachment() as Session | null;
    if (!session || session.role === null || session.role === "guest") return;
    if (session.role === "player") {
      // The object may have just woken for this close: the copy is put back first.
      if (session.held && this.game) {
        this.takenHere.add(session.player);
        if (G.restoreHeld(this.game, session.player, session.held)) this.unwritten.add(session.player);
      }
      this.lineEnded(session.player, ws);
    }
    // A Peers room doesn't wait for a device that closed its line (a tab closed).
    if (session.role === "player" && this.game?.run?.peers) {
      await this.peersCheck(ws);
      return;
    }
    // A teacher's tab that closed its socket (reload, a phone locking its
    // screen) fades like one that went quiet: away after FRESH_MS, not at
    // once, so a reload doesn't flip the steering to the Projector and back.
    // Until it is heard from again it is quiet, not present (`closed`).
    if (session.role === "screen" || session.role === "remote") {
      const key = `${session.role}:${session.token}`;
      const now = Date.now();
      this.lastPoll.set(key, now);
      const another = this.ctx.getWebSockets().some((o) => {
        if (o === ws || o.readyState !== WebSocket.OPEN) return false;
        const s = o.deserializeAttachment() as Session | null;
        return s?.role === session.role && s.token === session.token;
      });
      if (!another) {
        this.closed.set(key, now);
        if (this.closed.size > 20) this.closed.delete(this.closed.keys().next().value!);
      }
    }
    this.broadcastStaff(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  private authenticate(auth: Auth, out: ServerMessage[]): Session {
    if (!this.meta || !this.game) {
      out.push(this.endedBy ?? { t: "gone", reason: "This quiz has ended." });
      return { role: null };
    }
    const meta = this.meta;
    const game = this.game;
    if (auth.role === "screen" || auth.role === "remote") {
      const held = meta.roles[auth.role];
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
      }
    }
    // A guest is told what it can be: a player (or, once the quiz is under
    // way, one of the players whose devices are away), or a free role.
    out.push(auth.role === "player" ? { ...this.chooseMessage(), stale: true } : this.chooseMessage());
    return { role: "guest" };
  }

  /**
   * Whether the tab holding a role is there, quiet (soon away), or away;
   * "none" when nobody holds it. Quiet: not heard from for QUIET_MS, or its
   * line closed and it hasn't been heard from since (`closed`). A polling
   * tab whose poll is held is heard from now.
   */
  private presence(role: RoleName, exclude?: WebSocket): "none" | "present" | "quiet" | "away" {
    const token = this.meta?.roles[role];
    if (!token) return "none";
    const key = `${role}:${token}`;
    const now = Date.now();
    let last = this.lastPoll.get(key) ?? 0;
    let open = false;
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude || ws.readyState !== WebSocket.OPEN) continue;
      const s = ws.deserializeAttachment() as Session | null;
      if (!s || s.role !== role || s.token !== token) continue;
      const pinged = this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime() ?? 0;
      last = Math.max(last, pinged, s.since);
      open = true;
    }
    for (const w of this.waiters) if (w.session.role === role && w.session.token === token) last = now;
    const age = now - last;
    if (age >= FRESH_MS) return "away";
    if (age >= QUIET_MS || (!open && this.closed.get(key) === last)) return "quiet";
    return "present";
  }

  private shown(role: RoleName, exclude?: WebSocket): Presence {
    const p = this.presence(role, exclude);
    return p === "quiet" ? "present" : p;
  }

  /** The Projector steers while no Remote is there (docs/design/teacher-devices.md, "When a device is gone"). */
  private steering(exclude?: WebSocket): boolean {
    const p = this.presence("remote", exclude);
    return p === "none" || p === "away";
  }

  /** A tab holds the role and is there (quiet counts: a swap waits for it, the wall doesn't take over). */
  private there(role: RoleName): boolean {
    const p = this.presence(role);
    return p === "present" || p === "quiet";
  }

  /**
   * A Remote the teacher code may not take: its tab is present. A quiet one
   * (a closed tab, a phone locked, nothing heard for QUIET_MS) is taken at
   * once, rather than "full" until it is away; the wall still waits FRESH_MS
   * before it steers.
   */
  private remoteHeld(): boolean {
    return this.presence("remote") === "present";
  }

  /**
   * What a teacher device coming in with the teacher code does
   * (docs/design/teacher-devices.md, "A second device: one question, only when needed"): the question when one tab shows and steers;
   * the role whose tab is gone; "screen", to do both, when nothing is there;
   * nothing when both tabs are there. The class code never reaches a role,
   * so this holds before and after the first student alike.
   */
  private entry(): Entry {
    const s = this.there("screen");
    const r = this.remoteHeld();
    if (s && r) return "full";
    if (s) return this.meta!.roles.remote ? "remote" : "ask";
    return "screen";
  }

  /**
   * Tells the tabs holding a role's old token what happened (they lost it, or
   * hold another role now) and closes their line: the tab reconnects as what
   * it is now.
   */
  private evict(role: RoleName, token: string, msg: ServerMessage, keep?: WebSocket): void {
    for (const ws of this.ctx.getWebSockets()) {
      // keep: the socket whose command this is; it hears it with the reply.
      if (ws === keep) continue;
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
    this.closed.delete(`${role}:${token}`);
    this.moved.set(`${role}:${token}`, msg);
    if (this.moved.size > 20) this.moved.delete(this.moved.keys().next().value!);
  }

  /** A role handed to a tab that is about to connect with it counts as there from now. */
  private hand(role: RoleName, token: string): void {
    this.meta!.roles[role] = token;
    this.lastPoll.set(`${role}:${token}`, Date.now());
  }

  /**
   * A teacher device takes a role, as entry() says: the one whose tab is
   * gone, or either when one tab does both. "Show here" (the screen) turns
   * that tab into the steering tab; "Steer from here" (the remote) leaves it
   * the wall, which stops steering. Null when the entry has changed.
   */
  private takeRole(role: RoleName): string | null {
    const roles = this.meta!.roles;
    const entry = this.entry();
    if (entry === "full" || (entry !== "ask" && entry !== role)) return null;
    const token = randomToken();
    const old = roles[role];
    if (entry === "ask") {
      if (role === "screen" && old) {
        // The tab that showed and steered becomes the steering tab.
        const remote = randomToken();
        this.evict("screen", old, { t: "role", role: "remote", token: remote });
        this.hand("remote", remote);
      }
    } else {
      if (old) this.evict(role, old, { t: "lost", role });
      // Nothing was there: the newcomer shows and steers, as a tab that just
      // uploaded; a gone steering tab's token goes with it, so the next
      // device is asked rather than sent to it.
      if (role === "screen" && roles.remote && !this.remoteHeld()) {
        this.evict("remote", roles.remote, { t: "lost", role: "remote" });
        roles.remote = null;
      }
    }
    this.hand(role, token);
    return token;
  }

  private async command(
    session: Session,
    id: string,
    cmd: Command,
    ws?: WebSocket,
  ): Promise<{ direct: ServerMessage[]; session?: Session }> {
    const game = this.game;
    const meta = this.meta;
    if (!game || !meta || session.role === null) return { direct: [{ t: "gone", reason: "This quiz has ended." }] };
    const roles = meta.roles;
    const ack = (ok: boolean, error?: string, result?: unknown): ServerMessage => ({ t: "ack", id, ok, error, result });
    const now = Date.now();
    const at = (c: { at: { phase: string; current: number; reading?: boolean; votes?: boolean; lastCall?: boolean } }) => {
      const run = game.run;
      const phase = run ? run.phase : "idle";
      const current = run ? run.current : -1;
      if (!c.at || c.at.phase !== phase || c.at.current !== current) return false;
      // Showing the answers, Last call, the lock-in and the reveal are steps
      // within one phase: a press sent twice mustn't take two steps.
      if (typeof c.at.votes === "boolean" && c.at.votes !== G.lockedIn(game)) return false;
      if (typeof c.at.lastCall === "boolean" && c.at.lastCall !== !!G.runningClock(game)) return false;
      return typeof c.at.reading !== "boolean" || c.at.reading === (G.answering(game) === "reading");
    };

    try {
      if (session.role === "guest") {
        if (cmd.op === "tick") return { direct: [ack(true), this.chooseMessage()] };
        if (cmd.op === "takeRole") {
          if (cmd.role !== "screen" && cmd.role !== "remote") return { direct: [ack(false, "unknown role")] };
          // A Peers room has no teacher devices (teacherCheck).
          if (G.isPeers(game)) return { direct: [ack(false, WRONG_TEACHER_CODE)] };
          // The teacher code, checked here whatever the page did before; the
          // uploading device's secret (Resume) needs no digits and isn't counted.
          const owner = typeof cmd.secret === "string" && safeEqual(cmd.secret, meta.secret);
          if (!owner) {
            const check = await this.checkTeacher(cmd.teacher, session.dev ?? "quiz");
            if (check !== "ok") return { direct: [ack(false, check === "locked" ? TOO_MANY_CODES : WRONG_TEACHER_CODE)] };
          }
          const token = this.takeRole(cmd.role);
          // The tabs changed since the page was told: it hears what holds now.
          if (!token) return { direct: [ack(false, "changed"), this.chooseMessage()] };
          await this.afterTeacherChange(["meta"]);
          return { direct: [ack(true), { t: "role", role: cmd.role, token }], session: { role: cmd.role, token, since: now } };
        }
        if (cmd.op !== "newPlayer" && cmd.op !== "claim") return { direct: [ack(false, "not joined")] };
        const run = game.run;
        if (!run || run.phase === "final") return { direct: [ack(false, "This quiz has finished."), this.chooseMessage()] };
        // Joining after the start may be a student whose device lost its
        // player; they can pick their avatar back (docs/design/class-and-wall.md, "Coming back").
        if (cmd.op === "newPlayer") {
          // A join resent after its answer was lost gets the same player.
          const earlier = typeof id === "string" && run.joins && Object.hasOwn(run.joins, id) ? G.playerById(run, run.joins[id]) : null;
          if (earlier && !earlier.removed) {
            return { direct: [ack(true), { t: "welcome", player: earlier.id, token: earlier.token }], session: { role: "player", player: earlier.id } };
          }
          // The first student after the booking lapsed: the class is coming after all.
          if (!(await this.bookAgain())) return { direct: [ack(false, G.isPeers(game) ? roomsFullMessage() : classesFullMessage()), this.chooseMessage()] };
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

      if (session.role === "player") {
        if (cmd.op === "tick") return { direct: [ack(true)] };
        if (cmd.op === "dress") {
          // In the lobby: the child's look, held until Start writes the class's
          // looks (docs/design/open-period-in-memory.md).
          const outcome = G.dress(game, session.player, cmd.b, cmd.h, cmd.t);
          if (outcome === "stored") await this.took(session.player, ws);
          return { direct: [ack(outcome !== "refused")] };
        }
        if (cmd.op === "ready") {
          // Peers: done with the solution, held; the room steps on, and writes, once everyone present is.
          const outcome = G.setReady(game, session.player, cmd.q);
          if (outcome === "stored") await this.took(session.player, ws);
          return { direct: [ack(outcome !== "refused")] };
        }
        if (G.isHost(game, session.player) && cmd.op !== "answer") {
          // The player who opened a Peers room: Start, on without waiting,
          // the final ranking, a fix of the solution, Remove, Exit.
          let changed: ("run" | "fixes")[] = ["run"];
          switch (cmd.op) {
            case "begin":
            case "goOn":
            case "finish":
              if (!at(cmd)) return { direct: [ack(true, undefined, "stale")] };
              if (cmd.op === "begin") {
                G.begin(game, now);
                await this.bookAhead();
              } else if (cmd.op === "goOn") G.goOn(game, now, this.nextView());
              else G.finish(game, now);
              break;
            case "setCounts":
              G.setCounts(game, cmd.q, this.fromScreen(cmd.q, cmd.counts));
              changed = ["fixes"];
              break;
            case "setVoid":
              G.setVoid(game, cmd.q, !!cmd.value);
              changed = ["fixes"];
              break;
            case "remove":
              if (cmd.player === session.player) return { direct: [ack(false, "not allowed")] };
              G.removePlayer(game, cmd.player);
              // The room may have waited only for that avatar.
              G.peersStep(game, now, this.nextView(), this.connectedPlayers());
              break;
            case "endInstance":
              await this.endInstance(id);
              return { direct: [ack(true)] };
            default:
              return { direct: [ack(false, "not allowed")] };
          }
          await this.afterTeacherChange(changed);
          if (game.run?.phase === "final") await this.settleRows();
          return { direct: [ack(true)] };
        }
        if (cmd.op !== "answer") return { direct: [ack(false, "not allowed")] };
        const view = typeof cmd.v === "number" ? cmd.v : Infinity;
        // The tablet names the answer by its place on screen; it is stored by its place in the text.
        const choice = Number.isInteger(cmd.choice) ? (G.orderOf(game, cmd.q)[cmd.choice] ?? -1) : -1;
        // Held in memory, written with the lock-in or the next step
        // (docs/design/open-period-in-memory.md).
        const outcome = G.answerOutcome(game, session.player, cmd.q, choice, cmd.seq, view, now, typeof cmd.ms === "number" ? cmd.ms : undefined);
        if (outcome === "recorded") await this.took(session.player, ws);
        // The acknowledgement carries what is held for this question now,
        // in screen order: the one fact the tablet shows as accepted and the
        // one that scores, whatever this tap's fate (docs/design/question-flow.md,
        // "When a tap counts"). Its own view says the same.
        return { direct: [ack(outcome !== "refused", undefined, { q: cmd.q, record: this.recordOnScreen(cmd.q, session.player) } satisfies AnswerAck)] };
      }

      if (roles[session.role] !== session.token) return { direct: [ack(false), { t: "lost", role: session.role }] };
      if (cmd.op === "tick") {
        // A device gone away (FRESH_MS) may have been the last one Last call
        // waited for; the wall's count already says everyone is in.
        await this.closeIfAllIn();
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
        if (cmd.op === "play") {
          // The clicker in the room works whoever steers.
          if (!at(cmd)) return { direct: [ack(true, undefined, "stale")] };
          G.play(game, now, this.nextView());
          await this.afterTeacherChange(["run"]);
          if (game.run?.phase === "final") await this.settleRows();
          return { direct: [ack(true)] };
        }
        if (cmd.op === "zoom") {
          // Like the clicker: the teacher at the projector points at the picture, whoever steers.
          if (!at(cmd)) return { direct: [ack(true, undefined, "stale")] };
          G.setZoom(game, !!cmd.value);
          await this.afterTeacherChange(["run"]);
          return { direct: [ack(true)] };
        }
      }
      if (cmd.op === "swap") {
        // ⇄ Swap (docs/design/teacher-devices.md, "A second device: one question, only when needed"): the wall becomes the steering tab
        // and the steering tab the wall, at once, from either; the same tap
        // undoes it. Both get new tokens, as a role handed over always does.
        const other: RoleName = session.role === "screen" ? "remote" : "screen";
        const otherToken = roles[other];
        if (!otherToken || !this.there(other)) return { direct: [ack(false, "There is no other screen to swap with.")] };
        const mine = randomToken();
        const theirs = randomToken();
        this.evict(other, otherToken, { t: "role", role: session.role, token: theirs });
        this.evict(session.role, session.token, { t: "role", role: other, token: mine }, ws);
        this.hand(session.role, theirs);
        this.hand(other, mine);
        await this.afterTeacherChange(["meta"]);
        return { direct: [ack(true), { t: "role", role: other, token: mine }], session: { role: null } };
      }
      if (session.role === "screen" && !this.steering()) return { direct: [ack(false, "The remote steers the quiz.")] };

      let changed: ("run" | "fixes" | "meta")[] = [];
      switch (cmd.op) {
        case "begin":
        case "play":
        case "lastCall":
        case "finish":
        case "skipCurrent": {
          if (!at(cmd)) return { direct: [ack(true, undefined, "stale")] };
          // Start without "Let the class in" lets the class in too, and books.
          if (cmd.op === "begin" && !(await this.bookRows())) return { direct: [ack(false, classesFullMessage())] };
          if (cmd.op === "begin") {
            G.begin(game, now);
            await this.bookAhead();
          }
          else if (cmd.op === "play") G.play(game, now, this.nextView());
          else if (cmd.op === "lastCall") G.lastCall(game, now);
          else if (cmd.op === "finish") G.finish(game, now);
          else {
            G.skipCurrent(game, now);
            changed.push("fixes");
          }
          changed.push("run");
          break;
        }
        case "letIn":
          if (!(await this.bookRows())) return { direct: [ack(false, classesFullMessage())] };
          G.letIn(game);
          changed = ["run"];
          break;
        case "speed":
          G.setSpeed(game, !!cmd.value);
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
      if (game.run?.phase === "final") await this.settleRows();
      return { direct: [ack(true)] };
    } catch (e) {
      if (e instanceof G.GameError) {
        // A Peers room has nobody to ask: the class's refusals without "Ask whoever runs it".
        const words = G.isPeers(game) ? ({ [CLASS_FULL]: ROOM_FULL, [CLASS_STARTED]: ROOM_STARTED }[e.message] ?? e.message) : e.message;
        return { direct: [ack(false, words)] };
      }
      // The account's daily allowance is spent: the tab says so rather than
      // looking offline (docs/design/hosting-and-limits.md, "When the allowance runs out anyway"). What's in memory may be
      // ahead of storage now; reload it, so nothing shows that isn't stored.
      if (isQuotaError(e)) {
        await this.load().catch(() => {});
        return { direct: [ack(false, "quota"), { t: "quota" }] };
      }
      throw e;
    }
  }

  /**
   * Letting the class in books it against the day's ledger (rows at the most
   * it can write, requests and awake time estimated: server/rows.ts); a quiz
   * whose class waits outside books nothing. False: the day has no room.
   */
  private async bookRows(): Promise<boolean> {
    const meta = this.meta!;
    const run = this.game!.run;
    if (!run?.waiting || meta.rows) return true;
    const cost = atLetIn(this.game!.quiz.questions.length);
    let booked: { day: Cost } | "rows";
    try {
      booked = await this.budget().bookRows(this.ctx.id.toString(), cost, meta.codeUntil, !!meta.probe);
    } catch (e) {
      // The ledger can't be reached: the class goes in unbooked rather than
      // be stopped by the site's own bookkeeping.
      console.error("class not booked:", e instanceof Error ? e.message : String(e));
      return true;
    }
    if (booked === "rows") {
      // Kept for the check's notice, which lasts until the teacher tries again.
      meta.day = DAY_FOR_CLASSES;
      await this.persist(["meta"]);
      this.broadcastStaff();
      return false;
    }
    meta.day = booked.day;
    meta.rows = { written: 0, booked: cost, at: Date.now() };
    return true;
  }

  /**
   * The first student after the class's booking lapsed books it again, as at
   * letting in or, once under way, for the class it will be; it may reach
   * further than letting in (DAY_FOR_JOINS), since the children are there.
   * False: not even that is left. The ledger out of reach: the student comes in.
   */
  private async bookAgain(): Promise<boolean> {
    const meta = this.meta!;
    const rows = meta.rows;
    const run = this.game!.run;
    if (!rows?.lapsed || rows.settled || !run) return true;
    const cost = run.phase === "lobby" ? atLetIn(this.game!.quiz.questions.length) : add(this.spent(), ahead(this.classNow(1)));
    let booked: { day: Cost } | "rows";
    try {
      booked = await this.budget().bookRows(this.ctx.id.toString(), cost, meta.codeUntil, !!meta.probe, "join");
    } catch (e) {
      console.error("class not booked again:", e instanceof Error ? e.message : String(e));
      return true;
    }
    if (booked === "rows") return false;
    meta.day = booked.day;
    meta.rows = { written: rows.written, booked: cost, at: Date.now() };
    return true;
  }

  /**
   * How many classes like this one still fit today, for the check's warning
   * (ROOM_WARN); null when the class is let in, or the day's ledger isn't
   * known in this object's memory.
   */
  private room(): number | null {
    const day = this.meta?.day;
    if (!this.game?.run?.waiting || day === undefined) return null;
    return room(asCost(day), atLetIn(this.game.quiz.questions.length), DAY_FOR_CLASSES);
  }

  /** The class as it is now, for what is ahead of it. extra: a student about to join. */
  private classNow(extra = 0): ClassNow {
    const game = this.game!;
    const run = game.run!;
    const players = G.activePlayers(run);
    const lines = run.lines ?? {};
    const mine = [...players.map((p) => lines[`p:${p.id}`]), lines.screen, lines.remote].filter((l): l is LineCounts => !!l);
    const teachers = (lines.screen ? 1 : 0) + (lines.remote ? 1 : 0);
    const opened = run.opened ?? 0;
    return {
      players: players.length + extra,
      devices: players.length + teachers + extra,
      pollers: mine.filter((l) => l.mode === "poll").length,
      questionsLeft: Math.max(1, game.quiz.questions.length - Math.max(0, opened - 1)),
    };
  }

  /** What the class has spent so far, by its devices' counts and its rows written. */
  private spent(): Cost {
    return spent(Object.values(this.game?.run?.lines ?? {}), this.meta?.rows?.written ?? 0);
  }

  /** Students in the class: its players but a Peers room's opener, who opened it. */
  private students(): number {
    const run = this.game?.run;
    if (!run) return 0;
    return G.activePlayers(run).filter((p) => p.id !== run.peers?.host).length;
  }

  /** Moves the class's booking to `cost`; kept in meta only once the ledger took it. */
  private async moveBooking(cost: Cost): Promise<boolean> {
    const rows = this.meta!.rows!;
    try {
      await this.budget().moveRows(this.ctx.id.toString(), cost);
    } catch {
      return false;
    }
    rows.booked = cost;
    return true;
  }

  /**
   * At the start the class is there, its devices' lines known and the looks
   * fixed: the booking moves to what was spent plus what is ahead. With no
   * student there it is a look at the room or a teacher alone, and holds
   * only what was spent until one comes (`bookAgain`).
   */
  private async bookAhead(): Promise<void> {
    const rows = this.meta!.rows;
    const run = this.game!.run;
    if (!rows || rows.settled || !run) return;
    if (this.students() === 0) {
      if (await this.moveBooking(this.spent())) rows.lapsed = true;
      return;
    }
    await this.moveBooking(add(this.spent(), ahead(this.classNow())));
  }

  /**
   * Under way: a device that fell back to long-poll, or a class spending
   * faster than estimated, books more, never refused (server/rows.ts, `grown`).
   */
  private async bookGrowth(): Promise<void> {
    const rows = this.meta?.rows;
    const run = this.game?.run;
    if (!rows?.booked || rows.settled || rows.lapsed || !run?.started || run.phase === "final") return;
    const more = grown(rows.booked, add(this.spent(), ahead(this.classNow())));
    if (more) await this.moveBooking(more);
  }

  /**
   * A let-in lobby that no student joined within LOBBY_WAIT_MS: the booking
   * holds only what was spent until a student comes (`bookAgain`). For the
   * alarm: when that is due, or null.
   */
  private lapseAt(): number | null {
    const rows = this.meta?.rows;
    if (!rows?.at || rows.lapsed || rows.settled || this.game?.run?.phase !== "lobby" || this.students() > 0) return null;
    return rows.at + LOBBY_WAIT_MS;
  }

  /** The final ranking: nothing more is written for the class, so the booking settles with what was spent and what devices left polling on it will. */
  private async settleRows(): Promise<void> {
    const rows = this.meta!.rows;
    if (!rows || rows.settled) return;
    const pollers = this.classNow().pollers;
    try {
      await this.budget().moveRows(this.ctx.id.toString(), add(this.spent(), tail(pollers)), true, this.classUse());
    } catch {
      // Unsettled, the quiz's end settles it (endInstance).
      return;
    }
    rows.settled = true;
    await this.persist(["meta"]);
  }

  /**
   * A device's count of its line (docs/design/telemetry.md, "What is
   * counted, and by whom"): the newest replaces the one before, in memory
   * and in the run, which stores it with its next write; on a socket also in
   * the attachment, so a wake gets it back. Never a write of its own.
   */
  private takeLine(session: Session, raw: unknown, ws?: WebSocket): void {
    const run = this.game?.run;
    const key = lineKey(session);
    if (!run || !key || raw === undefined) return;
    const line = readLine(raw);
    if (!line) return;
    run.lines = { ...run.lines, [key]: line };
    if (!ws) return;
    const s = ws.deserializeAttachment() as Session | null;
    if (s && lineKey(s) === key) ws.serializeAttachment({ ...s, line });
  }

  /** The class as one summary of numbers, for its settle (docs/design/telemetry.md, "What reaches storage"). */
  private classUse(): ClassUse | undefined {
    const game = this.game;
    const run = game?.run;
    const meta = this.meta;
    if (!game || !run || !meta) return undefined;
    const players = G.activePlayers(run);
    const kind: RoomKind = run.peers ? "peers" : meta.roles.remote || run.lines?.remote ? "remote" : "wall";
    const end = run.ended ?? meta.lastActivity;
    return summarize(
      {
        kind,
        players: players.length,
        late: players.filter((p) => p.late).length,
        questions: game.quiz.questions.length,
        played: run.opened ?? 0,
        final: run.phase === "final",
        minutes: run.started ? Math.max(0, Math.round((end - run.started) / 60_000)) : 0,
        rows: meta.rows?.written ?? 0,
        ...(meta.probe ? { probe: true } : {}),
      },
      Object.values(run.lines ?? {}),
    );
  }

  private async afterTeacherChange(changed: ("run" | "fixes" | "meta")[]): Promise<void> {
    this.meta!.lastActivity = Date.now();
    await this.refreshCode();
    await this.bookGrowth();
    await this.persist([...new Set([...changed, "meta" as const])]);
    await this.scheduleAlarm();
    this.broadcast();
  }

  /** The version the views get with the next persist(): the first to show what just changed. */
  private nextView(): number {
    return this.meta!.v + 1;
  }

  /** Writes what changed; the quiz text itself was written once at upload. A write of the run carries every input held so far. */
  private async persist(keys: ("run" | "fixes" | "meta")[]): Promise<void> {
    const meta = this.meta!;
    const game = this.game!;
    meta.v++;
    const entries: Record<string, unknown> = { meta };
    if (keys.includes("run")) entries.run = game.run;
    if (keys.includes("fixes")) entries.fixes = game.fixes;
    const covered = entries.run !== undefined ? [...this.unwritten] : [];
    for (const id of covered) this.unwritten.delete(id);
    // Each key is a row; what the class writes counts against its booking.
    if (meta.rows && !meta.rows.settled) meta.rows.written += Object.keys(entries).length;
    try {
      await this.ctx.storage.put(entries);
    } catch (e) {
      for (const id of covered) this.unwritten.add(id);
      throw e;
    }
  }

  /**
   * A player's input changed what the server holds (docs/design/open-period-in-memory.md):
   * the class sees it now, storage gets it with the run's next write, and
   * the player's socket keeps a copy. on: the socket it came on. In a Peers
   * room it may be the last the room waited for, and the room steps on; in
   * Last call the last answer of everyone present locks in.
   */
  private async took(player: string, on?: WebSocket): Promise<void> {
    const game = this.game!;
    this.unwritten.add(player);
    this.takenHere.add(player);
    this.mirror(player, on);
    if (game.run?.phase === "lobby") {
      this.showSoon();
      return;
    }
    if (G.isPeers(game)) {
      await this.peersStore();
      return;
    }
    if (G.runningClock(game) && this.allAnswered()) {
      G.closeAnswers(game, this.nextView());
      await this.persist(["run"]);
      await this.scheduleAlarm();
    }
    this.broadcast();
  }

  /**
   * A look changed: the screens hear of it within LOOK_SHOW_MS, one round
   * for every look changed in between. A Projector or a Remote on long-poll
   * would otherwise spend a request on each child's tap; the tablet shows
   * its own pick at once anyway.
   */
  private showSoon(): void {
    if (this.showTimer) return;
    this.showTimer = setTimeout(() => {
      this.showTimer = null;
      this.broadcast();
    }, LOOK_SHOW_MS);
  }

  /**
   * A player device's input as it was last taken (DeviceHeld), sent with a
   * hello or a poll. Wanted only when the instance lost it with its memory
   * (`takenHere`); then it is taken as the commands again, by the same
   * rules as a tap (a tap made on a view that showed answering open counts
   * while its question is on screen).
   */
  private async fromDevice(player: string, held: unknown, on?: WebSocket): Promise<void> {
    const game = this.game;
    const run = game?.run;
    const p = run ? G.playerById(run, player) : null;
    if (!game || !p || !held || typeof held !== "object" || this.takenHere.has(player)) return;
    const h = held as DeviceHeld;
    if (typeof h.token !== "string" || !safeEqual(h.token, p.token)) return;
    let changed = false;
    const a = h.answer;
    if (a && typeof a === "object" && Number.isInteger(a.q) && Number.isInteger(a.choice) && typeof a.seq === "number") {
      const choice = G.orderOf(game, a.q)[a.choice] ?? -1;
      const v = typeof a.v === "number" ? a.v : Infinity;
      changed = G.answerOutcome(game, player, a.q, choice, a.seq, v, Date.now(), typeof a.ms === "number" ? a.ms : undefined) === "recorded";
    }
    const l = h.look;
    if (l && typeof l === "object" && G.dress(game, player, l.b, l.h, l.t) === "stored") changed = true;
    if (typeof h.ready === "number" && G.setReady(game, player, h.ready) === "stored") changed = true;
    if (!changed) return;
    // Never in the way of the hello or the poll it came with: at worst the copy isn't taken.
    try {
      await this.took(player, on);
    } catch (e) {
      if (isQuotaError(e)) await this.load().catch(() => {});
      else console.error("device's input not taken:", e instanceof Error ? e.message : String(e));
    }
  }

  /**
   * The player's input as the server holds it goes into the attachment of
   * `on`, their newest socket, and out of their other sockets', so a copy
   * put back (load) is never an older one. Without `on` (the input came
   * over HTTP) no socket keeps one.
   */
  private mirror(player: string, on?: WebSocket): void {
    const held = this.game ? G.heldOf(this.game, player) : null;
    for (const ws of this.ctx.getWebSockets()) {
      const s = ws.deserializeAttachment() as Session | null;
      if (s?.role !== "player" || s.player !== player) continue;
      if (ws === on) ws.serializeAttachment({ ...s, held });
      else if (s.held) ws.serializeAttachment({ ...s, held: null });
    }
  }

  /**
   * A player's line ended (a socket closed, a held poll ran out) while the
   * server held their input unwritten, and no other socket of theirs keeps
   * a copy: were the instance to lose its memory before the stage's own
   * write, the input would be lost unless the device came back with it. So
   * it is written when the line isn't back within LINE_WRITE_MS (a poller
   * polling again, a new socket that keeps the copy), one write for every
   * line that ended in between, at most MAX_LINE_WRITES a stage for the
   * class (`Run.lineWrites`); past those it waits for the stage's write.
   */
  private lineEnded(player: string, closing?: WebSocket): void {
    if (!this.unwritten.has(player) || !this.live()) return;
    if (this.copied(player, closing) || this.lineWritesLeft() < 1) return;
    this.lineEnds.set(player, Date.now());
    this.lineTimer ??= setTimeout(() => void this.writeLines(), LINE_WRITE_MS);
  }

  /** Whether an open socket of this player's, other than `closing`, keeps the copy of their input. */
  private copied(player: string, closing?: WebSocket): boolean {
    return this.ctx.getWebSockets().some((ws) => {
      if (ws === closing || ws.readyState !== WebSocket.OPEN) return false;
      const s = ws.deserializeAttachment() as Session | null;
      return s?.role === "player" && s.player === player && !!s.held;
    });
  }

  /** A line that ended at `at` is back: a poll since, or a socket that keeps the copy. */
  private lineBack(player: string, at: number): boolean {
    return (this.lastPoll.get(player) ?? 0) > at || this.copied(player);
  }

  private lineWritesLeft(): number {
    const run = this.game?.run;
    if (!run) return 0;
    const used = run.lineWrites && run.lineWrites.q === run.current ? run.lineWrites.n : 0;
    return MAX_LINE_WRITES - used;
  }

  private async writeLines(): Promise<void> {
    this.lineTimer = null;
    const ends = [...this.lineEnds];
    this.lineEnds.clear();
    const run = this.game?.run;
    // A step may have written it meanwhile; a line that is back needs no write.
    if (!run || this.unwritten.size === 0 || this.lineWritesLeft() < 1) return;
    if (!ends.some(([player, at]) => this.unwritten.has(player) && !this.lineBack(player, at))) return;
    run.lineWrites = { q: run.current, n: MAX_LINE_WRITES - this.lineWritesLeft() + 1 };
    try {
      await this.persist(["run"]);
    } catch (e) {
      if (isQuotaError(e)) await this.load().catch(() => {});
      else console.error("held input not written:", e instanceof Error ? e.message : String(e));
    }
  }

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
    if (meta.codeUntil > end + CODE_SLACK_MS / 2) return;
    const until = end + CODE_SLACK_MS;
    const stub = this.env.JOIN.get(this.env.JOIN.idFromName(meta.code));
    if (await stub.claim(this.ctx.id.toString(), until)) meta.codeUntil = until;
    // The site's booking of this quiz's storage lives as long.
    await this.budget().renew(this.ctx.id.toString(), until).catch(() => {});
  }

  private async releaseCode(): Promise<void> {
    if (!this.meta) return;
    const stub = this.env.JOIN.get(this.env.JOIN.idFromName(this.meta.code));
    await stub.release(this.ctx.id.toString());
  }

  private async scheduleAlarm(): Promise<void> {
    const meta = this.meta;
    if (!meta) return;
    let at = meta.lastActivity + INSTANCE_IDLE_MS;
    // A running Last call: locking in at its end is the server's step (the alarm); the reveal stays the teacher's.
    const deadline = this.game ? G.deadline(this.game) : null;
    if (deadline != null) at = Math.min(at, deadline);
    // A device's wrong teacher codes are forgotten once they no longer count.
    const guesses = this.guessesExpire();
    if (guesses != null) at = Math.min(at, guesses);
    // Peers: someone the room waits for may go away, and the room on without them.
    const recheck = this.peersRecheck();
    if (recheck != null) at = Math.min(at, recheck);
    // A let-in lobby nobody joined gives its booking back.
    const lapse = this.lapseAt();
    if (lapse != null) at = Math.min(at, Math.max(Date.now() + 1000, lapse));
    // Each setAlarm() writes a row (Cloudflare's Durable Objects pricing), so
    // an alarm already due sooner stays: an alarm that comes early only looks
    // and sets the next one. One that is past is running now, or about to.
    const set = await this.ctx.storage.getAlarm();
    if (set !== null && set > Date.now() && set <= at) return;
    await this.ctx.storage.setAlarm(at);
    const rows = meta.rows;
    if (rows && !rows.settled) rows.written++;
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
    if (this.pruneGuesses(now)) await this.ctx.storage.put("guesses", this.guesses);
    const lapse = this.lapseAt();
    if (lapse != null && now >= lapse && (await this.moveBooking(this.spent()))) {
      this.meta!.rows!.lapsed = true;
      await this.persist(["meta"]);
    }
    const deadline = G.deadline(this.game!);
    if (deadline != null && now >= deadline) {
      // Time's up: answering closes; the reveal waits for the teacher.
      G.closeAnswers(this.game!, this.nextView());
      await this.persist(["run"]);
      this.broadcast();
    }
    await this.peersCheck();
    await this.scheduleAlarm();
  }

  /**
   * Peers: a player's change is held, and when everyone present is done the
   * room steps on, the step's write carrying it (docs/design/peers.md,
   * "Nobody steers"). A step is the room's use, as a teacher's step is: it
   * keeps the quiz alive.
   */
  private async peersStore(): Promise<void> {
    const game = this.game!;
    if (G.peersStep(game, Date.now(), this.nextView(), this.connectedPlayers())) {
      await this.afterTeacherChange(["run"]);
      if (game.run?.phase === "final") await this.settleRows();
      return;
    }
    // Someone is done now: the alarm may look again for who went away.
    await this.scheduleAlarm();
    this.broadcast();
  }

  /**
   * Peers: presence changes with time, not with events, so the alarm and a
   * closed line look again: the room steps on when those it waited for went
   * away, and every device's "waiting for" follows. exclude: a line closing.
   */
  private async peersCheck(exclude?: WebSocket): Promise<void> {
    const game = this.game;
    if (!game || !G.isPeers(game)) return;
    if (G.peersStep(game, Date.now(), this.nextView(), this.connectedPlayers(exclude))) {
      await this.afterTeacherChange(["run"]);
      if (game.run?.phase === "final") await this.settleRows();
      return;
    }
    await this.scheduleAlarm();
    this.broadcast(exclude);
  }

  /**
   * Peers: when the first device the room waits for would count as away
   * (not heard from for FRESH_MS), for the alarm; null when the room waits
   * for nobody, or nobody is done yet, which holds it whoever is there.
   */
  private peersRecheck(): number | null {
    const game = this.game;
    if (!game || !G.isPeers(game)) return null;
    const now = Date.now();
    const heard = this.lastHeard();
    const present = new Set([...heard].filter(([, t]) => now - t < FRESH_MS).map(([id]) => id));
    const waiting = G.waitingFor(game, present);
    if (waiting.length === 0 || !G.anyoneDone(game)) return null;
    return Math.max(now + 1000, Math.min(...waiting.map((id) => heard.get(id) ?? now)) + FRESH_MS + 100);
  }

  /**
   * Everything goes: quiz, class, players, answers, pictures (docs/design/hosting-and-limits.md, "What lives, and for how long").
   * ackId: the teacher ended it, and every device goes to the root page (docs/design/question-flow.md, "The steering bar": Exit).
   */
  private async endInstance(ackId?: string): Promise<void> {
    await this.releaseCode().catch(() => {});
    const rows = this.meta?.rows;
    const unsettled = rows && !rows.settled;
    await this.budget().release(this.ctx.id.toString(), unsettled ? this.spent() : undefined, unsettled ? this.classUse() : undefined).catch(() => {});
    const gone: ServerMessage = ackId ? { t: "gone", reason: "This quiz has been ended.", home: true } : { t: "gone", reason: "This quiz has ended." };
    const host = this.game?.run?.peers?.host;
    for (const ws of this.ctx.getWebSockets()) {
      const s = ws.deserializeAttachment() as Session | null;
      // Whoever ended it hears that it worked before the line closes: a teacher tab, or a Peers room's opener.
      if (ackId && (s?.role === "screen" || s?.role === "remote" || (s?.role === "player" && s.player === host))) send(ws, { t: "ack", id: ackId, ok: true });
      send(ws, gone);
      ws.close(4000, "gone");
    }
    for (const w of this.waiters) w.resolve([gone]);
    this.waiters.clear();
    if (this.lineTimer) clearTimeout(this.lineTimer);
    if (this.showTimer) clearTimeout(this.showTimer);
    this.lineTimer = null;
    this.showTimer = null;
    this.lineEnds.clear();
    this.unwritten.clear();
    this.takenHere.clear();
    if (ackId) this.endedBy = gone;
    this.meta = null;
    this.game = null;
    this.quizRecord = null;
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }

  /** Players whose device was heard from recently: an open socket that still pings, or a recent poll. */
  private connectedPlayers(exclude?: WebSocket): Set<string> {
    const now = Date.now();
    return new Set([...this.lastHeard(exclude)].filter(([, t]) => now - t < FRESH_MS).map(([id]) => id));
  }

  /** When each player's device was last heard from: an open socket's ping or hello, or a poll. */
  private lastHeard(exclude?: WebSocket): Map<string, number> {
    const at = new Map<string, number>();
    const note = (id: string, t: number) => at.set(id, Math.max(at.get(id) ?? 0, t));
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude || ws.readyState !== WebSocket.OPEN) continue;
      const s = ws.deserializeAttachment() as Session | null;
      if (!s || s.role !== "player") continue;
      note(s.player, Math.max(this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime() ?? 0, s.since ?? 0));
    }
    for (const [pid, t] of this.lastPoll) if (!pid.includes(":")) note(pid, t);
    return at;
  }

  private chooseMessage(): Extract<ServerMessage, { t: "choose" }> {
    const run = this.game?.run;
    const away = run && run.phase !== "lobby" && run.phase !== "final" ? this.awayPlayers() : [];
    return {
      t: "choose",
      title: this.game?.quiz.title ?? "",
      phase: run ? run.phase : "idle",
      avatars: away.map((p) => ({ id: p.id, avatar: p.avatar })),
      entry: this.meta ? this.entry() : "full",
      ...(run?.waiting ? { waiting: true as const } : {}),
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
      top: st.filter((s) => s.place <= 3).slice(0, 10).map(({ id, avatar, score, place }) => ({ id, avatar, score, place })),
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

  /**
   * Answering closes early when every device that is there has answered,
   * also when the last one Last call waited for went away rather than
   * answered (checked on the teacher tabs' ticks). True when it closed.
   */
  private async closeIfAllIn(): Promise<boolean> {
    const game = this.game;
    if (!game || !G.runningClock(game) || !this.allAnswered()) return false;
    G.closeAnswers(game, this.nextView());
    await this.persist(["run"]);
    await this.scheduleAlarm();
    this.broadcast();
    return true;
  }

  /** Last call as the screens draw it, while it runs; null without one, or once answering is locked in. */
  private clockView(): ClockView | null {
    const clock = this.game ? G.runningClock(this.game) : null;
    if (!clock) return null;
    return { ms: clock.ms, leftMs: Math.max(0, clock.at + clock.ms - Date.now()) };
  }

  /** A player's stored answer to question q, its choice in the order on screen. */
  private recordOnScreen(q: number, player: string): AnswerAck["record"] {
    const r = G.recordOf(this.game!, q, player);
    return r ? { choice: G.orderOf(this.game!, q).indexOf(r.choice), seq: r.seq } : null;
  }

  private answeredNow(): number {
    const run = this.game?.run;
    return run && run.current >= 0 ? G.activeAnswers(run, run.current).length : 0;
  }

  /** The players who answered the current question, in the order their answers arrived (a change of mind keeps its place). */
  private answeredIds(): Set<string> {
    const run = this.game?.run;
    if (!run || run.current < 0) return new Set();
    return new Set(Object.keys(run.answers[run.current] ?? {}).filter((id) => G.playerById(run, id)?.removed === false));
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

  /** Question i's picture as the class sees it: none once hidden by a fix. */
  private shownImage(i: number): string {
    return this.game!.fixes[i].hidePicture ? "" : this.game!.quiz.questions[i].image;
  }

  /** Every picture the class may be shown, to fetch ahead (in the lobby) so no question waits on one. */
  private allPictures(): string[] {
    const game = this.game!;
    const pictures = new Set<string>();
    for (const name of [game.quiz.background, ...game.quiz.questions.flatMap((x, i) => (game.fixes[i].skip ? [] : [this.shownImage(i), x.background, ...x.answers.map((a) => a.image ?? "")]))]) {
      const ref = this.imageRef(name);
      if (ref) pictures.add(ref.src);
    }
    return [...pictures];
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
    const image = showQ ? this.imageRef(this.shownImage(run!.current)) : null;
    const pics = showQ ? this.answerPics(run!.current) : undefined;
    // Who answered, and of how many: the devices that are there, or that
    // answered and went away since. A dead tablet stops holding the count
    // below full once it is away.
    const inIds = showQ ? this.answeredIds() : new Set<string>();
    const connected = this.connectedPlayers(exclude);
    return {
      role: "screen",
      v: meta.v,
      title: game.quiz.title,
      code: meta.code,
      teacher: meta.teacher,
      background: this.imageRef(game.quiz.background),
      pictures: this.allPictures(),
      zoom: !!image && G.zoomed(game),
      phase,
      current: run ? run.current : -1,
      waiting: !!run?.waiting,
      players: active.map((p) => ({ id: p.id, avatar: p.avatar })),
      answered: this.answeredNow(),
      answeredBy: [...inIds].map((id) => ({ id, avatar: run!.players[id].avatar })),
      of: active.filter((p) => connected.has(p.id) || inIds.has(p.id)).length,
      question: showQ
        ? {
            q: run!.current,
            n: prog.n,
            total: prog.total,
            text: q!.text,
            answers: this.onScreen(run!.current, q!.answers.map((a) => a.text)),
            ...(pics ? { pics } : {}),
            image,
            background: this.imageRef(q!.background || game.quiz.background),
            // After the reveal the answers are open as far as the wall goes.
            answering: G.answering(game) ?? "open",
            clock: this.clockView(),
          }
        : null,
      votes: run && G.lockedIn(game) ? this.onScreen(run.current, G.distribution(game, run.current)) : null,
      reveal:
        run && phase === "reveal"
          ? {
              counts: this.onScreen(run.current, game.fixes[run.current].counts),
              dist: this.onScreen(run.current, G.distribution(game, run.current)),
              void: game.fixes[run.current].void,
              winners: G.winners(game, run.current),
            }
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
    const inIds = run && (run.phase === "question" || run.phase === "reveal") ? this.answeredIds() : new Set<string>();
    return {
      role: "teacher",
      v: meta.v,
      id: this.ctx.id.toString(),
      title: game.quiz.title,
      code: meta.code,
      teacher: meta.teacher,
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
          answers: this.onScreen(
            i,
            q.answers.map((a, j) => ({ text: a.text, counts: fix.counts[j], marked: a.correct, ...(a.image !== undefined ? { image: a.image ? this.imageRef(a.image) : null } : {}) })),
          ),
          void: fix.void,
          skip: fix.skip,
          status,
        };
      }),
      phase: run ? run.phase : "idle",
      current: run ? run.current : -1,
      waiting: !!run?.waiting,
      room: this.room(),
      screen: this.shown("screen", exclude),
      remote: this.shown("remote", exclude),
      zoom: G.zoomed(game) && !game.fixes[run!.current].hidePicture && !!this.imageRef(game.quiz.questions[run!.current].image),
      speed: G.speedScale(game),
      answering: G.answering(game),
      votes: G.lockedIn(game),
      clock: this.clockView(),
      last: run ? G.lastQuestion(game) : false,
      run: run
        ? {
            n: prog.n,
            total: prog.total,
            players: G.activePlayers(run).map((p) => ({ id: p.id, avatar: p.avatar, connected: connected.has(p.id), score: scores.get(p.id) ?? 0, answered: inIds.has(p.id) })),
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
    const shownAt = run && run.phase === "question" ? run.shown?.[run.current] : undefined;
    const speed = G.speedScale(game);
    const ans = G.answering(game) ?? "open";
    const votes = G.lockedIn(game);
    const peers = run?.peers ? this.peersViews() : null;
    // A Peers device lays out the question itself, as the wall would, and
    // draws the answer pictures' small copies where it has them (`pics`
    // here, the full pictures' addresses in `peers.question.pics`).
    let packs = peers ? this.peersPacks().packs : this.packUrls();
    if (packs?.length === 0) packs = undefined;
    const smalls = run && run.current >= 0 && ans !== "reading" ? this.answerSmalls(run.current) : undefined;
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
        ...(packs ? { packs } : {}),
        question:
          q && (phase === "question" || phase === "reveal")
            ? {
                q: run!.current,
                n: prog.n,
                total: prog.total,
                // Not while the class reads the question: the tablet points at the board instead.
                answers: ans === "reading" ? [] : this.onScreen(run!.current, q.answers.map((a) => a.text)),
                ...(smalls ? { pics: smalls } : {}),
                mine,
                answering: ans,
                clock,
                sinceMs: shownAt !== undefined ? Math.max(0, now - shownAt) : null,
                ...(votes ? { votes: true } : {}),
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
        ...(peers ? { peers: peers(player) } : {}),
      };
    };
  }

  /**
   * Peers (docs/design/peers.md): what a wall would show, on each device,
   * and what the room's opener needs to start, fix and remove.
   */
  private peersViews(): (player: string) => PeersView {
    const game = this.game!;
    const meta = this.meta!;
    const run = game.run!;
    const present = this.connectedPlayers();
    const showQ = run.current >= 0 && (run.phase === "question" || run.phase === "reveal");
    const q = showQ ? game.quiz.questions[run.current] : null;
    const pics = showQ ? this.answerPics(run.current) : undefined;
    const host = G.playerById(run, run.peers!.host);
    const shared = {
      title: game.quiz.title,
      code: meta.code,
      hostAvatar: host && !host.removed ? host.avatar : null,
      players: G.activePlayers(run).map((p) => ({ id: p.id, avatar: p.avatar, away: !present.has(p.id) })),
      waitingFor: G.waitingFor(game, present),
      last: G.lastQuestion(game),
      ...(run.phase === "lobby" ? this.peersAhead() : {}),
      question: q
        ? {
            text: q.text,
            image: this.imageRef(this.shownImage(run.current)),
            background: this.imageRef(q.background || game.quiz.background),
            ...(pics ? { pics } : {}),
          }
        : null,
      dist: run.phase === "reveal" ? this.onScreen(run.current, G.distribution(game, run.current)) : null,
      winners: run.phase === "reveal" ? G.winners(game, run.current) : [],
      ranking: run.phase === "reveal" || run.phase === "final" ? this.ranking() : null,
    };
    return (player: string): PeersView => ({ ...shared, player, host: player === run.peers!.host, ready: G.isReady(game, player) });
  }

  /**
   * In a Peers lobby, what a device fetches ahead so no question waits on a
   * picture: the packs (`peersPacks`, in the player view) and where their
   * pictures sit, and one by one only what no pack carries (an answer
   * picture without a small copy, a picture stored without its size).
   */
  private peersAhead(): Pick<PeersView, "pictures" | "inPacks"> {
    const record = this.quizRecord!;
    const { inPacks } = this.peersPacks();
    const packed = new Set(inPacks.map((x) => x.src));
    for (const info of Object.values(record.images)) if (info.small) packed.add(this.imageSrc(record, info.n));
    const pictures = this.allPictures().filter((src) => !packed.has(src));
    return { ...(pictures.length > 0 ? { pictures } : {}), ...(inPacks.length > 0 ? { inPacks } : {}) };
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
        const last = this.sentToPoller.get(w.session.player);
        if (last && last.poll === pollKey(view)) continue;
        this.sentToPoller.set(w.session.player, sent(view));
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

/** What a polling device was last sent: the view's key, its pollKey, its version. */
type Sent = { key: string; poll: string; v: number };

function sent(view: PlayerView): Sent {
  return { key: viewKey(view), poll: pollKey(view), v: view.v };
}

/**
 * What ends a held poll: the view without who is in and who a Peers room
 * waits for (docs/design/hosting-and-limits.md, "What a Peers room costs").
 * Those change with every friend's answer, look and line; a poll answered
 * for each would cost a Function and a Durable Object request per device
 * and answer. They come with the poll's end instead, at most POLL_HOLD_MS
 * late; the room's steps and the device's own changes end it at once. In a
 * room someone steers it is the view's key.
 */
function pollKey(view: PlayerView): string {
  if (!view.peers) return viewKey(view);
  return viewKey({ ...view, peers: { ...view.peers, players: [], waitingFor: [] } });
}

/** Where a device's line is kept in the run: a player by id, a teacher's tab by its role; a guest's isn't. */
function lineKey(s: Session): string | null {
  if (s.role === "player") return `p:${s.player}`;
  if (s.role === "screen" || s.role === "remote") return s.role;
  return null;
}

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

/** The upload's "fixes" field (JSON text), or null when it isn't there or isn't JSON; G.applyFixes checks the rest. */
function readFixes(field: unknown): unknown {
  if (typeof field !== "string") return null;
  try {
    return JSON.parse(field);
  } catch {
    return null;
  }
}
