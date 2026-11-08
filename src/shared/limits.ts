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
 * Changes of mind per student and question, so three successive answers: a
 * mis-tap and one rethink. The last accepted tap counts. Kept low so that
 * what a class can write at most is small enough to book in full
 * (docs/design/hosting-and-limits.md, "Running classes finish").
 */
export const MAX_ANSWER_CHANGES = 2;
/**
 * Uploads a day, across the site. The "room for a few dozen classes a day" on
 * the start page and in public/own-copy.html holds only while the caps here
 * (this one, MAX_PLAYERS, MAX_ANSWER_CHANGES) stay as they are: the arithmetic
 * is in docs/design/hosting-and-limits.md, Situation. A self-hoster who
 * changes them makes that sentence untrue.
 */
export const MAX_UPLOADS_PER_DAY = 300;
/**
 * Rows a day the classes may book (docs/design/hosting-and-limits.md, "Running
 * classes finish"): the Free plan writes 100,000 a day across the account;
 * the rest is for uploads (the quiz and each picture are rows), the site's
 * small objects and what a booking doesn't cover. Back at 00:00 UTC.
 */
export const DAY_ROWS_FOR_CLASSES = 80_000;
/**
 * The check warns that the site is nearly full when fewer classes than this
 * still fit today (this one included), with the way to more quizzes; a day
 * whose bookings reached NEARLY_FULL of DAY_ROWS_FOR_CLASSES counts as busy
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
const OWN_COPY = "For more quizzes, a site of your own or your school's: classyquiz.pages.dev/own-copy says how.";

/** Why a device can't join a class (server/game.ts); shown on it, in words its teacher can act on. */
export const CLASS_FULL = "This class is full. Ask your teacher.";
/** A student device before the teacher let the class in: it waits, and joins by itself once they do. */
export const CLASS_WAITING = "Your teacher lets the class in in a moment.";
export const CLASS_STARTED = "This quiz has started and takes no more players. Ask your teacher.";
/** The same in a Peers room, where nobody is a teacher (docs/design/peers.md). */
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
  return `The free site can't take more classes today: the ones running now use what is left. It takes new ones again at ${at ? `${at} Swiss time` : "00:00 UTC"}. ${OWN_COPY}`;
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
