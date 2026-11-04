// Pictures that came with an uploaded quiz (docs/design/pictures.md,
// "At upload"). The teacher's browser has already redrawn each one as PNG or
// JPEG, which drops photo metadata and shrinks it; the server takes nothing
// else, and reads the size it needs for the layout from the file itself.

import { dropPicture, imageKey, pictureRefs, type Problem, type Quiz } from "../quiz/format.ts";
import { MAX_IMAGE_BYTES, MAX_IMAGES, MAX_SMALL_BYTES, PACK_BYTES } from "../shared/protocol.ts";

export type ImageType = "image/png" | "image/jpeg";

/** A picture as uploaded: the file name it came with, and its bytes. */
export interface UploadedImage {
  name: string;
  bytes: Uint8Array;
}

/** An answer picture's small copy, for the students' devices: `l` bytes from `o` in the pack stored as `pack:<p>`. */
export type SmallPart = ImageInfo & { p: number; o: number; l: number };

export type StoredImage = ImageInfo & { n: number; small?: SmallPart };

/**
 * Two answer pictures of one question whose proportions differ more than
 * this get a warning: drawn alike, they differ only in what the question asks.
 */
const ASPECT_SPREAD = 1.5;

/**
 * Pairs the quiz's Image: and Background: lines with the uploaded files by
 * `imageKey`. Files the quiz doesn't name are dropped; a picture used more
 * than once (by two questions, or as a picture and a background) is stored
 * once. With `leaveOutMissing` (the teacher chose to run without them), a
 * picture that didn't come is taken off the quiz with a warning.
 * `smalls`: the answer pictures' small copies for the students' devices (v3
 * item 1), by the same names; they go into packs of at most PACK_BYTES. An
 * answer picture without one shows on the devices as its colour and shape.
 * Returns the index for the quiz record and the files to store as `img:<n>`
 * and `pack:<p>`.
 */
export function matchImages(
  quiz: Quiz,
  images: UploadedImage[],
  leaveOutMissing: boolean,
  smalls: UploadedImage[] = [],
):
  | { ok: true; warnings: Problem[]; index: Record<string, StoredImage>; files: Record<string, Uint8Array>; packs: number }
  | { ok: false; errors: Problem[]; missing: string[] } {
  const byKey = new Map(images.map((f) => [imageKey(f.name), f]));
  const errors: Problem[] = [];
  const warnings: Problem[] = [];
  const missing: string[] = [];
  const index: Record<string, StoredImage> = {};
  const files: Record<string, Uint8Array> = {};
  let n = 0;
  for (const ref of pictureRefs(quiz)) {
    const key = imageKey(ref.name);
    if (index[key]) continue;
    const file = byKey.get(key);
    if (!file) {
      if (leaveOutMissing) {
        // Neutral wording: the browser also leaves out a picture it couldn't open.
        warnings.push({ message: ref.leftOut });
        dropPicture(quiz, ref);
      } else if (!missing.includes(ref.name)) {
        missing.push(ref.name);
        errors.push({
          message: `${ref.label}, which didn't come with the quiz. Pictures come as files in a .zip, together with the quiz text; a pasted quiz can't carry them.`,
        });
      }
      continue;
    }
    const info = file.bytes.byteLength <= MAX_IMAGE_BYTES ? imageInfo(file.bytes) : null;
    if (!info) {
      errors.push({ message: `${ref.label}, which couldn't be read.` });
      continue;
    }
    index[key] = { ...info, n };
    files[`img:${n}`] = file.bytes;
    n++;
  }
  if (n > MAX_IMAGES) errors.push({ message: `The quiz has ${n} pictures; it can have at most ${MAX_IMAGES}.` });
  if (errors.length > 0) return { ok: false, errors, missing };
  const packs = packSmalls(quiz, index, smalls, files);
  warnings.push(...proportions(quiz, index));
  return { ok: true, warnings, index, files, packs };
}

/**
 * The answer pictures' small copies, one after another in packs: a device
 * fetches a pack once, and cuts the pictures out of it by offset. Returns
 * how many packs there are.
 */
function packSmalls(quiz: Quiz, index: Record<string, StoredImage>, smalls: UploadedImage[], files: Record<string, Uint8Array>): number {
  const byKey = new Map(smalls.map((f) => [imageKey(f.name), f]));
  const parts: Uint8Array[][] = [];
  let size = 0;
  for (const ref of pictureRefs(quiz)) {
    if (ref.kind !== "answer") continue;
    const key = imageKey(ref.name);
    const stored = index[key];
    const file = byKey.get(key);
    if (!stored || stored.small || !file || file.bytes.byteLength > MAX_SMALL_BYTES) continue;
    const info = imageInfo(file.bytes);
    if (!info) continue;
    if (parts.length === 0 || size + file.bytes.byteLength > PACK_BYTES) {
      parts.push([]);
      size = 0;
    }
    stored.small = { ...info, p: parts.length - 1, o: size, l: file.bytes.byteLength };
    parts[parts.length - 1].push(file.bytes);
    size += file.bytes.byteLength;
  }
  parts.forEach((list, p) => {
    const pack = new Uint8Array(list.reduce((s, b) => s + b.byteLength, 0));
    let o = 0;
    for (const b of list) {
      pack.set(b, o);
      o += b.byteLength;
    }
    files[`pack:${p}`] = pack;
  });
  return parts.length;
}

/**
 * A question whose answer pictures have different proportions: the class
 * can pick by the shape or the crop of a picture rather than by what it
 * shows, e.g. the one cut from the sheet among three drawn ones.
 */
function proportions(quiz: Quiz, index: Record<string, StoredImage>): Problem[] {
  const out: Problem[] = [];
  quiz.questions.forEach((q, i) => {
    const sizes = q.answers.map((a) => (a.image ? index[imageKey(a.image)] : undefined)).filter((x): x is StoredImage => !!x);
    if (sizes.length < 2) return;
    const aspects = sizes.map((s) => s.w / s.h);
    const lo = Math.min(...aspects);
    const hi = Math.max(...aspects);
    if (hi / lo <= ASPECT_SPREAD) return;
    const ratio = (a: number) => (a >= 1 ? `${a.toFixed(1).replace(/\.0$/, "")}:1` : `1:${(1 / a).toFixed(1).replace(/\.0$/, "")}`);
    out.push({
      message:
        `Question ${i + 1}'s answer pictures have different proportions (from ${ratio(lo)} to ${ratio(hi)}). ` +
        `The class may pick by a picture's shape or crop rather than by what it shows. Drawn alike, on canvases of the same size, they differ only in what the question asks about.`,
    });
  });
  return out;
}

export interface ImageInfo {
  type: ImageType;
  w: number;
  h: number;
}

/** PNG or JPEG with a plausible size, or null. */
export function imageInfo(b: Uint8Array): ImageInfo | null {
  const info = png(b) ?? jpeg(b);
  if (!info || info.w < 1 || info.h < 1 || info.w > 20000 || info.h > 20000) return null;
  return info;
}

function u16(b: Uint8Array, i: number): number {
  return (b[i] << 8) | b[i + 1];
}

function png(b: Uint8Array): ImageInfo | null {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length < 24 || sig.some((v, i) => b[i] !== v)) return null;
  // The first chunk is IHDR: width and height, 4 bytes each, big-endian.
  if (String.fromCharCode(b[12], b[13], b[14], b[15]) !== "IHDR") return null;
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return { type: "image/png", w: dv.getUint32(16), h: dv.getUint32(20) };
}

function jpeg(b: Uint8Array): ImageInfo | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i++; // fill byte
      continue;
    }
    // Start of frame (SOF0–SOF15, except DHT, JPG and DAC, which share the range).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { type: "image/jpeg", h: u16(b, i + 5), w: u16(b, i + 7) };
    }
    // Markers without a length: RST0–7, SOI, TEM.
    if ((marker >= 0xd0 && marker <= 0xd8) || marker === 0x01) {
      i += 2;
      continue;
    }
    i += 2 + u16(b, i + 2);
  }
  return null;
}
