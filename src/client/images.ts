// Pictures at upload (docs/decisions.md, "Pictures in the archive"): the
// quiz's Image: lines are matched with the files in the .zip, each picture is
// redrawn on a canvas, and the quiz goes up with them.
//
// Redrawing does three things at once. It drops everything a photo carries
// besides the picture (camera, time, GPS: "nothing identified"); it shrinks a
// phone photo to what a projector shows (a class's devices load it over school
// Wi-Fi); and it leaves the server only PNG and JPEG to take, so no SVG, with
// the scripts it may hold, is ever served. A question's or an answer's
// picture keeps its transparency as PNG. The screens show a question's
// picture on white, so a transparent line drawing doesn't vanish on a dark
// page; an answer's picture sits on its tile's colour, which shows through
// wherever it is transparent (the creator's choice). Backgrounds are
// flattened onto white, and so is a transparent picture too large as PNG.
//
// Kept apart from the upload page so whichever page takes the quiz can call
// prepareImages() and uploadQuiz().

import { imageKey, parseQuiz, pictureRefs, type PictureRef, type Problem } from "../quiz/format.ts";
import {
  ANSWER_LONG_SIDE,
  BACKGROUND_LONG_SIDE,
  IMAGE_LONG_SIDE,
  MAX_IMAGE_BYTES,
  MAX_QUIZ_BYTES,
  MAX_SMALL_BYTES,
  MAX_UPLOAD_BYTES,
  SMALL_LONG_SIDE,
  type UploadResult,
} from "../shared/protocol.ts";
import { api, readApi } from "./net.ts";
import type { ZipEntry } from "./unzip.ts";

export interface PreparedImage {
  /** The name as the quiz writes it; the server matches it the same way. */
  name: string;
  blob: Blob;
  /** An answer picture's small copy, for the students' devices (v3 item 1). */
  small?: Blob;
}

export interface PreparedImages {
  images: PreparedImage[];
  /**
   * Pictures the quiz names that can't go up: not in the archive, no
   * archive at all, or not readable by this browser. Each is worded for the
   * teacher to paste to the AI; the teacher may also run without them.
   */
  problems: Problem[];
}

/** Below this a PNG stays a PNG (crisp lines); above it a JPEG is smaller. */
const PNG_KEEP_BYTES = 500_000;
const KEEP_AS_PNG = /\.(png|gif|bmp|svg)$/i;
const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
};

function isClutter(name: string): boolean {
  return /(^|\/)(__MACOSX|\.)/.test(name) || name.endsWith("/");
}

/**
 * The pictures the quiz text names (Image: and Background:), found in the archive (null: the quiz was
 * pasted) and redrawn. A quiz whose text has errors gets nothing here; the
 * server reports those.
 */
export async function prepareImages(text: string, archive: ZipEntry[] | null, progress?: (done: number, of: number) => void): Promise<PreparedImages> {
  const parsed = parseQuiz(text);
  // The first mention of each file names it in messages; the server matches every mention by the same key.
  const wanted = new Map<string, PictureRef>();
  // Every way a file is used: its size on the wall follows the largest use,
  // and an answer picture also gets a small copy for the devices.
  const uses = new Map<string, Set<PictureRef["kind"]>>();
  if (parsed.ok) {
    for (const ref of pictureRefs(parsed.quiz)) {
      const key = imageKey(ref.name);
      if (!wanted.has(key)) wanted.set(key, ref);
      uses.set(key, (uses.get(key) ?? new Set()).add(ref.kind));
    }
  }
  const images: PreparedImage[] = [];
  const problems: Problem[] = [];
  if (wanted.size === 0) return { images, problems };

  const inArchive = new Map<string, ZipEntry[]>();
  for (const e of archive ?? []) {
    if (isClutter(e.name)) continue;
    const key = imageKey(e.name);
    inArchive.set(key, [...(inArchive.get(key) ?? []), e]);
  }
  const archivePictures = [...inArchive.values()].map((es) => es[0].name.replace(/^.*\//, "")).filter((n) => (n.match(/\.(\w+)$/)?.[1].toLowerCase() ?? "") in TYPES);

  let done = 0;
  progress?.(done, wanted.size);
  for (const [key, { name, label }] of wanted) {
    const used = uses.get(key)!;
    const longSide = used.has("background") ? BACKGROUND_LONG_SIDE : used.has("image") ? IMAGE_LONG_SIDE : ANSWER_LONG_SIDE;
    // Only a background is flattened: a question's or an answer's picture keeps its transparency.
    const keepAlpha = used.has("image") || used.has("answer");
    const entries = inArchive.get(key) ?? [];
    if (archive === null) {
      problems.push({ message: `${label}. Pictures come as files in a .zip, together with the quiz text; a pasted quiz can't carry them.` });
    } else if (entries.length === 0) {
      const has = archivePictures.length > 0 ? ` The pictures in the .zip are: ${archivePictures.join(", ")}.` : " The .zip holds no pictures.";
      problems.push({ message: `${label}, which isn't in the .zip.${has}` });
    } else if (entries.length > 1) {
      problems.push({ message: `${label}, and the .zip has more than one file of that name: ${entries.map((e) => e.name).join(", ")}.` });
    } else {
      try {
        const raw = await entries[0].read();
        const ext = (entries[0].name.match(/\.(\w+)$/)?.[1] ?? "").toLowerCase();
        const file = new Blob([raw], { type: TYPES[ext] ?? "" });
        const blob = await redraw(file, ext, longSide, keepAlpha, MAX_IMAGE_BYTES);
        // Without its small copy an answer still works: the devices show its colour and shape.
        const small = used.has("answer") ? await redraw(file, ext, SMALL_LONG_SIDE, true, MAX_SMALL_BYTES).catch(() => undefined) : undefined;
        images.push({ name, blob, ...(small ? { small } : {}) });
      } catch {
        const hint = /\.hei[cf]$/i.test(entries[0].name) ? " HEIC pictures from iPhones can't be read by most browsers; PNG or JPEG work everywhere." : " PNG or JPEG work everywhere.";
        problems.push({ message: `${label}, which this browser can't open.${hint}` });
      }
    }
    progress?.(++done, wanted.size);
  }
  return { images, problems };
}

/** The picture redrawn: at most `longSide` pixels on its long side and `maxBytes`, as PNG (transparency kept when `keepAlpha`) or JPEG on white. */
async function redraw(blob: Blob, ext: string, longSide: number, keepAlpha: boolean, maxBytes: number): Promise<Blob> {
  if (ext === "svg") blob = await sizedSvg(blob, longSide);
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const w0 = img.naturalWidth;
    const h0 = img.naturalHeight;
    if (!w0 || !h0) throw new Error("no size");
    const scale = Math.min(1, longSide / Math.max(w0, h0));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w0 * scale));
    canvas.height = Math.max(1, Math.round(h0 * scale));
    const g = canvas.getContext("2d", { willReadFrequently: true });
    if (!g) throw new Error("no canvas");
    g.imageSmoothingQuality = "high";
    g.drawImage(img, 0, 0, canvas.width, canvas.height);
    // A question's picture keeps its transparency (answers as pictures, v3,
    // need it; the screens put every picture on white). A background, and a
    // transparent picture too large as PNG, are flattened onto white for JPEG.
    if (keepAlpha && hasTransparency(g, canvas.width, canvas.height)) {
      const png = await encode(canvas, "image/png");
      if (png.size <= maxBytes) return png;
    }
    g.globalCompositeOperation = "destination-over";
    g.fillStyle = "#fff";
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.globalCompositeOperation = "source-over";
    if (KEEP_AS_PNG.test(`.${ext}`)) {
      const png = await encode(canvas, "image/png");
      if (png.size <= Math.min(PNG_KEEP_BYTES, maxBytes)) return png;
    }
    for (const quality of [0.85, 0.7, 0.5]) {
      const jpg = await encode(canvas, "image/jpeg", quality);
      if (jpg.size <= maxBytes) return jpg;
    }
    throw new Error("too large");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function hasTransparency(g: CanvasRenderingContext2D, w: number, h: number): boolean {
  const d = g.getImageData(0, 0, w, h).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 255) return true;
  return false;
}

function encode(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), type, quality));
}

/**
 * An SVG drawn at the projector's size: vector pictures lose nothing by it.
 * Without width and height (only a viewBox, as AIs often write them) a
 * browser would give it no size or a tiny default one.
 */
async function sizedSvg(blob: Blob, longSide: number): Promise<Blob> {
  const doc = new DOMParser().parseFromString(await blob.text(), "image/svg+xml");
  const svg = doc.documentElement;
  if (svg.nodeName !== "svg") throw new Error("not an SVG");
  const box = (svg.getAttribute("viewBox") ?? "").split(/[\s,]+/).map(Number);
  let w = parseFloat(svg.getAttribute("width") ?? "");
  let h = parseFloat(svg.getAttribute("height") ?? "");
  if (/%/.test(svg.getAttribute("width") ?? "") || /%/.test(svg.getAttribute("height") ?? "")) w = h = NaN;
  if (!(w > 0 && h > 0) && box.length === 4 && box[2] > 0 && box[3] > 0) {
    w = box[2];
    h = box[3];
  }
  if (!(w > 0 && h > 0)) throw new Error("no size");
  const scale = longSide / Math.max(w, h);
  if (!svg.hasAttribute("viewBox")) svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("width", String(Math.round(w * scale)));
  svg.setAttribute("height", String(Math.round(h * scale)));
  return new Blob([new XMLSerializer().serializeToString(doc)], { type: "image/svg+xml" });
}

/**
 * Sends the quiz. Without pictures it goes as JSON, as it always did; with
 * them as multipart/form-data. `leaveOut`: the teacher chose to run without
 * the pictures that couldn't go up.
 */
/** `json: false`: the answer wasn't the site's (a school filter's page, say); `quota`: the daily allowance is spent. */
export async function uploadQuiz(text: string, images: PreparedImage[], leaveOut: boolean): Promise<UploadResult & { error?: string; json?: false; quota?: boolean }> {
  if (images.length === 0) {
    return (await api<UploadResult & { error?: string }>("/api/quiz", leaveOut ? { text, leaveOut: "missing" } : { text })).body;
  }
  const form = new FormData();
  form.append("text", text);
  if (leaveOut) form.append("leaveOut", "missing");
  // The name travels as a text field: a non-ASCII file name in a multipart
  // header is decoded differently from one runtime to the next.
  images.forEach((im, i) => {
    form.append("image", im.blob, `${i}`);
    form.append("imageName", im.name);
    if (im.small) {
      form.append("small", im.small, `s${i}`);
      form.append("smallName", im.name);
    }
  });
  const size = images.reduce((s, im) => s + im.blob.size + (im.small?.size ?? 0), new Blob([text]).size);
  if (size > MAX_UPLOAD_BYTES || new Blob([text]).size > MAX_QUIZ_BYTES) {
    return { ok: false, errors: [{ message: `The quiz with its pictures is larger than the site takes (${Math.round(MAX_UPLOAD_BYTES / 1e6)} MB).` }], warnings: [] };
  }
  const res = await fetch("/api/quiz", { method: "POST", body: form });
  // Out of the site's daily allowance, `error` says so and when it comes back.
  const r = await readApi<UploadResult>(res);
  if (r.json === false) return { ok: false, errors: [], warnings: [], error: "The site couldn't take the quiz. Try again.", json: false };
  return r;
}
