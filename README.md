<h1><picture><source media="(prefers-color-scheme: dark)" srcset="src/public/brand/classyquiz-horizontal-colour-dark.svg"><img src="src/public/brand/classyquiz-horizontal-colour.svg" alt="classyQuiz" height="72"></picture></h1>

Quizzes for classes. A website to run classroom quizzes, with AI integration to generate the quizzes from scanned exercises, scribbles, or typed instructions, or assist the creator in generating them themselves.

![A question on the class's projector: the four answers, how many chose each, the right one marked, and the class's avatars across the top](src/public/landing/wall-en.webp)

To run, either use the demo setup at https://classyquiz.pages.dev, or ask an AI to set up your own server. 

For creating quizzes, ask AI to "Read https://classyquiz.pages.dev. Help me create a classyQuiz from the attached exercises."

## Your own instance

The demo runs on a free plan shared by everyone who uses it. Your own copy runs on a free Cloudflare account. For teachers, https://classyquiz.pages.dev/own-copy describes it without the technical part.

With an AI assistant that runs commands, in a cloud VM (Claude Code on the web) or on your computer: *"Set up my own classyQuiz from https://github.com/sacrusha/ClassyQuiz, following its README."*

For an AI doing this for a teacher: the teacher creates the Cloudflare account and the token (step 3) and chooses the name (step 5); everything else is yours. Tell them where to click. The token never goes into the chat: tell them how to hand it over without it (on the teacher's own computer, `secrets/cloudflare.env`; on a cloud VM of yours, whatever way it offers). On their own computer you explain each step and they run it.

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

The demo's limits for a few teachers (players per class, uploads a day, storage, the rows a day its classes may book) are constants in `src/shared/limits.ts`; raise them for your own copy. Countdown's length and the points for speed are in `src/shared/tempo.ts`.

### On your school's own server

A school that would rather not use an outside service can run classyQuiz on its own server. The code as published runs on Cloudflare. It is written to be convertible, so that an AI can read it and convert it to another server, and the conversion is the school's. With an AI that runs programs, such as Claude Code: *"Convert classyQuiz from https://github.com/sacrusha/ClassyQuiz to run on our own server, following its README section 'On your school's own server'."*

- **What changes.** The Cloudflare-specific code is the Durable Objects in `src/server/` (`instance.ts`, `directory.ts`, `budget.ts`, `stats.ts`, exported by `worker.ts`: storage, alarms, hibernating WebSockets) and the `/api` routes in `src/functions/api/[[path]].ts`, listed at its top. The game, picture handling, the quiz format (`src/server/game.ts`, `images.ts`, `src/quiz/`, `src/shared/`) and the browser side stay as they are. The browser speaks HTTP and WebSocket to `/api`, with the messages in `src/shared/protocol.ts`.
- **What a converted copy keeps.** A quiz is deleted when the teacher ends it or three hours after the teacher last used it (`INSTANCE_IDLE_MS`), and no request is logged with an IP address (`docs/design/hosting-and-limits.md`, "What lives, and for how long"). The limits in `src/shared/limits.ts` are the demo's; raise them. Serve it over HTTPS: without it, tablets can't keep the screen awake.
- **The guidance the teachers' AIs read.** Before writing a quiz, a teacher's AI reads the start page's guidance, at the address the start page names (the Build step). It can't reach an address inside the school, and the live demo's guidance moves on with newer versions, whose quizzes an older copy may not read. So the start page has to name an address outside the school that serves the guidance of this copy's own version.
- **Done** when `npm test` passes in `src/` and `node scripts/simulate.mjs <your address>` passes against the converted server: a class of 25 on bad Wi-Fi, checked for answers lost or counted twice.
- **Updates are a choice.** A copy changes only when it is updated, so converting once and leaving it is a way to run it: the same screens every lesson. To take an update, convert again from the newer code. The Cloudflare-specific code stays in the files above, so converting again stays the same job.

How it is built and why: `docs/`.
