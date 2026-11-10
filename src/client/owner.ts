// The owner's page (docs/design/owner-page.md): asks for the key once, keeps
// it in this browser, and reads GET /api/site/use with it. The key goes
// nowhere else: not in an address, not in a form's fields, not on the page
// after it is typed. Until the site has accepted a key the page shows nothing
// but the box for it.

import { $, esc, store } from "./dom.ts";
import { GB_S_PER_POLL_S, PLAN, bucketLabels, objectRequests, pollGbSeconds, realClasses, sumUse, turnedAway } from "./owner-figures.ts";
import type { DayRecord, DayUse, MonthRecord, OwnerView, Use } from "../server/telemetry.ts";

const KEY = "cq.owner";
const gate = $("#gate") as HTMLFormElement;
const input = $("#key") as HTMLInputElement;
const msg = $("#msg");
const out = $("#figures");

let key = "";
let busy = false;

function say(text: string, bad = false): void {
  msg.textContent = text;
  msg.className = bad ? "bad" : "muted";
}

const n = (x: number): string => Math.round(x).toLocaleString("en-US");
/** GB-s: a tenth shown while small. */
const g = (x: number): string => (x < 10 ? x.toFixed(1) : n(x));
const pct = (a: number, b: number): string => (b > 0 ? `${Math.round((100 * a) / b)} %` : "–");
const cell = (x: number | string, zeroDim = true): string => `<td${zeroDim && x === 0 ? ' class="zero"' : ""}>${typeof x === "number" ? n(x) : esc(x)}</td>`;
const head = (cols: string[]): string => `<tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>`;
const table = (cols: string[], rows: string[]): string => `<div class="scroll"><table><thead>${head(cols)}</thead><tbody>${rows.join("")}</tbody></table></div>`;

function awayText(r: DayRecord["refused"]): string {
  if (!r || turnedAway(r) === 0) return "–";
  return [r.uploads && `uploads ${r.uploads}`, r.bytes && `bytes ${r.bytes}`, r.rows && `rows ${r.rows}`].filter(Boolean).join(" · ");
}

/** A figure with no limit to measure it against: what the site has, not what the plan allows. */
function figure(name: string, value: number, note: string): string {
  return `<div class="gauge"><div class="name">${esc(name)}</div><div class="val">${n(value)}</div><div class="of">${esc(note)}</div></div>`;
}

function gauge(name: string, value: number, of: number, note: string): string {
  const f = of > 0 ? value / of : 0;
  const level = f >= 0.8 ? "high" : f >= 0.5 ? "mid" : "";
  return `<div class="gauge"><div class="name">${esc(name)}</div><div class="val">${n(value)}</div><div class="of">of ${n(of)} · ${esc(note)}</div><div class="meter"><i class="${level}" style="width:${Math.min(100, f * 100)}%"></i></div></div>`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function gauges(v: OwnerView): string {
  const d = v.days[0];
  if (!d) return `<p class="muted">The site has no day on record yet.</p>`;
  const u = d.use;
  const label = d.day === today() ? `today, ${d.day} UTC` : `${d.day} UTC, the latest day on record`;
  return (
    `<h2>The latest day</h2><p class="note">${esc(label)}. The plan's day starts at 00:00 UTC. How many classes a day the site carries is for these figures to show; the plan's limits are the gauges: the ledger's, what classes booked or spent, refused at their share; and below them what the settled classes' devices reported. The project's own runs are left out of the classes, though they spend the plan's allowance too.</p>` +
    `<div class="gauges">` +
    figure("Classes", realClasses(d), "let in, the project's own runs left out") +
    figure("Most at once", d.atOnce ?? 0, "classes booked and not yet settled") +
    gauge("Ledger now: rows", v.ledger.now.rows, v.ledger.of.rows, "the classes' share of the plan's 100,000; booked or spent") +
    gauge("Ledger now: requests", v.ledger.now.requests, v.ledger.of.requests, "the classes' share of the plan's 100,000; booked or spent") +
    gauge("Ledger now: awake s", v.ledger.now.awakeS, v.ledger.of.awakeS, "the classes' share of the plan's duration, at 0.128 GB-s a second") +
    gauge("Requests, about", u ? objectRequests(u) : 0, PLAN.objectRequests, "Durable Object, classes only") +
    gauge("Duration, about", u ? pollGbSeconds(u) : 0, PLAN.gbSeconds, "GB-s, held polls only") +
    `</div>` +
    `<p class="note">Requests and duration are what the classes' devices report; uploads, joins and pictures come on top, and the Cloudflare dashboard has the account's own totals. The classes' requests are an estimate: sockets opened are not summed, so they are taken as one a device not on long-poll, plus its reconnects.</p>`
  );
}

function daysTable(v: OwnerView): string {
  const rows = v.days.map((d) => {
    const u = d.use;
    return `<tr>${cell(d.day)}${cell(realClasses(d))}${cell(d.probes ?? 0)}${cell(d.uploads)}${cell(d.atOnce ?? 0)}${cell(awayText(d.refused))}${cell(d.written)}${cell(d.peak)}${cell(u ? objectRequests(u) : 0)}${cell(g(u ? pollGbSeconds(u) : 0))}</tr>`;
  });
  return (
    `<h2>Days</h2><p class="note">UTC days, newest first, the last 31. “Turned away” is a lower bound: a refusal is counted in memory and written with the day's next write. “Rows written” is by the classes that finished; “ledger peak” is the most the ledger held at once.</p>` +
    table(["Day", "Classes", "Own runs", "Uploads", "Most at once", "Turned away", "Rows written", "Ledger peak", "Requests, about", "Duration GB‑s, about"], rows)
  );
}

function bars(title: string, labels: string[], counts: number[]): string {
  const max = Math.max(1, ...counts);
  return `<section><h3>${esc(title)}</h3>${labels.map((l, i) => `<div class="row"><span>${esc(l)}</span><span class="meter"><i style="width:${(100 * (counts[i] ?? 0)) / max}%"></i></span><b>${n(counts[i] ?? 0)}</b></div>`).join("")}</section>`;
}

function facts(title: string, items: [string, string][]): string {
  return `<section><h3>${esc(title)}</h3><dl>${items.map(([k, x]) => `<dt>${esc(k)}</dt><dd>${esc(x)}</dd>`).join("")}</dl></section>`;
}

function mix(v: OwnerView): string {
  const u = sumUse(v.days.map((d) => d.use));
  if (!u || u.classes === 0) return `<h2>The classes</h2><p class="muted">No class has settled in the days on record.</p>`;
  const e = v.edges;
  return (
    `<h2>The classes</h2><p class="note">All ${n(u.classes)} classes that settled in the ${v.days.length} days on record, the project's own runs left out. A class settles at its final ranking or the quiz's end; one never let in books nothing and is not here.</p>` +
    `<div class="mix">` +
    bars("Room", ["Peers", "Remote", "Wall alone"], [u.kinds.peers, u.kinds.remote, u.kinds.wall]) +
    bars("Players", bucketLabels(e.size), u.size) +
    bars("Durable Object requests", bucketLabels(e.requests), u.requests) +
    bars("Rows written", bucketLabels(e.rows), u.rows) +
    facts("How they went", [
      ["Reached the final ranking", pct(u.final, u.classes)],
      ["Questions played, of the quizzes' own", pct(u.played, u.questions)],
      ["Minutes, average", u.classes ? (u.minutes / u.classes).toFixed(1) : "–"],
      ["Players, average", u.classes ? (u.players / u.classes).toFixed(1) : "–"],
      ["Late joiners", n(u.late)],
    ]) +
    facts("Devices and lines", [
      ["Devices", n(u.devices)],
      ["On long-poll at their last count", pct(u.polled, u.devices)],
      ["Classes with at least one poller", pct(u.withPoller, u.classes)],
      ["Reconnects per device", u.devices ? (u.reconnects / u.devices).toFixed(2) : "–"],
      ["Devices that went to sleep", pct(u.slept, u.devices)],
      ["HTTP requests per class", u.classes ? n(u.http / u.classes) : "–"],
      ["Messages sent per class", u.classes ? n(u.sent / u.classes) : "–"],
    ]) +
    `</div>`
  );
}

function problems(v: OwnerView): string {
  const rows = v.days.filter((d) => d.use).map((d) => {
    const p = (d.use as DayUse).problems;
    return `<tr>${cell(d.day)}${cell((d.use as DayUse).devices)}${cell(p?.failed ?? 0)}${cell(p?.silent ?? 0)}${cell(p?.quota ?? 0)}${cell(p?.errors ?? 0)}</tr>`;
  });
  if (!rows.length) return "";
  return (
    `<h2>Problems</h2><p class="note">What devices met, by the day only: they say what fails now, and a month later describe a site that may have changed. A failed socket is a WebSocket attempt that did not open; a silent one opened and carried nothing, as a school filter can do. “Allowance spent” counts devices told the platform's allowance was used up. Script errors are a number, never the message.</p>` +
    table(["Day", "Devices", "Sockets failed", "Sockets silent", "Allowance spent seen", "Script errors"], rows)
  );
}

function ownRuns(v: OwnerView): string {
  const days = v.days.filter((d) => d.probeUse);
  if (!days.length) return "";
  const rows = days.map((d) => {
    const u = d.probeUse as DayUse;
    return `<tr>${cell(d.day)}${cell(u.classes)}${cell(u.devices)}${cell(u.http)}${cell(u.sent)}${cell(g(pollGbSeconds(u)))}${cell(u.problems?.failed ?? 0)}${cell(u.problems?.silent ?? 0)}${cell(u.problems?.errors ?? 0)}</tr>`;
  });
  return (
    `<details><summary>The project's own runs</summary><p class="note">Simulators and probes, which say so with their upload. Kept apart so a class of 25 simulated devices doesn't read as a teacher's.</p>` +
    table(["Day", "Classes", "Devices", "HTTP requests", "Messages sent", "Duration GB‑s, about", "Sockets failed", "Sockets silent", "Script errors"], rows) +
    `</details>`
  );
}

function monthsTable(v: OwnerView): string {
  if (!v.months.length) return `<h2>Months</h2><p class="muted">No month yet: a day is folded into its month when it passes 31 days old.</p>`;
  const rows = v.months.map((m: MonthRecord) => {
    const u: Use = m.use;
    return `<tr>${cell(m.month)}${cell(m.days)}${cell(m.classes - m.probes)}${cell(m.busiest)}${cell(m.probes)}${cell(m.uploads)}${cell(awayText(m.refused))}${cell(m.atOnce)}${cell(m.written)}${cell(m.peak)}${cell(pct(u.final, u.classes))}${cell(u.devices ? (u.reconnects / u.devices).toFixed(2) : "–")}${cell(objectRequests(u))}${cell(g(pollGbSeconds(u)))}</tr>`;
  });
  return (
    `<h2>Months</h2><p class="note">Days folded in as they pass 31, kept 24 months back. Sums, with the most at once and the busiest day kept; problems are not kept. A month's days may not all be on record: “Days” says how many were folded in.</p>` +
    table(["Month", "Days", "Classes", "Busiest day", "Own runs", "Uploads", "Turned away", "Most at once", "Rows written", "Ledger peak", "Reached final", "Reconnects per device", "Requests, about", "Duration GB‑s, about"], rows)
  );
}

function render(v: OwnerView): void {
  out.innerHTML = gauges(v) + daysTable(v) + mix(v) + problems(v) + ownRuns(v) + monthsTable(v) +
    `<p class="note">Held polls cost the object they keep awake about ${GB_S_PER_POLL_S} GB-s a second; the figures are for orders of magnitude, from what devices report with what they send anyway. Nothing here identifies anyone.</p>`;
}

function shell(on: boolean): void {
  gate.hidden = on;
  out.hidden = !on;
  if (!on) {
    out.innerHTML = "";
    input.focus();
  }
}

function toolbar(): void {
  const when = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  out.insertAdjacentHTML("afterbegin", `<div class="bar"><span class="when muted">Read at ${esc(when)}</span><button type="button" id="refresh">Read again</button><button type="button" class="quiet" id="forget">Forget the key</button></div>`);
  $("#refresh").addEventListener("click", () => void load(false));
  $("#forget").addEventListener("click", () => {
    store.remove(KEY);
    key = "";
    shell(false);
    say("The key is forgotten in this browser.");
  });
}

/** Reads the figures with `key`. `typed`: the key was just given (it is kept only once the site accepts it). */
async function load(typed: boolean): Promise<void> {
  if (busy) return;
  busy = true;
  say("Reading…");
  try {
    let r: Response;
    try {
      r = await fetch("/api/site/use", { headers: { authorization: `Bearer ${key}` }, cache: "no-store", referrerPolicy: "no-referrer" });
    } catch {
      say("The site could not be reached. The key is kept; try again.", true);
      if (out.hidden) shell(false);
      return;
    }
    if (r.status === 404) {
      // The site answers 404 to a wrong key and to no key set alike.
      store.remove(KEY);
      key = "";
      shell(false);
      say(typed ? "The site did not accept this key." : "The site no longer accepts the key kept in this browser.", true);
      return;
    }
    if (!r.ok) {
      say(`The site answered ${r.status}.`, true);
      return;
    }
    const view = (await r.json()) as OwnerView;
    if (typed) {
      store.set(KEY, key);
      if (store.get<string>(KEY) !== key) say("Opened, but this browser does not keep the key: it will be asked for again.");
      else say("");
    } else say("");
    render(view);
    toolbar();
    shell(true);
    input.value = "";
  } catch {
    say("The site's answer could not be read.", true);
  } finally {
    busy = false;
  }
}

gate.addEventListener("submit", (e) => {
  e.preventDefault();
  const typed = input.value.trim();
  if (!typed) return;
  // A request's header carries ASCII; the key is made of letters and digits.
  if (!/^[\x21-\x7e]+$/.test(typed)) {
    say("A key has letters and digits only.", true);
    return;
  }
  key = typed;
  void load(true);
});

const kept = store.get<string>(KEY);
if (typeof kept === "string" && /^[\x21-\x7e]+$/.test(kept)) {
  key = kept;
  void load(false);
}
