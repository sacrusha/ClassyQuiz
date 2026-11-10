# Developing classyQuiz

For whoever changes the code: where things are, how to run the site on your own
computer, how a change reaches Cloudflare, and the traps that cost earlier
implementers time. Setting up your own instance (account, token, name, first
deploy) is in the README, "Your own instance"; it is not repeated here. What the
site is for and what it must withstand is in `docs/backlog.md` (Project,
Constraints); what each part of the site is for, in `docs/design/`.

All commands run in `src/` unless said otherwise.

## Layout

- `quiz/`: the quiz format and its parser. Pure, so it runs unchanged in the
  browser, on Workers and on Node.
- `server/`: game logic and the Durable Objects, and the state Worker's config
  (`server/wrangler.toml`).
- `functions/`: the Pages functions, the `/api` routes.
- The Cloudflare-specific code stays in the Durable Object classes and the
  `/api` router, with the logic they call kept pure (`server/game.ts`,
  `server/images.ts`, `quiz/`, `shared/`). A school converts the server to its
  own with an AI, and converts again to take an update (README, "On a
  school's or company's own server"); code that spreads the platform further makes every
  conversion bigger. The local check (`client/open.ts`, `client/opening.ts`)
  runs `quiz/`, `server/images.ts` (`matchImages`) and `server/game.ts` (the
  fixes) in the browser, to check a quiz as the server will before anything
  goes up, and Solo plays a quiz on `server/game.ts` there
  (`client/solo.ts`); they stay free of platform code for that too.
- `shared/`: the protocol types and the constants that are tuned (`limits.ts`,
  `tempo.ts`).
- `client/`: the page scripts, plain DOM without a framework, bundled per page
  by esbuild to ES2020 because school devices are not always current.
- `public/`: pages and stylesheet; `scripts/`: build, dev, deploy, simulate.
- `public/brand/`: the mark, copies of `docs/brand/svg/` (the masters, their
  rules and the scripts that draw them). A page writes `<!--#brand file.svg-->`
  where the mark goes inline, or `<!--#brand-use file.svg-->` with the
  drawing once at `<!--#brand-defs-->`, and `build.mjs` writes it in. Opened
  straight from `public/`, a page shows no mark. Which file goes where:
  `docs/design/identity.md`.
- `public/site.css`: the shared look. Every page links it first; in `dist/`
  it is the front of `app.css`, or written into a page without `app.css`
  (`build.mjs`), so there is no `dist/site.css`.
- `public/app.css`: one namespace for every app page and `/example`, so a
  new class can pick up an old rule (`.device` is the network check's line)
  and a bare new rule can land on another page (`docs/backlog.md`,
  Housekeeping).

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
  `@cloudflare/workers-types`) are pinned to exact versions. Wrangler is kept
  current: it is the tool that holds the deploy token, and the older versions'
  bundled undici carries advisories, one of them about TLS certificate
  validation.
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

`GET /api/site/use`, the owner's figures (`docs/design/telemetry.md`),
answers 404 unless the site has an `OWNER_KEY`; locally, put
`OWNER_KEY=<any string>` in `src/.dev.vars` (git-ignored), which
`wrangler pages dev` reads, and send it as `Authorization: Bearer <key>`,
or open `/owner` and type the key (`docs/design/owner-page.md`).

`node scripts/simulate.mjs [base-url] [players] [--all-poll] [--speed]` plays a
class of bad-Wi-Fi devices against a running site, local or deployed. Its header
comment says what it exercises. It is the check that the whole flow holds; run
it after changes to the game, the protocol or the transport.
`node scripts/simulate-peers.mjs [base-url]` is the same for a Peers room
(`docs/design/peers.md`): friends, nobody steering, a phone going silent;
about two minutes, most of it waiting for that phone to count as away and
for a held poll's end.
`node scripts/simulate-memory.mjs [base-url] --restart "<command>"` (or
`--quiet <seconds>`) plays a small class whose instance loses its memory
in the lobby and with each question open, by the command (one that
restarts the local state Worker in place, keeping its `--persist-to`) or
by going quiet long enough to hibernate (40 s does it locally, 90 s on
Cloudflare, where 20 s didn't); it fails when the memory wasn't in fact
lost, as a quiet spell too short leaves it (3 s does locally). Run it
after changes to what the instance holds in memory
(`docs/design/open-period-in-memory.md`). A local stack restarted in place
is the stop and start of "A second local stack" below, with the same
persist directories. On Cloudflare a deploy is no such command: a running
instance takes up new code when it next hibernates, or resets 300 s after
the deploy if still active (`open-period-in-memory.md`, Situation), and
the script stands still while its command runs, so the run fails as
"nothing was tested there". A deploy's crossing is `--quiet 90` against a
copy of the site, with the copy deployed during the first quiet spell;
the reset at 300 s the script can't make there.

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

## The landing film

The film on the root page is built from its source in `docs/film/build/`
(`film.js` and the Python that builds and checks it); what it is for and how
it is made is `docs/film/README.md`. Generated from that source, and not to
be edited by hand: `public/js/film.js` and the pictures
`public/landing/film-*.webp` (the poster frames).
The page side, `client/film-poster.ts`, is ordinary code.

Rebuild with `py -I docs/film/build/sitebuild.py` (from the repo root;
`--no-poster` writes `film.js` only, without the pictures) when:

- `docs/film/build/film.js` changes;
- `client/landing-text.ts` changes the example ask or the words of the
  root page's first screen, which the film draws (`ask`, `code`, `what`,
  `wayQuizmaster`, `wayPeers`, `waySolo`, `getH`, `gives`, `run`,
  `upload`, `drop`, `noQuiz`, `tryIt`, `more`, `reading`), the chapters'
  names (`capSheet` … `capTap`; `capAi` is also the AI app's name on the
  phone) or the player's (`play`, `pause`, `speed`,
  `seek`): the film shows them as they were at its build, and `npm test`
  fails until it is rebuilt;
- the root page's first screen changes its layout or its sizes: the film
  draws it from them (`makeRootPage` in `docs/film/build/film.js`), by
  hand, and nothing fails; the film shows the page as it was;
- a screen the film draws after the upload changes its words (the local
  check and its entries, the lobby's check, the second device's question,
  the wall before anyone is let in, the Remote's buttons): the film quotes
  them in `SITE` in `docs/film/build/film.js`, and `client/film.test.ts`
  fails until that and the build follow; a screen that changes its layout
  or its sequence fails nothing, and the film shows the old one;
- the film's length (`DUR`) changes: `public/index.html`'s time bar carries
  it too, and `sitebuild.py` refuses to build until both agree;
- `client/look.ts` changes the avatars, which the film draws; no test
  catches this;
- the brand files or `public/landing/sheet-*.webp` change: the film shows
  them, and its pictures carry them.

Then `py -I docs/film/build/sitecheck.py`: it builds the working tree's site
and `main`'s in `.tmp/sitecheck/`, serves both with the site's headers and
checks the film in Edge, desktop and phone; it ends with "no problems" or
lists them. Its header says what it checks.

The scripts need Python 3 with Playwright for Python and Pillow, and the
installed Microsoft Edge (they launch it; no browser of Playwright's own is
needed); `sitecheck.py` also needs Node, npm and git. What they write goes to
`.tmp/film/` and `.tmp/sitecheck/` at the repo root.

## A second local stack

For a second developer or agent beside the main stack. Wrangler's dev registry
is global (`%APPDATA%\xdg.config\.wrangler\registry`) and keyed by Worker name,
so a second stack that keeps the name `classyquiz-state` overwrites the entry
the first stack's site binds to.

- Copy the deployables (`functions`, `server`, `shared`, `quiz`, `dist`, both
  `wrangler.toml`) to a scratch folder and rename the state Worker in both
  tomls, e.g. `classyquiz-state-images`, including `script_name` in the site's
  bindings. The site's name `classyquiz` can stay shared; nothing binds to it.
- Use other ports and other inspector ports.
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
keep working until reloaded. The same holds between the Pages functions and
the Durable Objects, and between the objects: the functions are the new ones
at once, while a running object keeps its code until it hibernates, for up to
300 s (`docs/design/open-period-in-memory.md`, Situation), so a call to a
method or an argument the previous code lacks meets that code meanwhile. An
object waking on the new code reads what the previous code stored and put on
its sockets.

A file removed from `dist/` is still served on the production address from
Cloudflare's edge cache for up to a week (`s-maxage` 7 days, seen on removed
pictures); the deployment's own address answers 404 for it, so that is where
a removal is checked.

`docs/deploy-log.md` is the present, what is live and what of it has been
tried there; each deploy's record is git's. So whoever deploys updates it
in the same session ("Live" replaced, what the deploy's checks ran live
under "Tried live", what it brought that nothing ran live under "Not tried
live") and writes what the deploy carried and what was checked in that
commit's message.

## Tooling kept on disk, outside the repo

`.tmp/` at the repo root on the owner's machine is git-ignored and survives
sessions (the session scratchpad does not); earlier implementers' walks,
probes and second-stack scripts lie there. None of it is reviewed; read a
script before running it.
