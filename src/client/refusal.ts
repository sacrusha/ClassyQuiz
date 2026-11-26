import { quotaResetAt } from "../shared/limits.ts";
import { esc } from "./dom.ts";
import { TEXT } from "./landing-text.ts";
import type { RoomResult } from "./opening.ts";
import { fullWords, lang, said } from "./room-text.ts";

/** r null: the site couldn't be reached. The quiz's own problems stay English: they are for the AI. */
export function roomRefusal(r: RoomResult | null): string {
  const t = TEXT[lang];
  const box = (head: string, more = "") => `<div class="open-problem" lang="${lang}"><p class="err">${esc(head)}</p>${more}</div>`;
  const ownCopy = `<p><a href="/own-copy">${esc(t.ownCopyLink)}</a></p>`;
  if (!r || r.json === false) return box(t.offline, `<p><a href="/check#it">${esc(t.whatToTellIt)}</a></p>`);
  if (r.ok) return "";
  // A refusal that isn't about the quiz may come without errors.
  if ((r.errors?.length ?? 0) > 0) return box(t.quizHead, `<ul lang="en">${r.errors.map((e) => `<li>${esc(e.message)}</li>`).join("")}</ul>`);
  if (r.quota) return box(t.quota(quotaResetAt()), ownCopy);
  if (r.full) return box(t.siteFull(r.full, quotaResetAt()), ownCopy);
  // A Peers room refused for want of room comes as the server's sentence alone.
  const full = r.error ? fullWords(r.error) : null;
  if (full) return box(full, ownCopy);
  return box(r.error ? said(r.error) : t.notTaken);
}
