// The landing block's words (client/landing-text.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { LANGS, TEXT, askText, chosenLang } from "./landing-text.ts";

test("every language labels the same five parts of its ask, in order, the site's address first", () => {
  for (const { id } of LANGS) {
    const t = TEXT[id];
    assert.equal(t.labels.length, 5, id);
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

test("every language's chess and open asks name the site's address, for the page to replace", () => {
  for (const { id } of LANGS) {
    assert.ok(TEXT[id].askChess.includes("classyquiz.pages.dev"), id);
    assert.ok(TEXT[id].ask2.includes("classyquiz.pages.dev"), id);
  }
});

// The film (public/js/film.js) types the example ask and shows the Run box's words as this file has them, copied in when
// docs/film/build/sitebuild.py builds it; its pictures are rendered then too. A change here without a rebuild would leave
// the film saying the old words: this fails until sitebuild.py has run.
test("the built film carries this file's ask and Run box words", async () => {
  const { readFile } = await import("node:fs/promises");
  const js = await readFile(new URL("../public/js/film.js", import.meta.url), "utf8");
  const m = js.match(/const LANDING = (\{.*\});\n/);
  assert.ok(m, "no LANDING in public/js/film.js");
  const built = JSON.parse(m[1]);
  for (const { id } of LANGS) {
    const t = TEXT[id];
    const want = { ask: t.ask, code: t.code, run: t.run, upload: t.upload, drop: t.drop, reading: t.reading };
    assert.deepEqual(built[id], JSON.parse(JSON.stringify(want)), `${id}: run docs/film/build/sitebuild.py`);
  }
});
