// Solo (backlog v5 item 2; docs/design/solo.md): someone plays the quiz on
// their own, to learn or review, in this page. Nothing goes to the site and
// nothing is kept: closing the tab, or a reload, ends it. The avatar is
// dressed first, as in a room's lobby; each answer shows the key at once,
// and a right one makes the avatar jump; the result cheers whatever the
// score, and hands the run to the player's AI on request.
//
// The run takes over the check's page; Back gives the check back as it was.

import type { Avatar } from "../shared/protocol.ts";
import { pickLook, sameLook, type Look, type LookPart } from "../shared/looks.ts";
import type * as G from "../server/game.ts";
import { DeviceScreen, type DeviceView } from "./device.ts";
import { esc, keepAwake, lines, pauseAwake } from "./dom.ts";
import type { Entry, EntryContext } from "./entries.ts";
import { ICON, avatarSvg, lookKey, pickerRows, wiggle } from "./look.ts";
import type { OpenedQuiz } from "./opening.ts";
import { newSoloRun, soloAnswer, soloAvatar, soloDress, soloForAi, soloKey, soloLast, soloMine, soloNext, soloQuestion, soloResult, soloStart } from "./solo.ts";

export const solo: Entry = {
  name: "Solo",
  line: "You play the quiz on your own, to learn or review: the solution after each answer.",
  button: "Play ▶",
  note: "Nothing goes to the site. A reload or closing the tab ends it.",
  plays: true,
  async start(quiz, ctx) {
    new SoloRun(quiz, ctx);
  },
};

/** Within this page, the avatar stays from one run to the next. */
let kept: Avatar | undefined;
let awake = false;

class SoloRun {
  private quiz: OpenedQuiz;
  private ctx: EntryContext;
  private main: HTMLElement;
  private game: G.Game;
  private screen: DeviceScreen | null = null;
  private done = false;

  constructor(quiz: OpenedQuiz, ctx: EntryContext) {
    this.quiz = quiz;
    this.ctx = ctx;
    this.main = ctx.main;
    this.game = newSoloRun(quiz.quiz, quiz.fixes, Math.random, Date.now(), kept);
    kept = soloAvatar(this.game);
    // Back ends the run and gives the check back: one step, whatever screen the run is on.
    history.pushState({ solo: true }, "");
    window.addEventListener("popstate", this.back);
    this.main.addEventListener("click", this.click);
    if (!awake) {
      awake = true;
      keepAwake();
    }
    pauseAwake(false);
    this.lobby();
  }

  private back = (): void => {
    this.done = true;
    window.removeEventListener("popstate", this.back);
    this.main.removeEventListener("click", this.click);
    this.screen?.close();
    pauseAwake(true);
    document.documentElement.classList.remove("solo-on");
    this.ctx.showCheck();
  };

  /** The page for one of Solo's screens: the start and the result scroll under the site's header, the questions take a screen's height. */
  private page(cls: string): void {
    document.body.className = cls;
    this.main.className = "";
    // A pull to refresh on a phone would reload, and the quiz is only in this page.
    document.documentElement.classList.add("solo-on");
    window.scrollTo(0, 0);
  }

  // The start: the avatar and the dressing menu, as in a room's lobby, and Start.

  private lobby(): void {
    const q = this.quiz.quiz;
    const n = this.game.fixes.filter((f) => !f.skip).length;
    const av = soloAvatar(this.game);
    this.page("play solo");
    this.main.innerHTML = `<div class="solo-head"><h1 class="ctitle">${lines(q.title || "Quiz")}</h1>
        <p class="cnum">${n} ${n === 1 ? "question" : "questions"}</p></div>
      <div class="dress">
        <div class="hero"></div>
        <div class="picker">${pickerRows(av.c)}</div>
        <div class="look"><button class="btn primary solo-go" type="button" data-solo="start">Start ▶</button></div>
      </div>`;
    this.drawLook();
  }

  private drawLook(): void {
    const av = soloAvatar(this.game);
    const hero = this.main.querySelector<HTMLElement>(".dress .hero");
    if (!hero) return;
    const key = lookKey(av);
    if (hero.dataset.key !== key) {
      const changed = hero.dataset.key !== undefined;
      hero.dataset.key = key;
      hero.innerHTML = avatarSvg(av);
      if (changed) wiggle(hero);
    }
    this.main.querySelectorAll<HTMLButtonElement>(".pick").forEach((btn) => {
      const on = Number(btn.dataset.i) === (av[btn.dataset.part as LookPart] ?? 0);
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", String(on));
    });
  }

  private pick(btn: HTMLElement): void {
    const av = soloAvatar(this.game);
    const now: Required<Look> = { b: av.b ?? 0, h: av.h ?? 0, t: av.t ?? 0 };
    const next = pickLook(now, btn.dataset.part as LookPart, Number(btn.dataset.i));
    if (sameLook(next, now)) return;
    soloDress(this.game, next);
    kept = soloAvatar(this.game);
    this.drawLook();
  }

  // The questions.

  private begin(): void {
    soloStart(this.game, Date.now());
    this.page("screen steering solo");
    this.main.innerHTML = "";
    this.screen = new DeviceScreen(this.main, { answer: (i) => this.answer(i), next: () => this.next() });
    this.draw();
  }

  private draw(): void {
    const g = this.game;
    const sq = soloQuestion(g);
    if (!sq) {
      this.result();
      return;
    }
    const q = this.quiz.quiz.questions[sq.q];
    const fix = this.quiz.fixes[sq.q];
    const pic = this.quiz.picture;
    const key = soloKey(g);
    const pics = q.answers.some((a) => a.image !== undefined) ? sq.order.map((i) => (q.answers[i].image ? pic(q.answers[i].image!) : null)) : undefined;
    const v: DeviceView = {
      title: this.quiz.quiz.title,
      question: {
        key: `${sq.q}`,
        n: sq.n,
        total: sq.total,
        text: q.text,
        answers: sq.order.map((i) => q.answers[i].text),
        ...(pics ? { pics } : {}),
        // Hidden on the check (a wrong or revealing crop): hidden here too.
        image: fix.hidePicture ? null : pic(q.image),
        background: pic(q.background || this.quiz.quiz.background),
      },
      answering: key ? "closed" : "open",
      mine: soloMine(g),
      counts: key ? key.counts : null,
      void: !!key?.void,
      me: { avatar: soloAvatar(g), score: soloResult(g).right },
      next: key ? (soloLast(g) ? "Result" : `Question ${sq.n + 1}`) : null,
    };
    this.screen!.show(v);
  }

  private answer(shown: number): void {
    const key = soloAnswer(this.game, shown, Date.now());
    if (!key) return;
    this.draw();
    if (key.right) this.screen!.jump([{ id: "me", avatar: soloAvatar(this.game) }]);
  }

  private next(): void {
    soloNext(this.game, Date.now());
    this.draw();
  }

  // The result: the avatar cheers whatever the score, the score, a bar per question.

  private result(): void {
    this.screen?.leave();
    const r = soloResult(this.game);
    this.page("play solo");
    this.main.innerHTML = `<div class="solo-end">
        <h1 class="ctitle">${lines(this.quiz.quiz.title || "Quiz")}</h1>
        <div class="hero"><span class="cheer">${avatarSvg(soloAvatar(this.game))}</span></div>
        <div class="solo-score">${ICON.star} ${r.right} / ${r.of}</div>
        ${r.of ? `<div class="classres"><div class="bars">${r.each.map((ok) => `<span><i style="height:${ok ? 100 : 0}%"></i></span>`).join("")}</div></div>` : ""}
        <div class="solo-actions">
          <button class="btn primary" type="button" data-solo="again">Play again ▶</button>
          <button class="btn" type="button" data-solo="copy">Copy the answers for your AI</button>
          <button class="btn" type="button" data-solo="back">← Back</button>
        </div>
        <p class="solo-ai muted" role="status">Your AI can explain a mistake, or check a solution that looks wrong.</p>
      </div>`;
  }

  private async copy(btn: HTMLElement): Promise<void> {
    const text = soloForAi(this.game);
    const say = this.main.querySelector<HTMLElement>(".solo-ai");
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copied: paste it into the chat with your AI";
    } catch {
      // No clipboard permission: show it for copying by hand.
      if (say && !this.main.querySelector(".solo-text")) say.insertAdjacentHTML("afterend", `<pre class="solo-text">${esc(text)}</pre>`);
    }
  }

  private again(): void {
    this.screen?.close();
    this.screen = null;
    this.game = newSoloRun(this.quiz.quiz, this.quiz.fixes, Math.random, Date.now(), kept);
    this.begin();
  }

  private click = (e: MouseEvent): void => {
    if (this.done) return;
    const t = e.target as HTMLElement;
    const pick = t.closest<HTMLElement>(".dress .pick");
    if (pick) {
      this.pick(pick);
      return;
    }
    const act = t.closest<HTMLElement>("[data-solo]")?.dataset.solo;
    if (act === "start") this.begin();
    else if (act === "again") this.again();
    else if (act === "copy") void this.copy(t.closest<HTMLElement>("[data-solo]")!);
    else if (act === "back") history.back();
  };
}
