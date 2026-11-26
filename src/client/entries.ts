// The ways a quiz can be played, offered on the local check in this order.

import type { OpenedQuiz } from "./opening.ts";
import { peers } from "./entry-peers.ts";
import { quizmaster } from "./entry-quizmaster.ts";
import { solo } from "./entry-solo.ts";

/** What an entry gets from the check while it starts or runs. */
export interface EntryContext {
  /** A message under the entry's button, as HTML (progress, or why it didn't start); "" clears it. */
  say(html: string): void;
  /**
   * The page's main element, for an entry that runs on this page: it may
   * replace what is in it, and give it back with showCheck().
   */
  main: HTMLElement;
  /** Draws the check again in `main`, as it was: the question list where it was, the fixes kept. */
  showCheck(): void;
}

export interface Entry {
  name: string;
  line: string;
  /** The card's picture of the way being played (source: docs/ways/). */
  picture: string;
  pictureAlt: string;
  button: string;
  /** A quiet line under the button, e.g. what starting it costs; optional. */
  note?: string;
  /**
   * Whoever starts it plays the quiz, so mustn't have to see the questions
   * on the way: the check then says so beside its question list.
   */
  plays: boolean;
  /**
   * Starts it with the quiz as the check holds it (fixes included).
   * Resolves once it has failed (said with ctx.say) or handed over to what
   * plays it; the check takes presses again after that.
   */
  start(quiz: OpenedQuiz, ctx: EntryContext): Promise<void>;
}

export const ENTRIES: Entry[] = [solo, peers, quizmaster];
