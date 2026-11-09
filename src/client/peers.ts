// A Peers room on a player's device (backlog v5 items 3 and 7;
// docs/design/peers.md; screens and words: docs/user-flow.md §3.9). There
// is no wall and nobody steers, so each device shows what a wall would:
// the code for the others (on the device of whoever opened the room), who
// is in, the question itself on the device screen (client/device.ts), the
// spread and the winners with the solution, and the ranking. The room
// moves on once everyone present is done: answered, then done with the
// solution. Whoever opened it also has a ⋯ to go on without waiting, fix a
// solution, remove an avatar and end the quiz.
//
// client/play.ts owns the line and the lobby's dressing menu; it hands
// every view of a Peers room here.

import qrcode from "qrcode-generator";
import type { Avatar, Command, PeersView, PlayerView, ServerMessage, TeacherQuestion } from "../shared/protocol.ts";
import { DeviceScreen, type DeviceView } from "./device.ts";
import { esc, lines, siteAddress } from "./dom.ts";
import { ICON, avatarSvg, syncAvatars } from "./look.ts";
import { answersBlock, openMenu, toast, type MenuItem } from "./manage.ts";
import { packPicture, wantPacks } from "./packs.ts";
import { fillPictures, preload, seed } from "./pictures.ts";
import { Latest } from "./latest.ts";

type Ack = Extract<ServerMessage, { t: "ack" }>;

export interface PeersContext {
  main: HTMLElement;
  send(cmd: Command): Promise<Ack>;
  /** The lobby's dressing menu for this player, built into `into` the first time (client/play.ts). */
  dress(into: HTMLElement): void;
}

const PLAY = "&#9654;";
/** The keys that press the foot's button, as on the device screen. */
const NEXT_KEYS = new Set([" ", "Enter", "ArrowRight", "ArrowDown", "PageDown", "n", "N"]);
/** Beyond this many, "waiting for" shows a number for the rest. */
const WAITING_SHOWN = 6;

export class PeersRoom {
  private ctx: PeersContext;
  private main: HTMLElement;
  private view: PlayerView | null = null;
  private screen: DeviceScreen;
  /** The last tap, shown on its way (dashed) until the view has it stored. */
  private tap: { q: number; choice: number } | null = null;
  /** The question whose solution this device left for the ranking: its own step, nobody waits on it. */
  private ranked = -1;
  /** "Done" sent for this question, shown at once until the view says so. */
  private readySent = -1;
  /** The solution the winners last jumped for: once per key, as on the wall. */
  private jumped = "";
  /** The question whose solution is being changed (⋯ → Change the solution), or null. */
  private fixing: number | null = null;
  /** The questions' pictures and backgrounds in the packs, as the lobby said: drawn from there once a pack is here. */
  private inPacks: NonNullable<PeersView["inPacks"]> = [];

  constructor(ctx: PeersContext) {
    this.ctx = ctx;
    this.main = ctx.main;
    this.screen = new DeviceScreen(ctx.main, { answer: (i) => this.answer(i), next: () => this.next(), menu: () => this.menu() });
    this.main.addEventListener("click", this.click);
    document.addEventListener("keydown", this.key);
  }

  show(v: PlayerView): void {
    this.view = v;
    const p = v.peers!;
    const q = v.question;
    // The view has the tap stored, or the room moved on: no longer on its way.
    const stored = v.reveal ? v.reveal.mine : (q?.mine ?? null);
    if (this.tap && (!q || q.q !== this.tap.q || stored === this.tap.choice)) this.tap = null;
    if (p.ready || v.phase !== "reveal" || v.current !== this.readySent) this.readySent = -1;
    if (p.inPacks) this.inPacks = p.inPacks;
    wantPacks(v.packs, () => this.packArrived());
    this.fromPacks();
    if (v.removed || !v.me) this.removed();
    else if (v.phase === "lobby" || v.phase === "idle") this.lobby(p);
    else if (v.phase === "final") this.final(v, p);
    else if (v.phase === "reveal" && (p.ready || this.readySent === v.current || this.ranked === v.current)) this.ranking(v, p);
    else if (q && p.question) this.question(v, p);
    this.renderFix();
  }

  private redraw(): void {
    if (this.view) this.show(this.view);
  }

  // The pictures (docs/design/peers.md, "The pictures"): the packs carry
  // the answer pictures' small copies and the questions' pictures and
  // backgrounds, a few requests per device; each is drawn under the
  // address the views name it by, so the layout doesn't wait or change. A
  // picture whose pack isn't here when it shows is fetched by itself.

  /** Gives the pictures whose packs are here to the page, under their addresses. */
  private fromPacks(): void {
    for (const x of this.inPacks) {
      const url = packPicture(x.pic);
      if (url) seed(x.src, url);
    }
    const v = this.view;
    const full = v?.peers?.question?.pics;
    v?.question?.pics?.forEach((small, i) => {
      const url = small && full?.[i] ? packPicture(small) : null;
      if (url) seed(full![i]!.src, url);
    });
  }

  private packArrived(): void {
    this.fromPacks();
    fillPictures();
  }

  /** A page of the room's own in `main`: the device screen steps aside. */
  private page(cls: string): void {
    this.screen.leave();
    document.body.className = cls;
    delete this.main.dataset.html;
  }

  private removed(): void {
    this.page("play peers");
    this.main.innerHTML = `<div class="center"><div class="verdict void" style="width:22vmin;height:22vmin">${ICON.cross}</div></div>`;
  }

  // The lobby: the code for the others on the opener's device, who is in,
  // the dressing menu, and Start, the opener's; the others see whose Start
  // it waits for. Built once and patched, so nothing is replaced under a
  // finger (a picture of the menu, Start).

  private lobby(p: PeersView): void {
    let root = this.main.querySelector<HTMLElement>(".plobby");
    if (!root) {
      this.page("play peers");
      this.main.innerHTML = `<div class="plobby">
        <h1 class="ctitle">${lines(p.title || "Quiz")}</h1>
        <div class="pjoin" hidden></div>
        <div class="avatars pcrowd" data-crowd></div>
        <div class="pstart"></div>
        <div class="pdress"></div>
      </div>`;
      root = this.main.querySelector<HTMLElement>(".plobby")!;
      if (p.pictures) preload(p.pictures);
    }
    root.classList.toggle("host", p.host);
    const join = root.querySelector<HTMLElement>(".pjoin")!;
    if (p.host && join.hidden) {
      join.innerHTML = joinCard(p.code);
      join.hidden = false;
    }
    syncAvatars(root.querySelector<HTMLElement>("[data-crowd]")!, p.players, (x) => ({ tag: "span", className: x.away ? "away" : "" }));
    this.ctx.dress(root.querySelector<HTMLElement>(".pdress")!);
    const n = p.players.length;
    setHtml(
      root.querySelector<HTMLElement>(".pstart")!,
      p.host
        ? `<button class="btn primary solo-go" type="button" data-peers="start">Start ${PLAY}</button><p class="muted">${n === 1 ? "Only you so far." : `${n} in, you among them.`} The quiz moves on once everyone has answered.</p>`
        : `<p class="muted pwait">${p.hostAvatar ? `<span class="pav">${avatarSvg(p.hostAvatar)}</span>` : ""}starts the quiz once everyone is in.</p>`,
    );
  }

  // A question and its solution, on the device screen.

  private question(v: PlayerView, p: PeersView): void {
    const q = v.question!;
    const pq = p.question!;
    const reveal = v.phase === "reveal" ? v.reveal : null;
    const tap = this.tap && this.tap.q === q.q ? this.tap : null;
    const mine = tap ? tap.choice : reveal ? reveal.mine : q.mine;
    if (!this.main.querySelector("#stage")) this.page("screen steering peers");
    const dv: DeviceView = {
      title: p.title,
      question: {
        key: `${q.q}`,
        n: q.n,
        total: q.total,
        text: pq.text,
        answers: q.answers,
        ...(pq.pics ? { pics: pq.pics } : {}),
        image: pq.image,
        background: pq.background,
      },
      // The view says "open" once the question has left answering; the solution closes it.
      answering: reveal ? "closed" : q.answering,
      mine,
      sending: !!tap,
      counts: reveal ? reveal.counts : null,
      void: !!reveal?.void,
      dist: reveal ? p.dist : null,
      me: { avatar: v.me!.avatar, score: v.me!.score },
      next: reveal ? "Ranking" : null,
      // While this device waits for the others to answer: who.
      foot: !reveal && mine !== null ? waitingLine(p) : undefined,
      menu: p.host,
    };
    this.screen.show(dv);
    if (reveal) {
      const key = `${q.q}|${reveal.counts.join()}|${reveal.void}`;
      if (key !== this.jumped) {
        this.jumped = key;
        const byId = new Map(p.players.map((x) => [x.id, x.avatar]));
        this.screen.jump(p.winners.flatMap((id) => (byId.has(id) ? [{ id, avatar: byId.get(id)! }] : [])));
      }
    }
  }

  private answer(i: number): void {
    const v = this.view;
    const q = v?.question;
    if (!v || !q || v.phase !== "question") return;
    const mine = this.tap && this.tap.q === q.q ? this.tap.choice : q.mine;
    // The same tile again changes nothing; it isn't sent.
    if (mine === i) return;
    const tap = { q: q.q, choice: i };
    this.tap = tap;
    this.redraw();
    this.answers.put({ tap, seq: Date.now(), v: v.v });
  }

  /** Taps go out merged (client/latest.ts): the first of a burst, then the latest. */
  private answers = new Latest<{ tap: { q: number; choice: number }; seq: number; v: number }, Ack>(
    (x) => this.ctx.send({ op: "answer", q: x.tap.q, choice: x.tap.choice, seq: x.seq, v: x.v }),
    (x, a) => {
      // Not taken (too late, too many changes of mind): the device shows what is held.
      if (this.tap !== x.tap || a.ok) return;
      this.tap = null;
      this.redraw();
    },
  );

  /** The foot's button: from the solution to the ranking (this device's own step), from the ranking "done". */
  private next(): void {
    const v = this.view;
    // A key under the open sheet would tap on, and let the room move under it.
    if (!v || v.phase !== "reveal" || this.fixing !== null) return;
    if (this.ranked !== v.current) {
      this.ranked = v.current;
      this.redraw();
      return;
    }
    if (v.peers!.ready || this.readySent === v.current) return;
    const q = v.current;
    this.readySent = q;
    this.redraw();
    void this.ctx.send({ op: "ready", q }).then((a) => {
      if (a.ok || this.readySent !== q) return;
      this.readySent = -1;
      this.redraw();
    });
  }

  // The ranking, while this device waits for the others: places 1 to 3 as
  // on the wall, and this player's own place; the foot's button says what
  // comes next, then who the room waits for.

  private ranking(v: PlayerView, p: PeersView): void {
    const q = v.question;
    const me = v.me!;
    const done = p.ready || this.readySent === v.current;
    const next = done ? null : p.last ? "Final ranking" : `Question ${(q?.n ?? 0) + 1}`;
    const html = `<div class="bar" id="qbar"><span>${q ? `${q.n} / ${q.total}` : ""}</span><span class="grow"></span><span class="dme">${avatarSvg(me.avatar)}</span><span id="dscore">${ICON.star} ${me.score}</span>${p.host ? `<button class="dmenu" type="button" data-peers="menu" aria-label="menu">&#8943;</button>` : ""}</div>
      <div class="pranking">${rankingList(p, me)}</div>
      <div class="steerbar dbar"><span class="grow">${done ? waitingLine(p) : esc(p.title)}</span><button class="btn primary bar-play" type="button" data-peers="ready"${next ? "" : ` style="visibility:hidden" tabindex="-1"`}>${next ? `${PLAY}<span class="lbl"><span>${esc(next)}</span></span>` : ""}</button></div>`;
    if (!this.main.querySelector(".pranking")) this.page("screen steering peers");
    setHtml(this.main, html);
  }

  // The final ranking: the podium as on the wall, cheering; this player's
  // place; for whoever opened the room, Exit, which ends it on every device.

  private final(v: PlayerView, p: PeersView): void {
    const me = v.me!;
    const top = p.ranking?.top ?? [];
    const html = `<div class="pfinal">
        <h1 class="ctitle">${lines(p.title || "Quiz")}</h1>
        <div class="ppodium">${top.map((t) => `<div class="p${t.place}"><span class="cheer">${avatarSvg(t.avatar)}</span><b>${t.place}.</b><span>${ICON.star} ${t.score}</span></div>`).join("")}</div>
        <p class="pme"><span class="pav">${avatarSvg(me.avatar)}</span><b>${me.place}.</b> <span class="muted">/ ${me.of}</span> ${ICON.star} ${me.score} ${ICON.trophy}</p>
        ${
          p.host
            ? `<button class="btn primary solo-go" type="button" data-peers="exit">Exit</button><p class="muted">Exit ends the quiz on every device.</p>`
            : `<a class="btn" href="/" aria-label="back">&#8592;</a>`
        }
      </div>`;
    if (!this.main.querySelector(".pfinal")) this.page("play peers");
    setHtml(this.main, html);
  }

  // The ⋯ of whoever opened the room.

  private menu(): void {
    const v = this.view;
    const p = v?.peers;
    if (!v || !p?.host) return;
    const at = { phase: v.phase, current: v.current };
    const items: MenuItem[] = [];
    if (v.phase === "question" || v.phase === "reveal") {
      const onto = v.phase === "question" ? "Solution" : p.last ? "Final ranking" : `Question ${(v.question?.n ?? 0) + 1}`;
      items.push({ label: `${esc(onto)} now, without waiting`, run: () => void this.run({ op: "goOn", at }) });
    }
    // Until the opener taps on, the room waits for them, so it doesn't move under the sheet.
    if (v.phase === "reveal" && !p.ready && this.readySent !== v.current) items.push({ label: "Change the solution", run: () => ((this.fixing = v.current), this.renderFix()) });
    const others = p.players.filter((x) => x.id !== p.player);
    if (others.length > 0) items.push({ label: "Remove a player…", run: () => this.removeMenu(others) });
    items.push({ label: `${ICON.trophy} End the quiz: final ranking`, run: () => void this.run({ op: "finish", at }) });
    openMenu(items);
  }

  private removeMenu(others: PeersView["players"]): void {
    openMenu(
      others.map((x) => ({
        label: `<span class="pav">${avatarSvg(x.avatar)}</span> Remove`,
        danger: true,
        run: () => void this.run({ op: "remove", player: x.id }),
      })),
    );
  }

  private async run(cmd: Command): Promise<void> {
    const a = await this.ctx.send(cmd);
    if (!a.ok && a.error) toast(a.error);
  }

  /** "Change the solution": the open question's choices in a sheet, as the steering screens have it (client/manage.ts). */
  private renderFix(): void {
    const v = this.view;
    const p = v?.peers;
    let el = document.getElementById("pfix");
    const i = this.fixing;
    if (i === null || !v || !p?.host || v.phase !== "reveal" || v.current !== i || !v.reveal || !v.question || !p.question) {
      el?.remove();
      this.fixing = null;
      return;
    }
    const r = v.reveal;
    const pics = p.question.pics;
    const q: TeacherQuestion = {
      text: p.question.text,
      image: null,
      pictureHidden: false,
      background: null,
      answers: v.question.answers.map((text, j) => ({ text, counts: r.counts[j], marked: r.counts[j], ...(pics ? { image: pics[j] } : {}) })),
      void: r.void,
      skip: false,
      status: "revealed",
    };
    if (!el) {
      el = document.createElement("div");
      el.id = "pfix";
      el.className = "sheet-back";
      el.innerHTML = `<div class="sheet fixsheet"></div>`;
      el.addEventListener("click", (e) => this.fixAct(e, el!));
      document.body.appendChild(el);
    }
    setHtml(el.firstElementChild as HTMLElement, `<p class="fixq">${lines(q.text)}</p>${answersBlock(q, i, { open: new Set(), all: false, fixing: i }, p.dist)}`);
    fillPictures(el);
  }

  private fixAct(e: MouseEvent, el: HTMLElement): void {
    const v = this.view;
    const t = e.target as HTMLElement;
    const a = t.closest<HTMLElement>("[data-act]");
    if (t === el || a?.dataset.act === "fix-done") {
      this.fixing = null;
      this.renderFix();
      return;
    }
    if (!a || !v?.reveal || this.fixing === null) return;
    const q = this.fixing;
    if (a.dataset.act === "toggle-count") {
      const counts = v.reveal.counts.slice();
      const j = Number(a.dataset.i);
      counts[j] = !counts[j];
      void this.run({ op: "setCounts", q, counts });
    } else if (a.dataset.act === "void") void this.run({ op: "setVoid", q, value: !v.reveal.void });
  }

  private click = (e: MouseEvent): void => {
    const act = (e.target as HTMLElement).closest<HTMLElement>("[data-peers]")?.dataset.peers;
    const v = this.view;
    if (!act || !v) return;
    if (act === "start") void this.run({ op: "begin", at: { phase: "lobby", current: -1 } });
    else if (act === "ready") this.next();
    else if (act === "menu") this.menu();
    else if (act === "exit") void this.run({ op: "endInstance" });
  };

  /** On the ranking, the foot's keys as on the device screen (which handles its own while it shows). */
  private key = (e: KeyboardEvent): void => {
    if (!this.main.querySelector(".pranking") || e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
    if ((e.target as HTMLElement).tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
    if (NEXT_KEYS.has(e.key)) {
      e.preventDefault();
      this.next();
    }
  };
}

/** Puts html into el unless it is already there: a view that changes nothing on this screen replaces nothing under a finger. */
function setHtml(el: HTMLElement, html: string): void {
  if (el.dataset.html === html && el.firstChild) return;
  el.dataset.html = html;
  el.innerHTML = html;
}

/** The code for the others, on the device of whoever opened the room: the address, the code, the QR to scan. */
function joinCard(code: string): string {
  const qr = qrcode(0, "M");
  // Straight to the player page, as the wall's QR code.
  qr.addData(`${location.origin}/play#${code}`);
  qr.make();
  return `<div class="pqr">${qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true })}</div>
    <div class="pcodebox"><p>Friends join on <b>${esc(siteAddress())}</b> with the code</p><p class="pcode">${esc(code)}</p><p class="muted">or with the QR code.</p></div>`;
}

/** Who the room waits for, as avatars; a number for those beyond WAITING_SHOWN. Empty when it waits for nobody present. */
function waitingLine(p: PeersView): string {
  const byId = new Map(p.players.map((x) => [x.id, x.avatar]));
  const avatars = p.waitingFor.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  if (avatars.length === 0) return "";
  const shown = avatars.slice(0, WAITING_SHOWN);
  const more = avatars.length - shown.length;
  return `<span class="pwaiting">Waiting for <span class="pavs">${shown.map((a) => `<span>${avatarSvg(a)}</span>`).join("")}</span>${more > 0 ? ` +${more}` : ""}</span>`;
}

/** Places 1 to 3 (at most ten avatars, ties sharing a place), and this player's own place if it is further down. */
function rankingList(p: PeersView, me: NonNullable<PlayerView["me"]>): string {
  const top = p.ranking?.top ?? [];
  const row = (place: number, av: Avatar, score: number, cls = "") =>
    `<div class="prank${cls}"><span class="pplace">${place}.</span><span class="pav">${avatarSvg(av)}</span><span class="pscore">${ICON.star} ${score}</span></div>`;
  const mine = top.some((t) => t.id === p.player) || me.place === 0 ? "" : row(me.place, me.avatar, me.score, " me apart");
  return `<div class="pranks">${top.map((t) => row(t.place, t.avatar, t.score, t.id === p.player ? " me" : "")).join("")}${mine}</div>`;
}
