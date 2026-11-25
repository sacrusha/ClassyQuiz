// One place on the player's page: its line to the quiz, the player it is and
// what it shows. A device has one; one the class shares has up to MAX_SEATS
// side by side (client/play.ts, docs/design/class-and-wall.md, "Sharing a
// device"). A teacher device's page has one that takes a role instead.

import type { Avatar, Entry, PackPic, PlayerView, ServerMessage } from "../shared/protocol.ts";
import { TOO_MANY_CODES, WRONG_TEACHER_CODE, viewKey } from "../shared/protocol.ts";
import { CLASS_FULL, CLASS_STARTED, CLASS_WAITING, ROOM_FULL, ROOM_STARTED } from "../shared/limits.ts";
import { esc, findQuiz, forgetQuiz, lines, rolePage, seatKey, siteHead, store, tabRole } from "./dom.ts";
import { ICON, avatarSvg, lookKey, pickerRows, shapeSvg, wiggle } from "./look.ts";
import { pickLook, sameLook, type Look, type LookPart } from "../shared/looks.ts";
import { Line, type LineStatus } from "./net.ts";
import { clockBar, edgeBar, localEnd } from "./clock.ts";
import { chooseGrid, type Chrome, type Orient } from "./answergrid.ts";
import { packPicture, picturesHere, wantPacks } from "./packs.ts";
import { PeersRoom } from "./peers.ts";
import { Latest } from "./latest.ts";
import { onTap } from "./tap.ts";
import { LINE_WORDS, T, said } from "./room-text.ts";

type Ack = Extract<ServerMessage, { t: "ack" }>;
type Choice = Extract<ServerMessage, { t: "choose" }>;

export interface Saved {
  instance: string;
  token: string;
  /** When the place was added: places stand in that order, also after a reload. Absent: by slot. */
  at?: number;
}

export interface SeatContext {
  instance: string;
  code: string;
  /** 0: the device's own place, kept where it always was; 1 and 2: places added at a shared device. */
  slot: number;
  root: HTMLElement;
  /** A teacher device: it takes a role, never plays. secret: the quiz's, on the device that uploaded it. */
  teacher: { digits: string; secret: () => string | undefined; fromWindow: boolean } | null;
  /** Another player's token at this device: a new player here joins beside them. */
  beside(): string | undefined;
  status(s: LineStatus): void;
  /** The view or the player changed: what the page lays out around its places may follow. */
  changed(): void;
  /** A teacher device without a working teacher code: the page's form for it. */
  teacherForm(note: string): void;
}

export class Seat {
  root: HTMLElement;
  view: PlayerView | null = null;
  /** Where the place stands among the device's: a new one at the end, beside the +. */
  readonly order: number;
  private ctx: SeatContext;
  private line: Line | null = null;
  private auth: { role: "player"; token: string } | { role: "guest" } = { role: "guest" };
  private lastKey = "";
  private choice: Choice | null = null;
  private busy = false;
  private tickTimer: number | undefined;
  /**
   * The last tap, until the server's view shows it stored (or the server
   * refused it). Until then the button shows it on its way, never as
   * accepted: what the tablet shows as accepted is the server's record, the
   * one that scores (docs/design/question-flow.md, "When a tap counts"). It counts if it
   * arrives while the question is still on screen.
   */
  private waiting: { q: number; choice: number } | null = null;
  /**
   * This place played as an avatar another device has since taken back: it
   * offers the choice ("+") rather than joining by itself, from now on. It may
   * be lying on a desk with nobody at it.
   */
  private displaced = false;
  /** The class turned this place away (full, or started), in the phase it was then; asked again when that changes. */
  private refused: { reason: string; phase: string } | null = null;
  /**
   * When the open question's answers appeared here (performance.now()),
   * per question: a tap's time for the points for speed is counted from here,
   * on this device, so a slow line costs no speed.
   */
  private shown: { q: number; at: number } | null = null;
  /** Closes the buttons when Last call runs out on this device. */
  private outTimer: number | undefined;
  /**
   * Dressing the animal in the lobby (docs/design/class-and-wall.md):
   * the look the child picked, shown at once, until the server's view shows
   * it back; the latest pick wins. One `dress` is in flight at a time, so a
   * burst of taps sends the first and then the last.
   */
  private look: Required<Look> | null = null;
  /** The server took no more changes of look (MAX_LOOK_CHANGES): the pictures stay, without effect. */
  private dressSpent = false;
  /** A Peers room draws its own screens (client/peers.ts); made with its first view. */
  private peers: PeersRoom | null = null;
  /** A teacher device has acted on what the quiz said when it came in. */
  private entered = false;
  private closed = false;
  /** A join or a pick on its way, and what a close waits on for its player (close). */
  private joining: Promise<Ack> | null = null;
  private welcomed: (() => void) | null = null;

  constructor(ctx: SeatContext) {
    this.ctx = ctx;
    this.root = ctx.root;
    const saved = ctx.teacher ? null : store.get<Saved>(this.key());
    // A place of another quiz that had this code is gone already (client/play.ts).
    if (saved && saved.instance === ctx.instance) this.auth = { role: "player", token: saved.token };
    this.order = this.token ? (saved?.at ?? ctx.slot) : Date.now();
  }

  get slot(): number {
    return this.ctx.slot;
  }

  /** This place's player, if it is one now. */
  get token(): string | undefined {
    return this.auth.role === "player" ? this.auth.token : undefined;
  }

  private key(): string {
    return seatKey(this.ctx.code, this.ctx.slot);
  }

  start(): void {
    if (!this.ctx.teacher) this.showWaiting();
    this.line = new Line({
      instance: this.ctx.instance,
      words: LINE_WORDS,
      slot: this.ctx.slot ? `.${this.ctx.slot}` : "",
      auth: () => this.auth,
      onMessage: (m) => this.onMessage(m),
      onStatus: (s) => {
        if (!this.closed) this.ctx.status(s);
      },
    });
    this.line.start();
  }

  /**
   * The place closes (docs/design/class-and-wall.md, "Sharing a device"): its
   * player leaves, gone before the start and away after it, and the device
   * forgets them. A leave that can't get through in a few seconds is given
   * up: the line ends anyway, and its player shows as away.
   */
  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.tickTimer);
    clearTimeout(this.outTimer);
    const line = this.line;
    // A join on its way: its player leaves too, or it would stand on the wall with nobody at it.
    if (this.joining && this.auth.role === "guest") {
      const a = await Promise.race([this.joining, wait(3000)]);
      if (a?.ok && this.auth.role === "guest") await Promise.race([new Promise<void>((r) => (this.welcomed = r)), wait(1000)]);
    }
    if (line && this.auth.role === "player") await Promise.race([line.send({ op: "leave" }), wait(3000)]);
    store.remove(this.key());
    line?.forget();
  }

  /** The place moves to another element (the page splits or joins again): what it shows moves with it. */
  moveTo(root: HTMLElement): void {
    if (root === this.root) return;
    const nodes = [...this.root.childNodes];
    this.root = root;
    root.replaceChildren(...nodes);
  }

  private onMessage(m: ServerMessage): void {
    if (this.closed) {
      if (m.t === "welcome") {
        this.auth = { role: "player", token: m.token };
        this.welcomed?.();
      }
      return;
    }
    const teacher = this.ctx.teacher;
    if (m.t === "welcome") {
      this.auth = { role: "player", token: m.token };
      store.set(this.key(), { instance: this.ctx.instance, token: m.token, at: this.order } satisfies Saved);
      // Over HTTP, a poll held for the guest would hold back this player's views.
      this.line?.repoll();
      this.busy = false;
      this.displaced = false;
      clearInterval(this.tickTimer);
      this.ctx.changed();
    } else if (m.t === "choose") {
      if (this.auth.role === "player") {
        // A choice for a guest reaching a player: the answer to a poll made
        // before the welcome. Joining again would make a second avatar.
        if (!m.stale) return;
        // The token isn't this class's player any more: another device took
        // the avatar back while this one was away. Choose again rather than
        // stay on a view that no longer moves.
        if (this.view !== null) this.displaced = true;
        this.auth = { role: "guest" };
        store.remove(this.key());
        this.view = null;
        this.lastKey = "";
        this.waiting = null;
        this.ctx.changed();
      }
      this.choice = m;
      if (this.view || this.busy) return;
      if (teacher) {
        // Acted on once, as the device arrives; later choices (another tab
        // came or went) wait for the teacher's tap, so a device left lying
        // here never takes a role by itself.
        if (!this.entered) {
          this.entered = true;
          this.enter(m);
        }
        return;
      } else if (m.phase === "final") {
        this.showFinished();
      } else if (this.refused && this.refused.phase === m.phase && m.avatars.length === 0) {
        this.showRefused(this.refused.reason);
      } else if (m.waiting) {
        // Before the teacher lets the class in: wait here; the next choice without it joins.
        this.showRefused(CLASS_WAITING, false);
      } else if (m.avatars.length > 0 || this.displaced) {
        // A student whose tablet died picks their avatar back. A tablet whose
        // avatar went to another device offers "+" rather than joining by
        // itself: it may be lying on a desk, nobody at it.
        this.showAvatars();
      } else {
        this.newPlayer();
      }
      // Which roles are free, and which avatars are away, change with time.
      clearInterval(this.tickTimer);
      this.tickTimer = window.setInterval(() => {
        if (!this.busy && this.line && !this.view) void this.line.send({ op: "tick" });
      }, 10_000);
    } else if (m.t === "role" && teacher) {
      clearInterval(this.tickTimer);
      this.line?.stop();
      const instance = this.ctx.instance;
      tabRole.set(instance, { role: m.role, token: m.token, code: this.ctx.code, teacher: teacher.digits || findQuiz(instance)?.teacher });
      // A window opened to be dragged to the projector says so until it is full screen.
      location.replace(rolePage(instance, m.role) + (teacher.fromWindow && m.role === "screen" ? "&drag=1" : ""));
    } else if (m.t === "state" && m.view.role === "player" && m.view.peers) {
      this.view = m.view;
      this.peers ??= new PeersRoom({
        main: this.root,
        send: (cmd) => this.line!.send(cmd),
        dress: (into) => this.view?.me && this.renderDress(this.view.me.avatar, into),
        forget: () => forgetQuiz(this.ctx.instance),
      });
      this.peers.show(m.view);
    } else if (m.t === "state" && m.view.role === "player") {
      // Every answer in the class bumps the version; only redraw when this
      // place's own view changed, or a tap could land on a button being
      // replaced and get lost.
      const k = viewKey(m.view);
      const before = this.view;
      const view = (this.view = m.view);
      const q = view.question;
      // The server's word on the last tap: stored, so no longer on its way.
      const stored = view.reveal ? view.reveal.mine : q?.mine;
      if (this.waiting && q && this.waiting.q === q.q && stored === this.waiting.choice) this.waiting = null;
      wantPacks(view.packs, () => this.packsArrived());
      // A picture answer's time for speed runs from when its pictures are here.
      if (q && q.answering !== "reading" && q.sinceMs !== null && this.shown?.q !== q.q && picturesHere(q.pics)) this.shown = { q: q.q, at: performance.now() - q.sinceMs };
      if (k === this.lastKey) return;
      this.lastKey = k;
      this.ctx.changed();
      // Only the stored answer changed while the buttons are up: they are marked
      // in place, since a redraw could swallow a tap landing just then.
      if (before && onlyMineChanged(before, view) && this.root.querySelector(".buttons")) {
        this.markChosen();
        return;
      }
      this.render();
    } else if (m.t === "gone") {
      store.remove(this.key());
      // Gone: the start page's resume card needn't ask after it (a Peers room's opener uploaded it).
      forgetQuiz(this.ctx.instance);
      this.line?.stop();
      clearInterval(this.tickTimer);
      edgeBar("", null);
      if (m.home) {
        location.replace("/");
        return;
      }
      this.root.innerHTML = `<div class="center"><div class="verdict void" style="width:22vmin;height:22vmin">${ICON.trophy}</div>
        <p class="muted">${esc(said(m.reason))}</p><a class="btn big" href="/" style="max-width:320px" aria-label="${T.back}">&#8592;</a></div>`;
    }
  }

  private showWaiting(): void {
    this.root.innerHTML = `<div class="center"><div class="dot" data-status="connecting" style="width:28px;height:28px"></div></div>`;
  }

  private showFinished(): void {
    this.root.innerHTML = `<div class="center"><div class="verdict void" style="width:22vmin;height:22vmin">${ICON.trophy}</div>
      <a class="btn big" href="/" style="max-width:320px" aria-label="${T.back}">&#8592;</a></div>`;
  }

  private showAvatars(): void {
    const c = this.choice!;
    this.root.innerHTML = `<div class="center">
      <div class="choose">
        ${c.avatars.map((a) => `<button data-id="${esc(a.id)}">${avatarSvg(a.avatar)}</button>`).join("")}
        <button class="new" aria-label="${T.newAvatar}">${ICON.plus}</button>
      </div>
    </div>`;
    this.root.querySelectorAll<HTMLButtonElement>(".choose button").forEach((b) =>
      onTap(b, () => {
        const id = b.dataset.id;
        if (id) this.claim(id);
        else this.newPlayer();
      }),
    );
  }

  /**
   * What a teacher device does on arriving (docs/design/teacher-devices.md, "A second device: one question, only when needed"): the
   * question when one tab shows and steers; the role whose tab is gone,
   * without asking; or the note that both are there, which pushes nobody
   * aside. Nothing the device senses decides it.
   */
  private enter(c: Choice): void {
    document.title = `${c.title || "Quiz"} · ${T.showOrSteer}`;
    const entry: Entry = c.entry;
    if (entry === "screen" || entry === "remote") {
      void this.takeRole(entry);
      return;
    }
    if (entry === "full") {
      this.root.innerHTML = `${siteHead()}<div class="center choice">
        <h1 class="qtitle">${lines(c.title || "Quiz")}</h1>
        <p class="muted">${T.entryFull}</p>
        <p class="muted">${T.entryFullAgain}</p>
        <button class="btn" data-retry>${T.tryAgain}</button>
      </div>`;
      this.root.querySelector("[data-retry]")!.addEventListener("click", () => {
        this.entered = false;
        this.showWaiting();
        void this.line?.send({ op: "tick" });
      });
      return;
    }
    this.root.innerHTML = `${siteHead()}<div class="center choice">
      <h1 class="qtitle">${lines(c.title || "Quiz")}</h1>
      <div class="entry-roles">
        <button class="btn role" data-role="screen">${T.showHere}<small>${T.showHereSmall}</small></button>
        <button class="btn role" data-role="remote">${T.steerHere}<small>${T.steerHereSmall}</small></button>
      </div>
    </div>`;
    this.root.querySelectorAll<HTMLButtonElement>("button[data-role]").forEach((b) =>
      b.addEventListener("click", () => void this.takeRole(b.dataset.role as "screen" | "remote")),
    );
  }

  private async takeRole(role: "screen" | "remote"): Promise<void> {
    const line = this.line;
    const teacher = this.ctx.teacher;
    if (!line || !teacher) return;
    this.busy = true;
    this.showWaiting();
    const a = await line.send({ op: "takeRole", role, teacher: teacher.digits || undefined, secret: teacher.secret() });
    if (a.ok) return; // the role follows
    this.busy = false;
    if (a.error === WRONG_TEACHER_CODE || a.error === TOO_MANY_CODES) {
      line.stop();
      clearInterval(this.tickTimer);
      this.ctx.teacherForm(a.error);
      return;
    }
    // The tabs changed in the meantime: the new choice has come with the answer.
    if (this.choice) this.enter(this.choice);
  }

  private newPlayer(): void {
    const line = this.line;
    if (!line) return;
    this.busy = true;
    this.showWaiting();
    const beside = this.ctx.beside();
    this.joining = line.send(beside ? { op: "newPlayer", beside } : { op: "newPlayer" });
    void this.joining.then((a) => {
      this.joining = null;
      if (this.closed) return;
      if (!a.ok) {
        this.busy = false;
        if (this.choice?.phase === "final") this.showFinished();
        else if (a.error === CLASS_WAITING) this.showRefused(CLASS_WAITING, false);
        else if (a.error === CLASS_FULL || a.error === CLASS_STARTED || a.error === ROOM_FULL || a.error === ROOM_STARTED || a.error === "not allowed") {
          this.refused = { reason: a.error, phase: this.choice?.phase ?? "" };
          this.showRefused(a.error);
        }
      } else this.refused = null;
    });
  }

  /** Turned away by the class (MAX_PLAYERS, MAX_LATE_JOINERS): the teacher is in the room. */
  private showRefused(reason: string, final = true): void {
    // final: turned away; otherwise waiting to be let in, with the line's dot.
    const mark = final
      ? `<div class="verdict void" style="width:22vmin;height:22vmin">${ICON.cross}</div>`
      : `<div class="dot" data-status="connecting" style="width:28px;height:28px"></div>`;
    // A place refused at a shared device has nothing to say: its × closes it.
    const words = reason === "not allowed" ? "" : `<p class="muted">${esc(said(reason))}</p>`;
    this.root.innerHTML = `<div class="center">${mark}${words}</div>`;
  }

  private claim(id: string): void {
    const line = this.line;
    if (!line) return;
    this.busy = true;
    this.showWaiting();
    this.joining = line.send({ op: "claim", player: id });
    void this.joining.then((a) => {
      this.joining = null;
      if (!a.ok && !this.closed) {
        // Someone else took that avatar in the meantime: ask again.
        this.busy = false;
        void line.send({ op: "tick" });
      }
    });
  }

  /**
   * A pack of answer pictures arrived: the pictures on screen get their
   * source in place (no redraw, which could swallow a tap), and the time for
   * speed starts now if the question was waiting for them.
   */
  private packsArrived(): void {
    this.root.querySelectorAll<HTMLImageElement>("img[data-pack]").forEach((img) => {
      if (img.getAttribute("src")) return;
      const [p, o, l, type] = img.dataset.pack!.split(",");
      const url = packPicture({ p: Number(p), o: Number(o), l: Number(l), type, w: 0, h: 0 });
      if (url) img.src = url;
    });
    const q = this.view?.question;
    if (q && q.answering !== "reading" && q.sinceMs !== null && this.shown?.q !== q.q && picturesHere(q.pics)) this.shown = { q: q.q, at: performance.now() };
  }

  private chosenPicture(i: number): string {
    const p = this.view?.question?.pics?.[i];
    return p ? `<div class="row" style="justify-content:center"><div class="verdict-pic a${i}">${packImg(p)}</div></div>` : "";
  }

  /** The answer the buttons show as chosen: the stored one, or the last tap on its way (sending). */
  private chosen(q: NonNullable<PlayerView["question"]>): { mine: number | null; sending: boolean } {
    const w = this.waiting;
    if (w && w.q === q.q && w.choice !== q.mine) return { mine: w.choice, sending: true };
    return { mine: q.mine, sending: false };
  }

  /** The buttons' marks, in place: the stored answer, or the tap on its way. */
  private markChosen(): void {
    const q = this.view?.question;
    const box = this.root.querySelector<HTMLElement>(".buttons");
    if (!q || !box) return;
    const { mine, sending } = this.chosen(q);
    box.classList.toggle("chosen", mine !== null);
    box.querySelectorAll<HTMLElement>(".ansbtn").forEach((b) => {
      const i = Number(b.dataset.i);
      b.classList.toggle("mine", i === mine);
      b.classList.toggle("sending", i === mine && sending);
    });
  }

  private render(): void {
    const v = this.view;
    if (!v) return;
    const root = this.root;
    if (v.removed) {
      // The teacher removed this avatar: the device keeps its token, so it
      // comes back as removed rather than as a new player in the same class
      // (docs/design/class-and-wall.md, "The door": Remove is sticky).
      root.innerHTML = `<div class="center"><div class="verdict void" style="width:22vmin;height:22vmin">${ICON.cross}</div></div>`;
      return;
    }
    const me = v.me;
    const top = me
      ? `<div class="top"><div class="me">${avatarSvg(me.avatar)}</div><span class="grow"></span>
         ${v.question ? `<span>${v.question.n} / ${v.question.total}</span><span class="grow"></span>` : ""}
         <span>${ICON.star} ${me.score}</span></div>`
      : "";

    if (v.phase === "lobby" && me) {
      this.renderDress(me.avatar);
      return;
    }
    this.look = null;
    if (v.phase === "lobby" || v.phase === "idle" || !me) {
      root.innerHTML = `<div class="center">${me ? `<div class="hero">${avatarSvg(me.avatar)}</div>` : ""}<div class="big">${ICON.eye}</div></div>`;
      return;
    }
    clearTimeout(this.outTimer);
    if (v.phase === "question" && v.question && v.question.answering === "reading") {
      // The class reads the question on the board; the answers come when the teacher shows them.
      root.innerHTML = `${top}<div class="center"><div class="big reading">${ICON.eye}</div></div>`;
      return;
    }
    if (v.phase === "question" && v.question) {
      const q = v.question;
      const n = q.answers.length;
      // Locked in, or Last call run out here: the buttons stay, the chosen one
      // marked, and take no more taps. A tap still on its way shows as on its way.
      const end = q.clock ? localEnd(`${v.current}|${q.clock.ms}`, q.clock) : null;
      const out = q.answering === "closed" || (end !== null && end <= performance.now());
      const { mine, sending } = this.chosen(q);
      const pics = q.pics;
      root.innerHTML = `${top}${q.clock && end !== null ? clockBar(q.clock.ms, end) : ""}<div class="buttons n${n}${pics ? " pics" : ""}${mine !== null ? " chosen" : ""}${out ? " closed" : ""}">
        ${q.answers
          .map((a, i) => {
            const sel = mine === i ? (sending ? " mine sending" : " mine") : "";
            if (!pics) return `<button class="ansbtn a${i}${sel}" data-i="${i}">${shapeSvg(i)}<span>${lines(a)}</span></button>`;
            const p = pics[i];
            return `<button class="ansbtn pic col a${i}${sel}" data-i="${i}">${shapeSvg(i)}<span class="apic${p ? "" : " text"}">${p ? packImg(p) : `<span>${lines(a)}</span>`}</span></button>`;
          })
          .join("")}
      </div>`;
      if (pics) arrangePictureButtons(root.querySelector<HTMLElement>(".buttons")!, pics);
      if (out) {
        // Locked in, the spread on the wall: look up. Otherwise Last call ran out here.
        root.querySelector(".top")?.insertAdjacentHTML("beforeend", q.votes ? `<span class="timeup look">${ICON.eye}</span>` : `<span class="timeup">${ICON.timer}</span>`);
        return;
      }
      if (end !== null) {
        // Run out here: closed without a redraw, so no tap is swallowed by one.
        this.outTimer = window.setTimeout(() => {
          root.querySelector(".buttons")?.classList.add("closed");
          root.querySelector(".clockbar")?.classList.add("out");
          root.querySelector(".top")?.insertAdjacentHTML("beforeend", `<span class="timeup">${ICON.timer}</span>`);
        }, Math.max(0, end - performance.now()));
      }
      root.querySelectorAll<HTMLButtonElement>(".ansbtn").forEach((b) =>
        onTap(b, () => {
          if (root.querySelector(".buttons.closed")) return;
          const choice = Number(b.dataset.i);
          // The same button again changes nothing; it isn't sent (children
          // hammer buttons, and each stored tap is spent from the site's day).
          if (this.chosen(q).mine === choice) return;
          const ms = this.shown && this.shown.q === q.q ? Math.round(performance.now() - this.shown.at) : undefined;
          // Shown at once as on its way; as accepted once the server's view
          // has it. The line delivers it, resending until the server answers.
          const tap = { q: q.q, choice };
          this.waiting = tap;
          this.markChosen();
          this.answers.put({ tap, seq: Date.now(), v: v.v, ms });
        }),
      );
      return;
    }
    if (v.phase === "reveal" && v.reveal && this.waiting && this.waiting.q === v.question?.q) {
      // Tapped before the reveal but not yet delivered: it will count.
      const w = this.waiting.choice;
      root.innerHTML = `${top}<div class="center"><div class="verdict none"><span class="dot" data-status="offline" style="width:30%;height:30%"></span></div>
        <div class="row verdict-shape" style="justify-content:center"><span class="a${w}" style="color:var(--ans)">${shapeSvg(w)}</span></div>${this.chosenPicture(w)}</div>`;
      return;
    }
    if (v.phase === "reveal" && v.reveal) {
      const r = v.reveal;
      const cls = r.void ? "void" : r.mine === null ? "none" : r.counts[r.mine] ? "right" : "wrong";
      const icon = r.void ? ICON.void : r.mine === null ? "–" : r.counts[r.mine] ? ICON.check : ICON.cross;
      const mine = r.mine !== null ? `<div class="row verdict-shape" style="justify-content:center"><span class="a${r.mine}" style="color:var(--ans)">${shapeSvg(r.mine)}</span></div>${this.chosenPicture(r.mine)}` : "";
      const gained = r.points ? `<div class="big gained">+${r.points}</div>` : "";
      root.innerHTML = `${top}<div class="center"><div class="verdict ${cls}">${icon}</div>${gained}${mine}</div>`;
      return;
    }
    if (v.phase === "ranking" || v.phase === "final") {
      root.innerHTML = `${top}<div class="center">
        <div class="hero">${avatarSvg(me.avatar)}</div>
        <div class="big">${me.place}. <span class="muted" style="font-size:.6em">/ ${me.of}</span></div>
        <div class="big">${ICON.star} ${me.score}</div>
        ${v.phase === "final" ? `<div class="big">${ICON.trophy}</div>` : ""}
      </div>`;
    }
  }

  // Dressing the animal, in the lobby: a background shape, a hat and a tool,
  // the same menu for everyone, no words. Built once and patched in place: a
  // view arriving (a classmate joining changes "of") must not replace a
  // picture under a finger.

  /** into: where the menu is built the first time; a Peers lobby has it beside the code and Start (client/peers.ts). */
  private renderDress(stored: Avatar, into: HTMLElement = this.root): void {
    // The server's view has caught up with what the child picked.
    if (this.look && this.looks.idle() && sameLook(stored, this.look)) this.look = null;
    const shown = this.look ? { ...stored, ...this.look } : stored;
    let box = this.root.querySelector<HTMLElement>(".dress");
    if (!box) {
      into.innerHTML = `<div class="dress">
        <div class="hero"></div>
        <div class="picker">${pickerRows(stored.c)}</div>
        <div class="look">${ICON.eye}</div>
      </div>`;
      box = this.root.querySelector<HTMLElement>(".dress")!;
      box.querySelectorAll<HTMLButtonElement>(".pick").forEach((btn) => onTap(btn, () => this.pick(btn)));
    }
    const hero = box.querySelector<HTMLElement>(".hero")!;
    const key = lookKey(shown);
    if (hero.dataset.key !== key) {
      const changed = hero.dataset.key !== undefined;
      hero.dataset.key = key;
      hero.innerHTML = avatarSvg(shown);
      if (changed) wiggle(hero);
    }
    box.querySelectorAll<HTMLButtonElement>(".pick").forEach((btn) => {
      const on = Number(btn.dataset.i) === (shown[btn.dataset.part as LookPart] ?? 0);
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    box.classList.toggle("spent", this.dressSpent);
  }

  private pick(btn: HTMLButtonElement): void {
    const me = this.view?.me;
    if (!me || this.view?.phase !== "lobby" || this.dressSpent) return;
    const now: Required<Look> = this.look ?? { b: me.avatar.b ?? 0, h: me.avatar.h ?? 0, t: me.avatar.t ?? 0 };
    const next = pickLook(now, btn.dataset.part as LookPart, Number(btn.dataset.i));
    if (sameLook(next, now)) return;
    this.look = next;
    this.renderDress(me.avatar);
    this.looks.put(next);
  }

  /**
   * Taps go out merged (client/latest.ts): the first of a burst, then the
   * latest. The line resends each until the server answers.
   */
  private answers = new Latest<{ tap: { q: number; choice: number }; seq: number; v: number; ms?: number }, Ack>(
    (x) => this.line!.send({ op: "answer", q: x.tap.q, choice: x.tap.choice, seq: x.seq, v: x.v, ms: x.ms }),
    (x, a) => {
      if (this.waiting !== x.tap) return;
      // Taken: its view says so (above). Not taken (too late, too many
      // changes of mind): the device shows what is held, as its view has it.
      if (a.ok) return;
      this.waiting = null;
      if (this.root.querySelector(".buttons")) this.markChosen();
      else this.render();
    },
  );

  private looks = new Latest<Required<Look>, Ack>(
    (l) => this.line!.send({ op: "dress", b: l.b, h: l.h, t: l.t }),
    (_, a) => {
      if (!a.ok) {
        // Not taken: the quiz started, or the changes are spent. The device
        // shows the look that is held, as the wall does.
        this.look = null;
        this.looks.clear();
        if (this.view?.phase === "lobby" && a.error === undefined) this.dressSpent = true;
      }
      if (this.view?.phase === "lobby" && this.view.me) this.renderDress(this.view.me.avatar);
    },
  );
}

function wait(ms: number): Promise<null> {
  return new Promise((r) => setTimeout(() => r(null), ms));
}

/** The two views differ only in the stored answer of the open question (the buttons can stay). */
function onlyMineChanged(a: PlayerView, b: PlayerView): boolean {
  if (a.phase !== "question" || b.phase !== "question" || !a.question || !b.question || a.question.q !== b.question.q) return false;
  const strip = (x: PlayerView) => viewKey({ ...x, question: { ...x.question!, mine: null } });
  return strip(a) === strip(b);
}

/** An answer picture's <img>, with its source once its pack is here. */
function packImg(p: PackPic): string {
  const url = packPicture(p);
  return `<img data-pack="${p.p},${p.o},${p.l},${esc(p.type)}"${url ? ` src="${url}"` : ""} alt="">`;
}

/**
 * Picture answers' buttons arranged by the pictures' shape (client/answergrid.ts),
 * in the room the buttons have; the room is fixed in px so a picture
 * arriving doesn't push the buttons around.
 */
function arrangePictureButtons(box: HTMLElement, pics: (PackPic | null)[]): void {
  const W = box.clientWidth;
  const H = box.clientHeight;
  box.style.height = `${H}px`;
  const gap = parseFloat(getComputedStyle(box).rowGap) || 0;
  const first = box.querySelector<HTMLElement>(".ansbtn")!;
  const cls = first.className;
  const chromeOf = (orient: Orient): Chrome => {
    first.classList.remove("row", "col");
    first.classList.add(orient);
    first.style.width = "300px";
    first.style.height = "300px";
    const c = first.querySelector<HTMLElement>(".apic")!;
    const r = { w: first.offsetWidth - c.offsetWidth, h: first.offsetHeight - c.offsetHeight };
    first.style.width = first.style.height = "";
    return r;
  };
  const chrome = { row: chromeOf("row"), col: chromeOf("col") };
  first.className = cls;
  const g = chooseGrid(pics.map((p) => (p ? p.w / p.h : null)), W, H, gap, chrome);
  box.style.gridTemplateColumns = `repeat(${g.cols}, minmax(0, 1fr))`;
  box.style.gridTemplateRows = `repeat(${g.rows}, minmax(0, 1fr))`;
  box.dataset.grid = `${g.cols}x${g.rows} ${g.orient}`;
  box.querySelectorAll<HTMLElement>(".ansbtn").forEach((b) => {
    b.classList.remove("row", "col");
    b.classList.add(g.orient);
  });
}
