// The quiz read on the root page, passed to the local check at /open
// (docs/design/local-check.md, "From the root page to the check"). A page
// can't hand a file to the next one, so it goes through the browser's
// IndexedDB for the moment of the page change: the check takes it out and
// deletes it as it arrives. A record whose page never came (the tab closed
// in between, the navigation lost) stays in the browser's site data until
// the site next runs a page that sweeps: the start page, the check, or the
// next handover, each of which deletes what is older than STALE_MS.
// The pictures go as ArrayBuffers rather than Blobs, the plainer value to
// store (Blobs in IndexedDB had gaps in older Safari).

import type { QuizFiles } from "./opening.ts";

const DB = "cq-open";
const STORE = "handoff";
/** A record older than this never reached its page (a closed tab, a crash): the next sweep deletes it. */
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

/**
 * Deletes, within the store's transaction, every record that never reached
 * its page, and the one under `take`; the getter returns that one once the
 * transaction has completed.
 */
function sweep(store: IDBObjectStore, take?: string): () => Stored | undefined {
  let found: Stored | undefined;
  const req = store.openCursor();
  req.onsuccess = () => {
    const cursor = req.result;
    if (!cursor) return;
    const value = cursor.value as Stored;
    const taken = take !== undefined && cursor.key === take;
    if (taken) found = value;
    if (taken || !(value.at > Date.now() - STALE_MS)) cursor.delete();
    cursor.continue();
  };
  return () => found;
}

/**
 * The sweep on a page that opens no quiz itself (the start page, the
 * example's check), for a record left by a handover whose page never came.
 * Only where the browser lists the database: opening it would create it.
 */
export async function sweepStale(): Promise<void> {
  try {
    if (typeof indexedDB.databases !== "function") return;
    if (!(await indexedDB.databases()).some((d) => d.name === DB)) return;
    const db = await open();
    try {
      const tx = db.transaction(STORE, "readwrite");
      sweep(tx.objectStore(STORE));
      await done(tx);
    } finally {
      db.close();
    }
  } catch {
    /* no site data in this browser: nothing was left either */
  }
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
    const store = tx.objectStore(STORE);
    sweep(store);
    store.put(record, key);
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
    const taken = sweep(tx.objectStore(STORE), key);
    await done(tx);
    const found = taken();
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
