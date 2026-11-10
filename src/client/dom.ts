// Helpers shared by the pages. Browser storage may be missing (private
// windows, managed school browsers); every access here is guarded.

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
 * Text with its line breaks kept (questions may run over several lines), a
 * number written in digit groups ("1 000 000") kept on one line, and a number
 * kept with a short word after it ("50 Franken", "3 cm"): split, the number
 * stands alone on a tile's first line and looks like the whole answer.
 */
export function lines(s: string): string {
  return esc(s)
    .replace(/(\d) (?=\d{3}(?!\d))/g, "$1\u00A0")
    .replace(/(\d) (?=\p{L}{1,10}(?!\p{L}))/gu, "$1\u00A0")
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
    } catch {}
  },
};

/**
 * Where a device keeps its player in a quiz ({instance, token}): a reload,
 * sleep or dropped line comes back as the same avatar. The device that
 * opens a Peers room writes it before it joins (client/entry-peers.ts).
 */
export const playerKey = (code: string): string => `cq.player.${code}`;

export interface SavedQuiz {
  id: string;
  /** Lets this device ask where the quiz stands (the resume card) and come back to it without the teacher code. */
  secret: string;
  code: string;
  /** The teacher code's two digits. */
  teacher?: string;
  title: string;
  at: number;
}

export function savedQuizzes(): SavedQuiz[] {
  // An entry without a code can't be resumed.
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

// The teacher code (docs/design/teacher-devices.md, "One entry: the teacher code"): the class code and two
// digits, typed in the students' box, which routes by length.

/** "63953 47", as the teacher reads it: the class's code, then their own two digits. */
export function teacherCode(code: string, teacher: string): string {
  return teacher ? `${code} ${teacher}` : code;
}

/** Where a teacher device goes with the teacher code; `extra` is a query string, e.g. "?win=1". */
export function teacherEntry(code: string, teacher: string, extra = ""): string {
  return `/play${extra}#${code}${teacher}`;
}

// The role this tab holds (docs/design/teacher-devices.md). Per tab, not per
// device: two windows of one browser may hold the Projector and the Remote.
// sessionStorage survives a reload of the tab and goes with it when it's closed.

export interface HeldRole {
  role: "screen" | "remote";
  token: string;
  code: string;
  /** The teacher code's two digits: a tab that loses its role comes back in with them. */
  teacher?: string;
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
    } catch {}
  },
};

/**
 * Which of its two lobby screens the single tab shows (docs/design/teacher-devices.md,
 * "The single tab: check, then join"): the teacher's check, or the class's join screen. Per tab, so a reload
 * stays where it was; the tab that uploaded starts on the check.
 */
export const tabLobby = {
  get(instance: string): "check" | "join" {
    try {
      return sessionStorage.getItem(`cq.lobby.${instance}`) === "check" ? "check" : "join";
    } catch {
      return "join";
    }
  },
  set(instance: string, screen: "check" | "join"): void {
    try {
      sessionStorage.setItem(`cq.lobby.${instance}`, screen);
    } catch {
      /* the tab shows the join screen after a reload */
    }
  },
};

/**
 * How the screens are arranged, as the single tab's check asks it
 * (docs/design/teacher-devices.md, "How the screens are arranged"): one
 * screen that shows and steers, or a screen and a remote. It changes only
 * which how-to the check shows; every device still comes in by the same
 * code. Per browser, not per quiz: a host who steers from the phone does so
 * each time. A screen and a remote until the host taps One screen or this
 * browser runs a quiz without a Remote, so the example class's teacher finds
 * the remote's how-to on a first visit; without storage it stays so.
 */
export type Arrangement = "one" | "remote";
export const arrangement = {
  get(): Arrangement {
    try {
      return localStorage.getItem("cq.screens") === "one" ? "one" : "remote";
    } catch {
      return "remote";
    }
  },
  set(a: Arrangement): void {
    try {
      localStorage.setItem("cq.screens", a);
    } catch {
      /* the choice holds on this page until it reloads */
    }
  },
};

/**
 * A Remote has been in this quiz, as this tab saw it: a run that reaches its
 * final ranking without one sets the browser to One screen (arrangement).
 * Per tab, so a Projector reloaded after its Remote left still knows.
 */
export const tabHadRemote = {
  get(instance: string): boolean {
    try {
      return sessionStorage.getItem(`cq.hadremote.${instance}`) === "1";
    } catch {
      return false;
    }
  },
  set(instance: string): void {
    try {
      sessionStorage.setItem(`cq.hadremote.${instance}`, "1");
    } catch {
      /* a reload then forgets it: at worst this browser starts on One screen next time */
    }
  },
};

export function rolePage(instance: string, role: "screen" | "remote"): string {
  return `/${role === "screen" ? "screen" : "teach"}?q=${instance}`;
}

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

/**
 * The small header of a teacher's page (site.css, .site-head): the mark and
 * the name, back to the root page, as the static pages write it. Here the
 * lockup is a picture, not inline: this script is also the students', and
 * every tablet would carry the drawing for screens only a teacher sees.
 * The picture follows the device's dark mode, as these screens do.
 */
export function siteHead(): string {
  return `<header class="site-head"><div class="in"><a class="brand" href="/"><picture><source media="(prefers-color-scheme: dark)" srcset="/brand/classyquiz-horizontal-32-dark.svg"><img src="/brand/classyquiz-horizontal-32.svg" alt="classyQuiz" width="134" height="32"></picture></a></div></header>`;
}

export function siteAddress(): string {
  return location.host;
}

export function statusDot(el: HTMLElement, s: LineStatus): void {
  el.dataset.status = s;
  el.title = s === "live" ? "Connected" : s === "offline" ? "Connection lost — reconnecting" : "Connecting";
}
