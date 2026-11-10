// The free plan's shape, and what the site says when it runs out
// (docs/design/hosting-and-limits.md, "Protecting the day's allowance"). Cloudflare's daily limits are
// account-wide: one class that spends them spends them for every class on the
// site. A self-hoster raises any of these.

/**
 * Players in one class, removed ones included: the run is one stored value,
 * rewritten with every answer, and the projector draws every avatar. The
 * design target is a class of about 25; a larger group is what an own copy
 * of the site is for.
 */
export const MAX_PLAYERS = 60;
/**
 * After the start the door stays open while the class is still arriving:
 * this long, and through the first question however long it is up
 * (server/game.ts, `doorOpen`). Slow tablets in a class get in.
 */
export const DOOR_OPEN_MS = 5 * 60_000;
/** New players once the quiz is under way (past DOOR_OPEN_MS and the first question): a latecomer gets in, a stream of strangers with the code doesn't. */
export const MAX_LATE_JOINERS = 5;
/**
 * Changes of mind per student and question; the last accepted tap counts.
 * Answers are held in memory and written with the teacher's steps
 * (docs/design/open-period-in-memory.md), so a change costs no row: the cap
 * is a generous backstop, never met by a child answering, and not part of
 * what a class books.
 */
export const MAX_ANSWER_CHANGES = 10;
/**
 * Writes of the run per stage (the lobby, each question) because a
 * player's line ended (a socket closed, a held poll ran out) while the
 * server held their input unwritten: that input would be lost if the
 * instance then lost its memory before the stage's own write. Beyond these
 * the input waits for that write. Counted for the whole class, so a class
 * books them per stage, not per player (server/rows.ts).
 */
export const MAX_LINE_WRITES = 10;
/**
 * A line's end is written this long after it, unless the line is back by
 * then (a poller polling again, a new socket keeping the copy); one write
 * for every line that ended in between.
 */
export const LINE_WRITE_MS = 1000;
/**
 * A player device sends its latest tap (an answer, a look) at most this
 * often and one at a time; taps in between are merged into the latest. A
 * child hammering a button on long-poll would otherwise cost a Function and
 * a Durable Object request per tap, which no server-side cap can save.
 */
export const INPUT_GAP_MS = 300;
/**
 * Uploads a day, across the site. The "room for a few dozen classes a day" on
 * the start page and in public/own-copy.html holds only while the caps here
 * (this one, MAX_PLAYERS, MAX_LINE_WRITES) stay as they are: the arithmetic
 * is in docs/design/hosting-and-limits.md, Situation. A self-hoster who
 * changes them makes that sentence untrue.
 */
export const MAX_UPLOADS_PER_DAY = 300;
/**
 * What a class spends of the day's allowances that a class can run out of
 * mid-lesson (docs/design/hosting-and-limits.md, Situation, "What a class
 * costs"): rows written, Durable Object requests (a class's Function requests
 * are about the same), and seconds its object is kept awake (duration, at
 * about 0.128 GB-s a second).
 */
export interface Cost {
  rows: number;
  requests: number;
  awakeS: number;
}

/**
 * What the classes may book of each allowance a day (docs/design/hosting-and-limits.md,
 * "Running classes finish"); letting a class in is refused past it, with no
 * child in yet. The Free plan's day is 100,000 rows, 100,000 requests and
 * 13,000 GB-s (about 101,000 awake seconds), account-wide, back at 00:00 UTC.
 * What is left over is for what no class books (uploads, whose quiz and each
 * picture are rows; picture fetches, joins and the landing's requests; the
 * site's small objects) and for estimates that come out low: requests and
 * duration have no most a class can spend, so a class books an estimate.
 * Requests leave more over, since more of them come from outside a class.
 */
export const DAY_FOR_CLASSES: Cost = { rows: 80_000, requests: 75_000, awakeS: 80_000 };
/**
 * How far a class may reach when its first student comes after its booking
 * lapsed (LOBBY_WAIT_MS): the children are at the tablets then, so refusing
 * them costs more than refusing the teacher at letting in, and less than a
 * class under way failing. Past this the join is refused.
 */
export const DAY_FOR_JOINS: Cost = { rows: 90_000, requests: 87_000, awakeS: 92_000 };
/**
 * A let-in lobby that no student has joined holds its booking this long
 * (docs/design/hosting-and-limits.md, "Running classes finish"). Plausible
 * assumption: a teacher lets the class in when it is there or about to come
 * in, within a break's length (Swiss breaks run 5 to 20 minutes); a lobby
 * still empty after that is a look at the room, or a teacher who let in
 * early, whose first student books again (DAY_FOR_JOINS).
 */
export const LOBBY_WAIT_MS = 20 * 60_000;
/**
 * The check warns that the site is nearly full when fewer classes than this
 * still fit today (this one included), with the way to more quizzes; a day
 * whose bookings reached NEARLY_FULL of DAY_FOR_CLASSES (in any allowance) counts as busy
 * on the landing's line beside the full days (docs/design/hosting-and-limits.md,
 * "Running classes finish").
 */
export const ROOM_WARN = 3;
/** The owner: lower than 80%, half for now. */
export const NEARLY_FULL = 0.5;
/** Bytes of quizzes and their pictures stored at once, across the site (the account holds 5 GB in all). */
export const MAX_LIVE_BYTES = 1_000_000_000;
/** A device whose view hasn't changed for this long goes to sleep; a tap wakes it. */
export const SLEEP_AFTER_MS = 45 * 60_000;

/** The self-hosting nudge, appended to every refusal. */
const OWN_COPY = "For more quizzes, a site of your own, your school's or your company's: classyquiz.pages.dev/own-copy says how.";

/**
 * Why a device can't join (server/game.ts); shown on it. Whoever runs the
 * quiz is in the room and can act on it; the words name no role, so they fit
 * a class and any other crowd (docs/design/teacher-devices.md, "Words for
 * any crowd"). The pages match these strings: a change reaches a page open
 * during a deploy only once it reloads.
 */
export const CLASS_FULL = "This quiz is full. Ask whoever runs it.";
/** A player's device before the players are let in: it waits, and joins by itself once they are. */
export const CLASS_WAITING = "Joining opens in a moment.";
export const CLASS_STARTED = "This quiz has started and takes no more players. Ask whoever runs it.";
/** The same in a Peers room, where nobody runs it (docs/design/peers.md). */
export const ROOM_FULL = "This quiz is full: it takes no more players.";
export const ROOM_STARTED = "This quiz has started and takes no more players.";

/**
 * Which site-wide cap refused an upload (server/budget.ts). They free up
 * differently: the uploads cap at 00:00 UTC, the bytes cap as quizzes end or
 * expire (three hours after the teacher last used them), so each is said as it is.
 */
export type SiteFull = "uploads" | "bytes";

/** When Cloudflare's daily allowance comes back, 00:00 UTC, as Swiss time ("01:00"); null without time zone data. */
export function quotaResetAt(now = new Date()): string | null {
  try {
    const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    return reset.toLocaleTimeString("de-CH", { timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}

/** What the teacher is told when a site-wide cap refuses an upload; when it frees up depends on the cap. */
/** Letting a class in, refused: the day's rows are booked by the classes under way. */
export function classesFullMessage(now = new Date()): string {
  const at = quotaResetAt(now);
  return `The free site can't let another group in today: the quizzes under way use what is left. It takes new ones again at ${at ? `${at} Swiss time` : "00:00 UTC"}. ${OWN_COPY}`;
}

/** The same for a Peers room, refused as it opens: it is a quiz among friends, not a class. */
export function roomsFullMessage(now = new Date()): string {
  const at = quotaResetAt(now);
  return `The free site can't take more quizzes today: the ones running now use what is left. It takes new ones again at ${at ? `${at} Swiss time` : "00:00 UTC"}. ${OWN_COPY}`;
}

export function siteFullMessage(full: SiteFull, now = new Date()): string {
  if (full === "bytes") {
    return `The free site has no room for another quiz right now. It takes one again once others have ended or expired (three hours after their last use). ${OWN_COPY}`;
  }
  const at = quotaResetAt(now);
  return `The free site can't take more quizzes today. It takes new ones again at ${at ? `${at} Swiss time` : "00:00 UTC"}. ${OWN_COPY}`;
}

/** Cloudflare's daily allowance is used up; it comes back at 00:00 UTC, said in Swiss time. */
export function quotaMessage(now = new Date()): string {
  const at = quotaResetAt(now);
  return `The free site has used up today's allowance. It works again at ${at ? `${at} Swiss time` : "midnight UTC"}. ${OWN_COPY}`;
}

/**
 * An error from the platform saying a free-plan limit is spent. The wording
 * is undocumented, so the match is broad (docs/design/hosting-and-limits.md,
 * "Not known").
 */
export function isQuotaError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  return /free[- ]tier|daily limit|quota/i.test(m);
}
