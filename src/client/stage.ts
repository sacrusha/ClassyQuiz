// The wall and a player's own device lay a question out here alike, so a
// question looks on a laptop as it will on the projector. One stage per
// page: the parts carry ids (#qtext, #figure, #tiles) that the page's styles
// and the winners' band look for.

import type { Avatar, ImageRef } from "../shared/protocol.ts";
import { chooseGrid, type Chrome, type Orient } from "./answergrid.ts";
import { esc, lines } from "./dom.ts";
import { ICON, avatarSvg, partySize, shapeSvg } from "./look.ts";
import { fillPictures, picImg } from "./pictures.ts";

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
   * A player's own device. Held upright (the stage taller than wide), its
   * tiles keep room for the mark only, without the count (app.css,
   * `dupright`), and a question with picture answers gives its text less of
   * the height. Otherwise it is laid out as the wall is.
   */
  device?: boolean;
}

/** On an upright device, the share of the height a picture-answer question's text may take, against the wall's. */
const DEVICE_TEXT_ROOM = 0.7;
/** The smallest the question and the answers are set (em); below, words break. */
const QUESTION_MIN = 1.1;
const TILE_MIN = 1;
/** How far a layout's parts shrink, against their full size, before words break instead. */
const SHRINK_MIN = 0.3;
/** A layout within this of the best is taken when it comes earlier: two columns, then a picture beside, then one column. */
const FAMILIAR = 0.03;

function upright(stage: HTMLElement, o: StageOptions): boolean {
  return !!o.device && stage.clientHeight > stage.clientWidth;
}

function tile(i: number, cls: string, inner: string, o: StageOptions): string {
  return o.buttons
    ? `<button type="button" class="tile ${cls}" data-i="${i}">${inner}</button>`
    : `<div class="tile ${cls}">${inner}</div>`;
}

function questionSize(len: number, withPicture: boolean): number {
  if (withPicture) return len <= 40 ? 3 : len <= 90 ? 2.5 : len <= 160 ? 2.1 : 1.8;
  return len <= 40 ? 3.6 : len <= 90 ? 3 : len <= 160 ? 2.4 : 1.9;
}

/** A way to lay out a question with text answers: where its picture goes, and the tiles in one column or two. */
interface Layout {
  cls: string;
  one: boolean;
  /** The picture at its full size here; beside, it keeps that size. */
  pic?: { w: number; h: number };
  beside?: boolean;
}

/**
 * Each part has a full size: the question's type and the answers' by their
 * length, the picture as large as its place allows. The tiles go in two
 * columns or one; a picture goes between the question and the tiles or
 * beside both. In each such layout the parts that don't fit shrink alike
 * (beside, the picture keeps its size and the text shrinks in its column),
 * and the layout whose most-shrunk part stays largest is taken; of two
 * about alike, the more familiar one.
 */
export function layQuestion(stage: HTMLElement, q: StageQuestion, o: StageOptions = {}): void {
  const at = (sel: string) => stage.querySelector<HTMLElement>(sel)!;
  const up = upright(stage, o);
  if (q.pics) {
    layPictureAnswers(stage, q, q.pics, o, up);
    return;
  }
  const longest = Math.max(...q.answers.map((a) => a.length));
  const tileSize = longest <= 12 ? 2.6 : longest <= 30 ? 2 : longest <= 60 ? 1.55 : 1.25;
  const qHtml = `<h2 class="qtext" id="qtext">${lines(q.text)}</h2>`;
  const tilesHtml = `<div class="tiles${up ? " dupright" : ""}" id="tiles">${q.answers
    .map((a, i) => tile(i, `a${i}`, `${shapeSvg(i)}<span class="txt">${lines(a)}</span><span class="side"></span>`, o))
    .join("")}</div>`;
  const img = q.image;
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  const gap = parseFloat(getComputedStyle(stage).rowGap) || 0;
  const qSize = questionSize(q.text.length, !!img);

  const layouts: Layout[] = [];
  if (!img) layouts.push({ cls: "stage", one: false }, { cls: "stage", one: true });
  else {
    const aspect = img.w / img.h;
    const h = Math.min(W / aspect, H * 0.62);
    const between = { w: h * aspect, h };
    layouts.push({ cls: "stage fig between", one: false, pic: between });
    // Beside, the picture takes up to 58% of the width, else half.
    for (const share of [0.58, 0.5]) {
      const sh = Math.min(H, (share * W) / aspect);
      layouts.push({ cls: "stage fig beside", one: true, beside: true, pic: { w: sh * aspect, h: sh } });
    }
    layouts.push({ cls: "stage fig between", one: true, pic: between });
  }
  const largest = Math.max(1, ...layouts.map((l) => (l.pic ? l.pic.w * l.pic.h : 0)));
  const figure = (p: { w: number; h: number }) =>
    `<div class="figure" id="figure" data-zoom style="width:${Math.floor(p.w)}px;height:${Math.floor(p.h)}px">${picImg(img!.src, img!.w, img!.h)}</div>`;

  const build = (l: Layout): void => {
    stage.className = l.cls;
    stage.innerHTML = !l.pic ? qHtml + tilesHtml : l.beside ? figure(l.pic) + `<div class="col">${qHtml}${tilesHtml}</div>` : qHtml + figure(l.pic) + tilesHtml;
    at("#tiles").classList.toggle("onecol", l.one);
  };
  // The parts at f of their full size; how far they overrun the stage at their own heights (Infinity: a word is cut).
  const overrun = (l: Layout, f: number): number => {
    const text = at("#qtext");
    const tiles = at("#tiles");
    text.style.fontSize = `${Math.max(f * qSize, QUESTION_MIN)}em`;
    tiles.style.fontSize = `${Math.max(f * tileSize, TILE_MIN)}em`;
    let fig = 0;
    if (l.pic && !l.beside) {
      fig = Math.max(40, f * l.pic.h);
      const el = at("#figure");
      el.style.width = `${Math.floor((fig * l.pic.w) / l.pic.h)}px`;
      el.style.height = `${Math.floor(fig)}px`;
    }
    const textGap = q.text ? (l.beside ? parseFloat(getComputedStyle(text.parentElement!).rowGap) || 0 : gap) : 0;
    return tilesOverflow(tiles) ? Infinity : text.offsetHeight + textGap + tiles.offsetHeight + (fig ? fig + gap : 0) - H;
  };
  // The largest f at which the layout fits; for one that doesn't fit even at the smallest, that smallest, with words
  // broken where one would be cut, and how far it overruns.
  const fit = (l: Layout): { f: number; excess: number } => {
    build(l);
    at("#qtext").style.flex = "none";
    at("#tiles").style.flex = "none";
    if (overrun(l, 1) <= 0) return { f: 1, excess: 0 };
    let low = overrun(l, SHRINK_MIN);
    if (low === Infinity) {
      at("#tiles").classList.add("squeezed");
      low = overrun(l, SHRINK_MIN);
    }
    if (low > 0 || at("#tiles").classList.contains("squeezed")) return { f: SHRINK_MIN, excess: Math.max(0, low) };
    let lo = SHRINK_MIN;
    let hi = 1;
    for (let i = 0; i < 7; i++) {
      const mid = (lo + hi) / 2;
      if (overrun(l, mid) <= 0) lo = mid;
      else hi = mid;
    }
    return { f: lo, excess: 0 };
  };
  // The most-shrunk part: the type against its full size, the picture against the largest any layout gives it. A layout
  // that breaks words or overruns ranks below every one that fits, the less it overruns the better.
  const score = (l: Layout, r: { f: number; excess: number }, broken: boolean): number => {
    if (broken) return -1 - r.excess / Math.max(H, 1);
    const parts = [Math.max(r.f * qSize, QUESTION_MIN) / qSize, Math.max(r.f * tileSize, TILE_MIN) / tileSize];
    if (l.pic) parts.push((l.beside ? 1 : r.f) * Math.sqrt((l.pic.w * l.pic.h) / largest));
    return Math.min(...parts);
  };
  const tried = layouts.map((l) => {
    const r = fit(l);
    return { l, r, s: score(l, r, r.excess > 0 || at("#tiles").classList.contains("squeezed")) };
  });
  const best = Math.max(...tried.map((t) => t.s));
  const pick = tried.find((t) => t.s >= best - FAMILIAR)!;
  build(pick.l);
  overrun(pick.l, pick.r.f);
  at("#tiles").classList.toggle("squeezed", tilesOverflow(at("#tiles")));
  fillPictures(stage);
}

/**
 * Tiles arranged by the pictures' shape, the question's own picture beside
 * its text or between text and tiles, the room shared so that it and the
 * smallest answer picture come out about alike.
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

/** A text answer among picture answers. */
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

function tilesOverflow(box: HTMLElement): boolean {
  return [...box.querySelectorAll<HTMLElement>(".tile")].some(
    (t) => t.scrollHeight > t.clientHeight + 1 || [...t.querySelectorAll<HTMLElement>(".txt")].some((x) => x.scrollWidth > x.clientWidth + 1),
  );
}

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

/** The mark and count have their place at the right of every tile from the start, so neither the votes nor the reveal moves any answer text. */
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

/** How long they jump, before the band goes (ms); app.css times the jumps. */
export const PARTY_MS = 4200;
let partyTimer: number | undefined;

export function endJump(): void {
  clearTimeout(partyTimer);
  document.getElementById("party")?.remove();
}

/** The band goes by itself after PARTY_MS; whoever calls it decides when it starts. */
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
