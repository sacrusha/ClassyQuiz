// Pictures as answers: how a question's answer tiles are
// arranged, on the wall and on a student's device. Square pictures go two
// by two, wide strips (number lines) one under the other, tall ones side by
// side: whichever arrangement shows the smallest of the pictures largest.
// Colour and shape tell the answers apart, not their place, so the wall and
// a tablet may arrange the same answers differently.

/** What a tile takes around its picture: the tile's size minus its card's. */
export interface Chrome {
  w: number;
  h: number;
}

/**
 * "row": the shape, the card and the room for the votes side by side;
 * "col": the shape and the room for the votes above the card.
 */
export type Orient = "row" | "col";

export interface Grid {
  cols: number;
  rows: number;
  orient: Orient;
  /** The smallest picture's area in px², as laid out. */
  score: number;
}

/** A picture of this aspect (w/h) shown whole in a w×h box: its area. */
function contained(aspect: number, w: number, h: number): number {
  if (w <= 0 || h <= 0) return 0;
  return aspect >= w / h ? (w * w) / aspect : h * h * aspect;
}

/**
 * The arrangement for n tiles in a W×H area, gaps between them, each tile
 * losing `chrome` around its card. `aspects`: each answer's picture (w/h),
 * null for a text answer, which only needs a card of some size.
 */
export function chooseGrid(aspects: (number | null)[], W: number, H: number, gap: number, chrome: Record<Orient, Chrome>): Grid {
  const n = aspects.length;
  const pics = aspects.filter((a): a is number => a !== null && a > 0);
  const all = pics.length > 0 ? pics : [1];
  let best: Grid | null = null;
  let twoByTwo: Grid | null = null;
  for (const cols of [...new Set([1, 2, n])].filter((c) => c <= n)) {
    const rows = Math.ceil(n / cols);
    const tw = (W - (cols - 1) * gap) / cols;
    const th = (H - (rows - 1) * gap) / rows;
    for (const orient of ["row", "col"] as Orient[]) {
      const cw = tw - chrome[orient].w;
      const ch = th - chrome[orient].h;
      // A card too flat or too narrow for anything is no option.
      if (cw < 24 || ch < 24) continue;
      const score = Math.min(...all.map((a) => contained(a, cw, ch)));
      const g = { cols, rows, orient, score };
      if (!best || score > best.score) best = g;
      if (cols === 2 && n > 2 && (!twoByTwo || score > twoByTwo.score)) twoByTwo = g;
    }
  }
  // Two by two is what a class knows from the text tiles: kept unless another shows the pictures clearly larger.
  if (best && twoByTwo && twoByTwo.score >= 0.85 * best.score) return twoByTwo;
  return best ?? { cols: Math.min(2, n), rows: Math.ceil(n / Math.min(2, n)), orient: "col", score: 0 };
}
