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
