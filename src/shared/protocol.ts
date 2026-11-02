// What travels between the browser and the quiz instance. The same messages go
// over a WebSocket or, when a school network breaks WebSockets, over plain
// HTTP long-polling (docs/decisions.md, "Transport").
//
// The server sends each tab a complete view of what it should show, never a
// diff, so a tab that slept or lost its connection just draws the newest
// view. Commands are safe to send twice: flow commands name the state they
// were given in and are ignored when it has moved on; answers carry a sequence
// number; fixes set a value rather than toggle one.
//
// Roles (docs/user-flow.md §1): one code per quiz. A tab with the code is a
// guest until it plays (a player) or takes one of the two teacher roles, the
// Projector ("screen") or the Remote. Each role is held by one tab at a time,
// named by a token the tab keeps for its lifetime (sessionStorage).

import type { Avatar, Phase } from "../server/game.ts";
import type { Problem } from "../quiz/format.ts";

export type { Avatar, Phase, Problem };

export type RoleName = "screen" | "remote";

export type Auth =
  | { role: "screen"; token: string }
  | { role: "remote"; token: string }
  /** run: the class the token belongs to; a tablet of an earlier class is told it has finished. */
  | { role: "player"; token: string; run?: string }
  | { role: "guest" };

/** The state a flow command was given in. */
export interface At {
  phase: Phase | "idle";
  current: number;
}

export type Command =
  // steering: the Remote, or the Projector while no Remote is there
  | { op: "begin"; at: At }
  | { op: "reveal"; at: At }
  | { op: "next"; at: At }
  | { op: "ranking"; at: At }
  | { op: "finish"; at: At }
  | { op: "skipCurrent"; at: At }
  /** A new class with the same code, from the final ranking; `at` makes a resend harmless. */
  | { op: "again"; at: At }
  | { op: "setCounts"; q: number; counts: boolean[] }
  | { op: "setVoid"; q: number; value: boolean }
  | { op: "setSkip"; q: number; value: boolean }
  | { op: "remove"; player: string }
  | { op: "endInstance" }
  // the Projector: the clicker or keyboard's next usual step, at any time
  | { op: "advance"; at: At }
  /** Projector: take the steering back from the Remote (the screen in the room). */
  | { op: "steerHere" }
  /** Remote: this tab becomes the Projector that steers itself. */
  | { op: "projectorHere" }
  /** Projector or Remote: give the role up. */
  | { op: "leave" }
  /** Any tab: send me my current view (presence changes with time, not with events). */
  | { op: "tick" }
  // a guest
  | { op: "takeRole"; role: RoleName }
  | { op: "newPlayer" }
  | { op: "claim"; player: string }
  // a player
  /** v: the version of the view the tap was made on; a tap made before the device showed the reveal counts. */
  | { op: "answer"; q: number; choice: number; seq: number; v: number };

export type ClientMessage = { t: "hello"; auth: Auth } | { t: "cmd"; id: string; cmd: Command };

/**
 * How a role looks to a guest choosing what its tab is:
 * - free: nobody holds it, or its tab has been gone about a minute;
 * - taken: a tab holds it;
 * - quiet: a tab holds it but hasn't been heard from for a while; free soon;
 * - movable (Projector only): held by a Projector that steers itself; taking
 *   it turns that tab into the Remote;
 * - closed: free, but the class has students, and taking it would steer the
 *   quiz (decisions.md: no new tab gets the steering once students are in).
 */
export type ChoiceState = "free" | "taken" | "quiet" | "movable" | "closed";

/** Whether a role is held, and by a tab that is there. */
export type Presence = "none" | "present" | "away";

export type ServerMessage =
  | { t: "state"; view: View }
  | { t: "ack"; id: string; ok: boolean; error?: string; result?: unknown }
  /** A guest became a player; it keeps the token to come back. */
  | { t: "welcome"; player: string; token: string; run: string }
  /** This tab holds a role now (taken, or handed to it when its Projector moved to another tab). */
  | { t: "role"; role: RoleName; token: string }
  /** The role this tab held went to another tab. */
  | { t: "lost"; role: RoleName }
  /**
   * To a guest: the quiz's title, and what it can be. `avatars`: players whose
   * devices are away, once the quiz is under way; a student whose tablet died
   * picks theirs back.
   */
  | {
      t: "choose";
      title: string;
      phase: Phase | "idle";
      avatars: { id: string; avatar: Avatar }[];
      screen: ChoiceState;
      remote: ChoiceState;
    }
  /** The quiz is gone (ended, expired), or this tablet's class has finished. */
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
  code: string;
  /** The quiz's background (a question's own is in `question`). */
  background: ImageRef | null;
  phase: Phase | "idle";
  current: number;
  players: { id: string; avatar: Avatar }[];
  answered: number;
  question: QuestionView | null;
  reveal: RevealView | null;
  ranking: RankingView | null;
  remote: Presence;
  /** While no Remote is there, the Projector steers: what the Remote would see. */
  steer: TeacherView | null;
}

export interface TeacherQuestion {
  text: string;
  image: ImageRef | null;
  /** What the class sees behind it: its own background, else the quiz's. */
  background: ImageRef | null;
  answers: { text: string; counts: boolean; marked: boolean }[];
  void: boolean;
  skip: boolean;
  status: "upcoming" | "current" | "revealed" | "skipped";
}

export interface TeacherView {
  role: "teacher";
  v: number;
  id: string;
  title: string;
  code: string;
  background: ImageRef | null;
  warnings: Problem[];
  questions: TeacherQuestion[];
  phase: Phase | "idle";
  current: number;
  screen: Presence;
  remote: Presence;
  run: null | {
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

export const JOIN_CODE = /^\d{5}$/;
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

/**
 * Answer to POST /api/quiz. On success: the quiz's code, the secret this
 * device keeps to delete it, and the Projector token for the tab that pasted
 * it. `missingImages`: pictures the quiz names that didn't come with it.
 */
export type UploadResult =
  | { ok: true; id: string; secret: string; code: string; token: string }
  | { ok: false; errors: Problem[]; warnings: Problem[]; missingImages?: string[] };

/** Answer to POST /api/i/:id/info, for the device that pasted the quiz. */
export interface QuizInfo {
  title: string;
  code: string;
  /** When the quiz closes unless used before. */
  closes: number;
}
