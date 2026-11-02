# classyQuiz — Backlog

Project → versions as goals → items that get picked, worked and delivered. Each
item names the problem it solves for the teacher or the class; the versions tell
the story of what comes before and after. Items get resorted, split and combined
as understanding grows. Last settled: 2026-11-02.

## Project

A teacher has an exercise sheet and wants fifteen minutes of fun practice on
exactly that content. Existing tools fail on authoring time, premade content
fails on topic. The product is the path from sheet to a running classroom quiz.
Often the quiz is made in the ten-minute break before the lesson, with the
teacher's own AI, and used once. The material arrives as a few photos taken with
a phone, or as a document or PDF uploaded from a laptop; the teacher may be on
either device. Any age group, including settings beyond school with adult
participants; the example to design against is a Swiss German-speaking primary
class: a school-issued laptop on the projector, Android tablets for the kids,
the teacher's phone as remote, and an AI account that may be a free one.
Teachers understand English; students may read slowly, or not
read English at all, and the teacher is in the room. The guidance to the AI is
in English, which AIs are trained on; quizzes come out in whatever language the
teacher and the sheets are in. The measure is teacher time.

## Constraints

Hold for every version; not picked as work.

- **Nothing public, nothing kept beyond its use, nothing identified** — data
  protection, and the own-classroom copyright exception for quizzes derived
  from published material. The packaged quiz lives on the server for the
  lifetime of the quiz instance — what that lifetime is, is part of the work;
  the teacher's file on disk is the durable copy.
- **Survives school Wi-Fi** — connections drop, phones go to sleep, a device
  dies mid-quiz, and the lesson must go on. Failure in front of the class ends
  adoption.
- **Designed for Claude**; other mainstream AIs verified to produce usable
  quizzes from the guidance.
- **Hosted on the owner's Cloudflare account, no domain of its own** — a
  teacher's laptop can't be relied on to be reachable over school Wi-Fi; it's a
  tool, not a product, and usage limits nudge heavy use toward self-hosting, on
  Cloudflare or another provider. Free plan, designed to stay within its limits
  for a few users. The README promises that an AI can set up one's own instance
  from the public repo.

## v1 — One real teacher runs one real quiz their AI made in the break

Text-only multiple choice, up to four answers, press the right one. Runner first
so there is something to click early; authoring closes the loop.

1. **Quiz format** — a wrong key must be visible in seconds and fixable in the
   text or by telling the AI; an AI must write it reliably. Title, questions, up
   to four answers, one correct, and an authoring note per question for the
   AI's doubts, which must reach the teacher while the question is up, not the
   students.
2. **Upload as pasted text or as an archive** — not every AI emits files; those
   that do hand over one bundle. The archive is the container from the start;
   v2 puts images in it. Zip only: every tool that makes tar.gz can make zip,
   and several loose files are too error-prone. Upload attempts are counted by
   format, with content and identity excluded, so whether anyone tries another
   format is a fact to look up rather than a guess.
3. **Three audiences in one session** — the class looking at the projector, the
   teacher steering from a small screen — possibly a different device than the
   one driving the projector — and students answering on their own. The teacher
   may paste and set up on either the laptop or the phone; during setup the
   projector is off or an extended screen, but a mirrored laptop would show the
   class the key and the controls.
4. **Joining** — 25 kids inside a minute on shared, school-managed tablets with
   nothing set up or installed on them: that is the baseline, everything beyond
   it is optimisation. Devices with and without cameras, young readers, a
   teacher in the room who can call out what to do. Reaching the site is the
   slowest step; without a domain the owner prefers a `pages.dev` address, with
   short links or QR codes as further options.
5. **Students on the big screen** — they appear in a way that's fun, exposes
   nobody, and stores nothing about them; quick avatars are fine.
6. **Teacher-paced flow** — the teacher sets the tempo, stops to explain, shows
   the answer; the quiz is a teaching moment and no clock pressures the teacher.
7. **Answering on a small screen** — quick taps; colour-coded answers have
   worked better than lettered lists. Correctness scoring; speed scoring in v2
   must not need a rebuild.
8. **Ranking, intermediate and final** — closure for the whole class, slow
   readers included; export later without rework.
9. **Fixing a question during the run** — during the question, at the reveal,
   or any time before the final ranking; e.g. skip it, void it, change the key
   with the points following, or let another answer count too — the same
   capability as a question where any number of the answers are right and
   students pick one; a question where every answer is right has its own fun.
   Nothing constrains the number of right answers except what the result
   display can show. AI-made keys are wrong now and then; with break-time
   authoring this is the review.
10. **Hosted instance** — upload from one device, run from another, nobody has
    an account; nothing kept beyond its use.
11. **Guidance page: what the site is for, what quizzes are for, how they're
    built, how to build them with a human** — an AI told only the site's name
    must come away understanding these four things; typing the name into the
    chat already open must be enough. Whether a given AI actually does is a
    fact to test, not assume; known hazard: some hosting plans block AI
    fetchers by default. Part 4 is a first draft the owner takes over.
12. **Preview as the class will see it** — low priority: useful when there is
    time before class, which often there isn't.
13. **Validation errors the teacher can hand back to the AI** — low priority: a
    single-use quiz with a format error gets regenerated rather than repaired.
14. **Self-hosting nudge** — the free plan serves a few users; the site tells
    people how to get their own instance, e.g. "ask your AI to set one up,
    takes 5–10 minutes", or the guide on GitHub.

## v2 — Figures, tempo, and a hardened instance

Most sheets have pictures; some classes want energy; an open instance gets fed
garbage.

1. **Image per question** — figures are the exercise; e.g. between question and
   answers, or as background.
2. **Optional countdown** — game-show tempo for classes that want it.
3. **Speed scoring** — energy for classes that want it.
4. **Hardening** — an open public instance: e.g. size limits, malformed
   archives, abuse of upload and sessions.

## v3 — Answers as images

"Which of these shows…" — and readers who are still slow.

1. **Image answer options** — the question is visual, so is the choice.
2. **Placement beyond the named layouts** — some content fits no layout;
   teacher-supplied layout would run in every student's browser on the shared
   site.

## Later — Paper and memory

The quiz is already made; it can be more than one activity.

- **Printables** — quick test on paper, answer sheet, review print to take home;
  not every lesson has devices.
- **Corrected quiz downloadable after the run** — the in-class fixes shouldn't
  be lost for the next variant.
- **Results export** — a teacher who wants to look again.
- **Localization**, one sub-item per language — teachers who don't read
  English, classes that should see the few labels there are in their own.
- **Formula rendering** — fractions, powers, equations on maths sheets; until
  then an image carries them.
