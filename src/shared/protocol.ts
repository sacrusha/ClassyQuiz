// What travels between the browser and the quiz instance. The same messages go
// over a WebSocket or, when a school network breaks WebSockets, over plain
// HTTP long-polling (docs/design/connections.md, "Transport: WebSocket first, long-polling when the network breaks it").
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
// code plus two digits (docs/design/teacher-devices.md, "One entry: the teacher code"), or the quiz's secret.

import type { Answering, Avatar, Phase } from "../server/game.ts";
import type { Problem } from "../quiz/format.ts";
import type { SiteFull } from "./limits.ts";

export type { Answering, Avatar, Phase, Problem };

export type RoleName = "screen" | "remote";

export type Auth =
  | { role: "screen"; token: string }
  | { role: "remote"; token: string }
  | { role: "player"; token: string }
  | { role: "guest" };

/** The state a flow command was given in. */
export interface At {
  phase: Phase | "idle";
  current: number;
  /**
   * The class was reading the question, its answers hidden. Showing them,
   * Last call, the lock-in and the reveal share a phase, so a press sent
   * twice must not take two steps. Absent: not compared (the picture's zoom).
   */
  reading?: boolean;
  /** Answering was locked in, the spread on the wall and the key not yet. Absent: not compared. */
  votes?: boolean;
  /** Last call was running. Absent: not compared. */
  lastCall?: boolean;
}

export type Command =
  // steering: the Remote, or the Projector while no Remote is there
  | { op: "begin"; at: At }
  /** "Let the class in": student devices can join from now on (teacher devices any time). */
  | { op: "letIn" }
  /**
   * Play, the steering bar's step: one slice on from `at`. Show answers,
   * Lock in, Reveal, Ranking, Next; the final ranking after the last
   * question's reveal.
   */
  | { op: "play"; at: At }
  /** Last call: the answers shown if they weren't, and LAST_CALL_MS later answering locks in by itself. */
  | { op: "lastCall"; at: At }
  /** Points for speed on or off, in the lobby (the join screen's switch). */
  | { op: "speed"; value: boolean }
  | { op: "finish"; at: At }
  | { op: "skipCurrent"; at: At }
  | { op: "setCounts"; q: number; counts: boolean[] }
  | { op: "setVoid"; q: number; value: boolean }
  | { op: "setSkip"; q: number; value: boolean }
  /** Keep the question's picture off the projector (a wrong or revealing crop). */
  | { op: "setHidePicture"; q: number; value: boolean }
  /** The picture of the question on screen fills the projector, or goes back; also from the Projector itself. */
  | { op: "zoom"; value: boolean; at: At }
  | { op: "remove"; player: string }
  | { op: "endInstance" }
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
  /** In the lobby: the child's look, whole (shared/looks.ts); the latest one sent counts. t absent: no tool. */
  | { op: "dress"; b: number; h: number; t?: number }
  /** Peers: done with question q's solution; the next comes once everyone present is (docs/design/peers.md). */
  | { op: "ready"; q: number }
  /**
   * Peers, the player who opened the room: on without waiting for the
   * others (the solution now, or the next question). The same player also
   * sends begin, finish, setCounts, setVoid, remove and endInstance.
   */
  | { op: "goOn"; at: At };

export type ClientMessage = { t: "hello"; auth: Auth } | { t: "cmd"; id: string; cmd: Command };

/**
 * The result of a tap's acknowledgement: what is stored for this player
 * and question now, the choice in the order on screen; null for nothing.
 * Whether this tap was taken or not, the tablet shows this as its accepted
 * answer, the same record that scores (docs/design/question-flow.md, "When a tap counts").
 */
export interface AnswerAck {
  q: number;
  record: { choice: number; seq: number } | null;
}

/**
 * What a teacher device that comes in with the teacher code does
 * (docs/design/teacher-devices.md, "A second device: one question, only when needed"):
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
  | { t: "welcome"; player: string; token: string }
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
      /** The teacher hasn't let the class in yet: a student device waits, and joins once this is gone. */
      waiting?: true;
      /**
       * The tab came with a player token that isn't this class's player:
       * an avatar another device took back. Without
       * it, a choice reaching a tab that is a player now is out of date (an
       * answer to a poll it made as a guest) and ignored.
       */
      stale?: boolean;
    }
  /** The quiz is gone (ended, expired). home: the teacher ended it, and the device goes to the root page. */
  | { t: "gone"; reason: string; home?: boolean }
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
  /** Pictures as answers, in the order on screen, null for a text answer; absent when the question has none. */
  pics?: (ImageRef | null)[];
  image: ImageRef | null;
  /** Behind the question: its own background, else the quiz's. */
  background: ImageRef | null;
  /** Reading: the tiles keep their place, their text hidden until the answers are shown. */
  answering: Answering;
  clock: ClockView | null;
}

/**
 * Last call while it runs. Device clocks aren't synchronised: a device runs
 * it from when the view arrived, so it ends a moment after the server's,
 * never before.
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
   * wall. Follows a fix of the key; empty for a void question.
   */
  winners: string[];
}

export interface RankingView {
  /** The top few: places 1 to 3, at most ten avatars; id as in the players. */
  top: { id: string; avatar: Avatar; score: number; place: number }[];
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
  /** The teacher code's two digits after the class code: a second device types both (docs/design/teacher-devices.md, "One entry: the teacher code"). */
  teacher: string;
  /** The quiz's background (a question's own is in `question`). */
  background: ImageRef | null;
  /** Every picture the projector may show, to fetch ahead (in the lobby) so no question waits on one. */
  pictures: string[];
  /** The question's picture fills the screen. */
  zoom: boolean;
  phase: Phase | "idle";
  current: number;
  /** In the lobby, the class not let in yet: the wall shows no code. */
  waiting: boolean;
  players: { id: string; avatar: Avatar }[];
  answered: number;
  /**
   * Who has answered the open question, in the order the answers arrived:
   * each avatar pops in on the wall as its answer lands. Only those who
   * answered; nobody is shown as missing.
   */
  answeredBy: { id: string; avatar: Avatar }[];
  /** "answered of n": the players whose device is there, or who have answered; away devices don't count. */
  of: number;
  question: QuestionView | null;
  /** The votes on the wall, in screen order, before the key; null otherwise. */
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
  /** image: a picture answer's; null for one whose file was left out. */
  answers: { text: string; counts: boolean; marked: boolean; image?: ImageRef | null }[];
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
  /** The teacher code's two digits after the class code. */
  teacher: string;
  background: ImageRef | null;
  warnings: Problem[];
  questions: TeacherQuestion[];
  phase: Phase | "idle";
  current: number;
  /** In the lobby, the class not let in yet: the steering screens offer "Let the class in". */
  waiting: boolean;
  /**
   * Before the class is let in: how many classes like this one still fit
   * today, as last heard; 0 when letting in was refused. null: not known, or
   * let in. Below ROOM_WARN the check warns, with the way to more quizzes.
   */
  room: number | null;
  screen: Presence;
  remote: Presence;
  /** The question's picture fills the projector. */
  zoom: boolean;
  /** Points for speed, the join screen's switch. */
  speed: boolean;
  /** The open question: its answers hidden, open, or locked in until the reveal; null between questions. */
  answering: Answering | null;
  /** The open question is locked in, its spread on the wall and its key not yet: the next step is the reveal. */
  votes: boolean;
  /** Last call, while it runs. */
  clock: ClockView | null;
  /** No question comes after the current one: its reveal is followed by the final ranking. */
  last: boolean;
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
   * The answer pictures' small copies, in packs: fetched once, as soon as a
   * view names them, so they are on the device before the answers are shown.
   * Absent when the quiz has no picture answers. In a Peers room, followed
   * by the bundles of the questions' pictures and backgrounds
   * (`PeersView.inPacks`), absent when there are neither.
   */
  packs?: string[];
  /**
   * answers: empty while the class reads the question, its answers hidden.
   * sinceMs: how long the answers had been showing when the view was made;
   * the device adds its own time to it for the points for speed. mine: the
   * stored answer, the one the tablet shows as accepted.
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
    /** Locked in, the spread on the wall: answering is closed, look up. */
    votes?: boolean;
  } | null;
  /** points: what the answer scored, with points for speed; null otherwise. */
  reveal: { counts: boolean[]; mine: number | null; void: boolean; points: number | null } | null;
  /** A room that runs on its own: what a wall would show, on each device. Absent in a room someone steers. */
  peers?: PeersView;
}

/**
 * Peers (docs/design/peers.md): there is no wall, so each device gets the
 * question itself, the code to join, who is in, the spread, the winners and
 * the ranking. Every list of answers is in the order on screen.
 */
export interface PeersView {
  /** This device's player, as in `players` and the ranking. */
  player?: string;
  title: string;
  /** The code friends join with, shown on the device of whoever opened the room. */
  code: string;
  /** This device's player opened the room: it starts, ends, fixes a solution, removes an avatar. */
  host: boolean;
  /** Who opened the room: the others' lobby says whose Start it waits for. */
  hostAvatar: Avatar | null;
  /** Everyone in, in the lobby's order; away: not heard from for a while (it holds nobody up). */
  players: { id: string; avatar: Avatar; away: boolean }[];
  /** The players present that the room waits for: to answer, or to be done with the solution. */
  waitingFor: string[];
  /** This player is done with the open question's solution. */
  ready: boolean;
  /** No question comes after the open one: the final ranking does. */
  last: boolean;
  /**
   * In the lobby, what to fetch ahead: the player view's `packs` carry the
   * answer pictures' small copies and the questions' pictures and
   * backgrounds, which sit in them as `inPacks` says, under the address the
   * views name them by; `pictures`, one by one, what no pack carries.
   */
  pictures?: string[];
  inPacks?: { src: string; pic: PackPic }[];
  /** The open question, as the device lays it out. */
  question: { text: string; image: ImageRef | null; background: ImageRef | null; pics?: (ImageRef | null)[] } | null;
  /** With the solution: how many picked each answer, and who got it right (they jump). */
  dist: number[] | null;
  winners: string[];
  ranking: RankingView | null;
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
/** The teacher code: the class code and two digits, typed in the same box (docs/design/teacher-devices.md, "One entry: the teacher code"). */
export const TEACHER_CODE = /^\d{7}$/;
/** Said to a device whose teacher code's last two digits are wrong. */
export const WRONG_TEACHER_CODE = "The last two digits don't match this quiz.";
/** Said to a device after too many wrong teacher codes. */
export const TOO_MANY_CODES = "Too many wrong codes for this quiz. Try again in a few minutes.";
export const MAX_QUIZ_BYTES = 200_000;

// Pictures (docs/design/pictures.md, "At upload"). The browser redraws each
// one at upload to at most IMAGE_LONG_SIDE (BACKGROUND_LONG_SIDE) pixels; the server checks the rest.
// A Durable Object value holds at most 2 MB.
export const IMAGE_LONG_SIDE = 1600;
/** A background fills the projector, 1920 pixels wide at most. */
export const BACKGROUND_LONG_SIDE = 1920;
export const MAX_IMAGE_BYTES = 1_500_000;
/** Pictures per quiz, answers' included: 15 questions with four picture answers are 60. */
export const MAX_IMAGES = 120;
/**
 * A picture only used as an answer: a tile on the wall is at most half the
 * screen across, or a row of it for a wide strip.
 */
export const ANSWER_LONG_SIDE = 1200;
/**
 * An answer picture's second copy, for the students' devices: small, since
 * every tablet of the class loads all of them in the lobby.
 */
export const SMALL_LONG_SIDE = 640;
export const MAX_SMALL_BYTES = 300_000;
/** The small copies travel in packs of at most this size, one request per pack and device. */
export const PACK_BYTES = 1_500_000;
/** The whole upload with its pictures, as multipart/form-data. */
export const MAX_UPLOAD_BYTES = 16_000_000;

/**
 * Answer to POST /api/quiz. On success: the quiz's code and the teacher
 * code's two digits, the secret this device keeps to come back to it, and the
 * Projector token for the tab that pasted it. `missingImages`: pictures the quiz names that didn't come with it.
 * `error`: the site couldn't take it (full, or out of its daily allowance),
 * for the teacher, not a problem with the quiz to hand back to the AI.
 */
export type UploadResult =
  /** player: Peers, the token of the player who opened the room (this device); there is no Projector then. */
  | { ok: true; id: string; secret: string; code: string; teacher: string; token: string; player?: string }
  | { ok: false; errors: Problem[]; warnings: Problem[]; missingImages?: string[]; error?: string; full?: SiteFull };

/** Answer to POST /api/i/:id/info, for the device that pasted the quiz. */
export interface QuizInfo {
  title: string;
  code: string;
  /** The teacher code's two digits: Resume goes in with them, and another device types them. */
  teacher: string;
  /**
   * Where the quiz stands, for the resume line (docs/design/root-page.md,
   * "Coming back: the resume card"): the class's phase ("lobby": waiting for the class; "final": finished), and the
   * question on screen as n of total among those not skipped (n 0 before
   * the first).
   */
  stands: { phase: Phase | "idle"; n: number; total: number };
  /** A Peers room: the device comes back as its player, not as a teacher device. */
  peers?: true;
}
