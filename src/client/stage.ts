// A question laid out on a stage: its text, its picture and the answer
// tiles, in whatever room the stage has. The wall lays it out here
// (client/screen.ts), and so does a player's own device (client/device.ts),
// so a question looks on a laptop as it will on the projector
// (docs/design/class-and-wall.md, "Tiles do not move at the reveal";
// docs/design/solo.md, "The device screen").
//
// One stage per page: the parts carry ids (#qtext, #figure, #tiles) that
// the page's styles and the winners' band look for.

import type { Avatar, ImageRef } from "../shared/protocol.ts";
import { chooseGrid, type Chrome, type Orient } from "./answergrid.ts";
import { esc, lines } from "./dom.ts";
import { ICON, avatarSvg, partySize, shapeSvg } from "./look.ts";
import { fillPictures, picImg } from "./pictures.ts";

/** What the layout needs of a question: its text, the answers in the order on screen, the pictures. */
export interface StageQuestion {
  text: string;
  /** In the order on screen; "" for a picture answer. */
  answers: string[];
  /** Pictures as answers, in the order on screen, null for a text answer; absent when the question has none. */
  pics?: (ImageRef | null)[];
  image: ImageRef | null;
}

export interface StageOptions {
  /** The tiles are buttons, data-i their place on screen: a player answers on them. */
  buttons?: boolean;
  /**
   * A player's own device. Held upright (the stage taller than wide), it is
   * laid out apart from the wall: the question takes less of the height,
   * since the answers are what is tapped, text tiles stand in one column
   * where two would break their words or set them small, and alone the
   * tiles keep room for the mark only (app.css, `dupright`). Wider than
   * tall, it is laid out as the wall is, so a laptop or a projector shows a
   * question as the wall would (docs/design/solo.md, "Where a device differs").
   */
  device?: boolean;
}

/** On an upright device, the share of the height the question's text may take, against the wall's. */
const DEVICE_TEXT_ROOM = 0.7;
/** On an upright device, text tiles set smaller than this (em) in two columns try one. */
const DEVICE_TILE_MIN = 1.3;

/** Whether the stage is laid out as an upright device's rather than as the wall's; its tiles then carry `dupright`. */
function upright(stage: HTMLElement, o: StageOptions): boolean {
  return !!o.device && stage.clientHeight > stage.clientWidth;
}

/** One tile's element: a button where a player taps it, a block on the wall. */
function tile(i: number, cls: string, inner: string, o: StageOptions): string {
  return o.buttons
    ? `<button type="button" class="tile ${cls}" data-i="${i}">${inner}</button>`
    : `<div class="tile ${cls}">${inner}</div>`;
}

/** Font size (em) for the question by its length; smaller when it shares the screen with a picture. */
function questionSize(len: number, withPicture: boolean): number {
  if (withPicture) return len <= 40 ? 3 : len <= 90 ? 2.5 : len <= 160 ? 2.1 : 1.8;
  return len <= 40 ? 3.6 : len <= 90 ? 3 : len <= 160 ? 2.4 : 1.9;
}

/**
 * The question, its picture and the tiles in the stage's room. The
 * picture goes between the question and the tiles, or beside both: whichever
 * shows it larger, from its shape (known before it has loaded) and the room
 * the question's text leaves. Wide figures such as number lines end up
 * between; square and upright ones beside a short question. Beside needs the
 * question to stay readable in the narrower column, so a long question keeps
 * the picture between.
 */
export function layQuestion(stage: HTMLElement, q: StageQuestion, o: StageOptions = {}): void {
  const at = (sel: string) => stage.querySelector<HTMLElement>(sel)!;
  const up = upright(stage, o);
  if (q.pics) {
    layPictureAnswers(stage, q, q.pics, o, up);
    return;
  }
  const n = q.answers.length;
  const longest = Math.max(...q.answers.map((a) => a.length));
  const tileSize = longest <= 12 ? 2.6 : longest <= 30 ? 2 : longest <= 60 ? 1.55 : 1.25;
  const room = up ? DEVICE_TEXT_ROOM : 1;
  const fitAnswers = () => fitTiles(at("#tiles"), tileSize, up);
  const qHtml = `<h2 class="qtext" id="qtext">${lines(q.text)}</h2>`;
  const tilesHtml = `<div class="tiles${up ? " dupright" : ""}" id="tiles">${q.answers
    .map((a, i) => tile(i, `a${i}`, `${shapeSvg(i)}<span class="txt">${lines(a)}</span><span class="side"></span>`, o))
    .join("")}</div>`;
  const img = q.image;
  if (!img) {
    stage.className = "stage";
    stage.innerHTML = qHtml + tilesHtml;
    fitText(at("#qtext"), questionSize(q.text.length, false), window.innerHeight * 0.34 * room);
    fitAnswers();
    return;
  }
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  const gap = parseFloat(getComputedStyle(stage).rowGap) || 0;
  const aspect = img.w / img.h;
  const figure = (w: number, h: number) =>
    `<div class="figure" id="figure" data-zoom style="width:${Math.floor(w)}px;height:${Math.floor(h)}px">${picImg(img.src, img.w, img.h)}</div>`;

  const between = (): number => {
    stage.className = "stage fig between";
    stage.innerHTML = qHtml + figure(0, 0) + tilesHtml;
    fitText(at("#qtext"), questionSize(q.text.length, true), H * 0.3 * room);
    const qh = at("#qtext").offsetHeight;
    // The tiles keep room for their answers: a row of short numbers needs less than a row of sentences.
    const rows = n > 2 ? 2 : 1;
    const tilesMin = rows * H * (longest <= 12 ? 0.135 : longest <= 30 ? 0.16 : 0.2);
    const h = Math.max(40, Math.min(W / aspect, H - qh - tilesMin - (q.text ? 2 : 1) * gap, H * 0.62));
    const fig = at("#figure");
    fig.style.width = `${Math.floor(h * aspect)}px`;
    fig.style.height = `${Math.floor(h)}px`;
    fitAnswers();
    return h * h * aspect;
  };

  const betweenArea = between();
  // Beside, the picture takes up to 58% of the width, else half; the text
  // must stay readable in the column that leaves, or it's between after all.
  let beside = false;
  for (const share of [0.58, 0.5]) {
    const sideH = Math.min(H, (share * W) / aspect);
    if (sideH * sideH * aspect <= 1.3 * betweenArea) break;
    stage.className = "stage fig beside";
    stage.innerHTML = figure(sideH * aspect, sideH) + `<div class="col">${qHtml}${tilesHtml}</div>`;
    const textSize = fitText(at("#qtext"), questionSize(q.text.length, true), H * 0.42 * room);
    const tiles = fitTiles(at("#tiles"), tileSize);
    if (textSize >= 1.5 && !tiles.squeezed && tiles.size >= Math.min(tileSize, 1.3)) {
      beside = true;
      break;
    }
  }
  if (!beside && stage.classList.contains("beside")) between();
  fillPictures(stage);
}

/**
 * Pictures as answers (docs/design/pictures.md): tiles arranged by the
 * pictures' shape (answergrid.ts), the question's own picture beside its text
 * or between text and tiles, the room shared so that it and the smallest
 * answer picture come out about alike. A text answer among them takes a
 * picture's place.
 */
function layPictureAnswers(stage: HTMLElement, q: StageQuestion, pics: (ImageRef | null)[], o: StageOptions, up: boolean): void {
  const at = (sel: string) => stage.querySelector<HTMLElement>(sel)!;
  const room = up ? DEVICE_TEXT_ROOM : 1;
  const aspects = pics.map((p) => (p ? p.w / p.h : null));
  const longestText = Math.max(0, ...q.answers.map((a) => a.length));
  const qHtml = `<h2 class="qtext" id="qtext">${lines(q.text)}</h2>`;
  const tilesHtml = `<div class="tiles pics${up ? " dupright" : ""}" id="tiles">${q.answers
    .map((a, i) => {
      const p = pics[i];
      const card = p ? picImg(p.src, p.w, p.h) : a ? `<span class="txt">${lines(a)}</span>` : "";
      return tile(i, `pic a${i} row`, `${shapeSvg(i)}<div class="apic${p ? "" : " text"}">${card}</div><span class="side"></span>`, o);
    })
    .join("")}</div>`;
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  const gap = parseFloat(getComputedStyle(stage).rowGap) || 0;
  // No question text: its heading is hidden (app.css, .qtext:empty) and takes no gap.
  const textGap = q.text ? gap : 0;

  // What a tile takes around its card, in either orientation: fixed by the tiles' font, not by their size.
  stage.className = "stage picans";
  stage.innerHTML = tilesHtml;
  const tiles = at("#tiles");
  const tileGap = parseFloat(getComputedStyle(tiles).rowGap) || 0;
  const chromeOf = (orient: Orient): Chrome => {
    const t = tiles.querySelector<HTMLElement>(".tile")!;
    t.className = `tile pic a0 ${orient}`;
    const c = t.querySelector<HTMLElement>(".apic")!;
    return { w: t.offsetWidth - c.offsetWidth, h: t.offsetHeight - c.offsetHeight };
  };
  const chrome = { row: chromeOf("row"), col: chromeOf("col") };
  const grid = (h: number) => chooseGrid(aspects, W, Math.max(0, h), tileGap, chrome);

  const img = q.image;
  let best: { html: string; tilesH: number; fit: () => void; score: number } | null = null;
  if (!img) {
    stage.innerHTML = qHtml;
    fitText(at("#qtext"), questionSize(q.text.length, true), H * 0.26 * room);
    const tilesH = H - at("#qtext").offsetHeight - textGap;
    best = { html: qHtml, tilesH, fit: () => fitText(at("#qtext"), questionSize(q.text.length, true), H * 0.26 * room), score: 0 };
  } else {
    const aspect = img.w / img.h;
    const figure = (w: number, h: number) =>
      `<div class="figure" id="figure" data-zoom style="width:${Math.floor(w)}px;height:${Math.floor(h)}px">${picImg(img.src, img.w, img.h)}</div>`;
    // Between: the text, the picture at the full width, the tiles.
    stage.innerHTML = qHtml;
    fitText(at("#qtext"), questionSize(q.text.length, true), H * 0.22 * room);
    const qh = at("#qtext").offsetHeight;
    for (const share of [0.22, 0.3, 0.38, 0.46]) {
      const fh = Math.min(W / aspect, H * share);
      const tilesH = H - qh - fh - gap - textGap;
      const score = Math.min(fh * fh * aspect, grid(tilesH).score);
      if (!best || score > best.score)
        best = { html: qHtml + figure(fh * aspect, fh), tilesH, fit: () => fitText(at("#qtext"), questionSize(q.text.length, true), H * 0.22 * room), score };
    }
    // Beside: the picture and the text in one band above the tiles, while the text stays readable.
    for (const share of [0.3, 0.38, 0.46]) {
      const bh = H * share;
      const fw = Math.min(bh * aspect, W * 0.55);
      const fh = fw / aspect;
      const tilesH = H - bh - gap;
      const score = Math.min(fh * fh * aspect, grid(tilesH).score);
      if (best && score <= best.score) continue;
      const html = `<div class="qband" style="height:${Math.floor(bh)}px">${figure(fw, fh)}${qHtml}</div>`;
      stage.innerHTML = html;
      const fit = () => fitText(at("#qtext"), questionSize(q.text.length, true), bh);
      if (fit() < 1.5 && q.text.length > 40) continue;
      best = { html, tilesH, fit, score };
    }
  }
  const b = best!;
  const g = grid(b.tilesH);
  stage.innerHTML = b.html + tilesHtml;
  b.fit();
  const box = at("#tiles");
  box.style.gridTemplateColumns = `repeat(${g.cols}, minmax(0, 1fr))`;
  box.style.gridTemplateRows = `repeat(${g.rows}, minmax(0, 1fr))`;
  box.style.height = `${Math.floor(b.tilesH)}px`;
  box.querySelectorAll<HTMLElement>(".tile").forEach((t) => {
    t.classList.remove("row", "col");
    t.classList.add(g.orient);
  });
  box.dataset.grid = `${g.cols}x${g.rows} ${g.orient}`;
  fitCardTexts(box, longestText <= 12 ? 2.2 : longestText <= 30 ? 1.7 : 1.3);
  fillPictures(stage);
}

/** A text answer among picture answers: the largest font, from `start` down, that fits its card. */
function fitCardTexts(box: HTMLElement, start: number): void {
  const texts = [...box.querySelectorAll<HTMLElement>(".apic.text .txt")];
  if (texts.length === 0) return;
  let size = start;
  const set = () => texts.forEach((t) => (t.style.fontSize = `${size}em`));
  // A word wider than its card, or lines taller than it.
  const overflows = () => texts.some((t) => t.scrollWidth > t.clientWidth + 1 || t.parentElement!.scrollHeight > t.parentElement!.clientHeight + 1);
  set();
  while (overflows() && size > 0.6) {
    size -= 0.1;
    set();
  }
}

/**
 * Largest font, from `start` down, at which no answer word is cut and no
 * answer overflows its tile. With `column` (an upright device), tiles that
 * two columns squeeze or set small stand in one, where that sets them larger.
 */
function fitTiles(box: HTMLElement, start: number, column = false): { size: number; squeezed: boolean } {
  box.classList.remove("onecol");
  const two = fitTilesAt(box, start);
  if (!column || (!two.squeezed && two.size >= DEVICE_TILE_MIN)) return two;
  box.classList.add("onecol");
  const one = fitTilesAt(box, start);
  if ((one.squeezed && !two.squeezed) || (one.squeezed === two.squeezed && one.size <= two.size)) {
    box.classList.remove("onecol");
    return fitTilesAt(box, start);
  }
  return one;
}

function fitTilesAt(box: HTMLElement, start: number): { size: number; squeezed: boolean } {
  const tiles = [...box.querySelectorAll<HTMLElement>(".tile")];
  const overflows = () =>
    tiles.some((t) => t.scrollHeight > t.clientHeight + 1 || [...t.querySelectorAll<HTMLElement>(".txt")].some((x) => x.scrollWidth > x.clientWidth + 1));
  let size = start;
  box.style.fontSize = `${size}em`;
  while (overflows() && size > 1) {
    size -= 0.1;
    box.style.fontSize = `${size}em`;
  }
  // Still too long at the smallest size: break inside words rather than hide text.
  const squeezed = overflows();
  box.classList.toggle("squeezed", squeezed);
  return { size, squeezed };
}

/** Largest font, from `start` down, that keeps the question within `limit` pixels of height. */
function fitText(el: HTMLElement, start: number, limit: number): number {
  let size = start;
  el.style.fontSize = `${size}em`;
  while (el.scrollHeight > limit && size > 1.1) {
    size -= 0.15;
    el.style.fontSize = `${size}em`;
  }
  return size;
}

/** What the tiles show besides their answers; every list is in the order on screen. */
export interface TileMarks {
  /** The key: which answers count. Null before the reveal. */
  counts: boolean[] | null;
  /** How many picked each answer, with a bar; null for none (alone, or before the votes). */
  dist: number[] | null;
  /** The answer this device chose, outlined; with the key, a cross on it when it doesn't count. */
  mine?: number | null;
}

/**
 * The votes, then the reveal, on the tiles. The votes: how many
 * picked each, with a bar, and no answer marked or faded. The reveal adds a
 * tick on the ones that count and fades the others; the bars stay. The mark
 * and count have their place at the right of every tile from the start, so
 * neither step moves any answer text.
 */
export function markTiles(root: ParentNode, m: TileMarks): void {
  const { counts, dist } = m;
  const mine = m.mine ?? null;
  const max = dist ? Math.max(1, ...dist) : 1;
  root.querySelectorAll<HTMLElement>("#tiles .tile").forEach((tile, i) => {
    const right = counts ? counts[i] : false;
    tile.classList.toggle("dim", !!counts && !right);
    tile.classList.toggle("mine", i === mine);
    const side = tile.querySelector<HTMLElement>(".side")!;
    const mark = right ? `<span class="mark">${ICON.check}</span>` : counts && i === mine ? `<span class="mark">${ICON.cross}</span>` : "";
    const html = dist ? `${mark}<span class="n">${dist[i]}</span>` : mark;
    if (side.innerHTML !== html) side.innerHTML = html;
    let fill = tile.querySelector<HTMLElement>(".fill");
    if (!dist) {
      fill?.remove();
      return;
    }
    const width = `${(100 * dist[i]) / max}%`;
    if (!fill) {
      // Grows from nothing when the spread first shows.
      const f = document.createElement("span");
      f.className = "fill";
      f.style.width = "0";
      tile.appendChild(f);
      requestAnimationFrame(() => requestAnimationFrame(() => (f.style.width = width)));
      fill = f;
    } else fill.style.width = width;
  });
}

// The winners jump: after a reveal, the avatars of those whose answer
// counts jump for a few seconds in a band over the top of the stage; the
// tiles with the key stay in view (look.ts, partySize). Whoever calls it
// decides when (once per key: docs/design/class-and-wall.md, "The winners jump").

/** How long they jump, before the band goes (ms); app.css times the jumps. */
export const PARTY_MS = 4200;
let partyTimer: number | undefined;

export function endJump(): void {
  clearTimeout(partyTimer);
  document.getElementById("party")?.remove();
}

/** The band over the top of the stage, these avatars jumping in it in this order; it goes by itself. */
export function jump(stage: HTMLElement, winners: { id: string; avatar: Avatar }[]): void {
  endJump();
  if (winners.length === 0) return;
  const box = stage.getBoundingClientRect();
  // The band stops above the first tile: the key stays in view whatever the
  // layout (a short question beside its picture leaves little room).
  const tiles = [...stage.querySelectorAll("#tiles .tile")].map((t) => t.getBoundingClientRect().top);
  const room = tiles.length ? Math.min(...tiles) - box.top - 2 : Infinity;
  const L = partySize(winners.length, box.width, box.height, room);
  const el = document.createElement("div");
  el.id = "party";
  el.setAttribute("aria-hidden", "true");
  // The band over the top of the stage; the rows stand on its floor, the
  // back one higher, room above them for the jump.
  el.style.cssText = `left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${L.band}px`;
  const pad = Math.max(4, 0.06 * L.s);
  const rows = Math.ceil(winners.length / L.perRow);
  el.innerHTML = winners
    .map((w, i) => {
      const row = Math.floor(i / L.perRow);
      const inRow = Math.min(L.perRow, winners.length - row * L.perRow);
      const width = L.s + (inRow - 1) * L.step;
      // A back row half a step aside, its faces between the front row's.
      const shift = rows > 1 && width + L.step / 2 <= box.width ? ((row % 2 ? -1 : 1) * L.step) / 4 : 0;
      const x = (box.width - width) / 2 + shift + (i - row * L.perRow) * L.step;
      const y = pad + (rows - 1 - row) * L.rise;
      // Neighbours out of step, so ten side by side read as ten.
      const delay = (0.3 + ((i * 0.618) % 1) * 0.5).toFixed(2);
      return `<div class="jumper" data-id="${esc(w.id)}" style="left:${x.toFixed(1)}px;bottom:${y.toFixed(1)}px;width:${L.s}px;height:${L.s}px"><span style="animation-delay:${delay}s">${avatarSvg(w.avatar, false)}</span></div>`;
    })
    .join("");
  document.body.appendChild(el);
  partyTimer = window.setTimeout(() => {
    el.classList.add("out");
    partyTimer = window.setTimeout(() => el.remove(), 400);
  }, PARTY_MS);
}

/**
 * A background behind the whole screen, under a light veil so the question
 * and tiles read from the back row; null takes it away.
 */
export function backdrop(bg: ImageRef | null): void {
  let el = document.getElementById("backdrop");
  document.body.classList.toggle("has-backdrop", !!bg);
  if (!bg) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "backdrop";
    el.setAttribute("aria-hidden", "true");
    document.body.prepend(el);
  }
  if (el.dataset.src !== bg.src) {
    el.dataset.src = bg.src;
    el.innerHTML = picImg(bg.src, bg.w, bg.h);
  }
  fillPictures(el);
}
