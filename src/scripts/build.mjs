// Builds the static site into dist/: the pages and stylesheet from public/,
// and one bundled script per page from client/. The /api functions are
// bundled by wrangler itself.
//
//   node scripts/build.mjs           build once
//   node scripts/build.mjs --watch   rebuild on change (local development)

import { build, context } from "esbuild";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const watch = process.argv.includes("--watch");
const pages = ["home", "example", "open", "teach", "screen", "play", "check", "owner", "own-copy", "notfound"];

// Security headers for every page; scripts are revalidated so a deploy shows
// up on the next load. A font is kept a year: its file name carries the
// font's version, so a new font is a new name.
//
// The Content-Security-Policy is a second layer behind escaping: quiz text is
// the teacher's AI's, shown on every screen of the class, and a slip in any
// page that builds HTML from it must not run as script. Scripts only from the
// site's own files; pictures also as blob: (the projector fetches the quiz's
// pictures into object URLs). Styles stay open (the pages set many inline),
// and so do WebSocket addresses, for one reason only: Safari before 16 (every
// browser on an iOS 15 device) doesn't let 'self' match same-origin wss:
// (WebKit bugs 201591, 235873), and the target schools have iPads stuck on
// iOS 15. A static header can't target a version, so the rule is wider than
// its reason: reassess it (design/hosting-and-limits.md, "Not known") when
// iOS 15 stops mattering, and by November 2028 at the latest.
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob:",
  "connect-src 'self' ws: wss:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");
const headers = `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/js/*
  Cache-Control: no-cache
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
`;

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(root, "public"), dist, { recursive: true });
await writeFile(join(dist, "_headers"), headers);

// The mark and the name are written into a page inline, so the hat and the
// name take the page's ink (currentColor), dark mode included; an <img>
// can't. One file in public/brand/ feeds every page that shows it
// (docs/design/identity.md).
//   <!--#brand file.svg-->      the file, where the marker is.
//   <!--#brand-use file.svg-->  a small <svg> that <use>s the file, whose
//                               drawing is written once where the page says
//                               <!--#brand-defs-->. The root page puts that
//                               after the guidance, so AIs reading the page
//                               reach the guidance before any path data.
for (const name of (await readdir(dist)).filter((n) => n.endsWith(".html"))) {
  const page = join(dist, name);
  const html = await readFile(page, "utf8");
  const marks = [...html.matchAll(/<!--#brand(-use)? ([\w.-]+\.svg)-->/g)];
  if (!marks.length) continue;
  const brand = async (file) => {
    const svg = (await readFile(join(dist, "brand", file), "utf8")).trim();
    const m = svg.match(/^<svg([^>]*)>([\s\S]*)<\/svg>$/);
    const attr = (a) => m?.[1].match(new RegExp(`\\s${a}="([^"]+)"`))?.[1];
    if (!m || !attr("viewBox") || !attr("width") || !attr("height")) throw new Error(`${name}: brand/${file} is not an SVG with a viewBox, width and height`);
    return { svg, body: m[2], viewBox: attr("viewBox"), width: attr("width"), height: attr("height"), label: attr("aria-label") ?? "classyQuiz" };
  };
  let out = html;
  const used = new Map();
  for (const [marker, use, file] of marks) {
    const b = await brand(file);
    const id = `brand-${file.replace(/\.svg$/, "")}`;
    if (use) used.set(id, b);
    const text = use
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.viewBox}" width="${b.width}" height="${b.height}" role="img" aria-label="${b.label}"><use href="#${id}"/></svg>`
      : b.svg;
    out = out.replace(marker, () => text);
  }
  if (used.size) {
    if (!out.includes("<!--#brand-defs-->")) throw new Error(`${name}: <!--#brand-use--> without <!--#brand-defs-->`);
    const defs = [...used].map(([id, b]) => `<symbol id="${id}" viewBox="${b.viewBox}">${b.body}</symbol>`).join("");
    out = out.replace("<!--#brand-defs-->", () => `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="0" height="0" style="position:absolute;overflow:hidden">${defs}</svg>`);
  }
  await writeFile(page, out);
}

// site.css (the shared look) arrives with what a page already loads, so a
// device opening a page at lesson start waits for one stylesheet at most: in
// front of app.css for the app pages and of home.css for the root page,
// written into the page for those with their own <style>. A page links
// /site.css first in public/, which also works opened straight from there.
{
  const site = await readFile(join(dist, "site.css"), "utf8");
  const sheets = ["app.css", "home.css"];
  for (const sheet of sheets) await writeFile(join(dist, sheet), `${site}\n${await readFile(join(dist, sheet), "utf8")}`);
  const inline = site.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n\s*\n+/g, "\n").trim();
  const link = '<link rel="stylesheet" href="/site.css">\n';
  for (const name of (await readdir(dist)).filter((n) => n.endsWith(".html"))) {
    const page = join(dist, name);
    const html = await readFile(page, "utf8");
    if (!html.includes(link)) throw new Error(`${name}: doesn't link /site.css`);
    const out = sheets.some((sheet) => html.includes(`<link rel="stylesheet" href="/${sheet}">`))
      ? html.replace(link, "")
      : html.replace(link, () => `<style>\n${inline}\n</style>\n`);
    await writeFile(page, out);
  }
  await rm(join(dist, "site.css"));
}

// The site's address in the guidance page: the demo's in the source; a copy
// under another name (wrangler.toml's `name`, or SITE_ADDRESS when the
// address is something else) names its own, so the teacher's AI is sent to
// it rather than to the demo. The page's script shows the address the
// browser opened anyway; this is for AIs, which read the page without it.
// /check's part for a network that blocks the site is read the same way,
// often without its script (the page may be saved, or read elsewhere).
const DEMO = "classyquiz.pages.dev";
const project = (await readFile(join(root, "wrangler.toml"), "utf8")).match(/^name\s*=\s*"([^"]+)"/m)?.[1];
const address = (process.env.SITE_ADDRESS || (project ? `${project}.pages.dev` : DEMO)).replace(/^https?:\/\//, "").replace(/\/+$/, "");
if (address !== DEMO) {
  for (const name of ["index.html", "check.html"]) {
    const page = join(dist, name);
    await writeFile(page, (await readFile(page, "utf8")).replaceAll(DEMO, address));
  }
}

// The manual as plain text, /manual.txt, from the built page so that it
// names the same address. A fetch tool may hand an AI a small model's summary
// of the page; an AI with a shell can fetch this text itself
// (docs/design/guidance-page.md, "Situation").
{
  const html = await readFile(join(dist, "index.html"), "utf8");
  const start = html.indexOf('<div class="guide">');
  const end = html.lastIndexOf("</div>", html.indexOf("</main>"));
  if (start < 0 || end < start) throw new Error("index.html: no <div class=\"guide\"> inside <main>");
  await writeFile(join(dist, "manual.txt"), `${manualText(html.slice(start + '<div class="guide">'.length, end), `https://${address}`)}\n`);
}

// Turns the guidance's markup into Markdown-like text. It knows the elements
// the guidance uses and refuses others, so a new one is a build error rather
// than a hole in the text.
function manualText(src, origin) {
  const named = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'", nbsp: " ", rsaquo: "›", lsaquo: "‹", times: "×", hellip: "…", mdash: "—", ndash: "–", rarr: "→", darr: "↓" };
  const decode = (s) => s.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (m, e) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : named[e] ?? m);
  const root = { tag: "root", kids: [] };
  const stack = [root];
  for (const [, text, close, tag, attrs] of src.matchAll(/([^<]+)|<(\/?)(\w+)([^>]*)>/g)) {
    if (text !== undefined) { stack.at(-1).kids.push(text); continue; }
    if (close) {
      if (stack.at(-1).tag !== tag) throw new Error(`manual.txt: </${tag}> closes <${stack.at(-1).tag}>`);
      stack.pop();
    } else {
      const node = { tag, href: attrs.match(/href="([^"]*)"/)?.[1], kids: [] };
      stack.at(-1).kids.push(node);
      stack.push(node);
    }
  }
  const raw = (n) => (typeof n === "string" ? decode(n) : n.kids.map(raw).join(""));
  const url = (a) => (a.href.startsWith("/") ? origin + a.href : a.href);
  const inline = (n) => {
    if (typeof n === "string") return decode(n).replace(/\s+/g, " ");
    // A link inside code keeps the code whole; its address follows the code.
    if (n.tag === "code") {
      const links = n.kids.filter((k) => typeof k !== "string" && k.tag === "a").map(url);
      return `\`${raw(n).replace(/\s+/g, " ")}\`${links.length ? ` (${links.join(", ")})` : ""}`;
    }
    const t = n.kids.map(inline).join("");
    if (n.tag === "strong") return `**${t}**`;
    if (n.tag === "a") return url(n).replace(/^https?:\/\//, "").replace(/\/$/, "") === t.replace(/`/g, "") ? t : `${t} (${url(n)})`;
    throw new Error(`manual.txt: <${n.tag}> inside text`);
  };
  const isBlock = (n) => typeof n !== "string" && ["p", "ul", "ol", "pre", "blockquote", "h1", "h2", "h3"].includes(n.tag);
  // A node's children as blocks; text and inline elements between blocks form a paragraph.
  const blocks = (n) => {
    const out = [];
    let run = [];
    const flush = () => { const t = run.map(inline).join("").trim(); if (t) out.push(t); run = []; };
    for (const k of n.kids) {
      if (isBlock(k)) { flush(); out.push(block(k)); } else run.push(k);
    }
    flush();
    return out;
  };
  const block = (n) => {
    if (/^h[1-3]$/.test(n.tag)) return `${"#".repeat(Number(n.tag[1]))} ${n.kids.map(inline).join("").trim()}`;
    if (n.tag === "p") return n.kids.map(inline).join("").trim();
    if (n.tag === "pre") return "```\n" + raw(n).replace(/\n$/, "") + "\n```";
    if (n.tag === "blockquote") return blocks(n).join("\n\n").split("\n").map((l) => (l ? `> ${l}` : ">")).join("\n");
    if (n.tag === "ul" || n.tag === "ol") {
      return n.kids.filter((k) => typeof k !== "string").map((li, i) => {
        if (li.tag !== "li") throw new Error(`manual.txt: <${li.tag}> in a list`);
        const mark = n.tag === "ol" ? `${i + 1}. ` : "- ";
        const body = blocks(li).join("\n\n").split("\n");
        return mark + body.map((l, j) => (j && l ? " ".repeat(mark.length) + l : l)).join("\n");
      }).join("\n");
    }
    throw new Error(`manual.txt: <${n.tag}> as a block`);
  };
  return blocks(root).join("\n\n");
}

const options = {
  entryPoints: Object.fromEntries(pages.map((p) => [p, join(root, "client", `${p}.ts`)])),
  outdir: join(dist, "js"),
  bundle: true,
  format: "iife",
  // School-issued tablets and laptops are not always up to date.
  target: "es2020",
  minify: !watch,
  sourcemap: watch ? "inline" : false,
  logLevel: "info",
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  // public/ changes are copied by hand in watch mode: re-run the build.
} else {
  await build(options);
}
