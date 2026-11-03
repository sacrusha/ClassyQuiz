Quizzes for classes. A website to run classroom quizzes, with AI integration to generate the quizzes from scanned exercises, scribbles, or typed instructions, or assist the creator in generating them themselves.

To run, either use the demo setup at https://classyquiz.pages.dev, or ask an AI to set up your own server. 

For creating quizzes, ask AI to "Help me create a Quiz for https://classyquiz.pages.dev, use the website's guidance. Exercises attached."

## Your own instance

The demo runs on a free plan shared by everyone who uses it. Your own copy runs on a free Cloudflare account. For teachers, https://classyquiz.pages.dev/own-copy describes it without the technical part.

With an AI assistant that can run commands on your computer, e.g. Claude Code: *"Set up my own classyQuiz from https://github.com/sacrusha/ClassyQuiz, following its README."*

For an AI doing this for a teacher: the teacher creates the Cloudflare account and the token (step 3) and chooses the name (step 5); everything else is yours. Tell them where to click, and have them put the token into `secrets/cloudflare.env` themselves rather than into the chat.

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
5. In `src/wrangler.toml`, change `name = "classyquiz"` to a name of your own. Your site's address becomes `<name>.pages.dev`, and the start page names it to the teachers' AIs. If the address turns out different (the name was taken, or you add your own domain), deploy again with `SITE_ADDRESS` set to it in `secrets/cloudflare.env`.
6. In `src/`, run `npm run deploy`. The address is printed at the end.

To try it on your own computer first: `npm run dev` in `src/`, then open http://127.0.0.1:8788.

The demo's limits for a few teachers (players per class, uploads a day, storage) are constants in `src/shared/limits.ts`; raise them for your own copy. Last call's length and the points for speed are in `src/shared/tempo.ts`.

How it is built and why: `docs/`.
