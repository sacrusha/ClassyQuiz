// The film on the root page (public/index.html, "The film, under the first
// screen"). Until a press the page holds its poster frame as a picture, the
// player's bar (play, the time bar, the time, the speed, a hidden full screen
// button) and a hidden replay, and nothing else: nothing of the film loads or
// plays until someone asks, and the film's words (in
// /js/film.js) stay out of the page AIs read. The bar works before the film is
// there, as a video player's does: the speed is set here, always; ▶, the
// picture or a move of the time bar loads /js/film.js, which takes the markup
// over, paints the same frame over the picture, drops the picture, and plays
// from the start or shows the moment the bar was moved to, in the page's
// language. While it loads the bar shows the time it was moved to. If it can't
// load, or loads but can't draw the film (it then sets data-film to "failed"),
// the picture stays and the next press tries again.
//
// The film speaks the page's language, and so does its poster picture
// (film-<lang>.webp): filmLanguage() below, from client/home.ts whenever the
// page's language is set. A switch while the film is on goes back to the
// poster in the new language; the next press builds the film in it.

declare global {
  interface Window {
    /** Set by /js/film.js once loaded: start() builds the film again (after a reset or a failed draw), reset() takes it down to the poster. */
    classyQuizFilm?: { start(): void; reset(): void };
  }
}

const host = document.getElementById("cqfilm");
// The poster picture, kept here: while the film plays it is out of the document, and a switch still sets its language.
// The static page holds it, in English, for a browser without scripts only (<noscript>); here it is made without a
// source, which filmLanguage() gives it, so a visit fetches the poster of its own language and no other.
const poster = host ? makePoster(host) : null;

function makePoster(film: HTMLElement): HTMLImageElement | null {
  const stage = film.querySelector(".cqf-stage");
  if (!stage) return null;
  const img = document.createElement("img");
  img.alt = "";
  img.width = 1600;
  img.height = 900;
  img.sizes = "(max-width: 42rem) 100vw, 42rem";
  img.loading = "lazy";
  stage.prepend(img);
  return img;
}

const RATES: Record<string, [string, string]> = { "1": ["0.5", "½×"], "0.5": ["0.25", "¼×"], "0.25": ["1", "1×"] };
const clock = (x: number) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;

if (host) {
  let script: HTMLScriptElement | null = null;
  let loaded = false;
  const load = (start: "" | "seek") => {
    host.dataset.start = start;
    if (window.classyQuizFilm) {
      // loaded before: build it again (back from a language switch, or after a failed draw)
      delete host.dataset.film;
      window.classyQuizFilm.start();
      return;
    }
    if (script && loaded) {
      // it loaded but never set up: load it again
      script.remove();
      script = null;
    }
    if (script) return;
    host.classList.add("loading");
    loaded = false;
    script = document.createElement("script");
    script.src = "/js/film.js";
    script.onload = () => {
      loaded = true;
      host.classList.remove("loading");
    };
    script.onerror = () => {
      host.classList.remove("loading");
      script?.remove();
      script = null;
    };
    document.head.appendChild(script);
  };
  host.addEventListener("click", (e) => {
    const target = e.target as Element;
    // the speed, before the film and while it plays: the film reads it from the button
    const speed = target.closest<HTMLButtonElement>(".cqf-speed");
    if (speed) {
      const [rate, label] = RATES[speed.dataset.rate ?? "1"] ?? RATES["0.25"];
      speed.dataset.rate = rate;
      speed.textContent = label;
      return;
    }
    if (host.dataset.film === "on") return; // the film handles its own presses
    if (target.closest(".cqf-stage, .cqf-play")) load("");
  });
  host.addEventListener("input", (e) => {
    if (host.dataset.film === "on") return;
    const range = e.target as HTMLInputElement;
    if (range.type !== "range") return;
    const time = host.querySelector(".cqf-time")?.firstChild;
    if (time) time.nodeValue = clock(+range.value);
    range.setAttribute("aria-valuetext", clock(+range.value));
    load("seek");
  });
}

/** The film's poster picture in language `l`, and the film back to its poster if it is on: it is built in the page's language. */
export function filmLanguage(l: string): void {
  if (!host) return;
  const pic = (img: HTMLImageElement, src: string, srcset?: string) => {
    if (img.getAttribute("src") === src) return; // the same picture: no second download
    if (srcset) img.srcset = srcset; // srcset first: it, not src, picks what loads
    img.src = src;
  };
  if (poster) pic(poster, `/landing/film-${l}.webp`, `/landing/film-${l}-800.webp 800w, /landing/film-${l}.webp 1600w`);
  if (host.dataset.film !== "on") return;
  // the poster first decoded, so the stage doesn't stand empty between the film and the picture
  const back = () => {
    if (host.dataset.film === "on") window.classyQuizFilm?.reset();
  };
  if (poster) poster.decode().then(back, back);
  else back();
}
