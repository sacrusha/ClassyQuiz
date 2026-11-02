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

/**
 * Text with its line breaks kept (questions may run over several lines), and
 * a number written in digit groups ("1 000 000") kept on one line.
 */
export function lines(s: string): string {
  return esc(s)
    .replace(/(\d) (?=\d{3}(?!\d))/g, "$1\u00A0")
    .replace(/\n/g, "<br>");
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

// --- the quizzes pasted on this device (root page: resume, delete)

export interface SavedQuiz {
  id: string;
  /** Lets this device delete the quiz and ask when it closes. */
  secret: string;
  code: string;
  title: string;
  at: number;
}

export function savedQuizzes(): SavedQuiz[] {
  // Entries from before codes were per quiz have no code; they can't be resumed.
  return (store.get<SavedQuiz[]>("cq.quizzes") ?? []).filter((q) => typeof q.code === "string");
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

// --- the role this tab holds (user flow §1). Per tab, not per device: two
// windows of one browser may hold the Projector and the Remote. sessionStorage
// survives a reload of the tab and goes with it when it's closed.

export interface HeldRole {
  role: "screen" | "remote";
  token: string;
  code: string;
}

export const tabRole = {
  get(instance: string): HeldRole | null {
    try {
      const v = sessionStorage.getItem(`cq.role.${instance}`);
      return v ? (JSON.parse(v) as HeldRole) : null;
    } catch {
      return null;
    }
  },
  set(instance: string, r: HeldRole): void {
    try {
      sessionStorage.setItem(`cq.role.${instance}`, JSON.stringify(r));
    } catch {
      /* without storage a reload returns to the choice; the role frees up after a minute */
    }
  },
  remove(instance: string): void {
    try {
      sessionStorage.removeItem(`cq.role.${instance}`);
    } catch {
      /* ignore */
    }
  },
};

/** Where a tab holding a role shows it. */
export function rolePage(instance: string, role: "screen" | "remote"): string {
  return `/${role === "screen" ? "screen" : "teach"}?q=${instance}`;
}

// --- keeping the screen on (projector during a long explanation, a tablet
// waiting for the next question)

let lock: WakeLockSentinel | null = null;
/** Asleep (net.ts): the screen may turn off; a device left on doesn't keep its line open all day. */
let paused = false;
let requestLock: (() => Promise<void>) | null = null;

export function pauseAwake(pause: boolean): void {
  paused = pause;
  if (paused && lock) void lock.release().catch(() => {});
  if (!paused) void requestLock?.();
}

export function keepAwake(): void {
  if (!("wakeLock" in navigator)) return;
  const request = async () => {
    if (document.visibilityState !== "visible" || lock || paused) return;
    try {
      lock = await navigator.wakeLock.request("screen");
      lock.addEventListener("release", () => (lock = null));
    } catch {
      /* not allowed yet (needs a user gesture on some browsers) */
    }
  };
  requestLock = request;
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
