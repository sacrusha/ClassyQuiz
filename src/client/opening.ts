// Opening a quiz file (docs/design/local-check.md): the .zip is read and
// checked in this browser, by the parser and the picture checks the server
// runs at upload, so looking at a quiz, or playing it alone, costs the shared
// site nothing. Only opening a room uploads it, and the server checks it all
// again there: the browser isn't trusted.

import { imageKey, parseQuiz, type Problem, type Quiz } from "../quiz/format.ts";
import { matchImages, type StoredImage } from "../server/images.ts";
import * as G from "../server/game.ts";
import type { ImageRef } from "../shared/protocol.ts";
import { quotaResetAt } from "../shared/limits.ts";
import { esc, saveQuiz, savedQuizzes, store } from "./dom.ts";
import { recordUploadDay } from "./history.ts";
import { prepareImages, uploadQuiz, type PreparedImage } from "./images.ts";
import { LANG_KEY, TEXT, chosenLang, type Lang } from "./landing-text.ts";
import { own } from "./pictures.ts";
import type { ZipEntry } from "./unzip.ts";

/** A quiz as read from its .zip: the text and its pictures redrawn (client/images.ts), as they go up when a room opens. */
export interface QuizFiles {
  text: string;
  images: PreparedImage[];
  /** The person chose to go on without the pictures that couldn't be read. */
  leaveOut: boolean;
}

export type Reading =
  | { ok: true; files: QuizFiles }
  /** pictures: the problems are pictures that can't come along; the person may go on without them (leaveOut). */
  | { ok: false; errors: Problem[]; pictures: boolean };

/**
 * The quiz text and the pictures it names, read from the archive, or what is
 * wrong, in the order a fix is worth making: the text first, then the
 * pictures (which the person may leave out), then the server's own picture
 * checks.
 */
export async function readQuiz(text: string, archive: ZipEntry[], leaveOut: boolean, progress?: (done: number, of: number) => void): Promise<Reading> {
  const parsed = parseQuiz(text);
  if (!parsed.ok) return { ok: false, errors: parsed.errors, pictures: false };
  const prepared = await prepareImages(text, archive, progress);
  if (prepared.problems.length > 0 && !leaveOut) return { ok: false, errors: prepared.problems, pictures: true };
  const files = { text, images: prepared.images, leaveOut };
  const checked = await check(files);
  return checked.ok ? { ok: true, files } : { ok: false, errors: checked.errors, pictures: false };
}

/** What the server will make of these files at upload: the same parse and the same picture matching. */
async function check(files: QuizFiles): Promise<{ ok: true; quiz: Quiz; warnings: Problem[]; index: Record<string, StoredImage> } | { ok: false; errors: Problem[] }> {
  const r = parseQuiz(files.text);
  if (!r.ok) return { ok: false, errors: r.errors };
  const uploaded = await Promise.all(files.images.map(async (im) => ({ name: im.name, bytes: new Uint8Array(await im.blob.arrayBuffer()) })));
  // Takes the pictures left out off the quiz, with a warning each, as the server does.
  const m = matchImages(r.quiz, uploaded, files.leaveOut);
  if (!m.ok) return { ok: false, errors: m.errors };
  return { ok: true, quiz: r.quiz, warnings: [...r.warnings, ...m.warnings], index: m.index };
}

/**
 * The quiz open on the local check, as an entry receives it
 * (client/entries.ts). Nothing of it has gone to the site.
 */
export interface OpenedQuiz {
  /** What goes up when a room opens: the server parses the text again. */
  files: QuizFiles;
  /** As it will run: the pictures left out are off it. Questions and answers in the text's order (no shuffle yet). */
  quiz: Quiz;
  /** The parser's and the pictures' warnings, as the lobby would list them. */
  warnings: Problem[];
  /**
   * The fixes made on the check, one per question in the text's order
   * (server/game.ts, Fix: which choices count, void, skip, hidePicture).
   * Kept up to date while the check is open; they go up with the room.
   */
  fixes: G.Fix[];
  /** A picture the quiz names (an Image:, Background: or picture choice), as a blob URL on this page with its size; null for none or one left out. */
  picture(name: string): ImageRef | null;
}

/** The files opened for the check: checked as the server will, with the pictures as blob URLs on this page. */
export async function openQuiz(files: QuizFiles): Promise<{ ok: true; quiz: OpenedQuiz } | { ok: false; errors: Problem[] }> {
  const c = await check(files);
  if (!c.ok) return c;
  const urls = new Map<string, string>();
  for (const im of files.images) {
    const key = imageKey(im.name);
    if (urls.has(key)) continue;
    const url = URL.createObjectURL(im.blob);
    own(url);
    urls.set(key, url);
  }
  const picture = (name: string): ImageRef | null => {
    if (!name) return null;
    const key = imageKey(name);
    const info = c.index[key];
    const src = urls.get(key);
    return info && src ? { src, w: info.w, h: info.h } : null;
  };
  return { ok: true, quiz: { files, quiz: c.quiz, warnings: c.warnings, fixes: G.newGame(c.quiz).fixes, picture } };
}

export type RoomResult = Awaited<ReturnType<typeof uploadQuiz>>;

/**
 * Opening a room: the upload, with the check's fixes and how it will play
 * (`mode`). Fails by throwing when the site can't be reached. On success
 * the device keeps the quiz to come back to (the root page's resume card)
 * and counts the day.
 */
export async function openRoom(q: OpenedQuiz, mode?: "peers"): Promise<RoomResult> {
  const r = await uploadQuiz(q.files.text, q.files.images, q.files.leaveOut, q.fixes, mode);
  if (!r.ok) return r;
  // One quiz that hasn't started per device: the previous room ends if it
  // never started (docs/design/hosting-and-limits.md, "Running classes
  // finish"). keepalive: it outlives the page's change that follows.
  const previous = savedQuizzes()[0];
  if (previous && previous.id !== r.id) {
    void fetch(`/api/i/${previous.id}/replaced`, { method: "POST", keepalive: true, headers: { "content-type": "application/json" }, body: JSON.stringify({ secret: previous.secret }) }).catch(() => {});
  }
  saveQuiz({ id: r.id, secret: r.secret, code: r.code, teacher: r.teacher, title: "", at: Date.now() });
  recordUploadDay();
  return r;
}

/**
 * The language the root page speaks on this device (landing-text.ts,
 * chosenLang): a room's refusals and the line before them are the root
 * page's messages, moved to the check, so they speak its language; the
 * check's own words are not translated yet (docs/design/local-check.md,
 * "Opening a room").
 */
export function visitorLang(): Lang {
  return chosenLang(store.get<string>(LANG_KEY), navigator.languages ?? [navigator.language]);
}

/**
 * Why a room didn't open, as HTML: the quiz (the server's checks are the
 * last word), the site's day (with the way to more quizzes), or the network
 * (null: the site couldn't be reached), with what to tell IT. In the root
 * page's words and language (visitorLang); the quiz's own problems are not
 * translated, as on the root page.
 */
export function roomRefusal(r: RoomResult | null): string {
  const lang = visitorLang();
  const t = TEXT[lang];
  const box = (head: string, more = "") => `<div class="open-problem" lang="${lang}"><p class="err">${esc(head)}</p>${more}</div>`;
  const ownCopy = `<p><a href="/own-copy">${esc(t.ownCopyLink)}</a></p>`;
  if (!r || r.json === false) return box(t.offline, `<p><a href="/check#it">${esc(t.whatToTellIt)}</a></p>`);
  if (r.ok) return "";
  // A refusal that isn't about the quiz may come without errors (net.ts, readApi).
  if ((r.errors?.length ?? 0) > 0) return box(t.quizHead, `<ul lang="en">${r.errors.map((e) => `<li>${esc(e.message)}</li>`).join("")}</ul>`);
  if (r.quota) return box(t.quota(quotaResetAt()), ownCopy);
  if (r.full) return box(t.siteFull(r.full, quotaResetAt()), ownCopy);
  return box(r.error ?? t.notTaken);
}
