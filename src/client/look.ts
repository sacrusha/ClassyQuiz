// The pictures of the game: avatars and answer marks. Drawn as SVG here, not
// emoji, so a child's fox looks the same on an Android tablet as on the
// school laptop's projector (docs/decisions.md, "Avatars"). An avatar is an
// animal on a colour, assigned, and the look its child gave it in the lobby:
// a background shape and a hat (docs/avatars.md).

import type { Avatar } from "../shared/protocol.ts";
import { BACKGROUND_COUNT, HAT_COUNT } from "../shared/looks.ts";

/** Disc colours of avatars, told apart by the class: "the frog on purple". */
const AVATAR_COLOURS = ["#e5484d", "#3e7bfa", "#f5c518", "#8e4ec6", "#12a594", "#e93d82", "#7cb518", "#1f3a8a"];
const ANIMAL_NAMES = ["cat", "dog", "fox", "bear", "rabbit", "owl", "frog", "pig", "mouse", "lion", "panda", "penguin"];

const EYE = (x: number, y: number, r = 4.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#1b1b1f"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.33}" fill="#fff"/>`;
const EYES = (y = 52, dx = 11, r?: number) => EYE(50 - dx, y, r) + EYE(50 + dx, y, r);
const SMILE = (y = 66, w = 7) => `<path d="M${50 - w} ${y} Q50 ${y + w * 0.8} ${50 + w} ${y}" stroke="#1b1b1f" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
const WHISKERS = (y = 64) =>
  `<g stroke="#1b1b1f" stroke-width="1.6" stroke-linecap="round" opacity=".7"><path d="M36 ${y}H22M36 ${y + 4}L23 ${y + 8}M64 ${y}H78M64 ${y + 4}L77 ${y + 8}"/></g>`;

const ANIMALS: (() => string)[] = [
  // cat
  () =>
    `<path d="M24 46 L27 18 L44 32Z M76 46 L73 18 L56 32Z" fill="#8a8f98"/><path d="M29 38 L30 25 L39 32Z M71 38 L70 25 L61 32Z" fill="#f2a7b5"/>` +
    `<circle cx="50" cy="56" r="27" fill="#8a8f98"/>${EYES(52, 10)}<path d="M46 61 H54 L50 65Z" fill="#e8798e"/>${WHISKERS(63)}`,
  // dog
  () =>
    `<circle cx="50" cy="54" r="26" fill="#c08a55"/><ellipse cx="25" cy="52" rx="9" ry="18" fill="#7a4f2a" transform="rotate(18 25 52)"/>` +
    `<ellipse cx="75" cy="52" rx="9" ry="18" fill="#7a4f2a" transform="rotate(-18 75 52)"/><ellipse cx="50" cy="66" rx="13" ry="10" fill="#ead2b5"/>` +
    `${EYES(50, 10)}<ellipse cx="50" cy="62" rx="5.5" ry="4" fill="#1b1b1f"/>${SMILE(69, 5)}`,
  // fox
  () =>
    `<path d="M22 44 L26 14 L44 34Z M78 44 L74 14 L56 34Z" fill="#e8742a"/><path d="M28 36 L29 22 L38 32Z M72 36 L71 22 L62 32Z" fill="#3b2418"/>` +
    `<path d="M22 46 Q50 22 78 46 Q74 74 50 82 Q26 74 22 46Z" fill="#e8742a"/><path d="M28 56 Q40 62 50 80 Q34 74 28 56Z M72 56 Q60 62 50 80 Q66 74 72 56Z" fill="#fff"/>` +
    `${EYES(52, 11)}<ellipse cx="50" cy="74" rx="4.5" ry="3.5" fill="#1b1b1f"/>`,
  // bear
  () =>
    `<circle cx="28" cy="32" r="10" fill="#7a5134"/><circle cx="72" cy="32" r="10" fill="#7a5134"/><circle cx="28" cy="32" r="5" fill="#c99a6b"/><circle cx="72" cy="32" r="5" fill="#c99a6b"/>` +
    `<circle cx="50" cy="55" r="27" fill="#7a5134"/><ellipse cx="50" cy="65" rx="12" ry="9" fill="#c99a6b"/>${EYES(50, 11)}<ellipse cx="50" cy="61" rx="5" ry="3.6" fill="#1b1b1f"/>${SMILE(68, 4)}`,
  // rabbit
  () =>
    `<ellipse cx="38" cy="22" rx="7" ry="20" fill="#e4dfd9"/><ellipse cx="62" cy="22" rx="7" ry="20" fill="#e4dfd9"/><ellipse cx="38" cy="22" rx="3.4" ry="14" fill="#f2a7b5"/><ellipse cx="62" cy="22" rx="3.4" ry="14" fill="#f2a7b5"/>` +
    `<circle cx="50" cy="58" r="25" fill="#e4dfd9"/>${EYES(54, 10)}<ellipse cx="50" cy="63" rx="3.6" ry="2.8" fill="#e8798e"/><rect x="46.5" y="66" width="7" height="6" rx="1.5" fill="#fff" stroke="#1b1b1f" stroke-width="1"/>`,
  // owl
  () =>
    `<path d="M24 34 L28 16 L40 30Z M76 34 L72 16 L60 30Z" fill="#8c6b4f"/><ellipse cx="50" cy="56" rx="28" ry="29" fill="#8c6b4f"/><ellipse cx="50" cy="64" rx="17" ry="18" fill="#d9bf9c"/>` +
    `<circle cx="38" cy="48" r="11" fill="#fff"/><circle cx="62" cy="48" r="11" fill="#fff"/>${EYE(38, 48, 6)}${EYE(62, 48, 6)}<path d="M45 57 L55 57 L50 66Z" fill="#f29a1d"/>`,
  // frog: the eyes at the sides and the head a dome, so a hat sits on top as on the others (owner)
  () =>
    `<ellipse cx="50" cy="59" rx="32" ry="26" fill="#4caf50"/>` +
    `<path d="M33 66 Q50 79 67 66" stroke="#1b1b1f" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="30" cy="63" r="3.5" fill="#f2a7b5" opacity=".7"/><circle cx="70" cy="63" r="3.5" fill="#f2a7b5" opacity=".7"/>` +
    `<circle cx="28" cy="40" r="11" fill="#4caf50"/><circle cx="72" cy="40" r="11" fill="#4caf50"/>` +
    `<circle cx="28" cy="40" r="7" fill="#fff"/><circle cx="72" cy="40" r="7" fill="#fff"/>${EYE(29, 41, 4)}${EYE(71, 41, 4)}`,
  // pig
  () =>
    `<path d="M26 40 L28 22 L42 32Z M74 40 L72 22 L58 32Z" fill="#f08ca5"/><circle cx="50" cy="56" r="27" fill="#f6a8bb"/>${EYES(48, 11)}` +
    `<ellipse cx="50" cy="63" rx="11" ry="8" fill="#f08ca5" stroke="#d76b88" stroke-width="1.5"/><ellipse cx="46" cy="63" rx="2" ry="3" fill="#a3435e"/><ellipse cx="54" cy="63" rx="2" ry="3" fill="#a3435e"/>`,
  // mouse
  () =>
    `<circle cx="26" cy="32" r="15" fill="#a7a9ad"/><circle cx="74" cy="32" r="15" fill="#a7a9ad"/><circle cx="26" cy="32" r="9" fill="#f2a7b5"/><circle cx="74" cy="32" r="9" fill="#f2a7b5"/>` +
    `<ellipse cx="50" cy="58" rx="24" ry="25" fill="#a7a9ad"/>${EYES(54, 9)}<circle cx="50" cy="66" r="3.6" fill="#e8798e"/>${WHISKERS(66)}`,
  // lion
  () =>
    `<circle cx="50" cy="54" r="36" fill="#b5651d"/><g fill="#9a5418">${[0, 45, 90, 135, 180, 225, 270, 315].map((d) => `<circle cx="${50 + 31 * Math.cos((d * Math.PI) / 180)}" cy="${54 + 31 * Math.sin((d * Math.PI) / 180)}" r="9"/>`).join("")}</g>` +
    `<circle cx="50" cy="55" r="24" fill="#e3a63a"/><ellipse cx="50" cy="64" rx="10" ry="7" fill="#f3d08b"/>${EYES(51, 9)}<path d="M45 60 H55 L50 65Z" fill="#5a3311"/>${SMILE(68, 4)}`,
  // panda
  () =>
    `<circle cx="28" cy="32" r="10" fill="#1b1b1f"/><circle cx="72" cy="32" r="10" fill="#1b1b1f"/><circle cx="50" cy="56" r="27" fill="#fafafa"/>` +
    `<ellipse cx="39" cy="52" rx="7" ry="9" fill="#1b1b1f" transform="rotate(20 39 52)"/><ellipse cx="61" cy="52" rx="7" ry="9" fill="#1b1b1f" transform="rotate(-20 61 52)"/>` +
    `<circle cx="40" cy="52" r="2.6" fill="#fff"/><circle cx="60" cy="52" r="2.6" fill="#fff"/><ellipse cx="50" cy="63" rx="4.5" ry="3.2" fill="#1b1b1f"/>${SMILE(68, 4)}`,
  // penguin
  () =>
    `<ellipse cx="50" cy="56" rx="28" ry="30" fill="#23262e"/><path d="M50 40 Q30 40 30 60 Q32 80 50 82 Q68 80 70 60 Q70 40 50 40Z" fill="#fafafa"/>` +
    `${EYES(54, 9)}<path d="M44 61 L56 61 L50 69Z" fill="#f29a1d"/><circle cx="36" cy="64" r="3.4" fill="#f2a7b5" opacity=".8"/><circle cx="64" cy="64" r="3.4" fill="#f2a7b5" opacity=".8"/>`,
];

// ---------------------------------------------------------------------------
// The look (backlog v2 item 5): backgrounds in the child's colour, and hats.

const star = (cx: number, cy: number, outer: number, inner: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" L");
const ring = (n: number, cx: number, cy: number, d: number, r: number, attrs = "") =>
  Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI) / n;
    return `<circle cx="${(cx + d * Math.cos(a)).toFixed(1)}" cy="${(cy + d * Math.sin(a)).toFixed(1)}" r="${r}"${attrs}/>`;
  }).join("");

/**
 * In the order of shared/looks.ts; 0 is the disc. No triangle, square or
 * rhombus: those are the answer marks, and avatars pop up above the answer
 * tiles while the class answers (docs/avatars.md §6).
 */
const BACKGROUNDS: ((c: string) => string)[] = [
  (c) => `<circle cx="50" cy="50" r="49" fill="${c}"/>`,
  (c) => `<path d="M99 50 L74.5 92.4 L25.5 92.4 L1 50 L25.5 7.6 L74.5 7.6Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>`,
  (c) => `<path d="M${star(50, 54, 48, 24)}Z" fill="${c}" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`,
  (c) => `<path d="M50 95 C22 76 2 58 3 34 C4 14 20 4 34 6 C43 7 48 13 50 19 C52 13 57 7 66 6 C80 4 96 14 97 34 C98 58 78 76 50 95Z" fill="${c}"/>`,
  (c) => `<g fill="${c}">${ring(8, 50, 50, 33, 16)}<circle cx="50" cy="50" r="36"/></g>`,
  (c) =>
    `<ellipse cx="50" cy="76" rx="49" ry="22" fill="${c}"/><ellipse cx="50" cy="78" rx="38" ry="14" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2.5"/>` +
    `<ellipse cx="50" cy="80" rx="24" ry="8" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`,
];
const BACKGROUND_NAMES = ["circle", "hexagon", "star", "heart", "flower", "pond"];

/**
 * Hats, in the order of shared/looks.ts (0: none), each drawn with its brim
 * centred at (0, 0) and 30 wide; `height` is how far it reaches above the
 * brim, `box` the viewBox that shows it alone in the picker.
 */
const HATS: { name: string; svg: string; height: number; box: string }[] = [
  { name: "", svg: "", height: 1, box: "0 0 1 1" },
  {
    name: "crown",
    svg:
      `<path d="M-14 0 L-15 -17 L-7.5 -8 L0 -21 L7.5 -8 L15 -17 L14 0Z" fill="#f7b500" stroke="#9a6a00" stroke-width="1.4" stroke-linejoin="round"/>` +
      `<circle cx="0" cy="-5" r="2.6" fill="#e5484d"/><circle cx="-8" cy="-4" r="2" fill="#3e7bfa"/><circle cx="8" cy="-4" r="2" fill="#3e7bfa"/>`,
    height: 21,
    box: "-19 -25 38 30",
  },
  {
    name: "top hat",
    svg:
      `<rect x="-11" y="-25" width="22" height="23" rx="2" fill="#23262e"/><rect x="-11" y="-9" width="22" height="4.5" fill="#e5484d"/>` +
      `<rect x="-18" y="-3.5" width="36" height="4.5" rx="2.2" fill="#23262e"/>`,
    height: 25,
    box: "-20 -28 40 32",
  },
  {
    name: "cap",
    svg:
      `<path d="M-15 0 Q-15 -18 0 -18 Q15 -18 15 0Z" fill="#e5484d" stroke="#9e2a2e" stroke-width="1.2"/>` +
      `<path d="M8 -1.5 Q24 -5 29 1 Q20 3.5 8 2Z" fill="#b8282d"/><circle cx="0" cy="-18" r="2.4" fill="#9e2a2e"/>`,
    height: 20,
    box: "-18 -24 50 30",
  },
  {
    name: "wizard hat",
    svg:
      `<path d="M-17 0 Q-6 -10 -2 -20 Q2 -28 12 -27 Q6 -22 8 -12 Q11 -5 17 0Z" fill="#5b3fb5" stroke="#3a2780" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<ellipse cx="0" cy="0" rx="20" ry="3.6" fill="#3a2780"/>` +
      `<path d="M-3 -11 l1.3 2.6 2.8.4-2 2 .5 2.8-2.6-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" fill="#ffd84d"/><circle cx="6" cy="-6" r="1.5" fill="#ffd84d"/>`,
    height: 28,
    box: "-22 -30 44 36",
  },
  {
    name: "party hat",
    svg:
      `<path d="M-11 0 L0 -26 L11 0Z" fill="#12a594" stroke="#0b6e63" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<path d="M-7.5 -8 L7.5 -8 M-4.3 -16 L4.3 -16" stroke="#ffd84d" stroke-width="3"/><circle cx="0" cy="-27" r="4" fill="#e93d82"/>`,
    height: 31,
    box: "-17 -33 34 36",
  },
  {
    name: "flower",
    svg: ring(6, 9, -7, 8, 6, ` fill="#fff" stroke="#c9c2b8" stroke-width=".8"`) + `<circle cx="9" cy="-7" r="5.6" fill="#f5b301"/>`,
    height: 14,
    box: "-8 -24 34 34",
  },
  {
    name: "beanie",
    svg:
      `<path d="M-15 0 Q-15 -20 0 -20 Q15 -20 15 0Z" fill="#3e7bfa"/><rect x="-16" y="-5" width="32" height="7" rx="3" fill="#2a56b8"/>` +
      `<circle cx="0" cy="-22" r="5" fill="#fafafa" stroke="#c9c2b8" stroke-width=".8"/>`,
    height: 27,
    box: "-19 -29 38 34",
  },
  {
    name: "viking helmet",
    svg:
      `<path d="M-14 -4 Q-24 -10 -22 -24 Q-17 -14 -10 -12Z M14 -4 Q24 -10 22 -24 Q17 -14 10 -12Z" fill="#f3ead6" stroke="#9c8f72" stroke-width="1.1"/>` +
      `<path d="M-14 0 Q-14 -18 0 -18 Q14 -18 14 0Z" fill="#9aa1ad" stroke="#5d636e" stroke-width="1.2"/><rect x="-15" y="-4" width="30" height="5" rx="2" fill="#7a5134"/>`,
    height: 24,
    box: "-26 -27 52 32",
  },
];

/**
 * Where a hat sits on each animal (order of ANIMAL_NAMES): the brim's centre
 * x and y, its width, and how much hats grow beyond it. A hat never reaches
 * past the top of the picture. Smaller on the penguin (owner).
 */
const SEATS: [number, number, number, number][] = [
  [50, 35, 30, 1.3], // cat
  [50, 33, 34, 1.3], // dog
  [50, 38, 28, 1.3], // fox
  [50, 33, 32, 1.3], // bear
  [50, 40, 26, 1.3], // rabbit
  [50, 33, 30, 1.3], // owl
  [50, 37, 26, 1.2], // frog
  [50, 34, 30, 1.3], // pig
  [50, 39, 26, 1.3], // mouse
  [50, 34, 28, 1.3], // lion
  [50, 34, 32, 1.3], // panda
  [50, 31, 32, 1.05], // penguin
];

function hatOn(animal: number, hat: number): string {
  const h = HATS[hat];
  if (!h?.svg) return "";
  const [x, y, w, grow] = SEATS[animal];
  const scale = Math.min((w / 30) * grow, (y - 1) / h.height);
  return `<g transform="translate(${x} ${y}) scale(${scale.toFixed(3)})">${h.svg}</g>`;
}

const lookIndex = (i: number | undefined, n: number): number => (typeof i === "number" && Number.isInteger(i) && i >= 0 && i < n ? i : 0);

export function avatarSvg(av: Avatar, label = true): string {
  const colour = AVATAR_COLOURS[av.c % AVATAR_COLOURS.length];
  const a = av.a % ANIMALS.length;
  const b = lookIndex(av.b, BACKGROUND_COUNT);
  const h = lookIndex(av.h, HAT_COUNT);
  const name = h ? `${ANIMAL_NAMES[a]}, ${HATS[h].name}` : ANIMAL_NAMES[a];
  const aria = label ? ` role="img" aria-label="${name}"` : ` aria-hidden="true"`;
  return `<svg class="avatar" viewBox="0 0 100 100"${aria}>${BACKGROUNDS[b](colour)}${ANIMALS[a]()}${hatOn(a, h)}</svg>`;
}

/** A background shape alone, in the child's colour, for the lobby's picker. */
export function backgroundSvg(b: number, colour: number): string {
  return `<svg viewBox="0 0 100 100" role="img" aria-label="${BACKGROUND_NAMES[b]}">${BACKGROUNDS[b](AVATAR_COLOURS[colour % AVATAR_COLOURS.length])}</svg>`;
}

/** A hat alone, for the lobby's picker. */
export function hatSvg(h: number): string {
  return `<svg viewBox="${HATS[h].box}" role="img" aria-label="${HATS[h].name}">${HATS[h].svg}</svg>`;
}

/** Plays the wiggle that says "this one changed" (app.css). */
export function wiggle(el: HTMLElement): void {
  el.classList.remove("wiggle");
  void el.offsetWidth; // restart the animation
  el.classList.add("wiggle");
  el.addEventListener("animationend", () => el.classList.remove("wiggle"), { once: true });
}

/**
 * Keeps a lobby's row of avatars in place: newcomers are added in order,
 * those gone removed, and one whose look changed is redrawn with a wiggle,
 * so the child who dressed it finds it on the wall. Nothing else is
 * replaced, so each newcomer pops in once and a teacher's tap on Start or
 * on an avatar doesn't land on a node being swapped.
 */
export function syncAvatars<P extends { id: string; avatar: Avatar }>(
  box: HTMLElement,
  players: P[],
  el: (p: P) => { tag: string; className: string; attrs?: Record<string, string> },
): void {
  const ids = new Set(players.map((p) => p.id));
  for (const child of [...box.children] as HTMLElement[]) if (!ids.has(child.dataset.id ?? "")) child.remove();
  const have = new Map(([...box.children] as HTMLElement[]).map((c) => [c.dataset.id ?? "", c]));
  let prev: HTMLElement | null = null;
  for (const p of players) {
    const spec = el(p);
    let node = have.get(p.id);
    if (!node || node.tagName.toLowerCase() !== spec.tag) {
      node?.remove();
      node = document.createElement(spec.tag);
      node.dataset.id = p.id;
      if (prev) prev.after(node);
      else box.prepend(node);
    }
    const key = `${p.avatar.a}.${p.avatar.c}.${p.avatar.b ?? 0}.${p.avatar.h ?? 0}`;
    if (node.dataset.look !== key) {
      const changed = node.dataset.look !== undefined;
      node.dataset.look = key;
      node.innerHTML = avatarSvg(p.avatar);
      if (changed) wiggle(node);
    }
    const cls = node.classList.contains("wiggle") ? `${spec.className} wiggle`.trim() : spec.className;
    if (node.className !== cls) node.className = cls;
    for (const [k, v] of Object.entries(spec.attrs ?? {})) if (node.getAttribute(k) !== v) node.setAttribute(k, v);
    prev = node;
  }
}

/** For the test that the drawings match shared/looks.ts. */
export const LOOK_DRAWINGS = { backgrounds: BACKGROUNDS.length, hats: HATS.length, seats: SEATS.length, animals: ANIMALS.length };

// ---------------------------------------------------------------------------
// Answers: colour plus shape, so colour-blind students can tell them apart.
// The colours are in app.css (.a0 to .a3).

const SHAPES = [
  `<path d="M50 12 L90 84 H10Z"/>`,
  `<path d="M50 8 L92 50 L50 92 L8 50Z"/>`,
  `<circle cx="50" cy="50" r="40"/>`,
  `<rect x="13" y="13" width="74" height="74" rx="4"/>`,
];
const SHAPE_NAMES = ["triangle", "diamond", "circle", "square"];

export function shapeSvg(i: number, fill = "currentColor"): string {
  return `<svg class="shape" viewBox="0 0 100 100" aria-label="${SHAPE_NAMES[i]}" role="img" fill="${fill}">${SHAPES[i]}</svg>`;
}

export const ICON = {
  check: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  cross: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  person: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" fill="currentColor"/></svg>`,
  star: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="currentColor"/></svg>`,
  eye: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/></svg>`,
  plus: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  void: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M5.6 18.4L18.4 5.6" stroke="currentColor" stroke-width="2.5"/></svg>`,
  trophy: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v4a5 5 0 01-10 0zM5 4H2v2a4 4 0 004 4M19 4h3v2a4 4 0 01-4 4M10 14h4v3h3v3H7v-3h3z" fill="currentColor"/></svg>`,
  /** The votes: how the class answered, before the key. */
  bars: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V13M10 20V6M16 20v-9M21 20H3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  /** Time's up (the countdown tempos). */
  timer: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13.5" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 13.5V9M9.5 2.5h5M19 6l-1.6 1.6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  wifi: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9a15 15 0 0120 0M5.5 12.5a10 10 0 0113 0M9 16a5 5 0 016 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="19.5" r="1.6" fill="currentColor"/></svg>`,
};
