// The .zip is checked in this browser by the parser and the picture checks
// the server runs at upload, so looking at a quiz, or playing it alone,
// costs the shared site nothing. The server checks it all again at upload.

import { imageKey, parseQuiz, type Problem, type Quiz } from "../quiz/format.ts";
import { matchImages, type StoredImage } from "../server/images.ts";
import * as G from "../server/game.ts";
import type { ImageRef } from "../shared/protocol.ts";
import { saveQuiz, savedQuizzes } from "./dom.ts";
import { recordUploadDay } from "./history.ts";
import { prepareImages, uploadQuiz, type PreparedImage } from "./images.ts";
import { own } from "./pictures.ts";
import type { ZipEntry } from "./unzip.ts";

export interface QuizFiles {
  text: string;
  images: PreparedImage[];
  /** The person chose to go on without the pictures that couldn't be read. */
  leaveOut: boolean;
}

export type Reading =
  | { ok: true; files: QuizFiles }
  /** pictures: the problems are pictures that can't come along, which the person may leave out. */
  | { ok: false; errors: Problem[]; pictures: boolean };

/** Problems come in the order a fix is worth making: the text, then the pictures, then the server's own picture checks. */
export async function readQuiz(text: string, archive: ZipEntry[], leaveOut: boolean, progress?: (done: number, of: number) => void): Promise<Reading> {
  const parsed = parseQuiz(text);
  if (!parsed.ok) return { ok: false, errors: parsed.errors, pictures: false };
  const prepared = await prepareImages(text, archive, progress);
  if (prepared.problems.length > 0 && !leaveOut) return { ok: false, errors: prepared.problems, pictures: true };
  const files = { text, images: prepared.images, leaveOut };
  const checked = await check(files);
  return checked.ok ? { ok: true, files } : { ok: false, errors: checked.errors, pictures: false };
}

/** The same parse and picture matching as the server's at upload. */
async function check(files: QuizFiles): Promise<{ ok: true; quiz: Quiz; warnings: Problem[]; index: Record<string, StoredImage> } | { ok: false; errors: Problem[] }> {
  const r = parseQuiz(files.text);
  if (!r.ok) return { ok: false, errors: r.errors };
  const uploaded = await Promise.all(files.images.map(async (im) => ({ name: im.name, bytes: new Uint8Array(await im.blob.arrayBuffer()) })));
  const m = matchImages(r.quiz, uploaded, files.leaveOut);
  if (!m.ok) return { ok: false, errors: m.errors };
  return { ok: true, quiz: r.quiz, warnings: [...r.warnings, ...m.warnings], index: m.index };
}

export interface OpenedQuiz {
  files: QuizFiles;
  /** The pictures left out are off it; questions and answers in the text's order. */
  quiz: Quiz;
  warnings: Problem[];
  /** One per question in the text's order; kept up to date while the check is open, and they go up with the room. */
  fixes: G.Fix[];
  /** A blob URL on this page with its size; null for none or one left out. */
  picture(name: string): ImageRef | null;
}

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

/** Throws when the site can't be reached. */
export async function openRoom(q: OpenedQuiz, mode?: "peers"): Promise<RoomResult> {
  const r = await uploadQuiz(q.files.text, q.files.images, q.files.leaveOut, q.fixes, mode);
  if (!r.ok) return r;
  // One quiz that hasn't started per device: the previous room ends if it
  // never started. keepalive: it outlives the page's change that follows.
  const previous = savedQuizzes()[0];
  if (previous && previous.id !== r.id) {
    void fetch(`/api/i/${previous.id}/replaced`, { method: "POST", keepalive: true, headers: { "content-type": "application/json" }, body: JSON.stringify({ secret: previous.secret }) }).catch(() => {});
  }
  saveQuiz({ id: r.id, secret: r.secret, code: r.code, teacher: r.teacher, title: "", at: Date.now() });
  recordUploadDay();
  return r;
}
