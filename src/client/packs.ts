// Answer pictures come in a few packs, each cut by offset into blob URLs:
// one request per pack and device instead of one per picture, since a class
// of 25 tablets would otherwise spend thousands of the free plan's requests
// on a quiz with picture answers.

import type { PackPic } from "../shared/protocol.ts";

interface Pack {
  buf?: ArrayBuffer;
  busy?: boolean;
  fails: number;
  next: number;
}

const packs = new Map<string, Pack>();
const urls = new Map<string, string>();
let current: string[] = [];
let onReady: (() => void) | null = null;
const MAX_TRIES = 5;

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

export function picturesHere(pics: (PackPic | null)[] | undefined): boolean {
  return !pics || pics.every((p) => !p || packPicture(p) !== null);
}
