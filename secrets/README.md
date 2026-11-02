# secrets/

Local credentials. Git ignores everything in this folder except this README
and the .gitignore next to it.

## cloudflare.env — deploying to Cloudflare

Copy the template and fill it in:

    cp src/cloudflare.env.example secrets/cloudflare.env

`npm run deploy` (in src/) reads this file and passes the two values to
wrangler as environment variables. Nothing else reads it.

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

If the token leaks, roll it in the dashboard (API Tokens → ⋯ → Roll) and put
the new value here.
