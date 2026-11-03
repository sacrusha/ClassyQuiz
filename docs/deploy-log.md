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
