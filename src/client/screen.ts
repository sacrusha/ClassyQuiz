// The projector: what the class sees. Shows no teacher controls, no notes and
// no key before the reveal. A presentation clicker or the keyboard can move
// the quiz on (next / reveal); everything else is on the teacher's device.
//
// It gets its right to show a quiz in one of two ways:
// - the device holds the teacher link (a second window on an extended
//   screen): /screen?q=<id>;
// - pairing: it shows a code, the teacher's device types it in. The code is
//   harmless on the projector: it grants nothing to whoever reads it.

import qrcode from "qrcode-generator";
import type { Auth, Grant, ScreenView, ServerMessage } from "../shared/protocol.ts";
import { $, esc, findQuiz, keepAwake, lines, siteAddress, statusDot, store } from "./dom.ts";
import { ICON, avatarSvg, shapeSvg } from "./look.ts";
import { Line, api } from "./net.ts";

const main = $("main");
const dot = $("#dot");
const fsBtn = $("#fullscreen") as HTMLButtonElement;
const otherBtn = $("#other") as HTMLButtonElement;
let line: Line | null = null;
let view: ScreenView | null = null;

interface Paired {
  instance: string;
  token: string;
}

function start(): void {
  keepAwake();
  const q = new URLSearchParams(location.search).get("q");
  const own = q ? findQuiz(q) : null;
  if (own) {
    connect(own.id, { role: "screen", secret: own.secret });
    return;
  }
  const paired = store.get<Paired>("cq.screen");
  if (paired) {
    connect(paired.instance, { role: "screen", token: paired.token });
    return;
  }
  void pair();
}

function connect(instance: string, auth: Auth): void {
  otherBtn.hidden = false;
  line?.stop();
  line = new Line({
    instance,
    auth: () => auth,
    onMessage: (m) => onMessage(m, auth),
    onStatus: (s) => statusDot(dot, s),
  });
  line.start();
}

function onMessage(m: ServerMessage, auth: Auth): void {
  if (m.t === "state" && m.view.role === "screen") {
    view = m.view;
    render();
  } else if (m.t === "gone") {
    line?.stop();
    line = null;
    if ("token" in auth) store.remove("cq.screen");
    view = null;
    void pair();
  }
}

// ---------------------------------------------------------------------------
// Pairing

async function pair(): Promise<void> {
  for (;;) {
    let code: string, nonce: string;
    try {
      const r = await api<{ code: string; nonce: string }>("/api/pair/new", { role: "screen" });
      if (!r.body.code) throw new Error("no code");
      ({ code, nonce } = r.body);
    } catch {
      main.innerHTML = `<div class="center"><p class="muted">${ICON.wifi} No connection to ${esc(siteAddress())} yet. Retrying…</p></div>`;
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }
    main.innerHTML = `<div class="center pair">
      <p style="font-size:1.6em;margin:0">Projector</p>
      <div class="bigcode">${code}</div>
      <p class="muted" style="max-width:36em">On the teacher's phone or computer, open the quiz, choose <strong>Connect the projector</strong> and type this code.</p>
    </div>`;
    statusDot(dot, "live");
    for (;;) {
      let r: { grant?: Grant; waiting?: true; expired?: true };
      try {
        r = (await api<typeof r>("/api/pair/wait", { code, nonce })).body;
      } catch {
        statusDot(dot, "offline");
        await new Promise((res) => setTimeout(res, 2000));
        continue;
      }
      statusDot(dot, "live");
      if (r.grant && r.grant.role === "screen") {
        store.set("cq.screen", { instance: r.grant.instance, token: r.grant.token } satisfies Paired);
        connect(r.grant.instance, { role: "screen", token: r.grant.token });
        return;
      }
      if (r.expired) break;
    }
  }
}

// ---------------------------------------------------------------------------
// Drawing

function render(): void {
  const v = view;
  if (!v) return;
  document.title = v.title ? `${v.title} · classyQuiz` : "classyQuiz";
  if (v.phase !== "question" && v.phase !== "reveal") questionKey = "";
  if (v.phase === "idle") {
    main.innerHTML = `<div class="center"><h1 class="title">${esc(v.title || "classyQuiz")}</h1></div>`;
  } else if (v.phase === "lobby") renderLobby(v);
  else if ((v.phase === "question" || v.phase === "reveal") && v.question) renderQuestion(v);
  else if (v.phase === "ranking" || v.phase === "final") renderRanking(v);
}

let lobbyKey = "";
function renderLobby(v: ScreenView): void {
  const key = `${v.code}`;
  if (lobbyKey !== key || !main.querySelector(".lobby")) {
    lobbyKey = key;
    const url = `${location.origin}/#${v.code}`;
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    main.innerHTML = `
      <div class="bar"><span class="grow">${esc(v.title)}</span></div>
      <div class="lobby">
        <div class="join">
          <div class="qr">${qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true })}</div>
          <div class="addr">${esc(siteAddress())}</div>
          <div class="bigcode">${esc(v.code ?? "")}</div>
        </div>
        <div style="display:flex;flex-direction:column;min-height:0">
          <div class="count">${ICON.person}<span id="count">0</span></div>
          <div class="crowd" id="crowd"></div>
        </div>
      </div>`;
  }
  // Add newcomers without redrawing everyone, so each pops in once.
  const crowd = $("#crowd");
  const present = new Set(v.players.map((p) => p.id));
  for (const el of [...crowd.children] as HTMLElement[]) if (!present.has(el.dataset.id!)) el.remove();
  const shown = new Set(([...crowd.children] as HTMLElement[]).map((el) => el.dataset.id));
  for (const p of v.players) {
    if (shown.has(p.id)) continue;
    const d = document.createElement("div");
    d.className = "av";
    d.dataset.id = p.id;
    d.innerHTML = avatarSvg(p.avatar);
    crowd.appendChild(d);
  }
  $("#count").textContent = String(v.players.length);
}

let questionKey = "";
function renderQuestion(v: ScreenView): void {
  lobbyKey = "";
  const q = v.question!;
  const r = v.reveal;
  // While answers come in only the count changes; redrawing the question
  // each time would make it flicker on a slow laptop.
  const key = JSON.stringify([v.phase, q, r]);
  const counter = main.querySelector("#answered");
  if (key === questionKey && counter) {
    counter.textContent = `${v.answered} / ${v.players.length}`;
    return;
  }
  questionKey = key;
  const max = r ? Math.max(1, ...r.dist) : 1;
  const longest = Math.max(...q.answers.map((a) => a.length));
  const tileSize = longest <= 12 ? 2.6 : longest <= 30 ? 2 : longest <= 60 ? 1.55 : 1.25;
  main.innerHTML = `
    <div class="bar">
      <span>${q.n} / ${q.total}</span><span class="grow"></span>
      ${r && r.void ? `<span class="voided">${ICON.void}</span>` : ""}
      <span>${ICON.person} <span id="answered">${v.answered} / ${v.players.length}</span></span>
    </div>
    <h2 class="qtext" id="qtext">${lines(q.text)}</h2>
    <div class="tiles" style="font-size:${tileSize}em">
      ${q.answers
        .map((a, i) => {
          const right = r ? r.counts[i] : false;
          const dim = r && !right ? " dim" : "";
          return `<div class="tile a${i}${dim}">
            ${shapeSvg(i)}<span class="txt">${lines(a)}</span>
            ${r ? `${right ? `<span class="mark">${ICON.check}</span>` : ""}<span class="n">${r.dist[i]}</span><span class="fill" style="width:${(100 * r.dist[i]) / max}%"></span>` : ""}
          </div>`;
        })
        .join("")}
    </div>`;
  fitText($("#qtext"), q.text.length);
}

/** Largest font that keeps the question within its box. */
function fitText(el: HTMLElement, len: number): void {
  let size = len <= 40 ? 3.6 : len <= 90 ? 3 : len <= 160 ? 2.4 : 1.9;
  el.style.fontSize = `${size}em`;
  const limit = window.innerHeight * 0.34;
  while (el.scrollHeight > limit && size > 1.1) {
    size -= 0.15;
    el.style.fontSize = `${size}em`;
  }
}

function renderRanking(v: ScreenView): void {
  lobbyKey = "";
  const r = v.ranking;
  if (!r) return;
  const pct = r.given > 0 ? Math.round((100 * r.right) / r.given) : 0;
  const final = v.phase === "final";
  main.innerHTML = `
    <div class="bar"><span class="grow">${esc(v.title)}</span>${final ? `<span>${ICON.trophy}</span>` : ""}</div>
    <div class="ranking">
      <div class="podium">
        ${r.top
          .map(
            (e) => `<div class="entry p${e.place}">
              <div class="av">${avatarSvg(e.avatar)}</div>
              <div class="place">${e.place}.</div>
              <div>${ICON.star} ${e.score} / ${r.of}</div>
            </div>`,
          )
          .join("")}
      </div>
      <div class="classres">
        <div class="pct">${pct}%</div>
        <div class="muted">${ICON.check} ${r.right} / ${r.given}</div>
        <div class="bars">${r.perQuestion.map((p) => `<span style="height:${p.given ? (100 * p.right) / p.given : 0}%"></span>`).join("")}</div>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Clicker and keyboard: the one key moves the quiz on.

const ADVANCE = new Set([" ", "Enter", "ArrowRight", "ArrowDown", "PageDown", "n", "N"]);
document.addEventListener("keydown", (e) => {
  if (e.key === "f" || e.key === "F") {
    toggleFullscreen();
    return;
  }
  if (!ADVANCE.has(e.key) || e.repeat || !line || !view) return;
  e.preventDefault();
  void line.send({ op: "advance", at: { phase: view.phase, current: view.current } });
});

function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => {});
}
fsBtn.addEventListener("click", toggleFullscreen);
// A projector paired yesterday still shows yesterday's quiz: let go of it.
otherBtn.addEventListener("click", () => {
  line?.stop();
  line = null;
  view = null;
  store.remove("cq.screen");
  history.replaceState(null, "", "/screen");
  otherBtn.hidden = true;
  void pair();
});
document.addEventListener("fullscreenchange", () => {
  fsBtn.hidden = !!document.fullscreenElement;
  otherBtn.hidden = !!document.fullscreenElement || !line;
});

start();
