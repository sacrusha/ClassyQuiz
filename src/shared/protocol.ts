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
// Projector ("screen", the wall) or the Remote (the steering tab). Each role
// is held by one tab at a time, named by a token the tab keeps for its
// lifetime (sessionStorage). A teacher role takes the teacher code, the class
// code plus two digits (docs/after-upload.md §4), or the quiz's secret.

import type { Answering, Avatar, Phase } from "../server/game.ts";
import type { Problem } from "../quiz/format.ts";
import type { SiteFull } from "./limits.ts";
import type { Tempo } from "./tempo.ts";

export type { Answering, Avatar, Phase, Problem, Tempo };

export type RoleName = "screen" | "remote";

export type Auth =
  | { role: "screen"; token: string }
  | { role: "remote"; token: string }
  /**
   * run: the class the token belongs to. fresh: the page was just opened
   * and hasn't shown that class. A page still showing an earlier class is
   * told it has finished; a page opened anew with an earlier class's token
   * (the tablet was switched off between lessons) joins as a newcomer.
   */
  | { role: "player"; token: string; run?: string; fresh?: boolean }
  | { role: "guest" };

/** The state a flow command was given in. */
export interface At {
  phase: Phase | "idle";
  current: number;
  /**
   * The class was reading the question, its answers not yet shown (countdown
   * tempos). Go and Reveal share a phase, so a doubled Go must not land as a
   * Reveal. Absent: not compared (the picture's zoom; older pages).
   */
  reading?: boolean;
  /**
   * The votes were on the wall, the key not yet (v2 item 6). The votes and
   * the reveal are steps within one phase too: a doubled press must not show
   * the key. Absent: not compared.
   */
  votes?: boolean;
}

export type Command =
  // steering: the Remote, or the Projector while no Remote is there
  | { op: "begin"; at: At }
  /** How the class answered goes on the wall, without the key; answering closes. The reveal follows. */
  | { op: "votes"; at: At }
  /** The key: from the votes, or straight from the question (a page from before the votes step). */
  | { op: "reveal"; at: At }
  | { op: "next"; at: At }
  | { op: "ranking"; at: At }
  | { op: "finish"; at: At }
  | { op: "skipCurrent"; at: At }
  /** Countdown tempos: the answers appear and the clock starts. */
  | { op: "go"; at: At }
  /** The answers stay open, or open again after time's up, without a clock. */
  | { op: "stopClock"; at: At }
  /** The class's tempo, in the lobby or for the questions to come. */
  | { op: "tempo"; tempo: Tempo }
  /** The teacher's −5/+5 (by: −5 or 5): the countdown on now, or the next one, and every one after. */
  | { op: "nudge"; by: number }
  /** A new class with the same code, from the final ranking; `at` makes a resend harmless. */
  | { op: "again"; at: At }
  | { op: "setCounts"; q: number; counts: boolean[] }
  | { op: "setVoid"; q: number; value: boolean }
  | { op: "setSkip"; q: number; value: boolean }
  /** Keep the question's picture off the projector (a wrong or revealing crop). */
  | { op: "setHidePicture"; q: number; value: boolean }
  /** The picture of the question on screen fills the projector, or goes back; also from the Projector itself. */
  | { op: "zoom"; value: boolean; at: At }
  | { op: "remove"; player: string }
  | { op: "endInstance" }
  // the Projector: the clicker or keyboard's next usual step, at any time
  | { op: "advance"; at: At }
  /** Projector or Remote, while both tabs are there: the wall becomes the steering tab and the steering tab the wall. */
  | { op: "swap" }
  /** Projector or Remote: give the role up. */
  | { op: "leave" }
  /** Any tab: send me my current view (presence changes with time, not with events). */
  | { op: "tick" }
  // a guest
  /**
   * teacher: the teacher code's last two digits. secret: the quiz's, kept by
   * the uploading device (Resume); it needs no digits and isn't limited.
   */
  | { op: "takeRole"; role: RoleName; teacher?: string; secret?: string }
  | { op: "newPlayer" }
  | { op: "claim"; player: string }
  // a player
  /**
   * v: the version of the view the tap was made on; a tap made before the
   * device showed answering closed counts. ms: how long after the answers
   * appeared on this device it was tapped (points for speed).
   */
  | { op: "answer"; q: number; choice: number; seq: number; v: number; ms?: number }
  /** In the lobby: the child's look, whole (shared/looks.ts); the latest one sent counts. */
  | { op: "dress"; b: number; h: number };

export type ClientMessage = { t: "hello"; auth: Auth } | { t: "cmd"; id: string; cmd: Command };

/**
 * What a teacher device that comes in with the teacher code does
 * (docs/after-upload.md §4):
 * - ask: one tab does both (the wall steers itself): "Show the quiz here, or
 *   steer it from here?";
 * - screen / remote: that role is free, or its tab is gone: it takes it
 *   without asking. "screen" also when nothing is there: it does both;
 * - full: a wall and a steering tab are both there; a present tab is never
 *   pushed aside.
 */
export type Entry = "ask" | "screen" | "remote" | "full";

/** Whether a role is held, and by a tab that is there. */
export type Presence = "none" | "present" | "away";

export type ServerMessage =
  | { t: "state"; view: View }
  | { t: "ack"; id: string; ok: boolean; error?: string; result?: unknown }
  /** A guest became a player; it keeps the token to come back. */
  | { t: "welcome"; player: string; token: string; run: string }
  /** This tab holds a role now (taken, handed to it when its Projector moved to another tab, or swapped). */
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
      /** For a teacher device with the teacher code: what taking a role would do. */
      entry: Entry;
      /**
       * The tab came with a player token that isn't this class's player: of
       * an earlier class, or an avatar another device took back. Without
       * it, a choice reaching a tab that is a player now is out of date (an
       * answer to a poll it made as a guest) and ignored.
       */
      stale?: boolean;
    }
  /** The quiz is gone (ended, expired), or this tablet's class has finished. */
  | { t: "gone"; reason: string }
  /** The account's daily allowance is spent: nothing can be stored until it comes back (shared/limits.ts). */
  | { t: "quota" };

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

/**
 * An answer picture on a student's device: a slice of one of the packs the
 * view names (`packs`), `l` bytes from `o`, of `type`, `w`×`h` pixels.
 */
export interface PackPic {
  p: number;
  o: number;
  l: number;
  type: string;
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
  /** In the order on screen; "" for a picture answer. */
  answers: string[];
  /** Pictures as answers (v3 item 1), in the order on screen, null for a text answer; absent when the question has none. */
  pics?: (ImageRef | null)[];
  image: ImageRef | null;
  /** Behind the question: its own background, else the quiz's. */
  background: ImageRef | null;
  /** Reading: the tiles keep their place, their text hidden until Go. */
  answering: Answering;
  clock: ClockView | null;
}

/**
 * A running countdown, or one whose time is up (leftMs 0). Device clocks
 * aren't synchronised: a device runs it from when the view arrived, so it
 * ends a moment after the server's, never before.
 */
export interface ClockView {
  ms: number;
  /** What was left when the view was made. */
  leftMs: number;
}

export interface RevealView {
  counts: boolean[];
  dist: number[];
  void: boolean;
  /**
   * The players whose answer counts, in the lobby's order: they jump on the
   * wall (backlog v4 item 9). Follows a fix of the key; empty for a void
   * question. Absent from a server from before.
   */
  winners?: string[];
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
  /** Points for speed: scores aren't "right out of so many". */
  speed: boolean;
}

export interface ScreenView {
  role: "screen";
  v: number;
  title: string;
  code: string;
  /** The teacher code's two digits after the class code: a second device types both (docs/after-upload.md §4). */
  teacher: string;
  /** The quiz's background (a question's own is in `question`). */
  background: ImageRef | null;
  /** Every picture the projector may show, to fetch ahead (in the lobby) so no question waits on one. */
  pictures: string[];
  /** The question's picture fills the screen. */
  zoom: boolean;
  tempo: Tempo;
  phase: Phase | "idle";
  current: number;
  players: { id: string; avatar: Avatar }[];
  answered: number;
  /**
   * Who has answered the open question, in the order the answers arrived:
   * each avatar pops in on the wall as its answer lands (v2 item 7). Only
   * those who answered; nobody is shown as missing.
   */
  answeredBy: { id: string; avatar: Avatar }[];
  /** "answered of n": the players whose device is there, or who have answered; away devices don't count. */
  of: number;
  question: QuestionView | null;
  /** The votes on the wall, in screen order, before the key (v2 item 6); null otherwise. */
  votes: number[] | null;
  reveal: RevealView | null;
  ranking: RankingView | null;
  remote: Presence;
  /** While no Remote is there, the Projector steers: what the Remote would see. */
  steer: TeacherView | null;
}

export interface TeacherQuestion {
  text: string;
  /** Also when hidden, so the teacher can show it again. */
  image: ImageRef | null;
  /** Fixed: the picture stays off the projector. */
  pictureHidden: boolean;
  /** What the class sees behind it: its own background, else the quiz's. */
  background: ImageRef | null;
  /** image: a picture answer's (v3 item 1); null for one whose file was left out. */
  answers: { text: string; counts: boolean; marked: boolean; image?: ImageRef | null }[];
  void: boolean;
  skip: boolean;
  status: "upcoming" | "current" | "revealed" | "skipped";
  /** Its countdown in seconds, should the class play with one: as written, moved by the teacher's −5/+5. */
  seconds: number;
}

export interface TeacherView {
  role: "teacher";
  v: number;
  id: string;
  title: string;
  code: string;
  /** The teacher code's two digits after the class code. */
  teacher: string;
  background: ImageRef | null;
  warnings: Problem[];
  questions: TeacherQuestion[];
  phase: Phase | "idle";
  current: number;
  screen: Presence;
  remote: Presence;
  /** The question's picture fills the projector. */
  zoom: boolean;
  /** The teacher's choice in the lobby, else the quiz's "Tempo:", else the teacher's pace. */
  tempo: Tempo;
  /** The quiz gives its own lengths ("Time:" lines). */
  timed: boolean;
  /** Seconds the teacher's −5/+5 moved the lengths by; 0: as written. */
  adjust: number;
  /** The length the −5/+5 pair shows and acts on: the countdown running, or the next to start; null: no pair. */
  countdown: number | null;
  /** The tempo the open question came up under (a change applies from the next one); null between questions. */
  playing: Tempo | null;
  /** The open question: being read, open, or closed until the reveal; null between questions. */
  answering: Answering | null;
  /** The open question's votes are on the wall, its key not yet: the next step is the reveal. */
  votes: boolean;
  clock: ClockView | null;
  run: null | {
    n: number;
    total: number;
    /** answered: the open question (who the class waits for is the teacher's to see, not the wall's). */
    players: { id: string; avatar: Avatar; connected: boolean; score: number; answered: boolean }[];
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
  /**
   * The answer pictures' small copies, in packs (v3 item 1): fetched once,
   * as soon as a view names them, so they are on the device before Go.
   * Absent when the quiz has no picture answers.
   */
  packs?: string[];
  /**
   * answers: empty while the class reads the question (countdown tempos).
   * sinceMs: how long the answers had been showing when the view was made;
   * the device adds its own time to it for the points for speed.
   */
  question: {
    q: number;
    n: number;
    total: number;
    answers: string[];
    /** Pictures as answers, in the order on screen, null for a text answer; absent when the question has none. */
    pics?: (PackPic | null)[];
    mine: number | null;
    answering: Answering;
    clock: ClockView | null;
    sinceMs: number | null;
    /** The votes are on the wall: answering is closed, look up. */
    votes?: boolean;
  } | null;
  /** points: what the answer scored, with points for speed; null otherwise. */
  reveal: { counts: boolean[]; mine: number | null; void: boolean; points: number | null } | null;
}

export type View = ScreenView | TeacherView | PlayerView;

/**
 * What a view shows, as a string to compare: without its version and the
 * fields that only say how much time passed (a student's view is sent again
 * only when what it shows changes).
 */
export function viewKey(view: View): string {
  return JSON.stringify(view, (k, val) => (k === "v" || k === "leftMs" || k === "sinceMs" ? undefined : val));
}

export const JOIN_CODE = /^\d{5}$/;
/** The teacher code: the class code and two digits, typed in the same box (docs/after-upload.md §4). */
export const TEACHER_CODE = /^\d{7}$/;
/** Said to a device whose teacher code's last two digits are wrong. */
export const WRONG_TEACHER_CODE = "That isn't this quiz's teacher code.";
/** Said to a device after too many wrong teacher codes. */
export const TOO_MANY_CODES = "Too many wrong codes for this quiz. Try again in a few minutes.";
export const MAX_QUIZ_BYTES = 200_000;

// Pictures (decisions.md, "Pictures in the archive"). The browser redraws each
// one at upload to at most IMAGE_LONG_SIDE (BACKGROUND_LONG_SIDE) pixels; the server checks the rest.
// A Durable Object value holds at most 2 MB.
export const IMAGE_LONG_SIDE = 1600;
/** A background fills the projector, 1920 pixels wide at most. */
export const BACKGROUND_LONG_SIDE = 1920;
export const MAX_IMAGE_BYTES = 1_500_000;
/** Pictures per quiz, answers' included (v3 item 1: 15 questions with four picture answers are 60). */
export const MAX_IMAGES = 120;
/**
 * A picture only used as an answer: a tile on the wall is at most half the
 * screen across, or a row of it for a wide strip.
 */
export const ANSWER_LONG_SIDE = 1200;
/**
 * An answer picture's second copy, for the students' devices (v3 item 1):
 * small, since every tablet of the class loads all of them in the lobby.
 */
export const SMALL_LONG_SIDE = 640;
export const MAX_SMALL_BYTES = 300_000;
/** The small copies travel in packs of at most this size, one request per pack and device. */
export const PACK_BYTES = 1_500_000;
/** The whole upload with its pictures, as multipart/form-data. */
export const MAX_UPLOAD_BYTES = 16_000_000;

/**
 * Answer to POST /api/quiz. On success: the quiz's code and the teacher
 * code's two digits, the secret this device keeps to delete it, and the
 * Projector token for the tab that pasted it. `missingImages`: pictures the quiz names that didn't come with it.
 * `error`: the site couldn't take it (full, or out of its daily allowance),
 * for the teacher, not a problem with the quiz to hand back to the AI.
 */
export type UploadResult =
  | { ok: true; id: string; secret: string; code: string; teacher: string; token: string }
  | { ok: false; errors: Problem[]; warnings: Problem[]; missingImages?: string[]; error?: string; full?: SiteFull };

/** Answer to POST /api/i/:id/info, for the device that pasted the quiz. */
export interface QuizInfo {
  title: string;
  code: string;
  /** The teacher code's two digits: Resume goes in with them, and another device types them. */
  teacher: string;
  /**
   * Where the quiz stands, for the resume line (v4 item 2): the class's
   * phase ("lobby": waiting for the class; "final": finished), and the
   * question on screen as n of total among those not skipped (n 0 before
   * the first).
   */
  stands: { phase: Phase | "idle"; n: number; total: number };
  /** When the quiz closes unless used before. */
  closes: number;
}
