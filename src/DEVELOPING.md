# Developing classyQuiz

Where things are, running the site locally, deploying, and the traps.
Setting up an own instance is in the README, "Your own instance". Commands
run in `src/` unless said otherwise.

## Layout

- `quiz/`: the quiz format and its parser, pure: it runs in the browser, on
  Workers and on Node.
- `server/`: game logic, the Durable Objects, and the state Worker's config
  (`server/wrangler.toml`).
- `functions/`: the Pages functions, the `/api` routes.
- `shared/`: the protocol types and the tuned constants (`limits.ts`,
  `tempo.ts`).
- `client/`: the page scripts, plain DOM, bundled per page by esbuild to
  ES2020, since school devices are not always current.
- `public/`: pages and stylesheets; `scripts/`: build, dev, deploy,
  simulate.

Cloudflare-specific code is only in the Durable Object classes and the `/api`
router; the logic they call (`server/game.ts`, `server/images.ts`, `quiz/`,
`shared/`) is platform-free. A school converts the server to its own with an
AI, again for each update (README, "On a school's or company's own server"),
and the local check (`client/open.ts`, `client/opening.ts`) and Solo
(`client/solo.ts`) run that logic in the browser.

The pages' words, in the root page's four languages: `client/landing-text.ts`
(the root page), `client/room-text.ts` (the pages a quiz plays on),
`client/site-text.ts` (both, and the link to `/privacy`),
`client/check-text.ts`, and the tables in `client/own-copy.ts`,
`client/notfound.ts` and `client/privacy.ts`. The server speaks English; the
pages show its messages through `said()` (`client/room-text.ts`), keyed by
their English words, so a new or reworded message shows in English until
translated (`client/room-text.test.ts` lists the missing ones).

- `public/brand/`: copies of `docs/brand/svg/`. A page writes
  `<!--#brand file.svg-->` where the mark goes inline, or
  `<!--#brand-use file.svg-->` with the drawing once at `<!--#brand-defs-->`,
  and `build.mjs` writes it in; opened straight from `public/`, a page shows
  no mark.
- `public/site.css`: the shared look, linked first by every page; in `dist/`
  it is the front of `app.css` and `home.css`, or written into a page
  without either, so there is no `dist/site.css`.
- `public/home.css`: the root page's styles.
- `public/app.css`: one namespace for every app page and `/example`, so a new
  class can pick up an old rule and a bare new rule can land on another page.
- `dist/manual.txt`: the manual as plain text, made by `build.mjs` from the
  built root page; an element it doesn't know fails the build.
- `dist/en/`, `de/`, `fr/`, `it/`: the root page with the words of its
  `data-t` elements and asks from `client/landing-text.ts`, written by
  `build.mjs`.

The site is two Cloudflare deployables. The state Worker
(`classyquiz-state`) holds the Durable Objects (`Instance`, `JoinCode`,
`UploadStats`, `SiteBudget`); Pages can't host Durable Objects. The Pages
project (`classyquiz`) serves `dist/` and the `/api` functions, which reach
the objects through bindings by script name. The Free plan has only
SQLite-backed Durable Objects, so migrations use `new_sqlite_classes`. The
state Worker has no public address. What is logged:
`docs/design/hosting-and-limits.md`, "The plan".

## Toolchain

- Node 22.18 or newer (24 recommended) runs `.ts` directly, so TypeScript is
  limited to erasable syntax (`erasableSyntaxOnly`); `tsc` only checks:
  `npm run check` runs both tsconfigs.
- `npm test`: Node's built-in runner.
- Dev dependencies are pinned to exact versions. Wrangler holds the deploy
  token, and older versions' bundled undici has advisories, one about TLS
  certificate validation.
- The one runtime dependency is `qrcode-generator` (MIT), bundled into the
  projector page. Zip reading uses `DecompressionStream`.
- `npm run build` writes `dist/` (git-ignored), with the site's address
  built in (`SITE_ADDRESS`, `secrets/README.md`).

## Running locally

`npm run dev` builds, starts the state Worker on port 8787, then the site on
8788 (`wrangler pages dev`) and `build.mjs --watch`. Open
http://127.0.0.1:8788. The site finds the objects through wrangler's local
dev registry; started before the state Worker reports "Ready on", it can come
up unable to reach them.

The owner's figures (`docs/design/owner-page.md`) need an `OWNER_KEY`;
locally, put `OWNER_KEY=<any string>` in `src/.dev.vars` (git-ignored) and
open `/owner` and type it.

The simulators play against a running site, local or deployed; each one's
header says what it exercises and how to run it.

- `scripts/simulate.mjs`: a class of bad-Wi-Fi devices; the check that the
  whole flow holds, after changes to the game, the protocol or the
  transport.
- `scripts/simulate-peers.mjs`: a Peers room.
- `scripts/simulate-memory.mjs`: a class whose instance loses its memory,
  after changes to what the instance holds in memory. Going quiet long
  enough to hibernate took 40 s locally; on Cloudflare,
  `docs/design/open-period-in-memory.md`, Situation. A restart command is
  the stop and start of "A second local stack" below, with the same persist
  directories. On Cloudflare a deploy doesn't lose the memory at once (same
  file), so as `--restart` command the run fails; a deploy is crossed with
  `--quiet 90` against a copy of the site, deployed during the first quiet
  spell.

Traps:

- Watch mode does not copy `public/`; after a CSS or HTML change run
  `node scripts/build.mjs` once.
- `wrangler dev` doesn't reload the state Worker when its folders are
  replaced by a fresh copy; restart the stack.
- A stack killed hard can leave a stale registry entry that the next start
  keeps using: every API call fails with "Network connection lost" although
  the bindings read "[connected]". Restarting the site fixes it.
- Right after a start the site's calls to the objects can fail for up to
  about 40 s: wait until `/api/join` stops answering 500, then try one
  upload.
- On Windows, `taskkill /T` on the wrangler node processes stops a stack.
  Stopping only the shell leaves workerd holding the ports; killing only
  workerd makes wrangler start a new one.

## The landing film

`public/js/film.js` and `public/landing/film-*.webp` are built from
`docs/film/build/` (`docs/film/README.md`); `client/film-poster.ts` is
ordinary code. The film draws parts of the site itself, so it is rebuilt
(`py -I docs/film/build/sitebuild.py` from the repo root) when they change:

- the root page's words the film draws, from `client/landing-text.ts` and
  `client/example-files.ts`: `npm test` fails until the rebuild;
- the words of a screen it draws after the upload, quoted in `SITE` in
  `docs/film/build/film.js`: `client/film.test.ts` fails until `SITE` and
  the build follow;
- the film's length (`DUR`), which `public/index.html`'s time bar carries
  too: `sitebuild.py` refuses until both agree;
- the root page's layout or sizes (`makeRootPage` in `film.js`), the
  layout or sequence of a later screen, the avatars (`client/look.ts`), the
  brand files or the pictures it shows (`public/landing/sheet-*.webp`,
  `face-idea-*.webp`, `way-*.svg`): nothing fails, and the film shows the
  old ones.

Then `py -I docs/film/build/sitecheck.py` checks the film in the built site
against `main`'s.

## The root page's examples

The example files in `public/examples/`, `client/example-files.ts` and the
faces `public/landing/face-*.webp` are built from `docs/example/`
(`docs/example/README.md`, "Rebuilding"). The faces are shot from the Solo
screen, so a change to it calls for them too; `npm test` fails while
`example-files.ts` doesn't match the files.

## A second local stack

Wrangler's dev registry is global (`%APPDATA%\xdg.config\.wrangler\registry`)
and keyed by Worker name, so a second stack that keeps the name
`classyquiz-state` overwrites the entry the first stack's site binds to.

- Copy the deployables (`functions`, `server`, `shared`, `quiz`, `dist`,
  both `wrangler.toml`) to a scratch folder and rename the state Worker in
  both tomls, `script_name` in the site's bindings included. The site's name
  can stay; nothing binds to it.
- Use other ports and inspector ports.
- Give the site and the state Worker different `--persist-to` directories;
  with the same one, every Durable Object call fails with "Network
  connection lost".
- Start the site after the state Worker's "Ready on"; a start script that
  waits for it in a log must delete the old log first.
- On the Windows machine, the first start after stopping a stack failed
  three times out of three, even with the site started 10 s after the state
  Worker; stopping both and starting both again worked each time.

## Deploying

`npm run deploy` builds, deploys the state Worker, creates the Pages project
if it doesn't exist, and deploys `dist/`, touching only the two projects
named in the tomls. It reads `../secrets/cloudflare.env` through Node's
`--env-file` (`secrets/README.md`).

- When a Durable Object migration deletes a class the live Pages project
  still binds to, the Worker deploy is refused: deploy Pages first, then the
  Worker.
- After a deploy, pages open in a class keep running the old code until
  reloaded, and objects and functions take up the new code at different
  times (`docs/design/open-period-in-memory.md`); so protocol additions are
  optional, and an object waking on new code reads what the old code stored.
- A file removed from `dist/` stays on the production address from
  Cloudflare's edge cache for up to a week (`s-maxage` 7 days); the
  deployment's own address answers 404 for it. A changed file came back in
  either version for about two minutes after a deploy.
- The live site has answered Python's `urllib` default user agent with 403;
  a Python walk against it sends its own.

## Outside the repo

`.tmp/` at the repo root is git-ignored and survives sessions; earlier
implementers' walks, probes and scripts lie there, unreviewed.
