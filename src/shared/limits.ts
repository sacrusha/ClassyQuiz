// The free plan's shape, and what the site says when it runs out
// (docs/decisions.md, "Hardening"). Cloudflare's daily limits are
// account-wide: one class that spends them spends them for every class on the
// site. A self-hoster raises any of these.

/**
 * Players in one class, removed ones included: the run is one stored value,
 * rewritten with every answer, and the projector draws every avatar. The
 * owner's design target is a class of about 25; a larger group is what an
 * own copy of the site is for.
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
/** Changes of mind per student and question; the last accepted tap counts. */
export const MAX_ANSWER_CHANGES = 10;
/** Uploads a day, across the site. */
export const MAX_UPLOADS_PER_DAY = 300;
/** Bytes of quizzes and their pictures stored at once, across the site (the account holds 5 GB in all). */
export const MAX_LIVE_BYTES = 1_000_000_000;
/** A class ends by itself this long after the teacher's last step: the lesson is over, its devices stop costing. */
export const CLASS_IDLE_MS = 3 * 3600_000;
/** A device whose view hasn't changed for this long goes to sleep; a tap wakes it. */
export const SLEEP_AFTER_MS = 45 * 60_000;

/**
 * The self-hosting nudge (backlog items 14, 16). The start page and
 * public/own-copy.html say the site serves "a few dozen classes a day in
 * all": the account's daily allowance covers about 30 classes when every
 * device polls and about 75 on stored rows (decisions.md, "Hardening"),
 * below MAX_UPLOADS_PER_DAY. Raise these and that sentence no longer holds.
 */
const OWN_COPY = "Your AI can set up your own copy of the site: classyquiz.pages.dev/own-copy says how.";

/** Why a device can't join a class (server/game.ts); shown on it, in words its teacher can act on. */
export const CLASS_FULL = "This class is full. Ask your teacher.";
export const CLASS_STARTED = "This quiz has started and takes no more players. Ask your teacher.";

/** The site-wide caps refuse an upload (owner's voice, from the self-hosting nudge). */
export const SITE_FULL = `The free site is full for today. ${OWN_COPY}`;

/** Cloudflare's daily allowance is used up; it comes back at 00:00 UTC, said in Swiss time. */
export function quotaMessage(now = new Date()): string {
  let at = "midnight UTC";
  try {
    const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    at = `${reset.toLocaleTimeString("de-CH", { timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit" })} Swiss time`;
  } catch {
    /* no time zone data: say it in UTC */
  }
  return `The free site has used up today's allowance. It works again at ${at}. ${OWN_COPY}`;
}

/**
 * An error from the platform saying a free-plan limit is spent. The wording
 * isn't documented; this is a best reading, to check after a deploy
 * (decisions.md). Broad enough for "…free tier…", "…daily limit…", "quota".
 */
export function isQuotaError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  return /free[- ]tier|daily limit|quota/i.test(m);
}
