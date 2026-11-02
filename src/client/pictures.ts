// The quiz's pictures in the browser (decisions.md, "Pictures on the screens").
// The server sends them with no-store, so a shared school laptop keeps
// nothing once the page is closed; that also means an <img> that is drawn
// again fetches again. So each picture is fetched once per page, into a blob
// URL, and every <img data-pic="<src>"> on the page is filled from that.
//
// The Projector fetches every picture of the quiz ahead (in the lobby), so a
// question never waits on one; the teacher's pages fetch what they show.

const urls = new Map<string, string>();
const loading = new Map<string, Promise<string | null>>();
const waiting: (() => void)[] = [];
let running = 0;
/** At most this many fetches at once: the current question's picture shouldn't queue behind a dozen others. */
const PARALLEL = 2;

async function slot<T>(work: () => Promise<T>): Promise<T> {
  if (running >= PARALLEL) await new Promise<void>((r) => waiting.push(r));
  running++;
  try {
    return await work();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

/** The picture as a blob URL, fetched once; null when it can't be had (the <img> then asks the server itself). */
export function load(src: string, first = false): Promise<string | null> {
  const have = urls.get(src);
  if (have) return Promise.resolve(have);
  let p = loading.get(src);
  if (!p) {
    const work = async () => {
      try {
        const r = await fetch(src, { cache: "no-store" });
        if (!r.ok) return null;
        const url = URL.createObjectURL(await r.blob());
        urls.set(src, url);
        return url;
      } catch {
        return null;
      } finally {
        loading.delete(src);
      }
    };
    p = first ? work() : slot(work);
    loading.set(src, p);
  }
  return p;
}

/** Fetches these ahead, in order. */
export function preload(srcs: string[]): void {
  for (const s of srcs) void load(s);
}

/** An <img> for a picture; fillPictures() gives it its source. w/h hold its shape before it has loaded. */
export function picImg(src: string, w: number, h: number, cls = ""): string {
  return `<img data-pic="${attr(src)}" width="${w}" height="${h}" alt=""${cls ? ` class="${cls}"` : ""}>`;
}

function attr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** Gives every <img data-pic> under root its picture, fetching what isn't here yet. */
export function fillPictures(root: ParentNode = document): void {
  root.querySelectorAll<HTMLImageElement>("img[data-pic]").forEach((img) => {
    const src = img.dataset.pic!;
    const url = urls.get(src);
    if (url) {
      if (img.getAttribute("src") !== url) img.src = url;
      return;
    }
    if (img.dataset.asked) return;
    img.dataset.asked = "1";
    void load(src, true).then((u) => {
      // Fetching failed: let the browser try it the ordinary way.
      const now = u ?? src;
      document.querySelectorAll<HTMLImageElement>("img[data-pic]").forEach((x) => {
        if (x.dataset.pic === src && x.getAttribute("src") !== now) x.src = now;
      });
    });
  });
}
