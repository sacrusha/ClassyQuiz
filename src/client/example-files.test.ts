// An example's .zip changed without a run of docs/example/faces.py would leave the root page naming its old size and
// first question and showing its old face: this fails until it has run.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { EXAMPLE_FILES } from "./example-files.ts";
import { EXAMPLES } from "./example-text.ts";
import { LANGS } from "./landing-text.ts";
import { listZip, quizTextFromEntries } from "./unzip.ts";
import { parseQuiz } from "../quiz/format.ts";

const examples = new URL("../public/examples/", import.meta.url);
const landing = new URL("../public/landing/", import.meta.url);

test("every example's file is what the page says: its size, its question count and its first question", async () => {
  for (const ex of EXAMPLES) {
    for (const { id } of LANGS) {
      const f = EXAMPLE_FILES[ex][id];
      const file = new URL(f.zip, examples);
      assert.equal((await stat(file)).size, f.bytes, `${ex} ${id}: run docs/example/faces.py`);
      const buf = await readFile(file);
      const quiz = parseQuiz(await quizTextFromEntries(listZip(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))));
      assert.ok(quiz.ok, `${ex} ${id}: ${f.zip} doesn't parse`);
      assert.equal(quiz.quiz.title, f.title, `${ex} ${id}`);
      assert.equal(quiz.quiz.questions.length, f.questions, `${ex} ${id}`);
      assert.equal(quiz.quiz.questions[0].text, f.first, `${ex} ${id}`);
    }
  }
});

test("every example has its face in every language", async () => {
  for (const ex of EXAMPLES) for (const { id } of LANGS) assert.ok((await stat(new URL(`face-${ex}-${id}.webp`, landing))).size > 1000, `face-${ex}-${id}.webp`);
});
