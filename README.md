Quizzes for classes. A website to run classroom quizzes, with AI integration to generate the quizzes from scanned exercises, scribbles, or typed instructions, or assist the creator in generating them themselves.

To run, either use the demo setup at https://classyquiz.pages.dev, or ask an AI to set up your own server. 

For creating quizzes, ask AI to "Help me create a Quiz for https://classyquiz.pages.dev, use the website's guidance. Exercises attached."

## Your own instance

The demo runs on a free plan meant for a few teachers. Your own copy runs on a free Cloudflare account and takes five to ten minutes to set up.

With an AI assistant that can run commands on your computer, e.g. Claude Code: *"Set up my own classyQuiz from https://github.com/sacrusha/ClassyQuiz, following its README."*

By hand:

1. Install [Node.js](https://nodejs.org) 22.18 or newer (24 recommended) and git, and create a free [Cloudflare account](https://dash.cloudflare.com/sign-up).
2. Get the code and its tools:
   ```
   git clone https://github.com/sacrusha/ClassyQuiz.git
   cd ClassyQuiz/src
   npm install
   ```
3. In the Cloudflare dashboard, create an API token (My Profile → API Tokens → Create Token → Custom token), limited to your account, with the permissions *Account · Workers Scripts · Edit*, *Account · Cloudflare Pages · Edit* and *Account · Account Settings · Read*.
4. Copy `src/cloudflare.env.example` to `secrets/cloudflare.env` and fill in your account ID and the token (details in `secrets/README.md`).
5. In `src/wrangler.toml`, change `name = "classyquiz"` to a name of your own. Your site's address becomes `<name>.pages.dev`.
6. In `src/`, run `npm run deploy`. The address is printed at the end.

To try it on your own computer first: `npm run dev` in `src/`, then open http://127.0.0.1:8788.

How it is built and why: `docs/`.
