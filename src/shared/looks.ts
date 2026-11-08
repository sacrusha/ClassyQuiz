// How a child dresses their animal in the lobby
// (docs/design/class-and-wall.md, "Dressing the avatar"): a background shape,
// a hat and a tool, from one menu that is the same for everybody and every
// room. The animal and its colour stay assigned and tell the
// children apart; the look is the child's own and is never scarce.
// The drawings are in client/look.ts, in this order.

/** Background shapes: 0 is the plain disc, the default. */
export const BACKGROUND_COUNT = 6;
/** Hats: 0 is none, the default. */
export const HAT_COUNT = 9;
/** Tools held beside the animal: 0 is none, the default. */
export const TOOL_COUNT = 7;
/**
 * Changes of look a child can store in one class. Generous for a child who
 * tries everything; it stops a child who makes a game of hammering the
 * pictures from spending the site's daily allowance (docs/design/class-and-wall.md,
 * "Dressing the avatar": each stored change is two rows).
 */
export const MAX_LOOK_CHANGES = 30;
/** The server stores the class's looks at most this often: one write covers every child who changed in between. */
export const LOOK_WRITE_MS = 1000;

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
