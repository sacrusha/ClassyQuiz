# secrets/

Local credentials. Git ignores everything in this folder except this README
and the .gitignore next to it.

## cloudflare.env — deploying to Cloudflare

Copy the template and fill it in:

    cp src/cloudflare.env.example secrets/cloudflare.env

`npm run deploy` (in src/) reads this file and passes its values to
wrangler and the build as environment variables. Nothing else reads it.

- `CLOUDFLARE_ACCOUNT_ID` — the 32-character account ID. In the Cloudflare
  dashboard, Workers & Pages → Overview, right-hand column; or in the URL
  after `dash.cloudflare.com/`.
- `CLOUDFLARE_API_TOKEN` — an API token (My Profile → API Tokens → Create
  Token → Custom token), limited to that one account, with these
  permissions:
  - Account · Workers Scripts · Edit — the Worker that holds the quiz state
  - Account · Cloudflare Pages · Edit — the site and its address
  - Account · Account Settings · Read — wrangler looks up the account

  No zone permissions are needed: the site uses its default `pages.dev`
  address. A TTL (expiry date) on the token is a good idea.

- `OWNER_KEY` (optional) — the key for the owner's figures,
  `GET /api/site/use` (`docs/design/telemetry.md`, "Who reads it"); any
  long random string of ASCII letters and digits, since it travels in a
  request's header, which carries other letters unreliably. Nothing reads
  it from here: it is set once on the Pages project, from `src/`:

      node --env-file=../secrets/cloudflare.env node_modules/wrangler/bin/wrangler.js pages secret put OWNER_KEY --project-name classyquiz

  (it asks for the value), and takes effect with the next deploy. Kept here
  so the owner has it for reading:
  `curl -H "Authorization: Bearer <key>" https://classyquiz.pages.dev/api/site/use`.

- `SITE_ADDRESS` (optional, not secret) — the site's address when it isn't
  `<name>.pages.dev` with the name in `src/wrangler.toml` (the name was
  taken, or an own domain); the build writes it into the start page.

If the token leaks, roll it in the dashboard (API Tokens → ⋯ → Roll) and put
the new value here.
