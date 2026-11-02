import { test } from "node:test";
import assert from "node:assert/strict";
import { imageKey, parseQuiz, pictureRefs } from "./format.ts";

const canonical = `Title: Brüche addieren

1. Was ist 1/2 + 1/4?
- 2/6
+ 3/4
- 1/8
- 2/4

2. Was ist 1/3 + 1/3?
+ 2/3
- 2/6
- 1/9

3. Welcher Bruch ist grösser?
- 2/5
+ 3/5
`;

const keys = (src: string) =>
  parseQuiz(src).quiz.questions.map((q) => q.answers.findIndex((a) => a.correct));

test("canonical quiz parses completely", () => {
  const r = parseQuiz(canonical);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.ok, true);
  assert.equal(r.quiz.title, "Brüche addieren");
  assert.equal(r.quiz.questions.length, 3);
  const q1 = r.quiz.questions[0];
  assert.equal(q1.text, "Was ist 1/2 + 1/4?");
  assert.deepEqual(
    q1.answers.map((a) => [a.text, a.correct]),
    [["2/6", false], ["3/4", true], ["1/8", false], ["2/4", false]],
  );
  assert.deepEqual(keys(canonical), [1, 0, 1]);
});


test("chat answer: prose around a fenced block is ignored", () => {
  const src = `Here is your quiz! I left out exercise 4 because it needs a drawing.

\`\`\`text
${canonical}\`\`\`

Let me know if you want variants of exercise 2.`;
  const r = parseQuiz(src);
  assert.equal(r.ok, true);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.quiz.questions.length, 3);
  assert.equal(r.quiz.title, "Brüche addieren");
});

test("unclosed fence (truncated copy) runs to the end", () => {
  const r = parseQuiz("Sure:\n```\n" + canonical);
  assert.equal(r.ok, true);
  assert.equal(r.quiz.questions.length, 3);
});

test("no fence: preamble before the title and closing words are dropped with warnings", () => {
  const src = `Here is your quiz:\n\n${canonical}\nGood luck with the class!`;
  const r = parseQuiz(src);
  assert.equal(r.ok, true);
  assert.equal(r.quiz.questions.length, 3);
  assert.equal(r.quiz.questions[0].text, "Was ist 1/2 + 1/4?");
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0].message, /after the last question/);
});

test("no fence, no title keyword: preamble ignored, numbered question starts cleanly", () => {
  const src = `Here is your quiz:\n1. What is 2 + 2?\n- 3\n+ 4\n`;
  const r = parseQuiz(src);
  assert.equal(r.ok, true);
  assert.equal(r.quiz.questions[0].text, "What is 2 + 2?");
  assert.ok(r.warnings.some((w) => /before the first question/.test(w.message)));
});

test("unmarked single title line before the first question is taken as the title", () => {
  const r = parseQuiz(`# Fractions\n\n1. What is 1/2 of 10?\n+ 5\n- 2\n`);
  assert.equal(r.quiz.title, "Fractions");
  assert.deepEqual(r.warnings, []);
});

test("markdown dressing on keywords and questions is tolerated", () => {
  const src = `**Title:** Fractions

## 1. What is 1/2 of 10?
+ 5
- 2
`;
  const r = parseQuiz(src);
  assert.equal(r.ok, true);
  assert.equal(r.quiz.title, "Fractions");
  assert.equal(r.quiz.questions[0].text, "What is 1/2 of 10?");
});

test("keywords are case-insensitive and spacing-tolerant", () => {
  const r = parseQuiz(`TITLE :  X\n1. Q?\n+ a\n- b\nnote: n`);
  assert.equal(r.quiz.title, "X");
  assert.equal(r.ok, true);
});

test("Note: lines, from guidance an AI read before notes left the format, are dropped silently", () => {
  const src = `Title: T
**Note**: two answers on the sheet were smudged

1. Q?
+ a
- b
Note: sheet key agrees

2. R?
- c
+ d
`;
  const r = parseQuiz(src);
  assert.equal(r.ok, true);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.quiz.questions.length, 2);
  assert.deepEqual(r.quiz.questions[0].answers.map((a) => a.text), ["a", "b"]);
  assert.ok(!JSON.stringify(r.quiz).includes("smudged"));
});

test("checkbox answers are understood", () => {
  const src = `Title: T\n1. Q?\n- [ ] a\n- [x] b\n- [ ] c\n`;
  assert.equal(parseQuiz(src).ok, true);
  assert.deepEqual(keys(src), [1]);
});

test("dash variants mark wrong answers; fullwidth plus marks the right one", () => {
  const r = parseQuiz(`Title: T\n1. Q?\n– a\n— b\n− c\n＋ d\n`);
  assert.equal(r.ok, true);
  assert.deepEqual(r.quiz.questions[0].answers.map((a) => a.correct), [false, false, false, true]);
});

test("negative numbers and plus signs inside answers survive", () => {
  const r = parseQuiz(`Title: T\n1. What is 2 - 5?\n+ -3\n- 3\n- +7\n`);
  assert.equal(r.ok, true);
  assert.deepEqual(r.quiz.questions[0].answers.map((a) => a.text), ["-3", "3", "+7"]);
});

test("question text that merely starts with a number keeps it", () => {
  const r = parseQuiz(`Title: T\n1. 1.5 + 2 = ?\n+ 3.5\n- 3\n\n2. 3 apples and 2 pears: how many fruits?\n+ 5\n- 6\n`);
  assert.equal(r.quiz.questions[0].text, "1.5 + 2 = ?");
  assert.equal(r.quiz.questions[1].text, "3 apples and 2 pears: how many fruits?");
});

test("unnumbered questions work", () => {
  const r = parseQuiz(`Title: T\nWhat is 2 + 2?\n- 3\n+ 4\nWhat is 3 + 3?\n+ 6\n- 5\n`);
  assert.equal(r.ok, true);
  assert.deepEqual(r.quiz.questions.map((q) => q.text), ["What is 2 + 2?", "What is 3 + 3?"]);
});

test("multi-line question text is kept together", () => {
  const r = parseQuiz(`Title: T\n1. Anna has 3 apples.\nShe gets 2 more.\n\nHow many does she have?\n- 4\n+ 5\n`);
  assert.equal(r.quiz.questions[0].text, "Anna has 3 apples.\nShe gets 2 more.\nHow many does she have?");
});

test("whole block indented (as some AIs do in code blocks) still parses", () => {
  const src = canonical
    .split("\n")
    .map((l) => (l ? "    " + l : l))
    .join("\n");
  const r = parseQuiz(src);
  assert.equal(r.ok, true);
  assert.equal(r.quiz.questions.length, 3);
});

test("a deeper-indented line after an answer continues that answer", () => {
  const r = parseQuiz(`Title: T\n1. Q?\n- a rather long answer that the AI\n  wrapped onto a second line\n+ b\n`);
  assert.equal(r.ok, true);
  assert.equal(r.quiz.questions[0].answers[0].text, "a rather long answer that the AI wrapped onto a second line");
});

test("stray explanation after answers is reported, not merged into the next question", () => {
  const src = `Title: T
1. What is 2 + 2?
- 3
+ 4
Explanation: two and two make four.
2. What is 3 + 3?
+ 6
- 5
`;
  const r = parseQuiz(src);
  assert.equal(r.ok, false);
  assert.equal(r.quiz.questions[1].text, "What is 3 + 3?");
  assert.ok(r.errors.some((e) => /Explanation: two and two/.test(e.message) && /no answer lines/.test(e.message)));
});

test("CRLF, BOM, non-breaking spaces and zero-width characters are normalised", () => {
  const src = "﻿Title: T\r\n1. Q?\r\n+ a​\r\n- b\r\n";
  const r = parseQuiz(src);
  assert.equal(r.ok, true);
  assert.equal(r.quiz.questions[0].text, "Q?");
  assert.equal(r.quiz.questions[0].answers[0].text, "a");
});

test("non-breaking spaces in the text are kept, and read as spaces around markers", () => {
  const r = parseQuiz("Title: T\n1.\u00A0How much is 1000 × 1000?\n+\u00A01\u202F000\u202F000\n-\u00A0100\u00A0000\n- [\u00A0] 1 000\n");
  assert.equal(r.ok, true);
  assert.deepEqual(r.quiz.questions[0].answers.map((a) => [a.text, a.correct]), [
    ["1\u202F000\u202F000", true],
    ["100\u00A0000", false],
    ["1 000", false],
  ]);
});

test("right-to-left text with a leading bidi mark keeps its markers", () => {
  const src = "Title: اختبار\n1. كم يساوي ٢ + ٢؟\n‏+ ٤\n‏- ٥\n";
  const r = parseQuiz(src);
  assert.equal(r.ok, true);
  assert.deepEqual(r.quiz.questions[0].answers.map((a) => [a.text, a.correct]), [["٤", true], ["٥", false]]);
});

test("ZWNJ inside words is preserved", () => {
  const word = "می‌خواهم";
  const r = parseQuiz(`Title: T\n1. ${word}?\n+ a\n- b\n`);
  assert.equal(r.quiz.questions[0].text, `${word}?`);
});

// --- errors, phrased so a teacher can paste them back to the AI

test("no correct answer is an error naming the question", () => {
  const r = parseQuiz(`Title: T\n1. What is 2 + 2?\n- 3\n- 4\n`);
  assert.equal(r.ok, false);
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0].message, /Question 1 \("What is 2 \+ 2\?"\) has no answer marked correct/);
});

test("more than one answer may count, up to all of them", () => {
  const r = parseQuiz(`Title: T\n1. Q?\n+ a\n+ b\n- c\n\n2. Which of these are animals?\n+ cat\n+ dog\n+ owl\n`);
  assert.equal(r.ok, true);
  assert.deepEqual(
    r.quiz.questions.map((q) => q.answers.map((a) => a.correct)),
    [[true, true, false], [true, true, true]],
  );
});

test("several right answers don't trigger the same-position warning", () => {
  const q = (i: number) => `${i}. Q${i}?\n+ a\n+ b\n- c\n`;
  const r = parseQuiz(`Title: T\n${[1, 2, 3, 4].map(q).join("\n")}`);
  assert.deepEqual(r.warnings, []);
});

test("too many and too few answers are errors", () => {
  assert.match(parseQuiz(`Title: T\n1. Q?\n+ a\n- b\n- c\n- d\n- e\n`).errors[0].message, /5 answers; a question has at most 4/);
  assert.match(parseQuiz(`Title: T\n1. Q?\n+ a\n`).errors[0].message, /only 1 answer/);
});

test("asterisk bullets are ambiguous and reported", () => {
  const r = parseQuiz(`Title: T\n1. Q?\n* a\n* b\n`);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /doesn't say whether the answer is right or wrong/.test(e.message)));
});

test("lettered answers with an index key (Aiken style) are rejected with guidance", () => {
  const r = parseQuiz(`What is 2 + 2?\nA. 3\nB. 4\nANSWER: B\n`);
  assert.equal(r.ok, false);
  assert.match(r.errors[r.errors.length - 1].message, /No questions were found.*"\+".*"-"/s);
});

test("rendered-and-copied markdown (markers lost) fails loudly instead of producing a wrong key", () => {
  const r = parseQuiz(`Title: T\n1. Q?\na\nb\n`);
  assert.equal(r.ok, false);
});

test("answer line before any question is an error", () => {
  const r = parseQuiz(`Title: T\n+ a\n- b\n`);
  assert.equal(r.ok, false);
  assert.match(r.errors[0].message, /comes before any question/);
});

test("empty input", () => {
  const r = parseQuiz("");
  assert.equal(r.ok, false);
  assert.match(r.errors[0].message, /No questions were found/);
});

// --- warnings, shown in the key check

test("missing title, duplicate answers, long answers are warnings", () => {
  const long = "x".repeat(90);
  const r = parseQuiz(`1. Q?\n+ a\n- a\n- ${long}\n`);
  assert.equal(r.ok, true);
  const text = r.warnings.map((w) => w.message).join("\n");
  assert.match(text, /no title/);
  assert.match(text, /twice/);
  assert.match(text, /90 characters long/);
});

// --- pictures

const withImage = (line: string) => `Title: T\n\n1. Wie gross ist der Winkel?\n${line}\n- 30°\n+ 45°\n\n2. Q2?\n+ a\n- b\n`;

test("an Image: line after the question text gives the question its picture", () => {
  const r = parseQuiz(withImage("Image: q1.png"));
  assert.deepEqual(r.errors, []);
  assert.equal(r.quiz.questions[0].image, "q1.png");
  assert.equal(r.quiz.questions[0].text, "Wie gross ist der Winkel?");
  assert.equal(r.quiz.questions[1].image, "");
});

test("the picture's file name is read out of what AIs wrap around it", () => {
  const cases: [string, string][] = [
    ["**Image:** q1.png", "q1.png"],
    ["Image: `q1.png`", "q1.png"],
    ['Image: "Bild 1ä.png"', "Bild 1ä.png"],
    ["image: bilder/q1.JPG", "bilder/q1.JPG"],
    ["Image: q1.png (the triangle from exercise 4)", "q1.png"],
    ["Image: q1.png – the triangle", "q1.png"],
    ["Image: ![Dreieck](q1.png)", "q1.png"],
    ["![Dreieck](q1.png)", "q1.png"],
    ['![Dreieck](<fig 1.svg> "Figure")', "fig 1.svg"],
  ];
  for (const [line, name] of cases) {
    const r = parseQuiz(withImage(line));
    assert.deepEqual(r.errors, [], line);
    assert.equal(r.quiz.questions[0].image, name, line);
  }
});

test("an Image: line among the answers belongs to that question", () => {
  const r = parseQuiz(`1. Q?\n- a\nImage: q1.png\n+ b\n`);
  assert.deepEqual(r.errors, []);
  assert.equal(r.quiz.questions[0].image, "q1.png");
});

test("an Image: line after the answers is an error: it might be meant for the next question", () => {
  const r = parseQuiz(`Title: T\n1. Q1?\n+ a\n- b\nImage: q2.png\n2. Q2?\n+ a\n- b\n`);
  assert.equal(r.ok, false);
  assert.match(r.errors[0].message, /^Question 1 .*comes after the answers.*before the answers/);
  assert.equal(r.quiz.questions[0].image, "");
  assert.equal(r.quiz.questions[1].image, "");
});

test("pictures: two on one question, none named, from the web, before any question", () => {
  const two = parseQuiz(withImage("Image: a.png\nImage: b.png"));
  assert.match(two.errors.map((e) => e.message).join("\n"), /Question 1 .*more than one picture/);
  const none = parseQuiz(withImage("Image: the triangle"));
  assert.match(none.errors[0].message, /names no picture file/);
  const web = parseQuiz(withImage("Image: https://example.org/q1.png"));
  assert.match(web.errors[0].message, /from the web/);
  const before = parseQuiz(`Title: T\nImage: cover.png\n1. Q?\n+ a\n- b\n`);
  assert.match(before.errors[0].message, /comes before any question/);
});

test("imageKey ignores folders, case and Unicode composition", () => {
  assert.equal(imageKey("Bilder/Q1.PNG"), "q1.png");
  assert.equal(imageKey("a\\b\\Q1.png"), "q1.png");
  assert.equal(imageKey("Bild 1a\u0308.png"), imageKey("bild 1ä.png"));
});

test("correct answer always in the same position is a warning", () => {
  const q = (i: number) => `${i}. Q${i}?\n- a\n+ b\n- c\n`;
  const r = parseQuiz(`Title: T\n${[1, 2, 3, 4].map(q).join("\n")}`);
  assert.equal(r.ok, true);
  assert.ok(r.warnings.some((w) => /position 2 in every question/.test(w.message)));
});

// --- the specification on the guidance page and this parser stay in step

test("the example on the guidance page parses without errors or warnings", async () => {
  const { readFile } = await import("node:fs/promises");
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const m = html.match(/<pre><code>([\s\S]*?)<\/code><\/pre>/);
  assert.ok(m, "example block found");
  const text = m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const r = parseQuiz(text);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.quiz.questions.length, 3);
  assert.deepEqual(keys(text), [1, 3, 0]);
});

test("two quizzes in one pasted answer (e.g. one per class) are an error, not merged", () => {
  const src = "Two quizzes, one per class:\n\n```\nTitle: A (6a)\n1. Q?\n+ a\n- b\n```\n\n```\nTitle: B (6b)\n1. R?\n+ c\n- d\n```\n";
  const r = parseQuiz(src);
  assert.equal(r.ok, false);
  assert.match(r.errors[0].message, /more than one quiz.*Title: B \(6b\)/);
});

test("Background: before the first question is the quiz's; after a question's text, that question's own", () => {
  const r = parseQuiz(`Title: Wald\nBackground: wald.jpg\n\n1. Welcher Baum?\nImage: blatt.png\nBackground: herbst.jpg\n+ Eiche\n- Buche\n\n2. Und hier?\n+ a\n- b\n`);
  assert.deepEqual(r.errors, []);
  assert.equal(r.quiz.background, "wald.jpg");
  assert.deepEqual([r.quiz.questions[0].image, r.quiz.questions[0].background], ["blatt.png", "herbst.jpg"]);
  assert.deepEqual([r.quiz.questions[1].image, r.quiz.questions[1].background], ["", ""]);
  assert.deepEqual(
    pictureRefs(r.quiz).map((p) => p.label),
    ['The quiz has the background "wald.jpg"', 'Question 1 shows the picture "blatt.png"', 'Question 1 has the background "herbst.jpg"'],
  );
});

test("Background: under an unmarked title still belongs to the quiz", () => {
  const r = parseQuiz(`Wald\nBackground: wald.jpg\n1. Q?\n+ a\n- b\n`);
  assert.deepEqual(r.errors, []);
  assert.equal(r.quiz.title, "Wald");
  assert.equal(r.quiz.background, "wald.jpg");
});

test("backgrounds: two for the quiz, two for a question, or after the answers are errors", () => {
  const twoQuiz = parseQuiz(`Title: T\nBackground: a.jpg\nBackground: b.jpg\n1. Q?\n+ a\n- b\n`);
  assert.match(twoQuiz.errors[0].message, /more than one "Background:" line/);
  const twoQ = parseQuiz(`Title: T\n1. Q?\nBackground: a.jpg\nBackground: b.jpg\n+ a\n- b\n`);
  assert.match(twoQ.errors[0].message, /^Question 1 .*more than one background/);
  const after = parseQuiz(`Title: T\n1. Q?\n+ a\n- b\nBackground: a.jpg\n`);
  assert.match(after.errors[0].message, /^Question 1 .*comes after the answers, so it's unclear which question the background belongs to/);
  assert.equal(after.quiz.questions[0].background, "");
  const image = parseQuiz(`Title: T\nImage: a.png\n1. Q?\n+ a\n- b\n`);
  assert.match(image.errors[0].message, /comes before any question.*"Background:" line before the first question/);
});
