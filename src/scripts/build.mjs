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

// Scripts are revalidated so a deploy shows up on the next load; a font's
// file name carries its version, so it can be kept a year.
//
// The Content-Security-Policy is a second layer behind escaping: quiz text
// comes from the teacher's AI. Pictures also come as blob: (the projector
// fetches the quiz's pictures into object URLs); styles stay open because the
// pages set many inline. WebSocket addresses stay open only because Safari
// before 16 (every browser on iOS 15) doesn't let 'self' match same-origin
// wss: (WebKit bugs 201591, 235873), and school iPads stuck on iOS 15 are
// plausible.
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

// The brand marks are written into the pages inline, so they take the
// page's ink (currentColor), which an <img> can't.
//   <!--#brand file.svg-->      the file, where the marker is.
//   <!--#brand-use file.svg-->  a small <svg> that <use>s the file, whose
//                               drawing is written once where the page says
//                               <!--#brand-defs-->.
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

// site.css is merged into what a page already loads (app.css, home.css, or
// an inline <style>), so a page waits for one stylesheet at most. The pages
// in public/ link /site.css so they also work opened straight from there.
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

// The source names the demo's address; a copy deployed under another name
// (wrangler.toml's `name`, or SITE_ADDRESS) names its own, for readers that
// don't run the pages' scripts: AIs reading the guidance, a saved /check,
// search engines, link previews. Other pages' text may mean the shared site
// itself (own-copy.html), so they change only in their <head>.
const DEMO = "classyquiz.pages.dev";
const project = (await readFile(join(root, "wrangler.toml"), "utf8")).match(/^name\s*=\s*"([^"]+)"/m)?.[1];
const address = (process.env.SITE_ADDRESS || (project ? `${project}.pages.dev` : DEMO)).replace(/^https?:\/\//, "").replace(/\/+$/, "");
if (address !== DEMO) {
  for (const name of await readdir(dist)) {
    const file = join(dist, name);
    if (["index.html", "check.html", "robots.txt"].includes(name)) {
      await writeFile(file, (await readFile(file, "utf8")).replaceAll(DEMO, address));
    } else if (name.endsWith(".html")) {
      const html = await readFile(file, "utf8");
      const end = html.indexOf("</head>");
      if (end < 0) throw new Error(`${name}: no </head>`);
      await writeFile(file, html.slice(0, end).replaceAll(DEMO, address) + html.slice(end));
    }
  }
}

// /sitemap.xml: the pages without noindex.
{
  const urls = [];
  for (const name of (await readdir(dist)).filter((n) => n.endsWith(".html")).sort()) {
    if ((await readFile(join(dist, name), "utf8")).includes('<meta name="robots" content="noindex">')) continue;
    urls.push(`https://${address}/${name === "index.html" ? "" : name.slice(0, -".html".length)}`);
  }
  await writeFile(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
}

// Google Search Console's proof that this deployment's owner holds its
// address; set beside SITE_ADDRESS, so a copy doesn't serve the shared site's.
if (process.env.GOOGLE_SITE_VERIFICATION) {
  const file = process.env.GOOGLE_SITE_VERIFICATION.replace(/\.html$/, "");
  if (!/^google[0-9a-f]+$/.test(file)) throw new Error("GOOGLE_SITE_VERIFICATION: the verification file's name, google….html");
  await writeFile(join(dist, `${file}.html`), `google-site-verification: ${file}.html`);
}

// /manual.txt: the guidance as plain text, for an AI whose fetch tool would
// otherwise hand it a small model's summary of the page.
{
  const html = await readFile(join(dist, "index.html"), "utf8");
  const start = html.indexOf('<div class="guide">');
  const end = html.lastIndexOf("</div>", html.indexOf("</main>"));
  if (start < 0 || end < start) throw new Error("index.html: no <div class=\"guide\"> inside <main>");
  await writeFile(join(dist, "manual.txt"), `${manualText(html.slice(start + '<div class="guide">'.length, end), `https://${address}`)}\n`);
}

// Refuses elements it doesn't know, so a new one is a build error rather
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
