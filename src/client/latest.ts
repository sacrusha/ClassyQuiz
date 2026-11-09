// A burst of taps on a player device (a child hammering a button) sends its
// first and then its latest, one at a time and at most every INPUT_GAP_MS;
// the taps in between are never sent (shared/limits.ts, INPUT_GAP_MS).

import { INPUT_GAP_MS } from "../shared/limits.ts";

export class Latest<T, A> {
  private next: T | null = null;
  private busy = false;
  private last = -Infinity;
  private send: (x: T) => Promise<A>;
  private done: (x: T, a: A) => void;
  private gap: number;

  /** done: each sent one's answer, in the order sent. */
  constructor(send: (x: T) => Promise<A>, done: (x: T, a: A) => void, gap = INPUT_GAP_MS) {
    this.send = send;
    this.done = done;
    this.gap = gap;
  }

  /** The latest tap: sent now, or once the one on its way is answered and the gap is over. */
  put(x: T): void {
    this.next = x;
    this.pump();
  }

  /** Nothing on its way and nothing waiting. */
  idle(): boolean {
    return !this.busy && this.next === null;
  }

  /** Drops what waits to be sent (the server refused the one before, for the same reason). */
  clear(): void {
    this.next = null;
  }

  private pump(): void {
    if (this.busy || this.next === null) return;
    const wait = this.last + this.gap - Date.now();
    this.busy = true;
    if (wait > 0) {
      setTimeout(() => {
        this.busy = false;
        this.pump();
      }, wait);
      return;
    }
    const x = this.next;
    this.next = null;
    this.last = Date.now();
    void this.send(x).then((a) => {
      this.busy = false;
      this.done(x, a);
      this.pump();
    });
  }
}
