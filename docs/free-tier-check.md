# Free-tier check: one sitting, two questions

For the owner, with a free claude.ai account, with its owner. Written to be followed
from a phone. Feeds the backlog's v4 dated-tier pattern, v4 item 4 (own copy)
and v1 item 16 step 1.

1. **Does free Claude make a working .zip with pictures** from the live site's
   guidance and a photographed sheet? The zip is the artifact to keep.
2. **Does free Claude, through its own sandbox, put an own copy online** from
   the /own-copy prompt? How long, or where does it stall?

You are the teacher, not the tester. Type what is written here, do what the AI
asks of a teacher, and stop where this page says stop. Don't help it along
from what you know.

## Before the day

- Start only when delivery A (landing and guidance) is logged live in
  docs/deploy-log.md. Every fetch of the root from claude.ai caches that
  day's page, so part 1 gets one fetch's worth: no second chat for it.
- Print .tmp/example/sheet/sheet.pdf (two pages). Photograph each page with
  the phone, as a teacher would.
- The account's owner knows what runs on their account, and that a Cloudflare token
  gets pasted into their chat. Sit down when they haven't used Claude for a
  few hours (Settings, Usage). A usage limit hit is a result: write down when
  and where.
- Part 2: a throwaway email and a new free Cloudflare account, no card
  (dash.cloudflare.com/sign-up). Note how long that took. Choose a site name
  that is surely free, e.g. cqcheck plus five random digits. Nothing personal
  anywhere.
- A phone clock. Screenshot every error.

## Record first

- Date. Plan (it must say Free).
- The model as the chat shows it, exactly.
- Memory or preferences switched on in the account? Note it.

## Part 1: the zip

New chat, not in a Project. Leave the model picker alone.

**1a.** Attach both photos and ask as a teacher would, in your own words: the
site (classyquiz.pages.dev), which exercises (no. 1, 3 and 4), your class (5th
grade), how many questions (about 10), the language (English). Write down the
words you used.

Write down: time sent, time the answer was complete, whether it fetched the
site or guessed, and what it handed back (a .zip, a link, an artifact, text
only, or a question). If it asks a question, answer briefly, once, as a
teacher would.

**1b.** If it gave a .zip, download it, then ask once, in your own words, for
the number lines as pictures in the questions and pictures to tap as the
answers in the last three questions.

If 1a's zip already has picture answers, skip 1b and note that. Download the
new zip. Keep both, named with date and step.

**1c.** Upload each zip at classyquiz.pages.dev as a teacher would.

**Through**, all of it: a real .zip came out of Claude; the site takes it; the
first screen after upload lists the questions; pictures show in the questions,
and after 1b the last three have pictures as answers. If a second device is at
hand, play one question.

**Partly**, say which: zip without pictures; pictures only after 1b; upload
refused (copy the site's message, hand it to Claude once as it stands, upload
again; a second refusal ends it); wrong or missing keys (note which).

**Not through:** no zip (text, artifact, link, "I can't create files"). Copy
what it gave. Don't paste the guidance for it; that is another test. If file
creation looks switched off in the account, say so and stop. Don't change the
account's settings.

Stop part 1 at: the end of 1c, a second failure at the same step, or 30
minutes.

## Part 2: the own copy

**New chat**, so it starts cold. Start the clock. Type exactly (this one is the
site's own prompt, the thing under test):

> Please set up my own copy of classyQuiz from https://github.com/sacrusha/ClassyQuiz on a free Cloudflare account, following its README. Tell me each step I have to do myself.

Do what it asks of a teacher, and nothing more:
- Yes: the account ID, the token with the permissions it names (give it a
  one-day expiry), the site name. Paste the token into the chat only if the AI
  gives no other place; note that it didn't.
- Yes: a click in claude.ai's own settings that it tells you to make. Write it
  down as "needed a setting change: which".
- No: installing, running or opening anything on your computer. Stop and
  record "asked me to run something myself".
- Pasting an error back to it: once per error, as it stands. The same step
  failing twice ends the part.

Write a time of day for each:
- sent; first reply; first request to you
- GitHub reached
- Node and npm packages installed
- Cloudflare reached from its sandbox (the likeliest place to stall)
- token accepted; name accepted
- deploy ran; address printed
- the minutes spent on your own jobs, counted apart

**Through:** it prints an address, the root opens on the phone, you upload the
part-1 zip (or .tmp/example/zahlenstrahl-quiz.zip) and reach the first screen
after upload. The upload proves the server side runs, not only the static
pages. Time: send to address printed, with your own jobs apart.

**Partly:** the static page is up but upload fails; or it deployed under an
address other than the one it told you.

**Stalled:** write the stage and copy the exact message. Likely ones: can't
reach github.com, npm or api.cloudflare.com; sandbox timeout or session
length; "I can't run commands"; it explains the steps and leaves them to you
(a result: "explained, did not do"); token refused; name taken; deploy error.

Stop part 2 at: a repeated stall, an ask to run something yourself, a usage
limit, or 60 minutes.

## After

- Revoke the Cloudflare token. Delete the Pages project and the Worker in the
  dashboard, or leave them, token gone. Tell the account's owner the chats contain the
  token; they may delete them.
- Save to .tmp/free-tier/<date>/ (create it): both zips, the error
  screenshots, the filled record.
- Hand the record to the agent working on the wording.

## Record (copy, fill in)

```
Date:          Plan: Free     Model shown:
Memory/prefs on?
1a  sent ..:..  done ..:..  fetched site? y/n  handed back:
1b  sent ..:..  done ..:..  skipped? y/n
1c  upload ok? y/n  message:
    pictures in questions? y/n  as answers? y/n  keys right? y/n
    played on a second device? y/n
    PART 1: through / partly (what) / not through (what)
2   sent ..:..  address printed ..:..  own jobs ..min
    setting changes:
    github / npm / cloudflare / token / name / deploy:
    root loads? y/n  upload works? y/n
    PART 2: through in __ min / partly (what) / stalled at (stage, message)
Anything else a teacher would trip on:
```

## What the result changes

- **Part 1 through:** the landing's step 1 may say "Claude, free plan, <model
  shown>, tested <date>", the date of this sitting. Partly: the line says what
  it did and didn't (e.g. pictures only after a second message). Not through:
  no claim for the free plan, and Later's "pictures for a teacher whose AI
  can't make a zip" moves up.
- **Part 2 through:** own-copy may say "free Claude did it in <N> minutes,
  tested <date>", N being the AI's time plus the teacher's own jobs. Stalled
  or only explained: no number anywhere, and own-copy says who can: someone
  whose AI runs programs on their computer, or a colleague by hand from the
  README. A stage that a teacher can fix gets a line there.
