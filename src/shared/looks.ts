// How a player dresses their animal in the lobby
// (docs/design/class-and-wall.md, "Dressing the avatar"): a background shape,
// a hat and a thing beside it, from one menu that is the same for everybody
// and every room, a class's or a training room's. The animal and its colour
// stay assigned and tell the players apart; the look is the player's own and
// is never scarce. The drawings are in client/look.ts, in this order.

/** Background shapes: 0 is the plain disc, the default. */
export const BACKGROUND_COUNT = 6;
/** Hats: 0 is none, the default. */
export const HAT_COUNT = 10;
/** The row beside the hats, held, worn at the neck or set before the animal ("tools"): 0 is none, the default. */
export const TOOL_COUNT = 8;
/**
 * Changes of look a player can make in one class. The looks are held in
 * memory and written at Start (docs/design/open-period-in-memory.md), so a
 * change costs no row and the cap is not part of what a class books. It
 * discourages an accidental flood of requests, and is far more than
 * exploring the menu takes.
 */
export const MAX_LOOK_CHANGES = 100;
/** The screens hear of the class's changed looks at most this often: one round of views for every child who changed in between. */
export const LOOK_SHOW_MS = 1000;

/** A look as the device and the server name it: absent fields are the defaults. */
export interface Look {
  b?: number;
  h?: number;
  t?: number;
}

/** A background, a hat and a tool the menu has. */
export function validLook(b: unknown, h: unknown, t: unknown): boolean {
  const inRange = (x: unknown, n: number) => Number.isInteger(x) && (x as number) >= 0 && (x as number) < n;
  return inRange(b, BACKGROUND_COUNT) && inRange(h, HAT_COUNT) && inRange(t, TOOL_COUNT);
}

export function sameLook(x: Look, y: Look): boolean {
  return (x.b ?? 0) === (y.b ?? 0) && (x.h ?? 0) === (y.h ?? 0) && (x.t ?? 0) === (y.t ?? 0);
}

/** A row of the menu: the shape ("b"), the hat ("h") or the tool ("t"). */
export type LookPart = "b" | "h" | "t";

/** The look after a tap on picture i of a row: a shape is always worn; the hat or tool worn comes off with a second tap. */
export function pickLook(now: Required<Look>, part: LookPart, i: number): Required<Look> {
  return { ...now, [part]: part !== "b" && i === now[part] ? 0 : i };
}
