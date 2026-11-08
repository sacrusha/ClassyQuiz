// The quiz read on the root page, passed to the local check at /open
// (docs/design/local-check.md, "From the root page to the check"). A page
// can't hand a file to the next one, so it goes through the browser's
// IndexedDB for the moment of the page change: the check takes it out and
// deletes it as it arrives, and nothing of the quiz stays on the device.
// The pictures go as ArrayBuffers rather than Blobs, the plainer value to
// store (Blobs in IndexedDB had gaps in older Safari).

import type { QuizFiles } from "./opening.ts";

const DB = "cq-open";
const STORE = "handoff";
/** A record older than this never reached its page (a closed tab, a crash): the next arrival deletes it. */
const STALE_MS = 60_000;

interface Stored {
  at: number;
  text: string;
  leaveOut: boolean;
  images: { name: string; type: string; bytes: ArrayBuffer; small?: { type: string; bytes: ArrayBuffer } }[];
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}

/** Stores the files for the next page; the key goes in its address. Throws where the browser keeps no site data. */
export async function handOver(files: QuizFiles): Promise<string> {
  const images = await Promise.all(
    files.images.map(async (im) => ({
      name: im.name,
      type: im.blob.type,
      bytes: await im.blob.arrayBuffer(),
      ...(im.small ? { small: { type: im.small.type, bytes: await im.small.arrayBuffer() } } : {}),
    })),
  );
  const record: Stored = { at: Date.now(), text: files.text, leaveOut: files.leaveOut, images };
  const key = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
  const db = await open();
  try {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record, key);
    await done(tx);
  } finally {
    db.close();
  }
  return key;
}

/** The files stored under `key`, deleted as they are read, with any record that never reached its page; null when there are none. */
export async function takeOver(key: string): Promise<QuizFiles | null> {
  const db = await open();
  try {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    let found: Stored | undefined;
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      const value = cursor.value as Stored;
      if (cursor.key === key) found = value;
      if (cursor.key === key || !(value.at > Date.now() - STALE_MS)) cursor.delete();
      cursor.continue();
    };
    await done(tx);
    if (!found) return null;
    return {
      text: found.text,
      leaveOut: found.leaveOut,
      images: found.images.map((im) => ({
        name: im.name,
        blob: new Blob([im.bytes], { type: im.type }),
        ...(im.small ? { small: new Blob([im.small.bytes], { type: im.small.type }) } : {}),
      })),
    };
  } finally {
    db.close();
  }
}
