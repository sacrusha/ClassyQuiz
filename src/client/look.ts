// Avatars and answer marks, drawn as SVG, not emoji, so a child's fox looks the
// same on an Android tablet as on the school laptop's projector
// (docs/design/class-and-wall.md, "Dressing the avatar").

import type { Avatar } from "../shared/protocol.ts";
import { BACKGROUND_COUNT, HAT_COUNT, TOOL_COUNT } from "../shared/looks.ts";

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
  // frog: the eyes at the sides and the head a dome, so a hat sits on top as on the others
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
  // lion: the mane stays within 33 of the centre, so a background shape reads behind it as behind the other heads
  () =>
    `<circle cx="50" cy="54" r="29" fill="#b5651d"/><g fill="#9a5418">${[0, 45, 90, 135, 180, 225, 270, 315].map((d) => `<circle cx="${50 + 25 * Math.cos((d * Math.PI) / 180)}" cy="${54 + 25 * Math.sin((d * Math.PI) / 180)}" r="7.5"/>`).join("")}</g>` +
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
 * tiles while the class answers (docs/design/class-and-wall.md, "Dressing the avatar").
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
 * past the top of the picture. Smaller on the penguin.
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

/**
 * Tools held beside the animal, in the order of shared/looks.ts (0: none),
 * each drawn round (0, 0) within about 19 of it; `box` shows it alone in the
 * picker. Each is a solid blob, since at the who-answered bar's 21 to 36 px a
 * line is a pixel wide and gone; in neutral colours, never an answer's colour
 * in an answer's shape (docs/design/class-and-wall.md, "Dressing the avatar").
 * The types are inferred: docs/film/build/build.py lifts this part of the
 * file into the film as plain JavaScript.
 */
const TOOLS = [
  { name: "", svg: "", box: "0 0 1 1" },
  {
    name: "laptop",
    svg:
      `<rect x="-13" y="-15" width="26" height="19" rx="2.2" fill="#c9ced6" stroke="#5d636e" stroke-width="1.3"/><rect x="-10.4" y="-12.4" width="20.8" height="13.8" rx="1" fill="#2b3a55"/>` +
      `<path d="M-10.4 1.4 L2 -12.4 H7 L-5.4 1.4Z" fill="#fff" opacity=".18"/>` +
      `<path d="M-15.5 4 H15.5 L18.5 9.2 Q18.5 11 16.7 11 H-16.7 Q-18.5 11 -18.5 9.2Z" fill="#aeb4bd" stroke="#5d636e" stroke-width="1.3" stroke-linejoin="round"/>`,
    box: "-21 -18 42 32",
  },
  {
    name: "chart",
    svg:
      `<path d="M-8 9 L-12 18 M8 9 L12 18" stroke="#5d636e" stroke-width="2.6" stroke-linecap="round"/>` +
      `<rect x="-15" y="-16" width="30" height="26" rx="2" fill="#fff" stroke="#5d636e" stroke-width="1.6"/>` +
      `<rect x="-10.5" y="-1" width="5.5" height="7" fill="#3a3f4a"/><rect x="-2.75" y="-6" width="5.5" height="12" fill="#3a3f4a"/><rect x="5" y="-11" width="5.5" height="17" fill="#3a3f4a"/>` +
      `<path d="M-11 -5 L-2 -10.5 L3 -8.5 L9.5 -13.5" stroke="#d9541e" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    box: "-18 -19 36 39",
  },
  {
    name: "calculator",
    svg:
      `<g transform="rotate(-10)"><rect x="-11.5" y="-16" width="23" height="32" rx="3.5" fill="#3a3f4a" stroke="#23262e" stroke-width="1.2"/>` +
      `<rect x="-8.5" y="-13" width="17" height="7.5" rx="1.2" fill="#cfe3c8"/>` +
      `<g fill="#e8e6e1">${[-3, 2.5, 8].map((y) => [-8, -2, 4].map((x) => `<rect x="${x}" y="${y}" width="4.5" height="3.6" rx=".8"/>`).join("")).join("")}</g>` +
      `<rect x="4" y="8" width="4.5" height="3.6" rx=".8" fill="#f29a1d"/></g>`,
    box: "-16 -20 32 40",
  },
  {
    name: "coffee",
    svg:
      `<path d="M-6 -13 q-3 -3 0 -6 q3 -3 0 -6 M2 -13 q-3 -3 0 -6 q3 -3 0 -6" stroke="#9aa1ad" stroke-width="2" fill="none" stroke-linecap="round"/>` +
      `<path d="M8 -4 h3 a6.5 6.5 0 0 1 0 13 h-3" stroke="#5d636e" stroke-width="5.4" fill="none"/><path d="M8 -4 h3 a6.5 6.5 0 0 1 0 13 h-3" stroke="#fff" stroke-width="2.8" fill="none"/>` +
      `<path d="M-13 -9 H9 V10 Q9 15 4 15 H-8 Q-13 15 -13 10Z" fill="#fff" stroke="#5d636e" stroke-width="1.3"/>` +
      `<ellipse cx="-2" cy="-9" rx="11" ry="2.4" fill="#6b3e1f" stroke="#5d636e" stroke-width="1.1"/>`,
    box: "-16 -28 37 46",
  },
  {
    name: "briefcase",
    svg:
      `<path d="M-6 -9 V-13.5 Q-6 -16 -3.5 -16 H3.5 Q6 -16 6 -13.5 V-9" stroke="#4e3220" stroke-width="3" fill="none"/>` +
      `<rect x="-17" y="-9.5" width="34" height="23" rx="3" fill="#8a5a30" stroke="#4e3220" stroke-width="1.3"/>` +
      `<path d="M-17 -0.5 H17" stroke="#4e3220" stroke-width="1.3"/><rect x="-3" y="-3.5" width="6" height="5" rx="1" fill="#f7b500" stroke="#9a6a00" stroke-width=".9"/>`,
    box: "-20 -19 40 35",
  },
  {
    name: "book",
    svg:
      `<path d="M0 -7 Q-9 -13 -18.5 -9.5 V11.5 Q-9 8 0 13 Q9 8 18.5 11.5 V-9.5 Q9 -13 0 -7Z" fill="#a8471a"/>` +
      `<path d="M0 -8 Q-8 -13 -16.5 -10.5 V9 Q-8 6 0 10.5Z M0 -8 Q8 -13 16.5 -10.5 V9 Q8 6 0 10.5Z" fill="#fff" stroke="#c9c2b8" stroke-width=".9" stroke-linejoin="round"/>` +
      `<path d="M-13 -5.5 Q-8 -7.5 -3.5 -4.5 M-13 -1 Q-8 -3 -3.5 0 M-13 3.5 Q-8 1.5 -3.5 4.5 M13 -5.5 Q8 -7.5 3.5 -4.5 M13 -1 Q8 -3 3.5 0 M13 3.5 Q8 1.5 3.5 4.5" stroke="#9aa1ad" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
    box: "-21 -16 42 32",
  },
];

/**
 * Where a tool is held: low on the right, the same for every animal, over the
 * cheek and past the disc's edge, so it changes the outline on that side.
 */
const toolOn = (tool = 0) => (TOOLS[tool]?.svg ? `<g transform="translate(78 80) scale(1.05)">${TOOLS[tool].svg}</g>` : "");

const lookIndex = (i: number | undefined, n: number): number => (typeof i === "number" && Number.isInteger(i) && i >= 0 && i < n ? i : 0);

export function avatarSvg(av: Avatar, label = true): string {
  const colour = AVATAR_COLOURS[av.c % AVATAR_COLOURS.length];
  const a = av.a % ANIMALS.length;
  const b = lookIndex(av.b, BACKGROUND_COUNT);
  const h = lookIndex(av.h, HAT_COUNT);
  const t = lookIndex(av.t, TOOL_COUNT);
  const name = [ANIMAL_NAMES[a], HATS[h].name, TOOLS[t].name].filter(Boolean).join(", ");
  const aria = label ? ` role="img" aria-label="${name}"` : ` aria-hidden="true"`;
  return `<svg class="avatar" viewBox="0 0 100 100"${aria}>${BACKGROUNDS[b](colour)}${ANIMALS[a]()}${hatOn(a, h)}${toolOn(t)}</svg>`;
}

/** A background shape alone, in the child's colour, for the lobby's picker. */
export function backgroundSvg(b: number, colour: number): string {
  return `<svg viewBox="0 0 100 100" role="img" aria-label="${BACKGROUND_NAMES[b]}">${BACKGROUNDS[b](AVATAR_COLOURS[colour % AVATAR_COLOURS.length])}</svg>`;
}

/** A hat alone, for the lobby's picker. */
export function hatSvg(h: number): string {
  return `<svg viewBox="${HATS[h].box}" role="img" aria-label="${HATS[h].name}">${HATS[h].svg}</svg>`;
}

/** A tool alone, for the lobby's picker. */
export function toolSvg(t: number): string {
  return `<svg viewBox="${TOOLS[t].box}" role="img" aria-label="${TOOLS[t].name}">${TOOLS[t].svg}</svg>`;
}

/**
 * The dressing menu's rows, without words (docs/design/class-and-wall.md,
 * "Dressing the avatar"): the shapes in the player's colour, the hats, the
 * tools; each picture a button with data-part (shared/looks.ts, LookPart)
 * and data-i.
 */
export function pickerRows(colour: number): string {
  const row = (part: string, from: number, to: number, svg: (i: number) => string) =>
    `<div class="prow">${Array.from({ length: to - from }, (_, k) => `<button class="pick" type="button" data-part="${part}" data-i="${from + k}">${svg(from + k)}</button>`).join("")}</div>`;
  return row("b", 0, BACKGROUND_COUNT, (b) => backgroundSvg(b, colour)) + row("h", 1, HAT_COUNT, hatSvg) + row("t", 1, TOOL_COUNT, toolSvg);
}

/** Plays the wiggle that says "this one changed" (app.css). */
export function wiggle(el: HTMLElement): void {
  el.classList.remove("wiggle");
  void el.offsetWidth; // restart the animation
  el.classList.add("wiggle");
  el.addEventListener("animationend", () => el.classList.remove("wiggle"), { once: true });
}

/** What an avatar's drawing depends on: a changed key is a changed look. */
export const lookKey = (av: Avatar): string => `${av.a}.${av.c}.${av.b ?? 0}.${av.h ?? 0}.${av.t ?? 0}`;

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
    const key = lookKey(p.avatar);
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

/** How a group of jumpers is laid out (px): see partySize. */
export interface PartyLayout {
  /** A jumper's size, and the step to the next in its row. */
  s: number;
  step: number;
  /** Rows, the back one first; how many in a row; how far each row stands above the one in front. */
  rows: number;
  perRow: number;
  rise: number;
  /** The band's height: the rows, room for the jump above them, a margin. */
  band: number;
}

/** How high a jumper jumps, in its own size (app.css, @keyframes jump). */
export const JUMP = 0.5;

/**
 * The winners' band on the wall (client/screen.ts, renderParty), for n of
 * them over a stage w wide and h high, with `room` above its first tile:
 * the band never reaches the tiles, where the key is. Ten as large as the
 * band allows and apart: in one row on a wide wall, the band no more than
 * three tenths of the stage; in two or three rows on a narrow one, where
 * one row would leave them tiny. More than ten get smaller, down to two
 * thirds of ten's size, then overlap in their rows: twenty blur together,
 * and that is accepted. The band is as high as ten's,
 * so it covers the same whatever the count.
 */
export function partySize(n: number, w: number, h: number, room = Infinity): PartyLayout {
  const gap = Math.max(4, Math.round(w * 0.008));
  const RISE = 0.85;
  // The rows and the jump within the band, less its margins.
  const most = Math.min(0.3 * h, room);
  const cap = most - 2 * Math.max(4, 0.04 * most);
  const height = (s: number, rows: number) => s * (1 + RISE * (rows - 1)) + JUMP * s;
  const fit = (k: number, rows: number) => Math.floor(Math.max(16, Math.min((w - (k - 1) * gap) / k, cap / (1 + RISE * (rows - 1) + JUMP))));
  // Ten's layout: the row count that shows them largest, fewer rows on a tie.
  let rows = 1;
  for (const r of [2, 3]) if (fit(Math.ceil(10 / r), r) > fit(Math.ceil(10 / rows), rows) * 1.15) rows = r;
  const ten = fit(Math.ceil(10 / rows), rows);
  const band = Math.ceil(height(ten, rows) + 2 * Math.max(4, 0.06 * ten));
  const k = Math.max(1, Math.min(n, 10));
  if (n <= 10) {
    // Fewer than ten: as few rows as show them largest, within ten's band.
    const inner = band - 2 * Math.max(4, 0.06 * ten);
    let best = { s: 0, r: 1 };
    for (let r = 1; r <= Math.min(rows, k); r++) {
      const s = Math.min(fit(Math.ceil(k / r), r), Math.floor(inner / (1 + RISE * (r - 1) + JUMP)));
      if (s > best.s) best = { s, r };
    }
    const perRow = Math.ceil(k / best.r);
    return { s: best.s, step: best.s + gap, rows: Math.ceil(k / perRow), perRow, rise: RISE * best.s, band };
  }
  const perRow = Math.ceil(n / rows);
  const s = Math.min(ten, Math.floor(Math.max((2 / 3) * ten, (w - (perRow - 1) * gap) / perRow)));
  return { s, step: Math.min(s + gap, (w - s) / (perRow - 1)), rows, perRow, rise: RISE * s, band };
}

/** The final ranking (client/final.ts): the podium's height in the first place's avatar size: room for its jump, the avatar, the points, the highest step. */
const PODIUM = 2.5;
/** The crowd stands this much of its own size over the steps' foot. */
const OVERLAP = 0.25;
/** The podium's avatars are at least this much larger than the crowd's. */
const LEAD = 1.5;
/** A crowd row stands this much of an avatar above the one in front of it, and its avatars this far apart: they overlap, as a crowd does. */
const CROWD_RISE = 0.6;
const CROWD_STEP = 0.78;

/** Rows of n avatars of size s across w: as few as fit, each at most this many. */
function crowdRows(n: number, w: number, s: number): { rows: number; perRow: number } {
  const perRow = Math.max(1, Math.floor(Math.max(0, w - s) / (CROWD_STEP * s)) + 1);
  return { rows: n ? Math.ceil(n / perRow) : 0, perRow };
}

/** The crowd's height: the back rows rise behind the front one. */
export function crowdHeight(n: number, w: number, s: number): number {
  const { rows } = crowdRows(n, w, s);
  return rows ? s + (rows - 1) * CROWD_RISE * s : 0;
}

/**
 * Sizes for a stage w by h with n in the crowd: the crowd's avatar s as
 * large as its rows allow while the first place stays LEAD times larger;
 * the podium (first place's avatar a) takes the height the crowd leaves,
 * within a third of the width per step. A small class stands large, a
 * class of 60 in rows of small ones that still read as avatars.
 */
export function finalSize(n: number, w: number, h: number): { a: number; s: number } {
  const widest = (0.85 * w) / 3;
  const crowdH = (s: number) => (n ? crowdHeight(n, w, s) - OVERLAP * s : 0);
  const top = Math.floor(Math.min(h / 5, w / 8));
  for (let s = top; s >= 16; s--) {
    const a = Math.min((h - crowdH(s)) / PODIUM, widest);
    if (a >= LEAD * s) return { a: Math.floor(a), s };
  }
  return { a: Math.max(24, Math.floor(Math.min((h - crowdH(16)) / PODIUM, widest))), s: 16 };
}

/** A number in [0, 1) from a string and a salt: the same avatar stands in the same place on every view. */
function wobble(id: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10007) / 10007;
}

export interface CrowdPlace {
  x: number;
  y: number;
  size: number;
  /** Front rows over back ones. */
  z: number;
}

/**
 * The crowd in front of the podium, like a crowd rather than a grid
 * (owner: "a South Park crowd"): rows that overlap, the back ones higher
 * and a little smaller, each row shifted against the next, every avatar
 * a little off its place and size. Neighbours in the lobby's order go to
 * different rows, so the order doesn't read along a row. Places are from
 * the crowd box's top left, within w across and crowdHeight down.
 */
export function crowdPlaces(ids: string[], w: number, s: number): CrowdPlace[] {
  const n = ids.length;
  const { rows } = crowdRows(n, w, s);
  if (!rows) return [];
  const inRow: number[][] = Array.from({ length: rows }, () => []);
  ids.forEach((_, i) => inRow[i % rows].push(i));
  const out: CrowdPlace[] = new Array(n);
  inRow.forEach((members, r) => {
    // r 0 is the front row, at the bottom.
    const depth = rows > 1 ? r / (rows - 1) : 0;
    const size = s * (1 - 0.12 * depth);
    const k = members.length;
    const span = w - size;
    const step = k > 1 ? span / k : 0;
    const shift = r % 2 ? 0.25 : -0.25;
    members.forEach((i, j) => {
      const id = ids[i];
      const own = size * (0.94 + 0.1 * wobble(id, 1));
      const x = k > 1 ? (j + 0.5 + shift) * step + (wobble(id, 2) - 0.5) * 0.35 * step : span / 2;
      const y = (rows - 1 - r) * CROWD_RISE * s + (s - own) + (wobble(id, 3) - 0.5) * 0.12 * s;
      out[i] = { x: Math.max(0, Math.min(w - own, x)), y: Math.max(0, y), size: own, z: rows - r };
    });
  });
  return out;
}

/** For the test that the drawings match shared/looks.ts. */
export const LOOK_DRAWINGS = { backgrounds: BACKGROUNDS.length, hats: HATS.length, tools: TOOLS.length, seats: SEATS.length, animals: ANIMALS.length };

// Answer marks: colour plus shape, so colour-blind students can tell them apart.
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
  /** Last call, and its time up. */
  timer: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13.5" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 13.5V9M9.5 2.5h5M19 6l-1.6 1.6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  wifi: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9a15 15 0 0120 0M5.5 12.5a10 10 0 0113 0M9 16a5 5 0 016 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="19.5" r="1.6" fill="currentColor"/></svg>`,
};
