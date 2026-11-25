# Deployed

What runs at https://classyquiz.pages.dev, and what of it has been tried
there, for whoever reads a claim about the site and needs to know whether it
holds live. Each deploy's contents and checks are in this file's history
(`git log -p docs/deploy-log.md`); whoever deploys keeps it current
(`src/DEVELOPING.md`, "Deploying").

## Live

- Commit c56a7fc, deployed 2026-11-25: Pages deployment 5582ec12 of the
  project `classyquiz`, version 80fbf97d of the state Worker
  `classyquiz-state`. What the repo has that isn't live:
  `git diff c56a7fc -- src/`.
- Cloudflare's Free plan, on an account whose limits are shared with other
  projects on it.
- Set on the live Pages project, not in the repo: `OWNER_KEY`
  (`secrets/README.md`).
- Checked at the first deploy (2026-11-02): the Pages project has no log
  push, and the state Worker's observability reads `false`.

## Tried live

Each with the last time it was run there; code deployed since may have
changed what it covered.

- The Solo walk through the example quiz at desktop and phone sizes in
  headless Edge, nothing sent while playing, then Quizmaster to `/screen`
  with one upload (2026-11-09, dfdd557).
- `scripts/simulate-peers.mjs --empty`, a probe-marked room: Start's ten
  seconds, a Countdown on a question and on a solution, and the room ending
  by itself 601 s after its final ranking was left (2026-11-19, 9812126).
- `scripts/simulate.mjs` with 25 students, and headless-Edge walks of the
  WebSocket fallback and of going offline mid-question, at the first deploy
  only (2026-11-02). Since then on local stacks, and on 2026-11-09 on a copy
  of the site on the same account (what that copy showed:
  `design/open-period-in-memory.md`, Situation).
- The film played, and its time bar dragged before it loaded, in headless
  Edge at desktop and phone sizes in three languages (2026-11-07); its build
  on the owner's older test phone (2026-11-10; `docs/film/README.md`,
  "Text").
- `/owner` with the key, by the owner (2026-11-09, before the ledger of
  44ee213).
- The root page and its script fetched: the manual as committed, and the
  script with the opening of a quiz's text (2026-11-11, 2aa154c); `/manual.txt`
  and the root page carrying the format's required first line (2026-11-18,
  30520c5).
- Claude Code's WebFetch on the root page, the German ask for the format
  (`design/guidance-page.md`, Situation): the summary gave `/manual.txt`'s
  full address and required the first line verbatim (2026-11-18, 30520c5,
  one run; sixteen on a preview deploy of the same page).
- The sheets example in its four languages, in headless Edge: `/example`
  with its `.zip`, overview and conversation pictures, each quiz read on
  the local check (12 questions) and Solo's start screen; the earlier run's
  `.zip`s answer 404 on the deployment's own address (2026-11-19, 2f56259).
- The layout of text-answer questions (`design/class-and-wall.md`, "How a
  question fills the screen") on Solo's screen in headless Edge at
  1366x768 and on a 360x740 phone: three of the space quiz's questions
  with their pictures and a long word problem, laid out as on the built
  site; `/manual.txt`, `/layout`, `/preview.py`, the sheets example's
  German overview and a root-page face carrying the change, on the
  deployment's address and on the production one (2026-11-19, 8de826b).
- The root page opening on Sheets at 360x640 in English and German in
  headless Edge, the button that opens a file cut by 2 px as on the built
  site; the Test example's `.zip` and face, and `/example?ex=test`,
  answering, the mock's `.zip`s 404; on the deployment's address and on
  the production one (2026-11-19, 721f33f).
- A shared device (`design/class-and-wall.md`, "Sharing a device") in
  headless Edge with touch emulation at 1024x768, over WebSocket, two
  probe-marked quizzes: the check's switch, three places of one animal
  added and one closed and added again in the lobby, two overlapping
  touches pressing two places, no + or × under way and the server refusing
  both, a reload bringing the three back, an unshared quiz's phone
  unchanged; on the deployment's address; the production one served the
  same `play.js`, `screen.js` and `app.css` (2026-11-25, c56a7fc).

## Not tried live

- A class or a crowd: no Quizmaster run with a real second device, no Peers
  room on real phones, no final ranking or Exit with real players; only walks
  and probe-marked rooms.
- Since 8de826b: the new layout on a real projector and real phones, on a
  wall steered in a room and on Peers devices at the spread (which lay the
  question out again), and at other sizes (1920x1080, 1024x768, 1280x800,
  768x1024 and 390x844 on the built site only).
- Since fd6728c and 013c6a9: the Test example's quiz opened on the check
  or played, and `/example?ex=test`'s conversation pictures looked at, on
  the live site (the page and files answered, nothing more).
- Since 2f56259: the film with the new sheets run's words and question on
  the live site (`docs/film/build/sitecheck.py` on a local copy only).
- Since 9812126: Start's ten seconds in a Quizmaster's room (the wall, the
  Remote, the tablets), and a Peers room's screens in a browser (how the
  friends stand, Countdown's button, the link to share); on local stacks
  only. `scripts/simulate-memory.mjs` was not run for it anywhere.
- Real devices other than the owner's older test phone: tablets, phones, a
  clicker, an iPhone's full screen, a phone's pull-to-refresh on `/open`.
- A school's network: its filter on `*.pages.dev`, its Wi-Fi through
  `/check`.
- The AIs: fetchers other than Claude Code's WebFetch on the live page, and
  an AI building against the guidance as it now is.
- A screen reader on any page; the film in dark mode; the film watched
  through by someone outside the project.
- The platform's answers once an allowance is spent.
- A deploy resetting an instance still active 300 s after it
  (`design/open-period-in-memory.md`, Not known).
- An own copy set up end to end by the routes on `/own-copy`.
- Since 44ee213: the owner's page with the key, and on a phone; a lobby
  left to lapse (`LOBBY_WAIT_MS`).
- Since c56a7fc: a shared device on a real iPad or any real tablet, on
  long-poll, at other sizes, and the Remote's switch and a browser's
  remembered choice (all on a local stack only).
- Since 2aa154c: a `.txt` or `.md` quiz and a `.zip` named `.quiz` opened
  on the live site (in headless Edge on the built site only), and on a
  phone whose extractor takes a `.zip`.

The questions these leave are in the design files' "Not known" and the
backlog's "Open: with the owner, and in the field".
