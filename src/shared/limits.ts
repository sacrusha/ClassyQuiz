// The free plan's shape, and what the site says when it runs out
// (docs/design/hosting-and-limits.md, "Protecting the day's allowance"). Cloudflare's daily limits are
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
 * public/own-copy.html say the site has "room for a few dozen classes a
 * day": the account's daily allowance covers about 30 classes when every
 * device polls and about 75 on stored rows (docs/design/hosting-and-limits.md, Situation),
 * below MAX_UPLOADS_PER_DAY. Raise these and that sentence no longer holds.
 */
const OWN_COPY = "Your AI can set up your own copy of the site: classyquiz.pages.dev/own-copy says how.";

/** Why a device can't join a class (server/game.ts); shown on it, in words its teacher can act on. */
export const CLASS_FULL = "This class is full. Ask your teacher.";
export const CLASS_STARTED = "This quiz has started and takes no more players. Ask your teacher.";

/**
 * Which site-wide cap refused an upload (server/budget.ts). They free up
 * differently: the uploads cap at 00:00 UTC, the bytes cap as quizzes end or
 * expire (two days after their last use), so each is said as it is.
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

/** The site-wide caps refuse an upload (owner's voice, from the self-hosting nudge). */
export function siteFullMessage(full: SiteFull, now = new Date()): string {
  if (full === "bytes") {
    return `The free site has no room for another quiz right now. It takes one again once others have ended or expired (two days after their last use). ${OWN_COPY}`;
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
 * isn't documented; this is a best reading, to check after a deploy
 * (docs/design/hosting-and-limits.md, "When the allowance runs out anyway"). Broad enough for "…free tier…", "…daily limit…", "quota".
 */
export function isQuotaError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  return /free[- ]tier|daily limit|quota/i.test(m);
}
