# Deployed

What runs at https://classyquiz.pages.dev, and what of it has been tried
there, for whoever reads a claim about the site and needs to know whether it
holds live. Each deploy's contents and checks are in this file's history
(`git log -p docs/deploy-log.md`); whoever deploys keeps it current
(`src/DEVELOPING.md`, "Deploying").

## Live

- Commit 874e708, deployed 2026-11-10: Pages deployment fc6a7fe1 of the
  project `classyquiz`, version a03d3812 of the state Worker
  `classyquiz-state`. What the repo has that isn't live:
  `git diff 874e708 -- src/`.
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
- `scripts/simulate-peers.mjs`, a probe-marked room (2026-11-10, 44ee213).
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

## Not tried live

- A class or a crowd: no Quizmaster run with a real second device, no Peers
  room on real phones, no final ranking or Exit with real players; only walks
  and probe-marked rooms.
- Real devices other than the owner's older test phone: tablets, phones, a
  clicker, an iPhone's full screen, a phone's pull-to-refresh on `/open`.
- A school's network: its filter on `*.pages.dev`, its Wi-Fi through
  `/check`.
- The AIs: their fetchers on the live page (one fetch by an implementer's
  tool at the first deploy), and an AI building against the guidance as it
  now is.
- A screen reader on any page; the film in dark mode; the film watched
  through by someone outside the project.
- The platform's answers once an allowance is spent.
- A deploy resetting an instance still active 300 s after it
  (`design/open-period-in-memory.md`, Not known).
- An own copy set up end to end by the routes on `/own-copy`.
- Since 44ee213: the owner's page with the key, and on a phone; a lobby
  left to lapse (`LOBBY_WAIT_MS`).

The questions these leave are in the design files' "Not known" and the
backlog's "Open: with the owner, and in the field".
