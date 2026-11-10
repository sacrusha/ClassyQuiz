// The pages a quiz plays on speak the device's language (client/room-text.ts),
// the server's messages included, which come in English.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CLASS_FULL, CLASS_STARTED, CLASS_WAITING, ROOM_FULL, ROOM_STARTED } from "../shared/limits.ts";
import { TOO_MANY_CODES, WRONG_TEACHER_CODE } from "../shared/protocol.ts";
import { LOOK_DRAWINGS } from "./look.ts";
import { ROOM_TEXT } from "./room-text.ts";

test("every message the server says has words in German, French and Italian", async () => {
  const sources = await Promise.all(["../server/game.ts", "../server/instance.ts", "../functions/api/[[path]].ts"].map((f) => readFile(new URL(f, import.meta.url), "utf8")));
  // A sentence, not a code ("gone", "quota"): the pages show these.
  const said = sources.flatMap((s) => [...s.matchAll(/(?:GameError\(|error: |reason: )"([A-Z][^"]+[.?])"/g)].map((m) => m[1]));
  assert.ok(said.length > 20, `only ${said.length} messages found`);
  const all = [...new Set([...said, CLASS_FULL, CLASS_STARTED, CLASS_WAITING, ROOM_FULL, ROOM_STARTED, TOO_MANY_CODES, WRONG_TEACHER_CODE])];
  for (const l of ["de", "fr", "it"] as const) {
    const missing = all.filter((m) => !ROOM_TEXT[l].server[m]);
    assert.deepEqual(missing, [], `${l} has no words for these`);
  }
});

test("every avatar's parts and every tile's shape have a name in each language", () => {
  for (const [l, t] of Object.entries(ROOM_TEXT)) {
    assert.equal(t.animals.length, LOOK_DRAWINGS.animals, `${l}: animals`);
    assert.equal(t.backgrounds.length, LOOK_DRAWINGS.backgrounds, `${l}: backgrounds`);
    assert.equal(t.hats.length, LOOK_DRAWINGS.hats, `${l}: hats`);
    assert.equal(t.tools.length, LOOK_DRAWINGS.tools, `${l}: tools`);
    assert.equal(t.shapes.length, 4, `${l}: shapes`);
  }
});
