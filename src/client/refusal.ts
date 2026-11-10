// Why a room didn't open, on the local check under the entry's button
// (docs/design/local-check.md, "Opening a room"): the root page's messages,
// moved here with the upload.

import { quotaResetAt } from "../shared/limits.ts";
import { esc } from "./dom.ts";
import { TEXT } from "./landing-text.ts";
import type { RoomResult } from "./opening.ts";
import { lang, said } from "./room-text.ts";

/**
 * Why a room didn't open, as HTML: the quiz (the server's checks are the
 * last word), the site's day (with the way to more quizzes), or the network
 * (null: the site couldn't be reached), with what to tell IT. In the root
 * page's words, in this device's language; the quiz's own problems stay
 * English, as on the root page: they are for the AI.
 */
export function roomRefusal(r: RoomResult | null): string {
  const t = TEXT[lang];
  const box = (head: string, more = "") => `<div class="open-problem" lang="${lang}"><p class="err">${esc(head)}</p>${more}</div>`;
  const ownCopy = `<p><a href="/own-copy">${esc(t.ownCopyLink)}</a></p>`;
  if (!r || r.json === false) return box(t.offline, `<p><a href="/check#it">${esc(t.whatToTellIt)}</a></p>`);
  if (r.ok) return "";
  // A refusal that isn't about the quiz may come without errors (net.ts, readApi).
  if ((r.errors?.length ?? 0) > 0) return box(t.quizHead, `<ul lang="en">${r.errors.map((e) => `<li>${esc(e.message)}</li>`).join("")}</ul>`);
  if (r.quota) return box(t.quota(quotaResetAt()), ownCopy);
  if (r.full) return box(t.siteFull(r.full, quotaResetAt()), ownCopy);
  return box(r.error ? said(r.error) : t.notTaken);
}
