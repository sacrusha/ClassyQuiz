// The ways a quiz can be played, offered on the local check
// (docs/design/local-check.md, "The entries"). Only what is built is listed
// here: the site never promises what isn't (backlog v5). The order is the
// page's; the first entry's button is the page's primary one.

import type { OpenedQuiz } from "./opening.ts";
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
  /** The entry's name, the owner's: Solo, Peers, Quizmaster. */
  name: string;
  /** Under the name: who it is for and how it plays, one sentence, without a role noun where the sentence does without one. */
  line: string;
  /** The button that starts it. */
  button: string;
  /** A quiet line under the button, e.g. what starting it costs; optional. */
  note?: string;
  /**
   * Whoever starts it plays the quiz, so mustn't have to see the questions
   * on the way: the check then says so beside its question list (backlog v5
   * item 5).
   */
  plays: boolean;
  /**
   * Starts it with the quiz as the check holds it (fixes included).
   * Resolves once it has failed (said with ctx.say) or handed over to what
   * plays it; the check takes presses again after that.
   */
  start(quiz: OpenedQuiz, ctx: EntryContext): Promise<void>;
}

// Solo first: a newcomer's first use is plausibly Solo or a look at the
// example quiz (docs/design/local-check.md, Situation).
export const ENTRIES: Entry[] = [solo, quizmaster];
