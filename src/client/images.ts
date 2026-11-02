// Pictures at upload (docs/decisions.md, "Pictures in the archive"): the
// quiz's Image: lines are matched with the files in the .zip, each picture is
// redrawn on a canvas, and the quiz goes up with them.
//
// Redrawing does three things at once. It drops everything a photo carries
// besides the picture (camera, time, GPS: "nothing identified"); it shrinks a
// phone photo to what a projector shows (a class's devices load it over school
// Wi-Fi); and it leaves the server only PNG and JPEG to take, so no SVG, with
// the scripts it may hold, is ever served. Pictures are flattened onto white:
// a transparent line drawing would vanish on a dark screen.
//
// Kept apart from the upload page so whichever page takes the quiz can call
// prepareImages() and uploadQuiz().

import { imageKey, parseQuiz, pictureRefs, type PictureRef, type Problem } from "../quiz/format.ts";
import { BACKGROUND_LONG_SIDE, IMAGE_LONG_SIDE, MAX_IMAGE_BYTES, MAX_QUIZ_BYTES, MAX_UPLOAD_BYTES, type UploadResult } from "../shared/protocol.ts";
import { api, readApi } from "./net.ts";
import type { ZipEntry } from "./unzip.ts";

export interface PreparedImage {
  /** The name as the quiz writes it; the server matches it the same way. */
  name: string;
  blob: Blob;
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
  if (parsed.ok) {
    for (const ref of pictureRefs(parsed.quiz)) if (!wanted.has(imageKey(ref.name))) wanted.set(imageKey(ref.name), ref);
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
  for (const [key, { name, label, kind }] of wanted) {
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
        const blob = await redraw(new Blob([raw], { type: TYPES[ext] ?? "" }), ext, kind === "background" ? BACKGROUND_LONG_SIDE : IMAGE_LONG_SIDE);
        images.push({ name, blob });
      } catch {
        const hint = /\.hei[cf]$/i.test(entries[0].name) ? " HEIC pictures from iPhones can't be read by most browsers; PNG or JPEG work everywhere." : " PNG or JPEG work everywhere.";
        problems.push({ message: `${label}, which this browser can't open.${hint}` });
      }
    }
    progress?.(++done, wanted.size);
  }
  return { images, problems };
}

/** The picture redrawn: at most `longSide` pixels on its long side, on white, as PNG or JPEG. */
async function redraw(blob: Blob, ext: string, longSide: number): Promise<Blob> {
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
    const g = canvas.getContext("2d");
    if (!g) throw new Error("no canvas");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.imageSmoothingQuality = "high";
    g.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (KEEP_AS_PNG.test(`.${ext}`)) {
      const png = await encode(canvas, "image/png");
      if (png.size <= PNG_KEEP_BYTES) return png;
    }
    for (const quality of [0.85, 0.7, 0.5]) {
      const jpg = await encode(canvas, "image/jpeg", quality);
      if (jpg.size <= MAX_IMAGE_BYTES) return jpg;
    }
    throw new Error("too large");
  } finally {
    URL.revokeObjectURL(url);
  }
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
export async function uploadQuiz(text: string, images: PreparedImage[], leaveOut: boolean): Promise<UploadResult & { error?: string }> {
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
  });
  const size = images.reduce((s, im) => s + im.blob.size, new Blob([text]).size);
  if (size > MAX_UPLOAD_BYTES || new Blob([text]).size > MAX_QUIZ_BYTES) {
    return { ok: false, errors: [{ message: `The quiz with its pictures is larger than the site takes (${Math.round(MAX_UPLOAD_BYTES / 1e6)} MB).` }], warnings: [] };
  }
  const res = await fetch("/api/quiz", { method: "POST", body: form });
  // Out of the site's daily allowance, `error` says so and when it comes back.
  const r = await readApi<UploadResult>(res);
  if (r.json === false) return { ok: false, errors: [], warnings: [], error: "The site couldn't take the quiz. Try again." };
  return r;
}
