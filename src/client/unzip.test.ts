// The quiz among several text files in an archive (docs/design/quiz-format.md, "Which text file in the zip").

import { test } from "node:test";
import assert from "node:assert/strict";
import { quizTextFromEntries, type ZipEntry } from "./unzip.ts";

const entry = (name: string, text: string): ZipEntry => ({ name, read: async () => new TextEncoder().encode(text) as Uint8Array<ArrayBuffer> });
const QUIZ = "Title: Prozente\n\n1. 10 % von 50?\n+ 5\n- 10\n";

test("the text file that reads as a quiz, whatever its name", async () => {
  assert.equal(await quizTextFromEntries([entry("notes.txt", "Here is your quiz."), entry("prozente-quiz.md", QUIZ)]), QUIZ);
  assert.equal(await quizTextFromEntries([entry("quiz.md", QUIZ), entry("README.txt", "How to use")]), QUIZ);
  assert.equal(await quizTextFromEntries([entry("a/quiz.md", QUIZ), entry("__MACOSX/._quiz.md", "x")]), QUIZ);
  // None has a question: the top-level, shortest one, for its error message.
  assert.equal(await quizTextFromEntries([entry("long-name.txt", "b"), entry("x.md", "a")]), "a");
});
