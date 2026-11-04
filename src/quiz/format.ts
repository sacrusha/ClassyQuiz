// Quiz text format: the parser.
//
// The specification lives on the guidance page (src/public/index.html,
// "How quizzes are built"), because that is where AIs and teachers read it.
// This module implements it; keep the two in step.
//
// Design (docs/design/quiz-format.md): the correct answer is marked on its own line;
// the parser forgives what AIs typically add or vary and rejects only what it
// cannot read unambiguously; error messages name the question and are written
// so a teacher can paste them back to the AI.

export interface Answer {
  /** "" for a picture answer. */
  text: string;
  /** Picking this answer counts as right. Any number of a question's answers may count, at least one. */
  correct: boolean;
  /**
   * A picture as the answer ("+ Image: b.png"): a file name as
   * written, matched by `imageKey`. Absent for a text answer; "" for a
   * picture answer whose file was left out (it shows its colour and shape alone).
   */
  image?: string;
}

export interface Question {
  text: string;
  answers: Answer[];
  /** The picture shown with the question: a file name as written in the quiz, matched by `imageKey`; "" for none. */
  image: string;
  /** The picture behind this question, in place of the quiz's background; "" for none of its own. */
  background: string;
  /** "Order: fixed": the answers keep the text's order on screen; otherwise the site shuffles them. */
  keepOrder: boolean;
}

export interface Quiz {
  title: string;
  /** The picture behind every question that has no background of its own; "" for none. */
  background: string;
  questions: Question[];
}

/** A picture the quiz names, with the words that name it in messages. */
export interface PictureRef {
  name: string;
  kind: "image" | "background" | "answer";
  /** The question's index, or null for the quiz's background. */
  question: number | null;
  /** For kind "answer": the answer's index in the text. */
  answer?: number;
  /** "Question 3 shows the picture "q3.png"", "The quiz has the background "x.jpg"". */
  label: string;
  /** "Question 3 runs without its picture "q3.png"". */
  leftOut: string;
}

/** Every picture the quiz names, in order: the quiz's background, then each question's picture, background and answer pictures. */
export function pictureRefs(quiz: Quiz): PictureRef[] {
  const refs: PictureRef[] = [];
  if (quiz.background) {
    const b = quiz.background;
    refs.push({ name: b, kind: "background", question: null, label: `The quiz has the background "${b}"`, leftOut: `The quiz runs without its background "${b}".` });
  }
  quiz.questions.forEach((q, i) => {
    if (q.image) {
      refs.push({ name: q.image, kind: "image", question: i, label: `Question ${i + 1} shows the picture "${q.image}"`, leftOut: `Question ${i + 1} runs without its picture "${q.image}".` });
    }
    if (q.background) {
      const b = q.background;
      refs.push({ name: b, kind: "background", question: i, label: `Question ${i + 1} has the background "${b}"`, leftOut: `Question ${i + 1} runs without its background "${b}".` });
    }
    q.answers.forEach((a, j) => {
      if (!a.image) return;
      refs.push({
        name: a.image,
        kind: "answer",
        question: i,
        answer: j,
        label: `Question ${i + 1} has the picture "${a.image}" as a choice`,
        leftOut: `Question ${i + 1} runs without its picture choice "${a.image}": that choice shows only its colour and shape.`,
      });
    });
  });
  return refs;
}

/** Takes a picture off the quiz, for a quiz that runs without it. */
export function dropPicture(quiz: Quiz, ref: PictureRef): void {
  if (ref.question === null) quiz.background = "";
  else if (ref.kind === "answer") quiz.questions[ref.question].answers[ref.answer!].image = "";
  else quiz.questions[ref.question][ref.kind] = "";
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

// Removed everywhere: zero-width space, word joiner, BOM. ZWNJ/ZWJ
// (U+200C/U+200D) are kept: they carry meaning in Persian, Indic scripts and
// emoji.
const INVISIBLES = /[​⁠﻿]/g;
// Bidi controls are stripped only at the start of a line, so a marker typed
// in right-to-left text is still recognised.
const LEADING_BIDI = /^[‎‏؜‪-‮⁦-⁩]+/;

type Keyword = "title" | "note" | "image" | "background" | "order" | "tempo" | "time";

type Classified =
  | { kind: "blank" }
  | { kind: "keyword"; key: Keyword; value: string }
  | { kind: "answer"; correct: boolean; text: string; indent: number }
  | { kind: "ambiguous"; marker: string; text: string }
  | { kind: "text"; text: string; indent: number };

function stripWrappingEmphasis(s: string): string {
  const m = s.match(/^(\*\*|__)(.+)\1$/);
  return m ? m[2].trim() : s;
}

function indentWidth(raw: string): number {
  const m = raw.match(/^\s*/);
  return m ? m[0].replace(/\t/g, "    ").length : 0;
}

function classify(raw: string): Classified {
  const indent = indentWidth(raw);
  const s = raw.trim().replace(LEADING_BIDI, "").trim();
  if (s === "") return { kind: "blank" };

  // Checkbox lists, a common AI habit: "- [x] right", "- [ ] wrong", "[x] right".
  let m = s.match(/^(?:[-*+]\s+)?\[([\sxX✓✔])\]\s+(.*)$/);
  if (m) return { kind: "answer", correct: /\S/.test(m[1]), text: m[2].trim(), indent };

  m = s.match(/^[+＋]\s+(.*)$/);
  if (m) return { kind: "answer", correct: true, text: m[1].trim(), indent };

  // "-" marks a wrong answer. Dashes and minus signs are accepted because
  // editors and phone keyboards substitute them.
  m = s.match(/^[-–—−]\s+(.*)$/);
  if (m) return { kind: "answer", correct: false, text: m[1].trim(), indent };

  // "*" and "•" look like answers but don't say whether they're right or wrong.
  m = s.match(/^([*•])\s+(.*)$/);
  if (m) return { kind: "ambiguous", marker: m[1], text: m[2].trim() };

  // A Markdown image on a line of its own, "![figure](q3.png)", is an AI's
  // way of writing an Image: line.
  if (/^!\[[^\]]*\]\([^)]*\)$/.test(s)) return { kind: "keyword", key: "image", value: s };

  // Keywords, possibly dressed up as Markdown: "## Title: x", "**Title:** x", "**Note**: x".
  const unheaded = s.replace(/^#{1,6}\s+/, "");
  m = unheaded.match(/^([*_]{0,2})(title|note|image|background|order|tempo|time)[*_]{0,2}\s*:\s*[*_]{0,2}\s*(.*)$/i);
  if (m) {
    let value = m[3].trim();
    if (m[1]) value = value.replace(/(\*\*|__)$/, "").trim();
    return { kind: "keyword", key: m[2].toLowerCase() as Keyword, value };
  }

  return { kind: "text", text: stripWrappingEmphasis(unheaded), indent };
}

/** File types a picture can come as; whether the browser can read it is the upload's concern. */
const PICTURE_FILE = /^(.*?\.(?:png|jpe?g|gif|webp|svg|bmp|avif|heic|heif))(?=$|[\s`"'”’>»),;:])/i;

/**
 * The file name on an Image: line, without what an AI may wrap around it:
 * Markdown image or link syntax, quotes, backticks, a description after it.
 * Null when the line names no picture file.
 */
function pictureName(value: string): string | null {
  let v = value.trim();
  const md = v.match(/^!?\[[^\]]*\]\(\s*<?([^)>]+?)>?(?:\s+["'“][^)]*)?\s*\)/);
  if (md) v = md[1];
  v = v.replace(/^[`"'“‘<«]+/, "");
  const m = v.match(PICTURE_FILE);
  return m ? m[1].trim() : null;
}

/**
 * How a picture's name is matched against the files that came with the quiz:
 * folders, case and Unicode composition don't matter, so "Bilder/Q3.PNG" in
 * the archive is the "q3.png" the quiz names.
 */
export function imageKey(name: string): string {
  return name.replace(/^.*[/\\]/, "").normalize("NFC").toLowerCase();
}

/** An answer that is only a file name: probably meant as a picture, but shown as text. */
const BARE_PICTURE = /^[^\s/\\]+\.(?:png|jpe?g|gif|webp|svg)$/i;

/**
 * An answer line's text as a picture answer: "Image: b.png", dressed like
 * an Image: line ("**Image:** b.png", "![a pie](b.png)", a description after
 * the name). The file name; a problem when it names none or points to the
 * web; null when the answer is text.
 */
function answerPicture(text: string): string | { problem: (label: string) => string } | null {
  let value: string;
  const kw = text.match(/^[*_]{0,2}image[*_]{0,2}\s*:\s*[*_]{0,2}\s*(.*)$/i);
  if (kw) value = kw[1].replace(/(\*\*|__)$/, "").trim();
  else if (/^!\[[^\]]*\]\(/.test(text)) value = text;
  else return null;
  const line = excerpt(text, 40);
  if (/[a-z]:\/\//i.test(value))
    return { problem: (label) => `${label}: the choice "${line}" points to the web. The site doesn't load pictures from the web; a picture comes as a file in the .zip, together with the quiz text.` };
  const name = pictureName(value);
  if (name === null) return { problem: (label) => `${label}: the choice "${line}" names no picture file. It names the file in the .zip, e.g. "+ Image: b.png".` };
  return name;
}

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

interface Block {
  textLines: string[];
  answers: Answer[];
  /** A "Note:" line came after the answers: an indented line after it doesn't continue the last answer. */
  noted: boolean;
  number: number | null;
  /** Indentation of the last answer line, to recognise its continuation. */
  answerIndent: number;
  image: string;
  background: string;
  keepOrder: boolean;
  /** Problems with the block's Image:/Background: lines, worded once the question's number is known. */
  pictureProblems: ((label: string) => string)[];
  /** Image:/Background: lines after the answers so far; errors unless more answers follow. */
  afterAnswers: { kind: "image" | "background"; line: string }[];
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

  // Non-breaking spaces stay: an author who wrote "1 000 000" with them wants
  // it kept on one line. Every pattern here reads them as spaces anyway.
  const normalised = input.replace(/\r\n?/g, "\n").replace(INVISIBLES, "");
  const lines = selectBody(normalised.split("\n"));

  let title: string | null = null;
  let quizBackground = "";
  let quizKeepOrder = false;
  const blocks: Block[] = [];
  let current: Block | null = null;

  // Blocks that have answers so far, kept as a count: recounting on every
  // line would be quadratic in the number of questions.
  let answered = 0;

  const startBlock = (text: string) => {
    const m = text.match(NUMBERING);
    const expected = answered + 1;
    let number: number | null = null;
    if (m && Number(m[1]) === expected) {
      text = text.slice(m[0].length);
      number = expected;
    }
    current = { textLines: [text], answers: [], noted: false, number, answerIndent: 0, image: "", background: "", keepOrder: false, pictureProblems: [], afterAnswers: [] };
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
            // dropped without a warning.
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
          // The quiz carries no messages from the AI to the teacher
          // (docs/design/quiz-format.md, "The quiz carries no notes"); one an
          // AI still writes is dropped, not a failed paste.
          if (block !== null) block.noted = true;
        } else if (c.key === "tempo" || c.key === "time") {
          // "Tempo:" and "Time:" are not format lines (the pace is the
          // teacher's), but an AI may still write them: dropped like a note
          // rather than read as question text.
          if (block !== null && block.answers.length > 0) block.noted = true;
        } else if (c.key === "order") {
          // "Order: fixed" keeps the answers as written; the site shuffles
          // them otherwise. Before the first question it holds for all. After
          // the answers it still means the question above: unlike a picture,
          // it can't be meant for the next one, whose text hasn't started.
          const keep = !/^(shuffle|shuffled|random|mixed|mix)\b/i.test(c.value);
          if (block === null) quizKeepOrder = keep;
          else {
            block.keepOrder = keep;
            if (block.answers.length > 0) block.noted = true;
          }
        } else {
          const kind = c.key;
          const line = excerpt(raw.trim());
          const name = pictureName(c.value);
          let problem: ((label: string) => string) | null = null;
          if (/[a-z]:\/\//i.test(c.value)) {
            problem = (label) =>
              `${label}: the line "${line}" points to the web. The site doesn't load pictures from the web; a picture comes as a file in the .zip, together with the quiz text.`;
          } else if (name === null) {
            problem = (label) => `${label}: the line "${line}" names no picture file. It names the file in the .zip, e.g. "${kind === "image" ? "Image" : "Background"}: q3.png".`;
          }
          if (block === null) {
            // Before the first question: a background for the whole quiz.
            if (kind === "image") {
              err(
                `The line "${line}" comes before any question. A question's picture goes after the question text, before the choices; ` +
                  `a picture behind every question is a "Background:" line before the first question.`,
              );
            } else if (problem) err(problem("The quiz's background"));
            else if (quizBackground !== "") err(`The quiz has more than one "Background:" line before the first question.`);
            else quizBackground = name!;
            break;
          }
          if (problem) block.pictureProblems.push(problem);
          else if (block[kind] !== "") {
            block.pictureProblems.push((label) =>
              kind === "image"
                ? `${label} has more than one picture. A question shows one; combine them into one picture file. ` +
                  `Pictures as choices are choice lines, each with its mark: "+ Image: b.png", "- Image: c.png".`
                : `${label} has more than one background.`,
            );
          } else {
            block[kind] = name!;
            if (block.answers.length > 0) block.afterAnswers.push({ kind, line });
          }
        }
        break;
      case "answer":
        if (block === null) {
          err(`The choice line "${excerpt(raw.trim())}" comes before any question.`);
          break;
        }
        if (block.answers.length === 0) answered++;
        block.answers.push({ text: c.text, correct: c.correct });
        block.afterAnswers = [];
        block.answerIndent = c.indent;
        break;
      case "ambiguous":
        err(
          `The line "${excerpt(raw.trim())}" starts with "${c.marker}", which doesn't say whether the choice is right or wrong. ` +
            `A right choice's line starts with "+", the others with "-".`,
        );
        break;
      case "text": {
        const numbered = c.text.match(NUMBERING);
        const isNextNumber = numbered !== null && Number(numbered[1]) === answered + 1;
        if (block === null) {
          startBlock(c.text);
        } else if (block.answers.length > 0) {
          if (c.indent > block.answerIndent && !block.noted) {
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
  const questionBlocks: Block[] = [];
  blocks.forEach((b, i) => {
    const text = b.textLines.join("\n").trim();
    if (b.answers.length > 0) {
      questions.push({ text, answers: b.answers, image: b.image, background: b.background, keepOrder: b.keepOrder });
      questionBlocks.push(b);
      return;
    }
    const leading = firstAnswered === -1 || i < firstAnswered;
    const trailing = i > lastAnswered;
    if (leading && !trailing) {
      // Picture lines under an unmarked title, before the first question.
      for (const problem of b.pictureProblems) err(problem("Before the first question"));
      if (b.background && quizBackground) err(`The quiz has more than one "Background:" line before the first question.`);
      else if (b.background) quizBackground = b.background;
      if (b.keepOrder) quizKeepOrder = true;
      if (b.image) {
        err(
          `The picture "${b.image}" comes before any question. A question's picture goes after the question text, before the choices; ` +
            `a picture behind every question is a "Background:" line before the first question.`,
        );
      }
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
      err(`The text "${excerpt(text)}" has no choice lines. Each question is followed by its choices, one per line, starting with "+" (right) or "-" (wrong).`);
    }
  });

  if (questions.length === 0) {
    err(
      `No questions were found. A quiz has a "Title:" line, then questions, each followed by ${MIN_ANSWERS} to ${MAX_ANSWERS} choice lines; ` +
        `a right choice's line starts with "+", the others with "-".`,
    );
  }

  // Answer letters an AI adds out of habit ("A) 3", "B) 4") would land on
  // shuffled tiles, the "A" third: dropped, like a question's number. Only
  // when every answer of the question carries the next letter from A, and
  // the answers are shuffled; under "Order: fixed" letters may be meant.
  for (const q of questions) if (!q.keepOrder && !quizKeepOrder) dropAnswerLetters(q.answers);

  questions.forEach((q, i) => {
    const num = i + 1;
    const label = q.text ? `Question ${num} ("${excerpt(q.text)}")` : `Question ${num}`;
    if (q.text === "") err(`${label} has choices but no question text.`);
    if (q.answers.length < MIN_ANSWERS) err(`${label} has only ${q.answers.length} choice; a question has ${MIN_ANSWERS} to ${MAX_ANSWERS}.`);
    if (q.answers.length > MAX_ANSWERS) err(`${label} has ${q.answers.length} choices; a question has at most ${MAX_ANSWERS}.`);
    if (!q.answers.some((a) => a.correct))
      err(`${label} has no choice marked right. A right choice's line starts with "+", the others with "-".`);
    // Pictures as answers: "+ Image: b.png". Read here, after
    // the answer letters are gone, so "A) Image: b.png" is a picture too.
    for (const a of q.answers) {
      const pic = answerPicture(a.text);
      if (pic === null) {
        if (BARE_PICTURE.test(a.text))
          warn(`${label}: the choice "${excerpt(a.text, 40)}" is shown as text. A picture as a choice is written "+ Image: ${a.text}" (or "- Image: …").`);
        continue;
      }
      a.text = "";
      if (typeof pic === "string") a.image = pic;
      else {
        err(pic.problem(label));
        a.image = "";
      }
    }
    const seen = new Set<string>();
    for (const a of q.answers) {
      if (a.image !== undefined) {
        if (a.image === "") continue;
        const key = `\u0000${imageKey(a.image)}`;
        if (seen.has(key)) warn(`${label} has the picture "${excerpt(a.image, 40)}" as two choices.`);
        seen.add(key);
        continue;
      }
      const key = a.text.toLowerCase();
      if (a.text === "") err(`${label} has an empty choice line.`);
      else if (seen.has(key)) warn(`${label} has the choice "${excerpt(a.text, 40)}" twice.`);
      else if (a.text.length > LONG_ANSWER)
        warn(`${label}: the choice "${excerpt(a.text, 40)}" is ${a.text.length} characters long, which is hard to read on a button.`);
      seen.add(key);
    }
    if (q.text.length > LONG_QUESTION)
      warn(`${label} is ${q.text.length} characters long, which is a lot to read on a projector.`);
    const b = questionBlocks[i];
    for (const problem of b.pictureProblems) err(problem(label));
    // After the answers, the line could as well be meant for the next
    // question, whose figure an AI may put above it; guessing would show a
    // figure with the wrong question.
    for (const { kind, line } of b.afterAnswers) {
      err(
        `${label}: the line "${line}" comes after the choices, so it's unclear which question the ${kind === "image" ? "picture" : "background"} belongs to. ` +
          `Its line goes after the question text, before the choices.` +
          (kind === "image" ? ` A picture as a choice is a choice line with its mark: "+ Image: b.png", "- Image: c.png".` : ""),
      );
      q[kind] = "";
    }
  });

  // Where the key sits in the text isn't checked: the site shuffles the
  // answers (docs/design/quiz-format.md, "Answers are shuffled; `Order: fixed` keeps an order").
  if (quizKeepOrder) for (const q of questions) q.keepOrder = true;

  if (title === null || title === "") warn(`The quiz has no title.`);

  return {
    ok: errors.length === 0,
    quiz: { title: title ?? "", background: quizBackground, questions },
    errors,
    warnings,
  };
}

// "A) ", "(a) ", "B. ", "C: ": a letter in front of an answer.
const ANSWER_LETTER = /^\(?([A-Za-z])\s*([).:])\s+(?=\S)/;

function dropAnswerLetters(answers: Answer[]): void {
  if (answers.length < 2) return;
  const found = answers.map((a) => a.text.match(ANSWER_LETTER));
  const first = found[0];
  if (!first || !/[Aa]/.test(first[1])) return;
  const ok = found.every((m, i) => m !== null && m[1] === String.fromCharCode(first[1].charCodeAt(0) + i) && m[2] === first[2]);
  if (!ok) return;
  answers.forEach((a, i) => (a.text = a.text.slice(found[i]![0].length)));
}
