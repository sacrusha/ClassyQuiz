# secrets/

Local credentials. Git ignores everything here except this README and the
.gitignore.

## cloudflare.env

    cp src/cloudflare.env.example secrets/cloudflare.env

`npm run deploy` (in src/) reads it and passes its values to wrangler and the
build as environment variables.

- `CLOUDFLARE_ACCOUNT_ID`: the 32-character account ID (Workers & Pages →
  Overview, right-hand column; or the URL after `dash.cloudflare.com/`).
- `CLOUDFLARE_API_TOKEN`: a custom API token (My Profile → API Tokens),
  limited to that account, with:
  - Account · Workers Scripts · Edit: the Worker that holds the quiz state
  - Account · Cloudflare Pages · Edit: the site and its address
  - Account · Account Settings · Read: wrangler looks up the account

  No zone permissions: the site uses its default `pages.dev` address. If the
  token leaks, roll it (API Tokens → ⋯ → Roll) and put the new value here.
- `OWNER_KEY` (optional): the key for the owner's figures,
  `GET /api/site/use` (`docs/design/telemetry.md`). ASCII letters and
  digits only, since it travels in a request header. The deploy doesn't
  read it from here; it is set once on the Pages project, from `src/`, and
  takes effect with the next deploy:

      node --env-file=../secrets/cloudflare.env node_modules/wrangler/bin/wrangler.js pages secret put OWNER_KEY --project-name classyquiz

  Kept here for reading the figures:
  `curl -H "Authorization: Bearer <key>" https://classyquiz.pages.dev/api/site/use`.
- `SITE_ADDRESS` (optional, not secret): the site's address when it isn't
  `<name>.pages.dev` with the name in `src/wrangler.toml`; the build writes
  it into the start page.
- `GOOGLE_SITE_VERIFICATION` (optional, not secret): the name of the file
  Google Search Console hands out to verify the address, `google….html`;
  the build serves it.
