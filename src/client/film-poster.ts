// The film in the strip's place (public/index.html, "The film in the strip's
// place"). Until a press the page holds its poster frame as a picture, the
// strip's captions as chapters with a still each, a hidden replay and full
// screen button and nothing else: the landing stays light, nothing loads or
// plays until someone asks, and the film's words (in /js/film.js) stay out of
// the page AIs read. The first
// press on ▶, the picture or a chapter loads /js/film.js; it takes the markup
// over, paints the same frame over the picture, drops the picture and plays
// from the start or that chapter, in the page's language. If it can't load,
// or loads but can't draw the film (it then sets data-film to "failed"), the
// picture stays and the next press tries again.
//
// The film speaks the page's language, and so do its pictures (the poster
// frame and the stills, film-<lang>.webp and so on): filmLanguage() below,
// from client/home.ts whenever the page's language is set. A switch while the
// film is on goes back to the poster in the new language; the next press
// builds the film in it.

declare global {
  interface Window {
    /** Set by /js/film.js once loaded: start() builds the film again (after a reset or a failed draw), reset() takes it down to the poster. */
    classyQuizFilm?: { start(): void; reset(): void };
  }
}

const host = document.getElementById("cqfilm");
// The poster picture, kept here: while the film plays it is out of the document, and a switch still sets its language.
const poster = host?.querySelector<HTMLImageElement>(".cqf-stage > img") ?? null;

if (host) {
  let script: HTMLScriptElement | null = null;
  let loaded = false;
  host.addEventListener("click", (e) => {
    if (host.dataset.film === "on") return; // the film handles its own presses
    const target = e.target as Element;
    const chapter = target.closest<HTMLButtonElement>(".cqf-ch button[data-ch]");
    if (!chapter && !target.closest(".cqf-stage")) return;
    host.dataset.start = chapter?.dataset.ch ?? "";
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
  });
}

/** The film's pictures in language `l`, and the film back to its poster if it is on: it is built in the page's language. */
export function filmLanguage(l: string): void {
  if (!host) return;
  const pic = (img: HTMLImageElement, src: string, srcset?: string) => {
    if (img.getAttribute("src") === src) return; // the same picture: no second download
    if (srcset) img.srcset = srcset; // srcset first: it, not src, picks what loads
    img.src = src;
  };
  if (poster) pic(poster, `/landing/film-${l}.webp`, `/landing/film-${l}-800.webp 800w, /landing/film-${l}.webp 1600w`);
  for (const img of host.querySelectorAll<HTMLImageElement>("img[data-lang-src]")) pic(img, `/landing/${img.dataset.langSrc}-${l}.webp`);
  if (host.dataset.film !== "on") return;
  // the poster first decoded, so the stage doesn't stand empty between the film and the picture
  const back = () => {
    if (host.dataset.film === "on") window.classyQuizFilm?.reset();
  };
  if (poster) poster.decode().then(back, back);
  else back();
}
