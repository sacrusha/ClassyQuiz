// What travels between the browser and the quiz instance. The same messages go
// over a WebSocket or, when a school network breaks WebSockets, over plain
// HTTP long-polling (docs/decisions.md, "Transport").
//
// The server sends each device a complete view of what it should show, never
// a diff, so a device that slept or lost its connection just draws the newest
// view. Commands are safe to send twice: flow commands name the state they
// were given in and are ignored when it has moved on; answers carry a sequence
// number; fixes set a value rather than toggle one.

import type { Avatar, Phase } from "../server/game.ts";
import type { Problem } from "../quiz/format.ts";

export type { Avatar, Phase, Problem };

export type Auth =
  | { role: "teacher"; secret: string }
  | { role: "screen"; token: string }
  /** A projector window on the device that holds the teacher link. */
  | { role: "screen"; secret: string }
  | { role: "player"; token: string }
  | { role: "player"; join: true };

/** The state a flow command was given in. */
export interface At {
  phase: Phase | "idle";
  current: number;
}

export type Command =
  // teacher
  /** Only from no run or the final ranking; `at` makes a resend harmless. */
  | { op: "startRun"; at: At }
  | { op: "begin"; at: At }
  | { op: "reveal"; at: At }
  | { op: "next"; at: At }
  | { op: "ranking"; at: At }
  | { op: "finish"; at: At }
  | { op: "skipCurrent"; at: At }
  | { op: "setCounts"; q: number; counts: boolean[] }
  | { op: "setVoid"; q: number; value: boolean }
  | { op: "setSkip"; q: number; value: boolean }
  | { op: "remove"; player: string }
  /** Teacher, or the projector (a new phone for a teacher whose device died). */
  | { op: "pair"; code: string }
  | { op: "endInstance" }
  // projector (keyboard, presentation clicker): the next usual step
  | { op: "advance"; at: At }
  // student
  /** v: the version of the view the tap was made on; a tap made before the device showed the reveal counts. */
  | { op: "answer"; q: number; choice: number; seq: number; v: number }
  | { op: "claim"; player: string }
  | { op: "newPlayer" }
  /** A device without a player asks again whom it might be (avatars become "away" over time). */
  | { op: "choose" };

export type ClientMessage = { t: "hello"; auth: Auth } | { t: "cmd"; id: string; cmd: Command };

export type ServerMessage =
  | { t: "state"; view: View }
  | { t: "ack"; id: string; ok: boolean; error?: string; result?: unknown }
  /** A student device got its player; it keeps the token to come back. */
  | { t: "welcome"; player: string; token: string }
  /**
   * To a student device without a player: the avatars of players whose
   * devices are away (empty in the lobby). It picks one back or asks for a
   * new player.
   */
  | { t: "choose"; avatars: { id: string; avatar: Avatar }[] }
  /** The credentials don't open anything (wrong link, quiz ended or expired). */
  | { t: "gone"; reason: string };

/**
 * A picture that came with the quiz. `src` is fetched with GET; it holds a
 * secret that only views carry, and the response is never cached, so a
 * shared school laptop keeps nothing once the page is closed. `w`/`h` are
 * the file's pixel size, for the layout before it has loaded.
 */
export interface ImageRef {
  src: string;
  w: number;
  h: number;
}

export interface QuestionView {
  /** Index in the quiz. */
  q: number;
  /** Position among the questions shown, 1-based, and how many there are. */
  n: number;
  total: number;
  text: string;
  answers: string[];
  image: ImageRef | null;
  /** Behind the question: its own background, else the quiz's. */
  background: ImageRef | null;
}

export interface RevealView {
  counts: boolean[];
  dist: number[];
  void: boolean;
}

export interface RankingView {
  /** The top few: places 1 to 3, at most ten avatars. */
  top: { avatar: Avatar; score: number; place: number }[];
  /** Per scoring question, how many of the given answers were right. */
  perQuestion: { right: number; given: number }[];
  right: number;
  given: number;
  /** Questions that scored so far. */
  of: number;
  players: number;
}

export interface ScreenView {
  role: "screen";
  v: number;
  title: string;
  /** The quiz's background (a question's own is in `question`). */
  background: ImageRef | null;
  phase: Phase | "idle";
  current: number;
  code: string | null;
  players: { id: string; avatar: Avatar }[];
  answered: number;
  question: QuestionView | null;
  reveal: RevealView | null;
  ranking: RankingView | null;
}

export interface TeacherQuestion {
  text: string;
  image: ImageRef | null;
  /** What the class sees behind it: its own background, else the quiz's. */
  background: ImageRef | null;
  answers: { text: string; counts: boolean; marked: boolean }[];
  note: string;
  void: boolean;
  skip: boolean;
  status: "upcoming" | "current" | "revealed" | "skipped";
}

export interface TeacherView {
  role: "teacher";
  v: number;
  id: string;
  title: string;
  background: ImageRef | null;
  quizNote: string;
  warnings: Problem[];
  questions: TeacherQuestion[];
  expires: number;
  screens: number;
  phase: Phase | "idle";
  current: number;
  run: null | {
    code: string;
    n: number;
    total: number;
    players: { id: string; avatar: Avatar; connected: boolean; score: number }[];
    answered: number;
    dist: number[] | null;
    ranking: RankingView | null;
  };
}

export interface PlayerView {
  role: "player";
  v: number;
  phase: Phase | "idle";
  current: number;
  removed: boolean;
  me: { avatar: Avatar; score: number; place: number; of: number } | null;
  question: { q: number; n: number; total: number; answers: string[]; mine: number | null } | null;
  reveal: { counts: boolean[]; mine: number | null; void: boolean } | null;
}

export type View = ScreenView | TeacherView | PlayerView;

/** Grant handed to a device that showed a pairing code. */
export type Grant = { instance: string; role: "screen"; token: string } | { instance: string; role: "teacher"; secret: string };

export const JOIN_CODE = /^\d{5}$/;
export const PAIR_CODE = /^\d{6}$/;
export const MAX_QUIZ_BYTES = 200_000;

// Pictures (decisions.md, "Pictures in the archive"). The browser redraws each
// one at upload to at most IMAGE_LONG_SIDE (BACKGROUND_LONG_SIDE) pixels; the server checks the rest.
// A Durable Object value holds at most 2 MB.
export const IMAGE_LONG_SIDE = 1600;
/** A background fills the projector, 1920 pixels wide at most. */
export const BACKGROUND_LONG_SIDE = 1920;
export const MAX_IMAGE_BYTES = 1_500_000;
export const MAX_IMAGES = 60;
/** The whole upload with its pictures, as multipart/form-data. */
export const MAX_UPLOAD_BYTES = 16_000_000;

/** Answer to POST /api/quiz. `missingImages`: pictures the quiz names that didn't come with it. */
export type UploadResult =
  | { ok: true; id: string; secret: string }
  | { ok: false; errors: Problem[]; warnings: Problem[]; missingImages?: string[] };
