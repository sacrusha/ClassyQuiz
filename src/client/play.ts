import { JOIN_CODE, TEACHER_CODE, TOO_MANY_CODES, WRONG_TEACHER_CODE } from "../shared/protocol.ts";
import { MAX_SEATS } from "../shared/limits.ts";
import { $, esc, findQuiz, keepAwake, savedQuizzes, seatKey, siteHead, statusDot, store, tabRole, rolePage } from "./dom.ts";
import { ICON } from "./look.ts";
import { api, type LineStatus } from "./net.ts";
import { edgeBar } from "./clock.ts";
import { Seat, type Saved, type SeatContext } from "./seat.ts";
import { onTap } from "./tap.ts";
import { T, lang, quotaNotice, said } from "./room-text.ts";

const main = $("main");
document.documentElement.lang = lang;
const dot = $("#dot");
const banner = $("#offline");
const params = new URLSearchParams(location.search);
const typed = (location.hash.slice(1) || params.get("c") || "").replace(/\D/g, "");
/** The old address, /teacher: it asks for the teacher code. */
const oldAddress = location.pathname.startsWith("/teacher");
const code = TEACHER_CODE.test(typed) ? typed.slice(0, 5) : typed;
const digits = TEACHER_CODE.test(typed) ? typed.slice(5) : "";
/** The uploading device needs no digits: it has the quiz's secret. */
const savedHere = JOIN_CODE.test(code) ? (savedQuizzes().find((q) => q.code === code) ?? null) : null;
const teacher = !!digits || (oldAddress && !!savedHere);
/** A window opened from a teacher tab. */
const fromWindow = params.get("win") === "1";

let instanceId = "";
let offlineTimer: number | undefined;
let unreachedTimer: number | undefined;

const UNREACHED_MS = 15_000;
const unreachedText = (): string => (teacher ? T.unreached : T.unreachedTell);
const bannerWords = document.createElement("span");
bannerWords.hidden = true;
bannerWords.textContent = unreachedText();
banner.append(bannerWords);

async function start(): Promise<void> {
  if (oldAddress && !teacher) {
    showTeacherForm(JOIN_CODE.test(code) ? T.needsDigits : "");
    return;
  }
  if (!JOIN_CODE.test(code)) {
    location.replace("/");
    return;
  }
  if (teacher) document.body.classList.add("follows-dark");
  keepAwake();
  showWaiting();
  let instance = "";
  const joinFrom = Date.now();
  const notReached = (): void => {
    const words = document.getElementById("unreached");
    if (words && Date.now() - joinFrom >= UNREACHED_MS) {
      words.textContent = unreachedText();
      words.hidden = false;
    }
  };
  for (;;) {
    try {
      const r = await api<{ instance?: string; message?: string }>("/api/join", teacher ? { code: typed, secret: savedHere?.secret } : { code });
      if (r.body.instance) {
        instance = r.body.instance;
        break;
      }
      // The site's own word, not a status: a filter's page can come as a 404
      // too, and says nothing about the quiz or this device's places in it.
      const no = r.body.error;
      if (no === "code" || no === "teacher" || no === "locked") {
        // With a wrong teacher code the quiz is still there, and so are the places.
        if (no === "code") for (let slot = 0; slot < MAX_SEATS; slot++) store.remove(seatKey(code, slot));
        if (!teacher) showNoQuiz();
        else if (no === "locked") showTeacherForm(TOO_MANY_CODES);
        else if (no === "teacher") showTeacherForm(WRONG_TEACHER_CODE);
        else showTeacherForm(T.noQuizCode(code));
        return;
      }
      if (r.body.quota) {
        main.innerHTML = `<div class="center"><p class="muted" style="max-width:36rem">${esc(quotaNotice())}</p></div>`;
        await new Promise((res) => setTimeout(res, 60_000));
        continue;
      }
      if (r.body.json === false) notReached();
    } catch {
      notReached();
    }
    await new Promise((res) => setTimeout(res, 2000));
  }
  instanceId = instance;
  if (teacher) {
    if (fromWindow) {
      // A window opened from a teacher tab: it may carry a copy of its
      // opener's role, which stays with the opener.
      tabRole.remove(instance);
    } else {
      const held = tabRole.get(instance);
      if (held) {
        location.replace(rolePage(instance, held.role));
        return;
      }
    }
    addSeat(0, { digits, secret: () => findQuiz(instanceId)?.secret ?? savedHere?.secret, fromWindow });
    return;
  }
  // A place kept from another quiz that had this code is forgotten.
  const had = [];
  for (let slot = 0; slot < MAX_SEATS; slot++) {
    const saved = store.get<Saved>(seatKey(code, slot));
    if (saved?.instance === instance) had.push(slot);
    else if (saved) store.remove(seatKey(code, slot));
  }
  for (const slot of had.length ? had : [0]) addSeat(slot);
}

function showWaiting(): void {
  main.innerHTML = `<div class="center"><div class="dot" data-status="connecting" style="width:28px;height:28px"></div><p class="muted" id="unreached" hidden></p></div>`;
}

function codeForm(value = "", placeholder = "12345"): string {
  return `<form class="codeform" id="codeform"><input class="code-input" id="c" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="${placeholder}" aria-label="${T.quizCode}" value="${esc(value)}"><button class="btn primary" aria-label="${T.go}">&#9654;</button></form>`;
}

function wireCodeForm(): void {
  const input = $("#c") as HTMLInputElement;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  input.addEventListener("input", () => {
    const c = input.value.replace(/\D/g, "");
    if (c !== input.value) input.value = c;
  });
  $("#codeform").addEventListener("submit", (e) => {
    e.preventDefault();
    const c = input.value.replace(/\D/g, "");
    if (!JOIN_CODE.test(c) && !TEACHER_CODE.test(c)) {
      input.select();
      return;
    }
    if (location.pathname.startsWith("/play")) {
      location.hash = c;
      location.reload();
    } else location.href = `/play#${c}`;
  });
}

function showNoQuiz(): void {
  main.innerHTML = `<div class="center">
    <p class="big">${esc(code)}</p><div class="verdict wrong" style="width:22vmin;height:22vmin">${ICON.cross}</div>
    ${codeForm()}
  </div>`;
  wireCodeForm();
}

/** The box takes the class code too, for a student who ends up here. */
function showTeacherForm(note: string): void {
  document.body.classList.add("follows-dark");
  document.title = `classyQuiz · ${T.showOrSteer}`;
  main.innerHTML = `${siteHead()}<div class="center teacher-entry">
    <h1>${T.showOrSteerH}</h1>
    ${note ? `<p class="muted">${esc(said(note))}</p>` : ""}
    <p class="muted">${T.codeAndDigits}</p>
    ${codeForm(JOIN_CODE.test(code) ? code : "", "12345 67")}
    <p class="muted">${T.digitsShown}</p>
  </div>`;
  wireCodeForm();
}

const seats: Seat[] = [];
const statuses = new Map<Seat, LineStatus>();
const columns = new Map<Seat, { frame: HTMLElement; body: HTMLElement }>();
/**
 * The places size themselves by their column (container units); a browser
 * without them (Safari before 16) keeps one place to the page.
 */
const canSplit = typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("container-type: size");
let strip: HTMLElement | null = null;

function addSeat(slot: number, asTeacher: SeatContext["teacher"] = null): void {
  const seat: Seat = new Seat({
    instance: instanceId,
    code,
    slot,
    root: seats.length === 0 ? main : document.createElement("div"),
    teacher: asTeacher,
    beside: () => seats.find((s) => s !== seat && s.token)?.token,
    status: (s) => {
      statuses.set(seat, s);
      showStatus();
    },
    changed,
    teacherForm: showTeacherForm,
  });
  seats.push(seat);
  seats.sort((a, b) => a.order - b.order);
  if (!asTeacher) layout();
  seat.start();
}

function addPlace(): void {
  if (seats.length >= MAX_SEATS) return;
  const used = new Set(seats.map((s) => s.slot));
  let slot = 0;
  while (used.has(slot)) slot++;
  addSeat(slot);
}

/** Under way no place is added or closed: either would resize every column under the others' fingers. */
function underWay(): boolean {
  return seats.some((s) => s.view && s.view.phase !== "lobby");
}

function closable(seat: Seat): boolean {
  if (seats.length < 2 || underWay()) return false;
  return !seat.token || seats.some((s) => s !== seat && s.token);
}

function closePlace(seat: Seat): void {
  if (seats.includes(seat) && closable(seat)) dropPlace(seat);
}

function dropPlace(seat: Seat): void {
  seats.splice(seats.indexOf(seat), 1);
  statuses.delete(seat);
  columns.get(seat)?.frame.remove();
  columns.delete(seat);
  layout();
  showStatus();
  void seat.close();
}

function changed(): void {
  if (teacher) return;
  // Under way, a place without a player closes: it was turned away, or its
  // avatar was picked back on another device, and only the lobby adds one.
  if (underWay()) for (const s of [...seats]) if (!s.token && seats.some((o) => o !== s && o.token)) dropPlace(s);
  layout();
  const views = seats.map((s) => s.view).filter((v) => v && !v.peers);
  if (views.length === 0) return;
  const v = views.find((x) => !x!.removed);
  edgeBar("start", v && v.phase === "lobby" ? v.starts : null);
}

function shareOffered(): boolean {
  return canSplit && seats.some((s) => s.view?.share);
}

function layout(): void {
  const split = seats.length > 1 || shareOffered();
  document.body.classList.toggle("shared", split);
  if (!split) {
    main.classList.remove("seats");
    const only = seats[0];
    if (only && only.root !== main) {
      columns.clear();
      only.moveTo(main);
    }
    return;
  }
  main.classList.add("seats");
  for (const seat of seats) {
    let col = columns.get(seat);
    if (!col) {
      const frame = document.createElement("div");
      frame.className = "seat";
      const body = document.createElement("div");
      body.className = "seat-body";
      const close = document.createElement("button");
      close.className = "seat-close";
      close.setAttribute("aria-label", T.closePlace);
      close.innerHTML = ICON.cross;
      onTap(close, () => closePlace(seat));
      frame.append(body, close);
      col = { frame, body };
      columns.set(seat, col);
    }
    seat.moveTo(col.body);
    col.frame.classList.toggle("closable", closable(seat));
  }
  const want: HTMLElement[] = seats.map((s) => columns.get(s)!.frame);
  if (seats.length < MAX_SEATS && shareOffered()) {
    if (!strip) {
      strip = document.createElement("button");
      strip.className = "addseat";
      strip.setAttribute("aria-label", T.addPlace);
      strip.innerHTML = `${ICON.plus}${ICON.person}`;
      onTap(strip, addPlace);
    }
    want.push(strip);
  }
  const now = [...main.children];
  if (now.length !== want.length || now.some((el, i) => el !== want[i])) main.replaceChildren(...want);
}

let shownStatus: LineStatus | null = null;

function showStatus(): void {
  const all = [...statuses.values()];
  const s: LineStatus = all.includes("offline") ? "offline" : all.includes("connecting") || all.length === 0 ? "connecting" : "live";
  if (s === shownStatus) return;
  shownStatus = s;
  statusDot(dot, s, T.status);
  clearTimeout(offlineTimer);
  clearTimeout(unreachedTimer);
  if (s === "live") {
    banner.hidden = true;
    bannerWords.hidden = true;
  } else {
    offlineTimer = window.setTimeout(() => (banner.hidden = false), 2500);
    unreachedTimer = window.setTimeout(() => (bannerWords.hidden = false), UNREACHED_MS);
  }
}

void start();
