// The avatar drawings cover every look the menu offers. The winners' band on
// the wall: ten large and apart, more blurring together, never wider than the
// stage nor taller than the question's part of it.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ANIMAL_COUNT } from "../server/game.ts";
import { BACKGROUND_COUNT, HAT_COUNT } from "../shared/looks.ts";
import { JUMP, LOOK_DRAWINGS, avatarSvg, crowdHeight, crowdPlaces, finalSize, partySize } from "./look.ts";

test("the winners' band: up to ten apart, more overlap, all inside the stage", () => {
  // The stage of a 1366x768 wall, of one steering itself, of a 1024x768 one, and of a phone steering itself.
  for (const [w, h] of [[1298, 600], [1298, 540], [972, 600], [342, 560]]) {
    const ten = partySize(10, w, h);
    for (let n = 1; n <= 40; n++) {
      const L = partySize(n, w, h);
      const rows = Math.ceil(n / L.perRow);
      assert.ok(rows <= L.rows, `${w}: ${n} in ${L.rows} rows`);
      assert.ok(L.s + (L.perRow - 1) * L.step <= w + 0.5, `${w}: ${n} fit in the band's width`);
      assert.ok(L.s * (1 + JUMP) + (rows - 1) * L.rise <= L.band, `${w}: ${n} fit in the band's height, jump included`);
      assert.equal(L.band, ten.band, `${w}: the band is as high whatever the count`);
      assert.ok(L.band <= 0.3 * h, `${w}: the band takes under a third of the stage (${L.band} of ${h})`);
      if (n <= 10) assert.ok(L.step > L.s, `${w}: ${n} stand apart`);
      if (n > 10) assert.ok(L.s >= Math.floor((2 / 3) * ten.s), `${w}: ${n} no smaller than two thirds of ten`);
    }
    assert.ok(partySize(40, w, h).step < partySize(40, w, h).s, `${w}: forty overlap`);
  }
  // A short question beside its picture leaves 94 px above the tiles: the band stays within it.
  for (let n = 1; n <= 40; n++) {
    const L = partySize(n, 1298, 600, 94);
    assert.ok(L.band <= 94 && L.s * (1 + JUMP) <= L.band, `${n} in a band of 94 px (${L.band}, ${L.s} px)`);
  }
  // Ten in one row on the 1366 wall, about a seventh of its height; in two rows on a phone.
  assert.deepEqual([partySize(10, 1298, 600).rows, partySize(10, 342, 560).rows], [1, 2]);
  assert.ok(partySize(10, 1298, 600).s >= 100 && partySize(10, 342, 560).s >= 60, "ten large enough to tell apart");
});

test("dressing: every look the menu offers has a drawing", () => {
  assert.deepEqual(LOOK_DRAWINGS, { backgrounds: BACKGROUND_COUNT, hats: HAT_COUNT, seats: ANIMAL_COUNT, animals: ANIMAL_COUNT });
  for (let a = 0; a < ANIMAL_COUNT; a++)
    for (let b = 0; b < BACKGROUND_COUNT; b++)
      for (let h = 0; h < HAT_COUNT; h++) assert.doesNotMatch(avatarSvg({ a, c: 0, b, h }), /undefined|NaN/, `animal ${a}, background ${b}, hat ${h}`);
});

test("the final ranking: the crowd fits under the podium, whose avatars stay half again as large, and stands inside its box", () => {
  for (const [w, h] of [[900, 740], [560, 600], [1600, 1000]]) {
    for (const n of [0, 3, 10, 25, 40, 59]) {
      const { a, s } = finalSize(n, w, h);
      const crowd = n ? crowdHeight(n, w, s) - 0.25 * s : 0;
      assert.ok(crowd + 2.5 * a <= h + 1, `${n} on ${w}×${h}: crowd ${crowd} and podium ${2.5 * a} fit`);
      if (n > 0) assert.ok(a >= 1.5 * s, `${n} on ${w}×${h}: first place ${a} against the crowd's ${s}`);
      assert.ok(a <= (0.85 * w) / 3 + 1, "a step's avatar within its third of the width");
      const ids = Array.from({ length: n }, (_, i) => `p${i}`);
      const places = crowdPlaces(ids, w, s);
      const tall = crowdHeight(n, w, s);
      for (const p of places) assert.ok(p.x >= 0 && p.x + p.size <= w + 0.01 && p.y >= 0 && p.y + p.size <= tall + 0.07 * s, `${n} on ${w}×${h}: an avatar inside the crowd's box`);
      assert.deepEqual(crowdPlaces(ids, w, s), places, "the same places on every view");
    }
  }
  assert.ok(finalSize(5, 1600, 600).s > finalSize(50, 1600, 600).s, "where the height binds, a small class stands larger");
});
