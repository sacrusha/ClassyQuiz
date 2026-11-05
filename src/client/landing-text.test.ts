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
