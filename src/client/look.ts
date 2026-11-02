// The pictures of the game: avatars and answer marks. Drawn as SVG here, not
// emoji, so a child's fox looks the same on an Android tablet as on the
// school laptop's projector (docs/decisions.md, "Avatars").

import type { Avatar } from "../shared/protocol.ts";

/** Disc colours of avatars, told apart by the class: "the frog on purple". */
export const AVATAR_COLOURS = ["#e5484d", "#3e7bfa", "#f5c518", "#8e4ec6", "#12a594", "#e93d82", "#7cb518", "#1f3a8a"];
export const ANIMAL_NAMES = ["cat", "dog", "fox", "bear", "rabbit", "owl", "frog", "pig", "mouse", "lion", "panda", "penguin"];

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
  // frog
  () =>
    `<circle cx="32" cy="34" r="11" fill="#4caf50"/><circle cx="68" cy="34" r="11" fill="#4caf50"/><ellipse cx="50" cy="60" rx="31" ry="23" fill="#4caf50"/>` +
    `<circle cx="32" cy="34" r="7" fill="#fff"/><circle cx="68" cy="34" r="7" fill="#fff"/>${EYE(32, 35, 4)}${EYE(68, 35, 4)}` +
    `<path d="M32 64 Q50 78 68 64" stroke="#1b1b1f" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="30" cy="62" r="3.5" fill="#f2a7b5" opacity=".7"/><circle cx="70" cy="62" r="3.5" fill="#f2a7b5" opacity=".7"/>`,
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

export function avatarSvg(av: Avatar, label = true): string {
  const colour = AVATAR_COLOURS[av.c % AVATAR_COLOURS.length];
  const name = ANIMAL_NAMES[av.a % ANIMAL_NAMES.length];
  const aria = label ? ` role="img" aria-label="${name}"` : ` aria-hidden="true"`;
  return `<svg class="avatar" viewBox="0 0 100 100"${aria}><circle cx="50" cy="50" r="49" fill="${colour}"/>${ANIMALS[av.a % ANIMALS.length]()}</svg>`;
}

// ---------------------------------------------------------------------------
// Answers: colour plus shape, so colour-blind students can tell them apart.

export const ANSWER_COLOURS = ["#d93b3b", "#2f6fd6", "#e8b100", "#1f9d55"];
export const ANSWER_INK = ["#fff", "#fff", "#1b1b1f", "#fff"];
const SHAPES = [
  `<path d="M50 12 L90 84 H10Z"/>`,
  `<path d="M50 8 L92 50 L50 92 L8 50Z"/>`,
  `<circle cx="50" cy="50" r="40"/>`,
  `<rect x="13" y="13" width="74" height="74" rx="4"/>`,
];
export const SHAPE_NAMES = ["triangle", "diamond", "circle", "square"];

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
  wifi: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9a15 15 0 0120 0M5.5 12.5a10 10 0 0113 0M9 16a5 5 0 016 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="19.5" r="1.6" fill="currentColor"/></svg>`,
};
