// The teacher's device, usually the phone: key check after upload, then the
// run (tempo, reveal, ranking), fixes at any point, connecting the projector
// and other devices. Notes from the AI stand out here and nowhere else.

import type { ServerMessage, TeacherQuestion, TeacherView } from "../shared/protocol.ts";
import { PAIR_CODE } from "../shared/protocol.ts";
import { $, esc, findQuiz, forgetQuiz, keepAwake, lines, saveQuiz, siteAddress, statusDot, type SavedQuiz } from "./dom.ts";
import { ICON, avatarSvg, shapeSvg } from "./look.ts";
import { Line } from "./net.ts";

const main = $("main");
const actions = $("#actions");
const dot = $("#dot");
const titleEl = $("#title");

let quiz: SavedQuiz | null = null;
let line: Line | null = null;
let view: TeacherView | null = null;
let keyShown = !window.matchMedia("(min-width: 900px) and (pointer: fine)").matches;
let fixMode = false;
let pairMessage = "";
// Redraws: the page is rebuilt only when more than live numbers changed, and
// the action bar only when its buttons changed. Answers arrive fastest just
// when the teacher reaches for Reveal; a button replaced under the finger
// loses the tap.
let lastSkeleton = "";
let lastButtons = "";
// After each step the buttons stay inert for a moment, so a double tap on
// "Reveal" doesn't land on the "Next" that replaces it.
const STEP_LOCK_MS = 700;
let lockUntil = 0;
let lastStep = "";
const STEPS = new Set(["start-run", "another", "begin", "reveal", "next", "ranking", "skip-current", "finish"]);

/** A number that changes while answers come in, patched in place. */
const live = (key: string, value: string | number) => `<span data-live="${key}">${value}</span>`;
const LIVE = /<span data-live="([^"]+)">[^<]*<\/span>/g;

function start(): void {
  // Arrives as /teach#<id>.<secret> from the upload or pairing; the secret
  // then leaves the address bar (it may be on a projected screen).
  const hash = location.hash.slice(1);
  const m = hash.match(/^([0-9a-f]{64})\.([A-Za-z0-9_-]+)$/);
  if (m) {
    const existing = findQuiz(m[1]);
    saveQuiz({ id: m[1], secret: m[2], title: existing?.title ?? "", at: existing?.at ?? Date.now() });
    history.replaceState(null, "", `/teach?q=${m[1]}`);
  }
  const id = new URLSearchParams(location.search).get("q") ?? (m ? m[1] : "");
  quiz = id ? findQuiz(id) : null;
  if (!quiz) {
    main.innerHTML = `<div class="card"><p>This device doesn't hold this quiz.</p>
      <p class="muted">A quiz opens on the device it was uploaded from. To steer it from here, open <a href="/remote">${esc(siteAddress())}/remote</a> on this device and type its code into the device that has the quiz.</p>
      <p><a class="btn" href="/">${esc(siteAddress())}</a></p></div>`;
    return;
  }
  keepAwake();
  const q = quiz;
  line = new Line({
    instance: q.id,
    auth: () => ({ role: "teacher", secret: q.secret }),
    onMessage,
    onStatus: (s) => statusDot(dot, s),
  });
  line.start();
}

function onMessage(m: ServerMessage): void {
  if (m.t === "state" && m.view.role === "teacher") {
    view = m.view;
    if (quiz && quiz.title !== view.title) {
      quiz.title = view.title;
      saveQuiz(quiz);
    }
    render();
  } else if (m.t === "gone") {
    if (quiz) forgetQuiz(quiz.id);
    line?.stop();
    actions.innerHTML = "";
    main.innerHTML = `<div class="card"><p>${esc(m.reason)}</p><p class="muted">The quiz and everything played with it have been deleted from the site. Your copy is the text from your AI.</p>
      <p><a class="btn primary" href="/new">New quiz</a></p></div>`;
  }
}

// ---------------------------------------------------------------------------

function at() {
  return { phase: view!.phase, current: view!.current };
}

async function act(el: HTMLElement): Promise<void> {
  const v = view;
  if (!v || !line) return;
  const a = el.dataset.act;
  const q = Number(el.dataset.q);
  if (a && STEPS.has(a)) {
    if (Date.now() < lockUntil) return;
    lockUntil = Date.now() + STEP_LOCK_MS;
  }
  const send = async (cmd: Parameters<Line["send"]>[0]) => {
    const r = await line!.send(cmd);
    if (!r.ok && r.error) toast(r.error);
    return r;
  };
  switch (a) {
    case "start-run":
    case "another":
      fixMode = false;
      await send({ op: "startRun", at: at() });
      break;
    case "begin":
      await send({ op: "begin", at: at() });
      break;
    case "reveal":
      await send({ op: "reveal", at: at() });
      break;
    case "next":
      fixMode = false;
      await send({ op: "next", at: at() });
      break;
    case "ranking":
      await send({ op: "ranking", at: at() });
      break;
    case "finish":
      if (confirm("Show the final ranking now? Questions not yet shown are left out.")) await send({ op: "finish", at: at() });
      break;
    case "skip-current":
      if (confirm("Skip this question? It won't count.")) await send({ op: "skipCurrent", at: at() });
      break;
    case "toggle-count": {
      const i = Number(el.dataset.i);
      const counts = v.questions[q].answers.map((x, j) => (j === i ? !x.counts : x.counts));
      if (!counts.some(Boolean)) {
        toast("At least one answer has to count. To count none, void the question.");
        return;
      }
      await send({ op: "setCounts", q, counts });
      break;
    }
    case "void":
      await send({ op: "setVoid", q, value: !v.questions[q].void });
      break;
    case "skip":
      await send({ op: "setSkip", q, value: !v.questions[q].skip });
      break;
    case "fix-mode":
      fixMode = !fixMode;
      render();
      break;
    case "show-key":
      keyShown = true;
      render();
      break;
    case "copy-link": {
      const link = `${location.origin}/teach#${quiz!.id}.${quiz!.secret}`;
      try {
        await navigator.clipboard.writeText(link);
        toast("Teacher link copied. Keep it private: whoever has it steers the quiz.");
      } catch {
        prompt("The teacher link (keep it private):", link);
      }
      break;
    }
    case "remove":
      if (confirm("Remove this avatar? Its answers stop counting. Use it for a double or a stranger.")) await send({ op: "remove", player: el.dataset.player! });
      break;
    case "end":
      if (confirm("End this quiz and delete it from the site? Your AI's text stays your copy.")) await send({ op: "endInstance" });
      break;
    case "pair": {
      const input = $("#paircode") as HTMLInputElement;
      const code = input.value.replace(/\D/g, "");
      if (!PAIR_CODE.test(code)) {
        pairMessage = "The code on the other device has 6 digits.";
        render();
        return;
      }
      pairMessage = "…";
      render();
      const r = await line.send({ op: "pair", code });
      pairMessage = r.ok ? (r.result === "screen" ? "Projector connected." : "Device connected: it can steer this quiz now.") : (r.error ?? "That didn't work.");
      render();
      break;
    }
  }
}

for (const area of [main, actions]) {
  area.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-act]");
    if (el) void act(el);
  });
}
main.addEventListener("submit", (e) => {
  e.preventDefault();
  const btn = (e.target as HTMLElement).querySelector<HTMLElement>("[data-act]");
  if (btn) void act(btn);
});

// ---------------------------------------------------------------------------
// Drawing

function render(): void {
  const v = view;
  if (!v) return;
  titleEl.textContent = v.title || "Quiz";
  document.title = `${v.title || "Quiz"} · teacher`;
  // Keep what the teacher is typing (a device code) across redraws.
  const typing = (document.activeElement as HTMLInputElement | null)?.id === "paircode" ? ($("#paircode") as HTMLInputElement).value : null;
  const run = v.run;
  let body = "";
  let buttons = "";

  if (!run || v.phase === "idle") {
    body = keyCheck(v) + connectCard(v) + endCard(v);
    buttons = `<button class="btn primary big" data-act="start-run">${ICON.person} Start with a class</button>`;
  } else if (v.phase === "lobby") {
    body = lobbyCard(v) + connectCard(v) + allQuestions(v) + endCard(v);
    buttons = `<button class="btn primary big" data-act="begin">Start the quiz &#9654;</button>`;
  } else if (v.phase === "question" || v.phase === "reveal") {
    body = currentCard(v) + allQuestions(v) + playersCard(v) + connectCard(v) + endCard(v);
    const last = !v.questions.some((q, i) => i > v.current && !q.skip);
    buttons =
      v.phase === "question"
        ? `<button class="btn" data-act="skip-current">Skip</button><button class="btn primary big" data-act="reveal">${ICON.eye} Reveal</button>`
        : `<button class="btn" data-act="ranking">${ICON.trophy} Ranking</button><button class="btn primary big" data-act="next">${last ? `${ICON.trophy} Final ranking` : "Next &#9654;"}</button>`;
  } else if (v.phase === "ranking") {
    body = rankingCard(v) + allQuestions(v) + playersCard(v) + connectCard(v) + endCard(v);
    const last = !v.questions.some((q, i) => i > v.current && !q.skip);
    buttons = `<button class="btn primary big" data-act="next">${last ? `${ICON.trophy} Final ranking` : "Next question &#9654;"}</button>`;
  } else if (v.phase === "final") {
    body = rankingCard(v) + allQuestions(v) + connectCard(v) + endCard(v);
    buttons = `<button class="btn" data-act="another">Another class</button><button class="btn danger" data-act="end">End and delete</button>`;
  }
  const step = `${v.phase}|${v.current}`;
  if (step !== lastStep) {
    lastStep = step;
    lockUntil = Math.max(lockUntil, Date.now() + STEP_LOCK_MS);
    window.setTimeout(() => actions.querySelectorAll("button").forEach((b) => (b.disabled = false)), lockUntil - Date.now());
  }
  if (buttons !== lastButtons) {
    lastButtons = buttons;
    actions.innerHTML = `<div class="wrap">${buttons}</div>`;
    if (Date.now() < lockUntil) actions.querySelectorAll("button").forEach((b) => (b.disabled = true));
  }

  const skeleton = body.replace(LIVE, '<span data-live="$1"></span>');
  if (skeleton === lastSkeleton) {
    // Only live numbers changed: patch them, touch nothing else.
    const values = new Map<string, string>();
    for (const m of body.matchAll(/<span data-live="([^"]+)">([^<]*)<\/span>/g)) values.set(m[1], m[2]);
    main.querySelectorAll<HTMLElement>("[data-live]").forEach((el) => {
      const val = values.get(el.dataset.live!);
      if (val !== undefined && el.textContent !== val) el.textContent = val;
    });
    return;
  }
  lastSkeleton = skeleton;
  // Sections the teacher opened or closed stay that way across redraws.
  const before = new Map<string, boolean>();
  main.querySelectorAll<HTMLDetailsElement>("details[data-k]").forEach((d) => before.set(d.dataset.k!, d.open));
  main.innerHTML = body;
  main.querySelectorAll<HTMLDetailsElement>("details[data-k]").forEach((d) => {
    const was = before.get(d.dataset.k!);
    if (was !== undefined) d.open = was;
  });
  if (typing !== null) {
    const input = $("#paircode") as HTMLInputElement;
    input.value = typing;
    input.focus();
  }
}

function summary(v: TeacherView): string {
  const notes = v.questions.filter((q) => q.note).length;
  const multi = v.questions.filter((q) => q.answers.filter((a) => a.marked).length > 1).length;
  return `<div class="summary">
    <span><strong>${v.questions.length}</strong> questions</span>
    <span>${notes ? `<span class="tag warn">${notes} with a note</span>` : "no notes"}</span>
    ${multi ? `<span><span class="tag">${multi}</span> with more than one right answer</span>` : ""}
  </div>`;
}

function keyCheck(v: TeacherView): string {
  if (!keyShown) {
    return `<div class="card cover">
      ${summary(v)}
      <p class="muted">The key check shows every right answer. If this screen is on the projector, the class would see them.</p>
      <button class="btn primary" data-act="show-key">Show the key check</button>
    </div>`;
  }
  const withNotes = v.questions.map((q, i) => [q, i] as const).filter(([q]) => q.note);
  return `<div class="card">
    <h2 style="margin:0 0 6px;font-size:1.1rem">Key check</h2>
    ${summary(v)}
    ${v.quizNote ? `<div class="note"><strong>Note on the quiz</strong>${esc(v.quizNote)}</div>` : ""}
    ${v.warnings.length ? `<ul class="problems muted">${v.warnings.map((w) => `<li>${esc(w.message)}</li>`).join("")}</ul>` : ""}
  </div>
  ${
    withNotes.length
      ? `<div class="card"><h2 style="margin:0 0 6px;font-size:1.1rem">Check these first</h2>
         ${withNotes.map(([q, i]) => questionBlock(q, i, { note: true })).join("")}</div>`
      : ""
  }
  <div class="card"><h2 style="margin:0 0 6px;font-size:1.1rem">All questions</h2>
    <p class="muted" style="margin-top:0">A wrong key can be fixed here or during the run.</p>
    ${v.questions.map((q, i) => questionBlock(q, i, { note: true, fix: fixMode })).join("")}
    <button class="btn" data-act="fix-mode">${fixMode ? "Done fixing" : "Fix a key"}</button>
  </div>`;
}

function questionBlock(q: TeacherQuestion, i: number, o: { note?: boolean; fix?: boolean; dist?: number[] | null; noText?: boolean }): string {
  const tags = [
    q.void ? `<span class="tag">void</span>` : "",
    q.skip ? `<span class="tag">skipped</span>` : "",
    q.status === "revealed" ? `<span class="tag">done</span>` : "",
    q.status === "current" ? `<span class="tag warn">now</span>` : "",
    q.answers.filter((a) => a.counts).length > 1 ? `<span class="tag">${q.answers.filter((a) => a.counts).length} right</span>` : "",
    q.answers.some((a) => a.counts !== a.marked) ? `<span class="tag warn">key changed</span>` : "",
  ].join(" ");
  const answers = q.answers
    .map((a, j) => {
      const fixable = o.fix ? ` fixable" data-act="toggle-count" data-q="${i}" data-i="${j}` : "";
      return `<div class="ans a${j}${a.counts ? " right" : ""}${fixable}">
        <span class="key">${a.counts ? ICON.check : ""}</span>${shapeSvg(j)}<span class="t">${lines(a.text)}</span>
        ${o.dist ? `<span class="cnt">${live(`d${i}-${j}`, o.dist[j])}</span>` : ""}
      </div>`;
    })
    .join("");
  const fixRow = o.fix
    ? `<div class="row" style="margin-top:6px">
        <button class="btn" data-act="void" data-q="${i}">${ICON.void} ${q.void ? "Count it again" : "Void (counts for nobody)"}</button>
        ${q.status === "upcoming" || q.status === "skipped" ? `<button class="btn" data-act="skip" data-q="${i}">${q.skip ? "Show it after all" : "Skip it"}</button>` : ""}
      </div>`
    : "";
  return `<div class="q">
    ${o.noText ? "" : `<div class="qt"><span class="num">${i + 1}.</span>${lines(q.text)} ${tags}</div>`}
    ${o.note && q.note ? `<div class="note"><strong>Note</strong>${esc(q.note)}</div>` : ""}
    ${answers}${fixRow}
  </div>`;
}

function lobbyCard(v: TeacherView): string {
  const run = v.run!;
  return `<div class="card">
    <div class="muted">${esc(siteAddress())}</div>
    <div class="codebig">${esc(run.code)}</div>
    <div class="row"><span class="stat">${live("joined", run.players.length)}</span><span class="muted">joined</span></div>
    ${playersList(v)}
    <p class="muted" style="margin-bottom:0">The projector shows the code and a QR code. Students who join later get in too.</p>
  </div>`;
}

function playersList(v: TeacherView): string {
  const run = v.run!;
  if (run.players.length === 0) return "";
  return `<div class="players">${run.players
    .map((p) => `<button data-act="remove" data-player="${esc(p.id)}" class="${p.connected ? "" : "away"}" title="${p.connected ? "connected" : "away"}">${avatarSvg(p.avatar)}</button>`)
    .join("")}</div>`;
}

function playersCard(v: TeacherView): string {
  const run = v.run!;
  const away = run.players.filter((p) => !p.connected).length;
  return `<details data-k="players" class="card"><summary>${ICON.person} ${run.players.length} players${away ? ` · ${away} away` : ""}</summary>
    <p class="muted">Faded avatars are away (device asleep or offline); they come back by themselves. Tap one to remove it, e.g. a double.</p>
    ${playersList(v)}
  </details>`;
}

function currentCard(v: TeacherView): string {
  const run = v.run!;
  const q = v.questions[v.current];
  const reveal = v.phase === "reveal";
  return `<div class="card">
    <div class="row" style="justify-content:space-between">
      <strong>${run.n} / ${run.total}</strong>
      <span><span class="stat" style="font-size:1.6rem">${live("answered", run.answered)}</span><span class="muted"> / ${live("players", run.players.length)} answered</span></span>
    </div>
    ${q.note ? `<div class="note"><strong>Note from your AI</strong>${esc(q.note)}</div>` : ""}
    <div class="qt" style="font-weight:600;font-size:1.1rem;margin:8px 0;white-space:pre-wrap">${lines(q.text)}</div>
    ${questionBlock(q, v.current, { fix: fixMode, dist: run.dist, noText: true })}
    <div class="row" style="margin-top:8px">
      <button class="btn" data-act="fix-mode">${fixMode ? "Done fixing" : "Fix this question"}</button>
      ${reveal && q.void ? `<span class="tag">void</span>` : ""}
    </div>
  </div>`;
}

function rankingCard(v: TeacherView): string {
  const r = v.run!.ranking;
  if (!r) return "";
  const pct = r.given ? Math.round((100 * r.right) / r.given) : 0;
  return `<div class="card">
    <div class="row"><span class="stat">${pct}%</span><span class="muted">right, over ${r.of} questions</span></div>
    <div class="players">${r.top.map((e) => `<div style="width:44px;text-align:center">${avatarSvg(e.avatar)}<small>${e.place}.</small></div>`).join("")}</div>
  </div>`;
}

function allQuestions(v: TeacherView): string {
  return `<details data-k="all" class="card"${fixMode && v.phase !== "question" && v.phase !== "reveal" ? " open" : ""}><summary>All questions · fix a key</summary>
    <p class="muted">Tap an answer to make it count or not; the points follow at once, also for questions already played.</p>
    ${v.questions.map((q, i) => questionBlock(q, i, { note: true, fix: true })).join("")}
  </details>`;
}

function connectCard(v: TeacherView): string {
  return `<details data-k="connect" class="card"${v.screens === 0 && (v.phase === "idle" || v.phase === "lobby") ? " open" : ""}>
    <summary>${v.screens > 0 ? "Projector connected" : "Connect the projector"} · other devices</summary>
    <p>On the projector computer, open <strong>${esc(siteAddress())}/screen</strong>. It shows a code; type it here. The same works for a second phone: open <strong>${esc(siteAddress())}/remote</strong> on it.</p>
    <form class="row" autocomplete="off">
      <input id="paircode" class="code-input" style="flex:1;min-width:10ch;font-size:1.5rem" inputmode="numeric" maxlength="7" placeholder="123456">
      <button class="btn primary" data-act="pair">Connect</button>
    </form>
    ${pairMessage ? `<p>${esc(pairMessage)}</p>` : ""}
    <p class="muted">Is the projector this computer's second screen? <a href="/screen?q=${esc(v.id)}" target="_blank" rel="noopener">Open the projector window here</a> and move it there (F for full screen).</p>
    <p class="muted">If this device's battery dies: open <strong>${esc(siteAddress())}/remote</strong> on another device and type its code at the projector computer (press C there). Or keep the teacher link somewhere private: <button class="btn" data-act="copy-link" type="button">Copy the teacher link</button></p>
  </details>`;
}

function endCard(v: TeacherView): string {
  const until = new Date(v.expires);
  const inRun = v.run && v.phase !== "final" && v.phase !== "lobby";
  return `<details data-k="end" class="card"><summary>Finish · end</summary>
    ${inRun ? `<p><button class="btn" data-act="finish">${ICON.trophy} Final ranking now</button></p>` : ""}
    <p class="muted">The quiz stays on the site until you end it, or until ${until.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })} if nothing happens before then.</p>
    <p><button class="btn danger" data-act="end">End and delete the quiz</button></p>
  </details>`;
}

let toastTimer: number | undefined;
function toast(msg: string): void {
  let t = document.querySelector<HTMLElement>(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (t!.hidden = true), 4000);
}

start();
