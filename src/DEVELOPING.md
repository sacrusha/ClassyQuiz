# Developing classyQuiz

For whoever changes the code: where things are, how to run the site on your own
computer, how a change reaches Cloudflare, and the traps that cost earlier
implementers time. Setting up your own instance (account, token, name, first
deploy) is in the README, "Your own instance"; it is not repeated here. What the
site is for and what it must withstand is in `docs/backlog.md` (Project,
Constraints); the screens are in `docs/user-flow.md`.

All commands run in `src/` unless said otherwise.

## Layout

- `quiz/`: the quiz format and its parser. Pure, so it runs unchanged in the
  browser, on Workers and on Node.
- `server/`: game logic and the Durable Objects, and the state Worker's config
  (`server/wrangler.toml`).
- `functions/`: the Pages functions, the `/api` routes.
- `shared/`: the protocol types and the constants that are tuned (`limits.ts`,
  `tempo.ts`).
- `client/`: the page scripts, plain DOM without a framework, bundled per page
  by esbuild to ES2020 because school devices are not always current.
- `public/`: pages and stylesheet; `scripts/`: build, dev, deploy, simulate.
- `public/brand/`: the mark. A page writes `<!--#brand file.svg-->` where
  the mark goes inline and `build.mjs` writes the file in; a script imports
  the file as text (`client/brand.d.ts`). Opened straight from `public/`, a
  page shows no mark. Which file goes where: `docs/design/identity.md`.

The site is two Cloudflare deployables. The state Worker (`classyquiz-state`)
holds the Durable Objects (`Instance`, `JoinCode`, `UploadStats`, `SiteBudget`).
The Pages project (`classyquiz`) serves `dist/` and the `/api` functions, which
reach the objects through bindings by script name. Pages cannot host Durable
Objects itself, hence the split. Only SQLite-backed Durable Objects exist on the
Free plan, so migrations in `server/wrangler.toml` use `new_sqlite_classes`.
The state Worker has observability off and no public address.

## Toolchain

- TypeScript is restricted to syntax Node can strip (`erasableSyntaxOnly`): Node
  runs `.ts` directly, and `tsc` only checks. Node 22.18 or newer; 24 is
  recommended.
- Tests use Node's built-in runner: `npm test` (the parser, game logic, and
  some client logic). A test pins a promise the design docs make, not an
  implementation detail, the language or the runtime: anything else breaks on
  harmless changes and reads as cover it doesn't give. A feature that
  shouldn't exist is removed, not tested for staying off.
- A comment says what the code can't: a reason, a trap, an invariant, a
  pointer to a design doc. Where a decision came from is git's.
- `npm run check` runs both tsconfigs (`tsconfig.json` for client, shared and
  quiz; `tsconfig.server.json` for the rest).
- Dev dependencies (`wrangler`, `esbuild`, `typescript`,
  `@cloudflare/workers-types`) are pinned to exact versions, and a version is
  taken once it is at least two weeks old. Wrangler is the exception on purpose:
  it is the tool that holds the deploy token, and the older versions' bundled
  undici carries advisories, one of them about TLS certificate validation.
- The one runtime dependency is `qrcode-generator` (MIT, no dependencies of its
  own), bundled into the projector page: a QR encoder is too error-prone to
  hand-write. Zip reading in the browser uses `DecompressionStream`, no library.
- `npm run build` writes `dist/` (git-ignored). `SITE_ADDRESS` overrides the
  address built into the pages; otherwise it is derived from the `name` in
  `wrangler.toml`.

## Running locally

`npm run dev` builds, starts the state Worker on port 8787, then the site on
8788 (`wrangler pages dev`) and `build.mjs --watch`. Open
http://127.0.0.1:8788. The site starts only after the state Worker reports
"Ready on"; started together, it can come up unable to reach the Durable
Objects. The site finds the objects through wrangler's local dev registry, the
way it finds them by script name when deployed.

`node scripts/simulate.mjs [base-url] [players] [--all-poll] [--speed]` plays a
class of bad-Wi-Fi devices against a running site, local or deployed. Its header
comment says what it exercises. It is the check that the whole flow holds; run
it after changes to the game, the protocol or the transport.

Things that bite:

- Watch mode does not copy `public/`. After a CSS or HTML change run
  `node scripts/build.mjs` once.
- `wrangler dev` does not reload the state Worker when its folders are replaced
  by a fresh copy. Restart the stack after copying server code.
- A stack killed hard can leave a stale entry in wrangler's registry, which the
  next start keeps using; every API call then fails with "Network connection
  lost" although the bindings read "[connected]". Restarting the site fixes it.
- Right after a start the site's calls to the objects can fail for up to about
  40 s. A probe should wait until `/api/join` stops answering 500, then try one
  upload before relying on a walk.
- On Windows, `taskkill /T` on the wrangler node processes stops a stack.
  Stopping only the shell leaves workerd holding the ports; killing only workerd
  makes wrangler start a new one.

## A second local stack

For a second developer or agent beside the main stack. Wrangler's dev registry
is global (`%APPDATA%\xdg.config\.wrangler\registry`) and keyed by Worker name,
so a second stack that keeps the name `classyquiz-state` overwrites the entry
the first stack's site binds to. (Inferred from the registry's layout, then
confirmed by collisions between stacks.)

- Copy the deployables (`functions`, `server`, `shared`, `quiz`, `dist`, both
  `wrangler.toml`) to a scratch folder and rename the state Worker in both
  tomls, e.g. `classyquiz-state-images`, including `script_name` in the site's
  bindings. The site's name `classyquiz` can stay shared; nothing binds to it.
- Use other ports (past ones: 8817/8818, 8827/8828, 8837/8838) and other
  inspector ports.
- Give the site and the state Worker different `--persist-to` directories. With
  the same one, every Durable Object call from the site fails with "Network
  connection lost".
- Start the site after the state Worker's "Ready on". A start script that waits
  for it in a log must delete the old log first.
- The first start after stopping a stack failed three times out of three on the
  Windows machine even with the site started 10 s after the state Worker.
  Stopping both and starting both again worked each time.

## Deploying

`npm run deploy` builds, deploys the state Worker, creates the Pages project if
it does not exist, and deploys `dist/`. It reads `../secrets/cloudflare.env`
(`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, optional `SITE_ADDRESS`;
template `src/cloudflare.env.example`, details `secrets/README.md`) through
Node's `--env-file`. It touches only the two projects named in the tomls.

Deploy order matters when a Durable Object migration deletes a class that the
live Pages project still binds to: the script deploys the Worker first, which is
then refused. In that case deploy Pages first (the new pages no longer bind the
class), then the Worker. A fresh instance is unaffected.

Protocol additions are made optional so pages open in a class during a deploy
keep working until reloaded.

`docs/deploy-log.md` records what is deployed.

## Tooling kept on disk, outside the repo

`E:\Projects\classyQuiz\.tmp\` on the owner's machine is git-ignored and
survives sessions (the session scratchpad does not). None of it is reviewed for
the repo; read a script before running it. Directories there:

- `shots-tool/`: headless-browser (Edge, puppeteer) walks that earlier
  implementers built on, scripts only, no screenshots. Puppeteer hangs when
  evaluating in a tab whose window has another tab in front; call
  `bringToFront()` first.
- `stacks/<name>/`: per-implementer scripts for starting and stopping a second
  local stack (`after-upload`, `fixc`, `flow`, `hard`, `identity`, `landing`,
  `lp`, `lp3`, `owner5`, `pics`, `stack`, `tempo-bar`, `v3`, `winners`).
- `identity/kit/`: the logo kit. `guidelines.md` is its entry point (the
  drawings, clear space, minimum sizes, colours, which file on which
  ground); `svg/`, `png/` and `web/` hold every version, `work/` the Python
  that builds them (`python -I work/build_kit.py`). `src/public/brand/` and
  the icons at the site's root are copies of its files.
- `sim-diag/`: the instrumented simulation used to chase a score mismatch,
  since designed out (`docs/design/question-flow.md`, "When a tap counts").
- `picture-answers/`: the generated test zip and its generator.
- `samples/`: the owner's number-line zip.
- `example/conversation/`: the worked example's conversation as HTML and
  `render.mjs`, which renders it to the light and dark pictures in
  `public/examples/`; `fake_photos.py`, the stand-in photographs
  (`docs/design/example-page.md`). `example/sheet/` makes the sheet.
- `avatars-prototype/`, `avatars-pass/`.
- Other working folders from past sessions: `ExampleSheets`, `ai-tests`,
  `dryrun`, `example`, `fnb3`, `fnbuild`, `guidance-runs`, `mock`, `review-d`,
  `session-2026-11-03`, `spike`, `winners-jump`, plus loose logs and probes.
