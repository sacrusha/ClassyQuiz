// Builds the static site into dist/: the pages and stylesheet from public/,
// and one bundled script per page from client/. The /api functions are
// bundled by wrangler itself.
//
//   node scripts/build.mjs           build once
//   node scripts/build.mjs --watch   rebuild on change (local development)

import { build, context } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const watch = process.argv.includes("--watch");
const pages = ["home", "teach", "screen", "play", "check", "example"];

// Security headers for every page; scripts are revalidated so a deploy shows
// up on the next load. A font is kept a year: its file name carries the
// font's version, so a new font is a new name.
//
// The Content-Security-Policy is a second layer behind escaping: quiz text is
// the teacher's AI's, shown on every screen of the class, and a slip in any
// page that builds HTML from it must not run as script. Scripts only from the
// site's own files; pictures also as blob: (the projector fetches the quiz's
// pictures into object URLs). Styles stay open (the pages set many inline),
// and so do WebSocket addresses: matching wss: by 'self' is uneven on the
// older browsers school devices run.
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
