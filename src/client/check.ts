// Does this network let the quiz through? Run on the school laptop and one
// tablet before relying on the site (docs/design/root-page.md, "Network
// help, where failure shows"). Tests what the quiz uses: the site's API over HTTP, and a live
// WebSocket. Without WebSockets the quiz still runs, over HTTP.

import { $, esc } from "./dom.ts";
import { ICON } from "./look.ts";

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
  row("http", "The site's server, over HTTP");
  try {
    const t0 = performance.now();
    const r = await fetch("/api/ping", { cache: "no-store" });
    const ok = r.ok && (await r.json()).ok === true;
    result("http", ok, ok ? `${Math.round(performance.now() - t0)} ms` : `answer ${r.status}`);
    return ok;
  } catch {
    result("http", false, "no answer");
    return false;
  }
}

function ws(): Promise<boolean> {
  row("ws", "Live connection (WebSocket)");
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
      finish(false, "blocked");
      return;
    }
    const t0 = performance.now();
    const timer = setTimeout(() => {
      finish(false, "no answer within 8 s");
      sock.close();
    }, 8000);
    sock.onopen = () => sock.send("hello");
    sock.onmessage = (e) => {
      clearTimeout(timer);
      finish(e.data === "hello", `${Math.round(performance.now() - t0)} ms`);
      sock.close();
    };
    sock.onerror = () => {
      clearTimeout(timer);
      finish(false, "blocked by this network");
    };
  });
}

function forIt(now: string): string {
  const host = location.host;
  const text = `Please allow ${host} on the school network. It is a site for classroom quizzes: students answer on their own devices. It needs HTTPS and WebSocket connections to ${host}. ${now}`;
  return `<p>What to send IT:</p><p class="it">${esc(text)}</p>`;
}

async function main(): Promise<void> {
  list.innerHTML = "";
  $("#verdict").innerHTML = "";
  const okHttp = await http();
  const okWs = okHttp ? await ws() : false;
  $("#verdict").innerHTML = !okHttp
    ? `<p class="err">${ICON.cross} This device can't reach the quiz's server: the network blocks it.</p>${forIt("At the moment this network blocks it.")}`
    : okWs
      ? `<p>${ICON.check} All good: the quiz runs live on this network.</p>`
      : `<p>${ICON.check} The quiz runs on this network, a little slower: answers and screens follow a moment later, because live connections are blocked. That is fine for a lesson. To make it live:</p>${forIt("At the moment the WebSocket connections are blocked, and the quiz runs more slowly.")}`;
}

// The part for a network that blocks the site entirely names this site's address.
for (const el of document.querySelectorAll<HTMLElement>("[data-host]")) el.textContent = location.host;

$("#again").addEventListener("click", () => void main());
void main();
