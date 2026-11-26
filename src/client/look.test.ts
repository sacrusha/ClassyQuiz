import { test } from "node:test";
import assert from "node:assert/strict";
import { ANIMAL_COUNT } from "../server/game.ts";
import { BACKGROUND_COUNT, HAT_COUNT, TOOL_COUNT } from "../shared/looks.ts";
import { JUMP, LOOK_DRAWINGS, avatarSvg, crowdHeight, crowdPlaces, finalSize, partySize } from "./look.ts";

test("the winners' band: any count fits inside it, jump included, and it stays above the tiles", () => {
  // The stage of a 1366x768 wall, of one steering itself, of a 1024x768 one, and of a phone steering itself.
  for (const [w, h] of [[1298, 600], [1298, 540], [972, 600], [342, 560]]) {
    for (let n = 1; n <= 40; n++) {
      const L = partySize(n, w, h);
      const rows = Math.ceil(n / L.perRow);
      assert.ok(rows <= L.rows, `${w}: ${n} in ${L.rows} rows`);
      assert.ok(L.s + (L.perRow - 1) * L.step <= w + 0.5, `${w}: ${n} fit in the band's width`);
      assert.ok(L.s * (1 + JUMP) + (rows - 1) * L.rise <= L.band, `${w}: ${n} fit in the band's height, jump included`);
      // A short question beside its picture leaves 94 px above the tiles, where the key is.
      const low = partySize(n, w, h, 94);
      assert.ok(low.band <= 94 && low.s * (1 + JUMP) <= low.band, `${w}: ${n} in a band of 94 px (${low.band}, ${low.s} px)`);
    }
  }
});

test("dressing: every look the menu offers has a drawing", () => {
  assert.deepEqual(LOOK_DRAWINGS, { backgrounds: BACKGROUND_COUNT, hats: HAT_COUNT, tools: TOOL_COUNT, seats: ANIMAL_COUNT, animals: ANIMAL_COUNT });
  for (let a = 0; a < ANIMAL_COUNT; a++)
    for (let b = 0; b < BACKGROUND_COUNT; b++)
      for (let h = 0; h < HAT_COUNT; h++)
        for (let t = 0; t < TOOL_COUNT; t++) assert.doesNotMatch(avatarSvg({ a, c: 0, b, h, t }), /undefined|NaN/, `animal ${a}, background ${b}, hat ${h}, tool ${t}`);
});

test("the final ranking: the crowd stands inside its box, the same on every view; where the height binds, a small class stands larger", () => {
  for (const [w, h] of [[900, 740], [560, 600], [1600, 1000]]) {
    for (const n of [0, 3, 10, 25, 40, 59]) {
      const { s } = finalSize(n, w, h);
      const ids = Array.from({ length: n }, (_, i) => `p${i}`);
      const places = crowdPlaces(ids, w, s);
      const tall = crowdHeight(n, w, s);
      for (const p of places) assert.ok(p.x >= 0 && p.x + p.size <= w + 0.01 && p.y >= 0 && p.y + p.size <= tall + 0.07 * s, `${n} on ${w}×${h}: an avatar inside the crowd's box`);
      assert.deepEqual(crowdPlaces(ids, w, s), places, "the same places on every view");
    }
  }
  assert.ok(finalSize(5, 1600, 600).s > finalSize(50, 1600, 600).s, "where the height binds, a small class stands larger");
});
