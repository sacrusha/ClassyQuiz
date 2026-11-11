// The landing block's words (client/landing-text.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { LANGS, TEXT, askText, chosenLang } from "./landing-text.ts";

test("every language marks the same five parts of its sheets ask, in order, the site's address first", () => {
  for (const { id } of LANGS) {
    const t = TEXT[id];
    assert.deepEqual(t.ask.filter((p) => p.l !== undefined).map((p) => p.l), [0, 1, 2, 3, 4], id);
    assert.equal(t.ask.find((p) => p.l === 0)?.s, "classyquiz.pages.dev", id);
    assert.ok(askText(t).includes("classyquiz.pages.dev"), id);
  }
});

test("the language: a choice made here, else the browser's, else English", () => {
  assert.equal(chosenLang("fr", ["de-CH"]), "fr");
  assert.equal(chosenLang(null, ["rm", "de-CH", "en"]), "de");
  assert.equal(chosenLang("xx", ["IT-it"]), "it");
  assert.equal(chosenLang(null, ["es", "pt"]), "en");
  assert.equal(chosenLang(undefined, []), "en");
});

test("every language's other asks name the site's address, for the page to replace", () => {
  for (const { id } of LANGS) {
    const t = TEXT[id];
    for (const ask of [t.askIdea, t.askNotes, t.askTest, t.askHelp]) assert.ok(ask.includes("classyquiz.pages.dev"), `${id}: ${ask.slice(0, 40)}`);
  }
});

// French puts a narrow no-break space (U+202F) before : ; ? !, so a mark never starts a line: on the root page and on
// /example alike, a visitor going from one to the other (docs/translation-review.md, "French spaces").
test("French has no plain space before : ; ? ! on the root page or /example", async () => {
  const { EXAMPLE_TEXT, IDEA_TEXT, MOCK_TEXT } = await import("./example-text.ts");
  const bad: string[] = [];
  const walk = (v: unknown, at: string): void => {
    if (typeof v === "string") {
      if (/ [:;?!]/.test(v)) bad.push(`${at}: ${v.slice(0, 60)}`);
    } else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${at}.${k}`);
  };
  walk(TEXT.fr, "landing");
  walk(EXAMPLE_TEXT.fr, "example");
  walk(IDEA_TEXT.fr, "idea");
  walk(MOCK_TEXT.fr, "mock");
  assert.deepEqual(bad, []);
});

// The page's tabs are its examples, in the order example-text.ts has them, then the help ask (docs/design/root-page.md,
// "Getting a quiz"); each example's file on the static page is the English one, with its size.
test("the page's tabs are the examples', and each shows its own file", async () => {
  const { readFile } = await import("node:fs/promises");
  const { EXAMPLES } = await import("./example-text.ts");
  const { EXAMPLE_FILES } = await import("./example-files.ts");
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const ids = [...html.matchAll(/<button type="button" id="tab-(\w+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, [...EXAMPLES, "help"]);
  for (const ex of EXAMPLES) {
    const f = EXAMPLE_FILES[ex].en;
    const at = html.indexOf(`<div class="ex" id="ex-${ex}">`);
    assert.ok(at > 0, `${ex}: no panel`);
    const panel = html.slice(at, html.indexOf(`<div class="ex" id=`, at + 1));
    assert.ok(panel.includes(`<a class="zip" href="/examples/${f.zip}" download>`), `${ex}: its file`);
    assert.ok(panel.includes(`<span class="zipname">${f.zip}</span><span class="size">${TEXT.en.size(f.bytes)}<`), `${ex}: its name and size`);
    assert.ok(panel.includes(`/landing/face-${ex}-en.webp`), `${ex}: its face`);
  }
});

// The static page is what an AI's fetcher reads, and what stands until the script has run: it says what the
// English table says (docs/design/root-page.md, "One page, two readers", "Languages").
test("the static page carries the English table's words", async () => {
  const { readFile } = await import("node:fs/promises");
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const plain = (s: string) => s.replace(/&nbsp;/g, " ").replace(/&rsaquo;/g, "›").replace(/&darr;/g, "↓").replace(/&amp;/g, "&");
  const en = TEXT.en as unknown as Record<string, unknown>;
  const seen = new Set<string>();
  for (const m of html.matchAll(/ data-t="(\w+)"[^>]*>([^<]*)</g)) {
    assert.equal(plain(m[2]), en[m[1]], `data-t="${m[1]}"`);
    seen.add(m[1]);
  }
  for (const m of html.matchAll(/ alt="([^"]*)" data-t-alt="(\w+)"/g)) {
    assert.equal(plain(m[1]), en[m[2]], `data-t-alt="${m[2]}"`);
    seen.add(m[2]);
  }
  for (const m of html.matchAll(/ aria-label="([^"]*)" data-t-aria="(\w+)"/g)) {
    assert.equal(plain(m[1]), en[m[2]], `data-t-aria="${m[2]}"`);
    seen.add(m[2]);
  }
  for (const m of html.matchAll(/ title="([^"]*)" data-t-title="(\w+)"/g)) {
    assert.equal(plain(m[1]), en[m[2]], `data-t-title="${m[2]}"`);
    seen.add(m[2]);
  }
  // the Quizmaster's ask is the labelled ask, plain; the others as the table has them
  for (const [id, ask] of [["idea", TEXT.en.askIdea], ["sheets", askText(TEXT.en)], ["notes", TEXT.en.askNotes], ["test", TEXT.en.askTest], ["help", TEXT.en.askHelp]]) {
    assert.ok(html.includes(`<span class="said" id="ask-${id}">${ask}</span>`), `the ${id} ask differs from landing-text.ts's`);
  }
  for (const key of ["what", "tabIdea", "tabSheets", "tabNotes", "tabTest", "unsure", "help", "getH", "which", "gives", "see", "run", "upload"]) assert.ok(seen.has(key), `index.html has no ${key}`);
});

// The film (public/js/film.js) types the sheets ask, shows the words of the page's first screen and its first tab's file, and names its chapters and controls as this file has them, copied in when
// docs/film/build/sitebuild.py builds it; its pictures are rendered then too. A change here without a rebuild would leave
// the film saying the old words: this fails until sitebuild.py has run.
test("the built film carries this file's ask, the first screen's words and its own names", async () => {
  const { readFile } = await import("node:fs/promises");
  const { EXAMPLE_FILES } = await import("./example-files.ts");
  const js = await readFile(new URL("../public/js/film.js", import.meta.url), "utf8");
  const m = js.match(/const LANDING = (\{.*\});\n/);
  assert.ok(m, "no LANDING in public/js/film.js");
  const built = JSON.parse(m[1]);
  for (const { id } of LANGS) {
    const t = TEXT[id];
    const want = {
      ask: t.ask, code: t.code, what: t.what,
      getH: t.getH, which: t.which, tabIdea: t.tabIdea, tabSheets: t.tabSheets, tabNotes: t.tabNotes, tabTest: t.tabTest, unsure: t.unsure, askIdea: t.askIdea,
      gives: t.gives, playThis: t.playThis, see: t.see, run: t.run, upload: t.upload, drop: t.drop, reading: t.reading,
      capSheet: t.capSheet, capAi: t.capAi, capZip: t.capZip, capWall: t.capWall, capTap: t.capTap,
      play: t.play, pause: t.pause, speed: t.speed, seek: t.seek,
      // the first tab's file, as the page names it
      zipIdea: EXAMPLE_FILES.idea[id].zip, sizeIdea: t.size(EXAMPLE_FILES.idea[id].bytes),
    };
    assert.deepEqual(built[id], JSON.parse(JSON.stringify(want)), `${id}: run docs/film/build/sitebuild.py`);
  }
});
