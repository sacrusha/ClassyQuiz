// Does this network let the quiz through? Run on the school laptop and one
// tablet before relying on the site (docs/design/root-page.md, "Network
// help, where failure shows"). Tests what the quiz uses: the site's API over HTTP, and a live
// WebSocket. Without WebSockets the quiz still runs, over HTTP.

import { $, esc } from "./dom.ts";
import { ICON } from "./look.ts";
import { CHECK_TEXT } from "./check-text.ts";
import { deviceLang, speak } from "./device-lang.ts";

const lang = deviceLang();
const t = CHECK_TEXT[lang];

const list = $("#results");

function row(id: string, label: string): void {
  list.insertAdjacentHTML("beforeend", `<li id="${id}" class="row"><span class="dot" data-status="connecting"></span><span>${esc(label)}</span><span class="muted" data-r></span></li>`);
}

function result(id: string, ok: boolean, detail: string): void {
  const li = $(`#${id}`);
  li.querySelector(".dot")!.setAttribute("data-status", ok ? "live" : "offline");
  (li.querySelector("[data-r]") as HTMLElement).textContent = detail;
}

async function http(): Promise<boolean> {
  row("http", t.http);
  try {
    const t0 = performance.now();
    const r = await fetch("/api/ping", { cache: "no-store" });
    const ok = r.ok && (await r.json()).ok === true;
    result("http", ok, ok ? t.ms(Math.round(performance.now() - t0)) : t.status(r.status));
    return ok;
  } catch {
    result("http", false, t.noAnswer);
    return false;
  }
}

function ws(): Promise<boolean> {
  row("ws", t.ws);
  return new Promise((resolve) => {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    let done = false;
    const finish = (ok: boolean, detail: string) => {
      if (done) return;
      done = true;
      result("ws", ok, detail);
      resolve(ok);
    };
    let sock: WebSocket;
    try {
      sock = new WebSocket(`${proto}//${location.host}/api/echo`);
    } catch {
      finish(false, t.blocked);
      return;
    }
    const t0 = performance.now();
    const timer = setTimeout(() => {
      finish(false, t.noAnswerIn(8));
      sock.close();
    }, 8000);
    sock.onopen = () => sock.send("hello");
    sock.onmessage = (e) => {
      clearTimeout(timer);
      finish(e.data === "hello", t.ms(Math.round(performance.now() - t0)));
      sock.close();
    };
    sock.onerror = () => {
      clearTimeout(timer);
      finish(false, t.blockedHere);
    };
  });
}

function forIt(now: string): string {
  return `<p>${esc(t.sendIt)}</p><p class="it">${esc(t.forIt(location.host, now))}</p>`;
}

async function main(): Promise<void> {
  list.innerHTML = "";
  $("#verdict").innerHTML = "";
  const okHttp = await http();
  const okWs = okHttp ? await ws() : false;
  $("#verdict").innerHTML = !okHttp
    ? `<p class="err">${ICON.cross} ${esc(t.unreachable)}</p>${forIt(t.nowBlocked)}`
    : okWs
      ? `<p>${ICON.check} ${esc(t.allGood)}</p>`
      : `<p>${ICON.check} ${esc(t.slower)}</p>${forIt(t.nowSlow)}`;
}

// The page in this device's language; the part for a network that blocks the
// site entirely names this site's address.
document.documentElement.lang = lang;
speak(t as unknown as Record<string, unknown>);
$("#forit").textContent = t.forIt(location.host, "");

$("#again").addEventListener("click", () => void main());
void main();
