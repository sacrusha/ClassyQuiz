// The landing's film (public/js/film.js, built from docs/film/build/film.js) draws the site's own screens with the
// site's own words (docs/film/README.md, Situation; docs/film/film-text.md). They are copied into its SITE when the
// film is made, so a screen that changes its words would leave the film showing a site that isn't there any more:
// this fails until the film's source and its build follow (docs/film/build/sitebuild.py).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

test("every word the built film quotes from the site's screens is in the site's code", async () => {
  const js = await readFile(new URL("../public/js/film.js", import.meta.url), "utf8");
  const m = js.match(/\n {2}const SITE = (\{\n[\s\S]*?\n {2}\});\n/);
  assert.ok(m, "no SITE in public/js/film.js: run docs/film/build/sitebuild.py");
  const site: unknown = new Function(`return ${m[1]};`)();
  // the strings it quotes; a how-to piece with a kind is a value the screen fills in (the address, the teacher code)
  const quoted: string[] = [];
  const walk = (v: unknown): void => {
    if (typeof v === "string") quoted.push(v);
    else if (Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && typeof v[1] === "string") return;
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(site);
  assert.ok(quoted.length > 20, `only ${quoted.length} words in SITE`);
  // the pages' code, and the shared words some of their screens show (the server's messages, shared/limits.ts)
  const read = async (d: string): Promise<string> => {
    const dir = new URL(d, import.meta.url);
    const names = (await readdir(dir)).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
    return (await Promise.all(names.map((f) => readFile(new URL(f, dir), "utf8")))).join("\n");
  };
  const code = `${await read("./")}\n${await read("../shared/")}`;
  // ▶ is an icon or an entity in the code, beside the words
  const missing = quoted.map((s) => s.replace(/▶/g, "").trim()).filter((s) => s && !code.includes(s));
  assert.deepEqual(missing, [], "the film shows words the site no longer has: change docs/film/build/film.js (SITE) and run docs/film/build/sitebuild.py");
});
