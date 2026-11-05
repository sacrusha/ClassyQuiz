# Deploy log

## 2026-11-02 — first deploy, https://classyquiz.pages.dev

From commit 356d2ae, Pages deployment 718effa0. Implementer's report, verbatim where it states facts:

- Account held only another project and another Worker; neither was touched. `npm run deploy` created the Worker `classyquiz-state` (no public address) and the Pages project `classyquiz`; the name was free, so the address has no suffix.
- Functions run only on `/api/*` (generated from the functions folder; deployment reports `uses_functions: true`), so pages, scripts and CSS don't count against the Free plan's request budget.
- No log push or observability on the Pages project; the state Worker's observability reads `false` through the API. A live `wrangler tail` could still be attached by someone with account access.
- Durable Object bindings `INSTANCE`, `JOIN`, `PAIR` resolve to `classyquiz-state` in production.
- Security headers present (nosniff, no-referrer, DENY framing, camera/mic/location off). Served from the Zurich edge. `/check`: HTTP 24 ms, WebSocket 72 ms.
- 25-student simulation passed twice against production; a silent device death was detected after 47 s, matching local.
- Headless Edge: fallback with WebSockets broken, offline mid-question, and the nine review-fix checks all pass.
- Root page fetched in full by the implementer's web fetch tool — one data point, not claude.ai's or other AIs' fetchers.
- Difference from local: an unknown path returns 200 with the root page (Pages falls back to root without a `404.html`); harmless, since the root is the join page.
- Left behind: one test quiz that expires on its own; roughly 2,000–3,000 of the day's 100,000 requests used.

Still open after this deploy: school web filters on `*.pages.dev` (check with `/check` on the school network); claude.ai's free tier and the other AIs reading the page; real Android tablets.

## 2026-11-02 — second deploy, 7a0fd6d

Pages deployment b3d103da, state Worker version b05cbebe (migration v2 adds the UploadStats Durable Object). Carries the review fixes, the pruning, the projector tile fix, in-time taps and the upload-attempt counter. Run by the owner from a clean worktree at 7a0fd6d, since the session's permission mode blocks deploys from the assistant.

## 2026-11-02 — third deploy, 984806a

Pages deployment 6dfdcde0, state Worker version 6eb4679a (migration v3 deletes the Pairing class). The redesigned teacher flow. Run by the owner from the clean worktree. Lesson: `npm run deploy` deploys the Worker first, which fails when a migration deletes a class the live Pages project still binds to — deploy Pages first in that case, then the Worker. A fresh self-hoster is unaffected.

## 2026-11-02 — fourth deploy, b244980

Pages deployment fc1f647f, state Worker version 28ec17c1, no migration. Pictures on the screens, answers shuffled at upload, Order: fixed, the as-built /layout.html, and the owner's landing-page copy. Run by the owner from the clean worktree.

## 2026-11-02 — fifth deploy, 5c536d6

Pages deployment 659be631, state Worker version 5ef3adb4 (migration v4 adds the SiteBudget Durable Object). Hardening merged with the picture screens. Run by the owner from the clean worktree. Unverified until the platform refuses: the wording of the allowance-spent state.

## 2026-11-03 — sixth deploy, 844df97

Pages deployment 2fb91b32, state Worker version d59ad472, no migration. Countdown with points for speed and the quiz carrying its tempo; tempo offset with −5/+5; pictures section of the guidance; landing page by attention budget, zip only, /own-copy; the lobby's Start naming the mode; review C fixes. Run by the owner from the clean worktree.

## 2026-11-03 — seventh deploy, 3601d2b

Pages deployment fac1734a, state Worker version 513efd47, no migration. A second teacher device once the class is in; the landing page's third look (one line per quiz, upload wording, foot lines); the guidance says upload. Run by the owner from the clean worktree.

## 2026-11-03 — eighth deploy, c82b402

Pages deployment 0f832b7c, state Worker version e54cd788, no migration. Votes before the answer; answered avatars on the wall. Run by the owner from the clean worktree.

## 2026-11-03 — ninth deploy, 61e8db0

Pages deployment 27590770, state Worker version 2d877175, no migration. Avatars the children dress; pictures as answers. Run by the owner from the clean worktree. Production and main level at 61e8db0 at the close of the session.

## 2026-11-04 — tenth deploy, 56ebf87

Pages deployment 5c49186b, state Worker version 5d6d3cd5, no migration; the Pages project gains the BUDGET binding to SiteBudget. Delivery A — the guidance rewrite cut to the facts, the after-upload flow with the teacher code, the landing page with the strip, two asks and four languages, review D's fixes — plus the avatars' winners band and the steering bar (Play, Last call, the double press; review E). Run by the product-owner session from the clean worktree with the main checkout's credentials file. Untested on a real hand, clicker or phone: the bar's timings, the dashed "on its way" tap.

## 2026-11-04 — eleventh deploy, 3089468

Pages deployment d895b857, state Worker version 5238c33c, no migration (the Worker's toml changed in comments only). The landing's strip as a card to the worked example, Build's wording, Run first when stacked, the labels under their words on phones, `/example` with its stand-in photos and mock conversation (v4 items 10–13), the guidance's enlarge sentences (v4 item 11), and the teacher screens' words: choices, answers and solution on the bar, the check, the menus, the guidance, `/layout` and the format's messages, Countdown for Last call, the guidance's lesson without the steering's mechanics (v1 item 6). Run by the product-owner session from the clean worktree with the main checkout's credentials file. Checked live: the guidance's new lesson paragraph, the bar's labels in the teacher bundle, `/api/site`; one probe upload, deleted at once, counts in the day's upload statistics.

## 2026-11-04 — twelfth deploy, 9f50079

Pages deployment 84080180, state Worker version 51faab5b, no migration (no change under `src/server/` since 3089468). The identity (v4 item 14): the top-hat fox and favicon set on every page, the shared header, one stylesheet for the look, Rubik for the site's own words, ink controls and rust links, the ranking's bars on tracks, a number kept with its word, readable placeholders, the join code kept off the wall's edges, the logo kit in `docs/brand/`. Tested locally by the owner before the deploy. Run by the product-owner session from the clean worktree with the main checkout's credentials file. Checked live: the root page with the drawings after the guidance (43.1 KB), `/favicon.ico` as an icon rather than the root's fallback, the favicon SVG, the header lockup, the Rubik font, `app.css`, the students' `js/play.js` at 40.7 KB, `/api/site`.

## 2026-11-04 — thirteenth deploy, c0d7480

Pages deployment f4182d88, state Worker version 78228a8d, no migration (no change under `src/server/`). The About guidance: "Build with the teacher" rewritten (phases, the first reply in a few lines, presentation through the layout page), the published format narrowed to `quiz.txt` in UTF-8, FAQ-kind information gathered in the first two sections, layout arithmetic and resolution figures dropped. Run by the personal-assistant session from the main checkout. Checked live: the root page (42.8 KB) carries "Build with the teacher" and `quiz.txt`.

## 2026-11-04 — fourteenth deploy, 7d41265

Pages deployment 254580c4, state Worker not changed in `src/server/` (no migration). `/example` shows the owner's real free Claude Sonnet run (one light screenshot) and offers `big-numbers-quiz.zip`, which is also the English example behind "Start the example quiz"; the mock conversation, its light and dark renders and `number-line-quiz.zip` are gone, as is `client/example.ts`. Before the deploy: `npm run check`, `npm test` (97 pass), and the zip's `quiz.txt` through the site's parser (13 questions, no errors or warnings, every picture present). Run by the personal-assistant session from the main checkout. Checked live: `/example`, the picture, the zip byte-identical to the source, `home.js` naming the new zip, the old zip no longer served. The example upload itself was not run live (it books an upload).

## 2026-11-05 — fifteenth deploy, 4bdb527

Pages deployment 939c1743, state Worker version 41ac93b2, no migration. Everything on the server goes 3 hours after the teacher's last use (the instance's 48 hours and the hour after the final ranking become 3 hours; the site-full message in four languages). A real `robots.txt` and a `404.html`: unknown and miscased paths are 404s, no longer the root page with a 200. Questions may have no text (a number alone on its line), with the empty heading hidden on the projector. The owner's rework of the About guidance and the example screenshot. Before the deploy: `npm run check`, `npm test` (99 pass), the build under `wrangler pages dev`. Run by the personal-assistant session from the main checkout. Checked live: `/robots.txt` as `text/plain`, also under a mixed-case host; `/Own-Copy`, `/nonexistent` and `/llms.txt` 404; `/`, `/own-copy`, `/play`, `/layout`, `/example`, `/api/site` 200; the page's three-hour sentence and `home.js`'s site-full wording. Quizzes uploaded before the deploy keep their old alarm and end at it, or at their next activity past three hours. The no-text question was not seen on a projector.
