// Local development: the state Worker and the site, as on Cloudflare, with
// the client rebuilt on change. Open http://localhost:8788. DEVELOPING.md,
// "Running locally".

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const wrangler = join(root, "node_modules", ".bin", process.platform === "win32" ? "wrangler.cmd" : "wrangler");
const procs = [];

function run(name, cmd, args, cwd, onLine = () => {}) {
  // Windows runs .cmd shims only through a shell; quote the path for it.
  const viaShell = cmd.endsWith(".cmd");
  const p = spawn(viaShell ? `"${cmd}"` : cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"], shell: viaShell });
  const tag = (line) => `[${name}] ${line}`;
  for (const s of [p.stdout, p.stderr]) {
    let buf = "";
    s.on("data", (d) => {
      buf += d;
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const l of lines) {
        if (!l.trim()) continue;
        console.log(tag(l));
        onLine(l);
      }
    });
  }
  p.on("exit", (code) => {
    console.log(tag(`exited (${code})`));
    for (const q of procs) q.kill();
    process.exit(code ?? 1);
  });
  procs.push(p);
  return p;
}

const build = spawn(process.execPath, [join(root, "scripts", "build.mjs")], { cwd: root, stdio: "inherit" });
build.on("exit", (code) => {
  if (code !== 0) process.exit(code ?? 1);
  // The site starts once the state Worker is ready; started together, the
  // site could come up unable to reach the Durable Objects.
  let siteStarted = false;
  run("state", wrangler, ["dev", "-c", "server/wrangler.toml", "--port", "8787", "--inspector-port", "9229"], root, (line) => {
    if (siteStarted || !/Ready on/.test(line)) return;
    siteStarted = true;
    run("site", wrangler, ["pages", "dev", "--port", "8788", "--inspector-port", "9230"], root);
    run("build", process.execPath, [join(root, "scripts", "build.mjs"), "--watch"], root);
  });
});

process.on("SIGINT", () => {
  for (const p of procs) p.kill();
  process.exit(0);
});
