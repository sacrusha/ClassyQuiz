// Small helpers shared by the pages: building DOM, browser storage that may
// be missing (private windows, managed school browsers), and keeping the
// screen awake.

import type { LineStatus } from "./net.ts";

export function $(sel: string, root: ParentNode = document): HTMLElement {
  const el = root.querySelector(sel);
  if (!el) throw new Error(`missing ${sel}`);
  return el as HTMLElement;
}

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Text with its line breaks kept (questions may run over several lines). */
export function lines(s: string): string {
  return esc(s).replace(/\n/g, "<br>");
}

export const store = {
  get<T>(key: string): T | null {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable: the page still works, it just can't resume */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

// --- the teacher's quizzes on this device

export interface SavedQuiz {
  id: string;
  secret: string;
  title: string;
  at: number;
}

export function savedQuizzes(): SavedQuiz[] {
  return store.get<SavedQuiz[]>("cq.quizzes") ?? [];
}

export function saveQuiz(q: SavedQuiz): void {
  const list = savedQuizzes().filter((x) => x.id !== q.id);
  list.unshift(q);
  store.set("cq.quizzes", list.slice(0, 20));
}

export function forgetQuiz(id: string): void {
  store.set("cq.quizzes", savedQuizzes().filter((x) => x.id !== id));
}

export function findQuiz(id: string): SavedQuiz | null {
  return savedQuizzes().find((x) => x.id === id) ?? null;
}

// --- keeping the screen on (projector during a long explanation, a tablet
// waiting for the next question)

let lock: WakeLockSentinel | null = null;

export function keepAwake(): void {
  if (!("wakeLock" in navigator)) return;
  const request = async () => {
    if (document.visibilityState !== "visible" || lock) return;
    try {
      lock = await navigator.wakeLock.request("screen");
      lock.addEventListener("release", () => (lock = null));
    } catch {
      /* not allowed yet (needs a user gesture on some browsers) */
    }
  };
  void request();
  document.addEventListener("visibilitychange", () => void request());
  document.addEventListener("pointerdown", () => void request(), { passive: true });
  document.addEventListener("keydown", () => void request());
}

/** The address a person types, without "https://". */
export function siteAddress(): string {
  return location.host;
}

export function statusDot(el: HTMLElement, s: LineStatus): void {
  el.dataset.status = s;
  el.title = s === "live" ? "Connected" : s === "offline" ? "Connection lost — reconnecting" : "Connecting";
}
