// Does this network let the quiz through? Run on the school laptop and one
// tablet before relying on the site (backlog constraint "survives school
// Wi-Fi"). Tests what the quiz uses: the site's API over HTTP, and a live
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

async function main(): Promise<void> {
  list.innerHTML = "";
  $("#verdict").innerHTML = "";
  const okHttp = await http();
  const okWs = okHttp ? await ws() : false;
  $("#verdict").innerHTML = !okHttp
    ? `<p class="err">${ICON.cross} This device can't reach the site. The school's web filter may block the address; ask IT to allow it.</p>`
    : okWs
      ? `<p>${ICON.check} All good: the quiz will run live on this network.</p>`
      : `<p>${ICON.check} The quiz will run, over plain HTTP instead of a live connection: answers and screens follow a moment later.</p>`;
}

$("#again").addEventListener("click", () => void main());
void main();
