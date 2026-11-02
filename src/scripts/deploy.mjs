// Deploys the site to Cloudflare (Free plan is enough):
//   1. the state Worker with the Durable Objects (server/wrangler.toml),
//   2. the Pages project with the pages and /api functions (wrangler.toml).
//
// Run as `npm run deploy` in src/; it reads ../secrets/cloudflare.env
// (see secrets/README.md). Touches only the Worker and Pages project named in
// the two wrangler.toml files, and creates the Pages project on first use.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const wrangler = join(root, "node_modules", "wrangler", "bin", "wrangler.js");

for (const v of ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"]) {
  if (!process.env[v]) {
    console.error(`${v} is not set. Copy src/cloudflare.env.example to secrets/cloudflare.env and fill it in (secrets/README.md).`);
    process.exit(1);
  }
}

const nameIn = (file) => {
  const m = readFileSync(join(root, file), "utf8").match(/^name\s*=\s*"([^"]+)"/m);
  if (!m) throw new Error(`no name in ${file}`);
  return m[1];
};
const stateWorker = nameIn("server/wrangler.toml");
const project = nameIn("wrangler.toml");

function run(args, opts = {}) {
  console.log(`\n> wrangler ${args.join(" ")}`);
  const r = spawnSync(process.execPath, [wrangler, ...args], { cwd: root, stdio: opts.capture ? "pipe" : "inherit", encoding: "utf8" });
  if (r.status !== 0 && !opts.allowFail) {
    if (opts.capture) console.error(r.stdout, r.stderr);
    process.exit(r.status ?? 1);
  }
  return r;
}

const step = (label) => console.log(`\n=== ${label}`);

step("Build");
const b = spawnSync(process.execPath, [join(root, "scripts", "build.mjs")], { cwd: root, stdio: "inherit" });
if (b.status !== 0) process.exit(b.status ?? 1);

step(`State Worker "${stateWorker}"`);
run(["deploy", "-c", "server/wrangler.toml"]);

step(`Pages project "${project}"`);
const list = run(["pages", "project", "list", "--json"], { capture: true });
let projects = [];
try {
  projects = JSON.parse(list.stdout);
} catch {
  console.error("Couldn't read the list of Pages projects:\n" + list.stdout);
  process.exit(1);
}
const exists = projects.some((p) => (p["Project Name"] ?? p.name) === project);
if (!exists) run(["pages", "project", "create", project, "--production-branch", "main"]);
run(["pages", "deploy", "dist", "--project-name", project, "--branch", "main", "--commit-dirty=true"]);

console.log(`\nDone. The site's address is shown above (https://${project}.pages.dev unless that name was taken).`);
