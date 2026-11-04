// The answer pictures on a student's device. The server keeps
// their small copies in a few packs; the device fetches each pack once, as
// soon as a view names it (in the lobby, so the pictures are here before the
// first question), and cuts each picture out of it by offset into a blob URL.
// One request per pack and device instead of one per picture: a class of 25
// tablets would otherwise spend thousands of the free plan's requests on a
// quiz with picture answers. Nothing is kept beyond the page.

import type { PackPic } from "../shared/protocol.ts";

interface Pack {
  buf?: ArrayBuffer;
  busy?: boolean;
  fails: number;
  /** No new attempt before this time (performance.now()). */
  next: number;
}

const packs = new Map<string, Pack>();
const urls = new Map<string, string>();
let current: string[] = [];
let onReady: (() => void) | null = null;
/** After this many failed fetches a pack isn't asked for again: the buttons show their colour and shape. */
const MAX_TRIES = 5;

/** Called with every view: fetches the packs it names that aren't here yet, one at a time. */
export function wantPacks(srcs: string[] | undefined, ready: () => void): void {
  current = srcs ?? [];
  onReady = ready;
  void pump();
}

let pumping = false;
async function pump(): Promise<void> {
  if (pumping) return;
  pumping = true;
  try {
    for (const src of current) {
      let p = packs.get(src);
      if (!p) packs.set(src, (p = { fails: 0, next: 0 }));
      if (p.buf || p.busy || p.fails >= MAX_TRIES || performance.now() < p.next) continue;
      p.busy = true;
      try {
        const r = await fetch(src, { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        p.buf = await r.arrayBuffer();
        onReady?.();
      } catch {
        p.fails++;
        // Again later, by the next view or this timer: 5 s, 15 s, 45 s …
        p.next = performance.now() + 5000 * 3 ** (p.fails - 1);
        if (p.fails < MAX_TRIES) window.setTimeout(() => void pump(), p.next - performance.now() + 50);
      } finally {
        p.busy = false;
      }
    }
  } finally {
    pumping = false;
  }
}

/** The picture as a blob URL, or null while its pack isn't here. */
export function packPicture(pic: PackPic): string | null {
  const src = current[pic.p];
  const buf = src ? packs.get(src)?.buf : undefined;
  if (!buf) return null;
  const key = `${src}|${pic.o}`;
  let url = urls.get(key);
  if (!url) {
    url = URL.createObjectURL(new Blob([buf.slice(pic.o, pic.o + pic.l)], { type: pic.type }));
    urls.set(key, url);
  }
  return url;
}

/** Every picture of the list is here (text answers need none). */
export function picturesHere(pics: (PackPic | null)[] | undefined): boolean {
  return !pics || pics.every((p) => !p || packPicture(p) !== null);
}
