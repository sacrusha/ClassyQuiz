// A Peers room on a player's device (backlog v5 items 3 and 7;
// docs/design/peers.md). There
// is no wall and nobody steers, so each device shows what a wall would:
// the code for the others (on the device of whoever opened the room), who
// is in, the question itself on the device screen (client/device.ts), the
// spread, the winners and how the friends stand with the solution, and the
// final ranking. The room moves on once everyone present is done: answered,
// then done with the solution; a player who is done can start a Countdown
// for the others. Whoever opened it also has a ⋯ to fix a solution, remove
// an avatar and end the quiz early.
//
// client/seat.ts owns the line and the lobby's dressing menu; it hands
// every view of a Peers room here.

import qrcode from "qrcode-generator";
import type { Command, PeersView, PlayerView, ServerMessage, TeacherQuestion } from "../shared/protocol.ts";
import { DeviceScreen, type DeviceView } from "./device.ts";
import { esc, lines, siteAddress } from "./dom.ts";
import { ICON, avatarSvg, syncAvatars } from "./look.ts";
import { answersBlock, openMenu, toast, type MenuItem } from "./manage.ts";
import { packPicture, wantPacks } from "./packs.ts";
import { fillPictures, preload, seed } from "./pictures.ts";
import { Latest } from "./latest.ts";
import { edgeBar } from "./clock.ts";
import { startButton } from "./steps.ts";
import { T, said } from "./room-text.ts";

type Ack = Extract<ServerMessage, { t: "ack" }>;

export interface PeersContext {
  main: HTMLElement;
  send(cmd: Command): Promise<Ack>;
  /** The lobby's dressing menu for this player, built into `into` the first time (client/seat.ts). */
  dress(into: HTMLElement): void;
  /** This device is done with the room: the start page needn't offer it again. */
  forget(): void;
}

/** Beyond this many, "waiting for" shows a number for the rest. */
const WAITING_SHOWN = 6;

export class PeersRoom {
  private ctx: PeersContext;
  private main: HTMLElement;
  private view: PlayerView | null = null;
  private screen: DeviceScreen;
  /** The last tap, shown on its way (dashed) until the view has it stored. */
  private tap: { q: number; choice: number } | null = null;
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
    this.screen = new DeviceScreen(ctx.main, { answer: (i) => this.answer(i), next: () => this.next(), menu: () => this.menu(), countdown: () => this.countdown() });
    this.main.addEventListener("click", this.click);
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
    else if (v.phase === "lobby" || v.phase === "idle") this.lobby(v, p);
    else if (v.phase === "final") this.final(v, p);
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
  // it waits for. Once pressed, the quiz comes START_MS later, its time
  // draining along the top edge. Built once and patched, so nothing is
  // replaced under a finger (a picture of the menu, Start).

  private lobby(v: PlayerView, p: PeersView): void {
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
    edgeBar("start", v.starts);
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
        ? `${startButton("solo-go", 'data-peers="start"', T.start, !!v.starts)}<p class="muted">${n === 1 ? T.onlyYou : T.inWithYou(n)} ${T.movesOn}</p>`
        : `<p class="muted pwait">${p.hostAvatar ? `<span class="pav">${avatarSvg(p.hostAvatar)}</span>` : ""}${v.starts ? T.startsSoon : T.startsOnce}</p>`,
    );
  }

  /** The invitation as a link, for friends who can't scan the code (a call): shared where the device shares, else copied. */
  private async invite(): Promise<void> {
    const url = joinUrl(this.view?.peers?.code ?? "");
    if (canShare()) {
      try {
        await navigator.share({ url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast(T.linkCopied, 2500);
    } catch {
      // No clipboard: the link to copy by hand, selected.
      const box = this.main.querySelector<HTMLElement>(".plink");
      if (!box) return;
      box.innerHTML = `<input class="plinkbox" readonly value="${esc(url)}" aria-label="${esc(T.copyLink)}">`;
      const input = box.querySelector<HTMLInputElement>("input")!;
      input.focus();
      input.select();
    }
  }

  // A question and its solution, on the device screen.

  private question(v: PlayerView, p: PeersView): void {
    const q = v.question!;
    const pq = p.question!;
    const reveal = v.phase === "reveal" ? v.reveal : null;
    const tap = this.tap && this.tap.q === q.q ? this.tap : null;
    const mine = tap ? tap.choice : reveal ? reveal.mine : q.mine;
    // Done with the room's step: answered (the room has it), or tapped on from the solution.
    const done = reveal ? p.ready || this.readySent === v.current : q.mine !== null;
    const doneShown = reveal ? done : mine !== null;
    if (!this.main.querySelector("#stage")) this.page("screen steering peers");
    const c = p.countdown;
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
      next: reveal && !done ? (p.last ? T.finalRanking : T.question(q.n + 1)) : null,
      // While this device waits for the others: who.
      foot: doneShown ? waitingLine(p) : undefined,
      // Every device sees a Countdown that runs, and whose it is; one done with the step can start it for those it waits for.
      countdown: c
        ? { note: reveal ? T.countdownOn : T.countdownNote, running: { key: `${v.phase}|${v.current}`, ms: c.ms, leftMs: c.leftMs, by: c.by } }
        : done && p.waitingFor.length > 0
          ? { note: reveal ? T.countdownOn : T.countdownNote, running: null }
          : null,
      ...(reveal && p.standings ? { standing: standingLine(p) } : {}),
      menu: p.host,
    };
    this.screen.show(dv);
    fitStanding(this.main.querySelector<HTMLElement>("#dstand"));
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

  /** The foot's button at the solution: done with it; the next question comes once everyone present is. */
  private next(): void {
    const v = this.view;
    // A key under the open sheet would tap on, and let the room move under it.
    if (!v || v.phase !== "reveal" || this.fixing !== null) return;
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

  /** Countdown: the room goes on LAST_CALL_MS from now, whoever it still waits for (docs/design/peers.md, "Countdown"). */
  private countdown(): void {
    const v = this.view;
    if (!v || (v.phase !== "question" && v.phase !== "reveal")) return;
    void this.run({ op: "lastCall", at: { phase: v.phase, current: v.current } });
  }

  // The final ranking: the podium as on the wall, cheering; this player's
  // place; ←, each device leaving when it likes. The room ends once nobody
  // has been at it for a while (docs/design/peers.md, "The end").

  private final(v: PlayerView, p: PeersView): void {
    const me = v.me!;
    const top = p.ranking?.top ?? [];
    const html = `<div class="pfinal">
        <h1 class="ctitle">${lines(p.title || "Quiz")}</h1>
        <div class="ppodium">${top.map((t) => `<div class="p${t.place}"><span class="cheer">${avatarSvg(t.avatar)}</span><b>${t.place}.</b><span>${ICON.star} ${t.score}</span></div>`).join("")}</div>
        <p class="pme"><span class="pav">${avatarSvg(me.avatar)}</span><b>${me.place}.</b> <span class="muted">/ ${me.of}</span> ${ICON.star} ${me.score} ${ICON.trophy}</p>
        <a class="btn" href="/" data-peers="leave" aria-label="${T.back}">&#8592;</a>
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
    // Until the opener taps on, the room waits for them; only a Countdown moves it under the sheet.
    if (v.phase === "reveal" && !p.ready && this.readySent !== v.current) items.push({ label: T.changeSolution, run: () => ((this.fixing = v.current), this.renderFix()) });
    const others = p.players.filter((x) => x.id !== p.player);
    if (others.length > 0) items.push({ label: T.removeSomeone, run: () => this.removeMenu(others) });
    items.push({ label: `${ICON.trophy} ${T.endQuiz}`, run: () => void this.run({ op: "finish", at }) });
    openMenu(items);
  }

  private removeMenu(others: PeersView["players"]): void {
    openMenu(
      others.map((x) => ({
        label: `<span class="pav">${avatarSvg(x.avatar)}</span> ${T.remove}`,
        danger: true,
        run: () => void this.run({ op: "remove", player: x.id }),
      })),
    );
  }

  private async run(cmd: Command): Promise<void> {
    const a = await this.ctx.send(cmd);
    if (!a.ok && a.error) toast(said(a.error));
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
    else if (act === "invite") void this.invite();
    else if (act === "menu") this.menu();
    // The link goes on to the start page by itself.
    else if (act === "leave") this.ctx.forget();
  };
}

/** Puts html into el unless it is already there: a view that changes nothing on this screen replaces nothing under a finger. */
function setHtml(el: HTMLElement, html: string): void {
  if (el.dataset.html === html && el.firstChild) return;
  el.dataset.html = html;
  el.innerHTML = html;
}

/** Straight to the player page, as the QR code. */
function joinUrl(code: string): string {
  return `${location.origin}/play#${code}`;
}

/** A phone or a tablet hands a link to its own share sheet; a laptop's is a detour from pasting it into a call. */
function canShare(): boolean {
  return typeof navigator.share === "function" && matchMedia("(pointer: coarse)").matches;
}

/** The code for the others, on the device of whoever opened the room: the address, the code, the QR to scan, the link to send. */
function joinCard(code: string): string {
  const qr = qrcode(0, "M");
  qr.addData(joinUrl(code));
  qr.make();
  const label = canShare() ? T.shareLink : T.copyLink;
  return `<div class="pqr">${qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true })}</div>
    <div class="pcodebox"><p>${T.friendsJoin(esc(siteAddress()))}</p><p class="pcode">${esc(code)}</p><p class="muted">${T.orQr}</p>
    <div class="plink"><button class="btn" type="button" data-peers="invite">${esc(label)}</button></div></div>`;
}

/** Who the room waits for, as avatars; a number for those beyond WAITING_SHOWN. Empty when it waits for nobody present. */
function waitingLine(p: PeersView): string {
  const byId = new Map(p.players.map((x) => [x.id, x.avatar]));
  const avatars = p.waitingFor.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  if (avatars.length === 0) return "";
  const shown = avatars.slice(0, WAITING_SHOWN);
  const more = avatars.length - shown.length;
  return `<span class="pwaiting"><span class="pwlabel">${T.waitingFor}</span> <span class="pavs">${shown.map((a) => `<span>${avatarSvg(a)}</span>`).join("")}</span>${more > 0 ? ` +${more}` : ""}</span>`;
}

/**
 * How the friends stand, for the top bar at the solution: the scores from
 * the highest, each with its avatars, so ties read as one group; this
 * player's avatar marked (docs/design/peers.md, "The solution").
 */
function standingLine(p: PeersView): string {
  const byId = new Map(p.players.map((x) => [x.id, x.avatar]));
  const groups: { score: number; ids: string[] }[] = [];
  for (const s of p.standings ?? []) {
    if (!byId.has(s.id)) continue;
    const last = groups[groups.length - 1];
    if (last && last.score === s.score) last.ids.push(s.id);
    else groups.push({ score: s.score, ids: [s.id] });
  }
  return groups
    .map(
      (g) =>
        `<span class="sgroup"><span class="sscore">${ICON.star} ${g.score}</span><span class="pavs">${g.ids
          .map((id) => `<span${id === p.player ? ' class="me"' : ""}>${avatarSvg(byId.get(id)!)}</span>`)
          .join("")}</span></span>`,
    )
    .join("");
}

/**
 * Where the standing doesn't fit the bar (a phone, many friends), avatars
 * give way from the lowest score up, this player's never, each score saying
 * "+n" for its own; scores keep their place while that is enough, and only
 * then the lowest go, but this player's, with "…" for them.
 */
function fitStanding(el: HTMLElement | null): void {
  const over = () => !!el && el.scrollWidth > el.clientWidth;
  if (!el || !el.firstChild || !over()) return;
  const groups = [...el.querySelectorAll<HTMLElement>(".sgroup")].reverse();
  for (const g of groups) {
    let hidden = 0;
    let more: HTMLElement | null = null;
    for (const a of [...g.querySelectorAll<HTMLElement>(".pavs > span:not(.me)")].reverse()) {
      if (!over()) return;
      a.remove();
      hidden++;
      if (!more) {
        more = document.createElement("span");
        more.className = "smore";
        g.appendChild(more);
      }
      more.textContent = `+${hidden}`;
    }
  }
  const cut = document.createElement("span");
  cut.className = "smore";
  cut.textContent = "…";
  for (const g of groups) {
    if (!over()) return;
    if (g.querySelector(".me")) continue;
    g.remove();
    if (!cut.parentNode) el.appendChild(cut);
  }
}
