// Quiz text format: the parser.
//
// The specification lives on the guidance page (src/public/index.html,
// "How quizzes are built"), because that is where AIs and teachers read it.
// This module implements it; keep the two in step.
//
// Design (docs/decisions.md): the correct answer is marked on its own line;
// the parser forgives what AIs typically add or vary and rejects only what it
// cannot read unambiguously; error messages name the question and are written
// so a teacher can paste them back to the AI.

export interface Answer {
  text: string;
  /** Picking this answer counts as right. Any number of a question's answers may count, at least one. */
  correct: boolean;
}

export interface Question {
  text: string;
  answers: Answer[];
  /** Authoring note: shown to the teacher while the question is up, never to students. */
  note: string;
}

export interface Quiz {
  title: string;
  /** Note on the quiz as a whole, for the teacher only. */
  note: string;
  questions: Question[];
}

/** Worded so the teacher can paste it back to the AI; it names the question it belongs to. */
export interface Problem {
  message: string;
}

export interface ParseResult {
  /** True when the quiz can be run: no errors (warnings are allowed). */
  ok: boolean;
  quiz: Quiz;
  errors: Problem[];
  warnings: Problem[];
}

const MIN_ANSWERS = 2;
const MAX_ANSWERS = 4;
/** Beyond these, text still works but gets hard to read on a button or from the back row. */
const LONG_ANSWER = 80;
const LONG_QUESTION = 300;

// ---------------------------------------------------------------------------
// Normalising and line classification

// Removed everywhere: zero-width space, word joiner, BOM. ZWNJ/ZWJ
// (U+200C/U+200D) are kept: they carry meaning in Persian, Indic scripts and
// emoji.
const INVISIBLES = /[​⁠﻿]/g;
// Bidi controls are stripped only at the start of a line, so a marker typed
// in right-to-left text is still recognised.
const LEADING_BIDI = /^[‎‏؜‪-‮⁦-⁩]+/;

type Classified =
  | { kind: "blank" }
  | { kind: "keyword"; key: "title" | "note" | "image"; value: string }
  | { kind: "answer"; correct: boolean; text: string; indent: number }
  | { kind: "ambiguous"; marker: string; text: string }
  | { kind: "text"; text: string; indent: number };

function stripWrappingEmphasis(s: string): string {
  const m = s.match(/^(\*\*|__)(.+)\1$/);
  return m ? m[2].trim() : s;
}

function indentWidth(raw: string): number {
  const m = raw.match(/^[ \t]*/);
  return m ? m[0].replace(/\t/g, "    ").length : 0;
}

function classify(raw: string): Classified {
  const indent = indentWidth(raw);
  const s = raw.trim().replace(LEADING_BIDI, "").trim();
  if (s === "") return { kind: "blank" };

  // Checkbox lists, a common AI habit: "- [x] right", "- [ ] wrong", "[x] right".
  let m = s.match(/^(?:[-*+]\s+)?\[([ xX✓✔])\]\s+(.*)$/);
  if (m) return { kind: "answer", correct: m[1] !== " ", text: m[2].trim(), indent };

  // "+" (also fullwidth) marks the correct answer.
  m = s.match(/^[+＋]\s+(.*)$/);
  if (m) return { kind: "answer", correct: true, text: m[1].trim(), indent };

  // "-" marks a wrong answer. Dashes and minus signs are accepted because
  // editors and phone keyboards substitute them.
  m = s.match(/^[-–—−]\s+(.*)$/);
  if (m) return { kind: "answer", correct: false, text: m[1].trim(), indent };

  // "*" and "•" look like answers but don't say whether they're right or wrong.
  m = s.match(/^([*•])\s+(.*)$/);
  if (m) return { kind: "ambiguous", marker: m[1], text: m[2].trim() };

  // Keywords, possibly dressed up as Markdown: "## Title: x", "**Title:** x", "**Note**: x".
  const unheaded = s.replace(/^#{1,6}\s+/, "");
  m = unheaded.match(/^([*_]{0,2})(title|note|image)[*_]{0,2}\s*:\s*[*_]{0,2}\s*(.*)$/i);
  if (m) {
    let value = m[3].trim();
    if (m[1]) value = value.replace(/(\*\*|__)$/, "").trim();
    return { kind: "keyword", key: m[2].toLowerCase() as "title" | "note" | "image", value };
  }

  return { kind: "text", text: stripWrappingEmphasis(unheaded), indent };
}

// ---------------------------------------------------------------------------
// Picking the quiz out of a pasted chat answer

const FENCE = /^\s*(`{3,}|~{3,})/;

function isQuizLike(lines: string[]): boolean {
  return lines.some((l) => {
    const c = classify(l);
    return c.kind === "answer" || (c.kind === "keyword" && c.key === "title");
  });
}

/**
 * When the text contains fenced code blocks, the quiz is in the blocks that
 * look like a quiz; prose around them is the AI talking to the teacher. An
 * unclosed fence (a truncated copy) runs to the end. Without fences, the whole
 * text is the quiz.
 */
function selectBody(all: string[]): string[] {
  const blocks: string[][] = [];
  let current: string[] | null = null;
  let opener = "";
  for (const line of all) {
    const m = line.match(FENCE);
    if (current === null) {
      if (m) {
        current = [];
        opener = m[1];
      }
    } else if (m && line.trim() === m[1] && m[1][0] === opener[0] && m[1].length >= opener.length) {
      blocks.push(current);
      current = null;
    } else {
      current.push(line);
    }
  }
  if (current !== null) blocks.push(current);
  const quizBlocks = blocks.filter(isQuizLike);
  return quizBlocks.length > 0 ? quizBlocks.flat() : all;
}

// ---------------------------------------------------------------------------
// Parsing

interface Block {
  textLines: string[];
  answers: Answer[];
  notes: string[];
  /** The question number written in front of the text, when there was one. */
  number: number | null;
  /** Indentation of the last answer line, to recognise its continuation. */
  answerIndent: number;
}

// "1. ", "1) ", "Q1: ", "Question 1: ". Stripped only when the number is the
// one expected next, so "1.5 + 2" or a stray "3." in the text stay put.
const NUMBERING = /^(?:Q(?:uestion)?\s*)?(\d{1,3})\s*[.):]\s+/i;

function excerpt(text: string, max = 60): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : flat.slice(0, max - 1).trimEnd() + "…";
}

export function parseQuiz(input: string): ParseResult {
  const errors: Problem[] = [];
  const warnings: Problem[] = [];
  const err = (message: string) => errors.push({ message });
  const warn = (message: string) => warnings.push({ message });

  const normalised = input
    .replace(/\r\n?/g, "\n")
    .replace(INVISIBLES, "")
    .replace(/[  ]/g, " ");
  const lines = selectBody(normalised.split("\n"));

  let title: string | null = null;
  const quizNotes: string[] = [];
  const blocks: Block[] = [];
  let current: Block | null = null;

  // Blocks that have answers so far, kept as a count: recounting on every
  // line made parsing quadratic in the number of questions.
  let answered = 0;

  const startBlock = (text: string) => {
    const m = text.match(NUMBERING);
    const expected = answered + 1;
    let number: number | null = null;
    if (m && Number(m[1]) === expected) {
      text = text.slice(m[0].length);
      number = expected;
    }
    current = { textLines: [text], answers: [], notes: [], number, answerIndent: 0 };
    blocks.push(current);
  };

  for (const raw of lines) {
    const c = classify(raw);
    const block = current as Block | null;
    switch (c.kind) {
      case "blank":
        break;
      case "keyword":
        if (c.key === "title") {
          if (title === null && answered === 0) {
            title = c.value;
            // Whatever came before the title was the AI talking to the teacher:
            // dropped without a warning (notes in it are kept for the teacher).
            for (const b of blocks) quizNotes.push(...b.notes);
            blocks.length = 0;
            current = null;
          } else if (answered > 0) {
            // A title after questions starts a second quiz (an AI may write
            // one per class); merging them would be silently wrong.
            err(
              `The text contains more than one quiz: a second one starts at "Title: ${excerpt(c.value)}". ` +
                `The site takes one quiz at a time; paste or upload each one separately.`,
            );
          } else warn(`A second title line was ignored: "${excerpt(c.value)}".`);
        } else if (c.key === "note") {
          if (c.value === "") break;
          if (block === null) quizNotes.push(c.value);
          else block.notes.push(c.value);
        } else {
          warn(`Images are not supported yet; the line "${excerpt(raw.trim())}" was ignored.`);
        }
        break;
      case "answer":
        if (block === null) {
          err(`The answer line "${excerpt(raw.trim())}" comes before any question.`);
          break;
        }
        if (block.answers.length === 0) answered++;
        block.answers.push({ text: c.text, correct: c.correct });
        block.answerIndent = c.indent;
        break;
      case "ambiguous":
        err(
          `The line "${excerpt(raw.trim())}" starts with "${c.marker}", which doesn't say whether the answer is right or wrong. ` +
            `The correct answer's line starts with "+", the others with "-".`,
        );
        break;
      case "text": {
        const numbered = c.text.match(NUMBERING);
        const isNextNumber = numbered !== null && Number(numbered[1]) === answered + 1;
        if (block === null) {
          startBlock(c.text);
        } else if (block.answers.length > 0) {
          if (c.indent > block.answerIndent && block.notes.length === 0) {
            // A line indented deeper than the answer before it continues that answer.
            const last = block.answers[block.answers.length - 1];
            last.text = `${last.text} ${c.text}`;
          } else {
            startBlock(c.text);
          }
        } else if (isNextNumber && block.number !== answered + 1) {
          // A line numbered as the next question ends whatever stray text came
          // before it (preamble, an explanation after the previous answers).
          startBlock(c.text);
        } else {
          block.textLines.push(c.text);
        }
        break;
      }
    }
  }

  // Answerless text before the first question is the AI's preamble (or an
  // unmarked title); after the last question, its closing words. In between,
  // it is a question that lost its answers.
  const firstAnswered = blocks.findIndex((b) => b.answers.length > 0);
  let lastAnswered = -1;
  blocks.forEach((b, i) => {
    if (b.answers.length > 0) lastAnswered = i;
  });
  const questions: Question[] = [];
  blocks.forEach((b, i) => {
    const text = b.textLines.join("\n").trim();
    if (b.answers.length > 0) {
      questions.push({ text, answers: b.answers, note: b.notes.join("\n") });
      return;
    }
    const leading = firstAnswered === -1 || i < firstAnswered;
    const trailing = i > lastAnswered;
    if (leading && !trailing) {
      quizNotes.push(...b.notes);
      const single = b.textLines.length === 1 ? b.textLines[0].trim() : "";
      const looksLikeTitle =
        i === firstAnswered - 1 && single !== "" && single.length <= LONG_ANSWER && !/[:?]$/.test(single);
      if (title === null && looksLikeTitle) title = single;
      else warn(`Text before the first question was ignored: "${excerpt(text)}".`);
    } else if (trailing && firstAnswered !== -1) {
      warn(`Text after the last question was ignored: "${excerpt(text)}".`);
    } else if (firstAnswered === -1) {
      // No question anywhere; reported once below.
    } else {
      err(`The text "${excerpt(text)}" has no answer lines. Each question is followed by its answers, one per line, starting with "+" (correct) or "-" (wrong).`);
    }
  });

  if (questions.length === 0) {
    err(
      `No questions were found. A quiz has a "Title:" line, then questions, each followed by ${MIN_ANSWERS} to ${MAX_ANSWERS} answer lines; ` +
        `the correct answer's line starts with "+", the others with "-".`,
    );
  }

  questions.forEach((q, i) => {
    const num = i + 1;
    const label = q.text ? `Question ${num} ("${excerpt(q.text)}")` : `Question ${num}`;
    if (q.text === "") err(`${label} has answers but no question text.`);
    if (q.answers.length < MIN_ANSWERS) err(`${label} has only ${q.answers.length} answer; a question has ${MIN_ANSWERS} to ${MAX_ANSWERS}.`);
    if (q.answers.length > MAX_ANSWERS) err(`${label} has ${q.answers.length} answers; a question has at most ${MAX_ANSWERS}.`);
    if (!q.answers.some((a) => a.correct))
      err(`${label} has no answer marked correct. The correct answer's line starts with "+", the others with "-".`);
    const seen = new Set<string>();
    for (const a of q.answers) {
      const key = a.text.toLowerCase();
      if (a.text === "") err(`${label} has an empty answer line.`);
      else if (seen.has(key)) warn(`${label} has the answer "${excerpt(a.text, 40)}" twice.`);
      else if (a.text.length > LONG_ANSWER)
        warn(`${label}: the answer "${excerpt(a.text, 40)}" is ${a.text.length} characters long, which is hard to read on an answer button.`);
      seen.add(key);
    }
    if (q.text.length > LONG_QUESTION)
      warn(`${label} is ${q.text.length} characters long, which is a lot to read on a projector.`);
  });

  // Answer order is display order (each position has its colour). If the key
  // always sits in the same place, the class will notice. Questions where
  // more than one answer counts don't have a single position and are left out.
  const single = questions.filter((q) => q.answers.filter((a) => a.correct).length === 1);
  if (single.length >= 4) {
    const positions = single.map((q) => q.answers.findIndex((a) => a.correct));
    if (positions.every((p) => p === positions[0])) {
      warn(`The correct answer is in position ${positions[0] + 1} in every question.`);
    }
  }

  if (title === null || title === "") warn(`The quiz has no title.`);

  return {
    ok: errors.length === 0,
    quiz: { title: title ?? "", note: quizNotes.join("\n"), questions },
    errors,
    warnings,
  };
}
