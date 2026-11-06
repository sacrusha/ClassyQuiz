# classyQuiz film — assessment and storyboard design (proposal)

Status: animatic built, https://claude.ai/artifact/CjQKrFm4cshsVZp7Kpk1Nv (build notes and departures: `claude/erfahrungsbericht-classyquiz-film.md`). The shot list below is the design it was built from; where the build departed (the right answer is red ▲ because the real question has `Order: fixed`, split 12/6/2/0, final ranking after a quick run to 13/13), the build is current. Screen wording: `film-text.md` (from the repo). Sources: the ClassyQuiz repo
(`docs/design/root-page.md` "The strip" and "Not known: the video", `docs/user-flow.md`,
`docs/backlog.md` v4 item 1), the landing's real screens (`src/public/landing/`), the example
conversation (`/examples/conversation.webp`), and this project's Grundsätze (2D animation,
body animation).

## Purpose

A teacher on the root page, usually not at school, should come away knowing two things:

1. **The workflow** — photos of my sheets plus one sentence to my own AI give a `.zip`; the
   `.zip` goes up on this site; the class plays it on the big screen and their tablets.
2. **That it solves a problem I have** — I have the material and a lesson coming up, not
   much time; what comes out is a whole class practising at once, and a moment to talk
   about a typical error, which nobody gets graded on.

Owner (2026-11-06), on where the current strip falls short: the last part, the class
playing, works for people who know classroom quizzes and may be tricky for those who don't.
So the classroom gets the most time, the AI half is brisk (the strip and the Build text
already explain it), and what a newcomer can't guess is shown as cause and effect:

- the question is on the big screen only; a tablet shows the four choices as colour, shape
  and their text, the same as on the wall (one child seen over the shoulder: wall and tablet in one frame);
- a tap on a tablet shows up on the wall (that child's avatar pops up, the count rises);
- the teacher sets the pace: every change on the wall follows a tap on the teacher's phone,
  the same small motif each time;
- the class sees how the votes split before anyone sees what's right, and talks about it;
- the solution comes to each tablet (✓ or ✗) and to the wall (avatars jump); the ranking shows
  avatars, so nobody is exposed.

That the quiz was made in the break the viewer infers; the film doesn't state it.

## Situation the film lives in

- **Replaces the strip**, 16:9. On a phone held upright that is about 358 × 201 px: any
  text that must be *read* needs a close-up and enough time on screen; everything else may
  be illegible (codes typed by children, AI prose).
- **Never autoplays**; played from the strip's place only. So the **poster frame plus its
  labels must still do the strip's five-second job** without being played.
- **Wordless**, so one storyboard serves DE/EN/FR/IT; text appears only *on screens*, and
  screens are data swapped by language (as the strip's wall and tablet are now).
- **The site's CSP**: scripts only from the site's own files, no outside fonts. The film is
  one JS file plus CSS; fonts are the site's Rubik and system-ui. The demo artifact obeys the
  same limits so it ports without a rewrite.
- **AIs read the root page.** The example page shows the chat as a picture so a fetcher
  doesn't take a teacher's chat for page text. The film's chat text therefore lives in the
  JS file and is drawn at play time, never in `index.html`.
- **The site makes no claims it hasn't tested** (no durations, no tiers, no "free works").
  The film must not make them by picture either.

## Changes to the brief, and why

| Brief | Proposal | Why |
|---|---|---|
| Opens on the desk | Same; a coffee mug as set dressing only, **no clock** | Owner: teachers infer the break themselves; a clock implies real time, and the AI's minutes of building are sped up in the film. |
| Ring of popular AI logos | Ring of **invented** app icons (spark, knot, orbit, leaf …), one chosen | Real logos are others' trademarks and read as endorsement; "any good AI" is conveyed by many-and-one just as well. |
| Typed ask | **The Build step's labelled ask, word for word**, in the visitor's language, `classyquiz.pages.dev` underlined in the accent as on the page | The film then demonstrates exactly the sentence printed below it; the address is the one thing a teacher must remember. |
| AI answers with bars, slides, zip | Bars; then a **preview card that is the same question the wall shows later**: the real example's arrow question at 646 000 (the 72 000–73 000 one on `wall-en.webp` exists in no quiz); then the `.zip` chip | Visual rhyme: what the AI made in the chat *is* what the class plays — backlog item 1's whole point. |
| Upload "if difficult, skip" | **Keep it**: tap Upload → file sheet with the `.zip` on top → tap → the check | The owner found "the step where the zip goes to classyQuiz isn't obvious"; it's the one step the strip was redesigned for. 1.5 s. |
| Laptop types teacher code, lobby | Same, then **the teacher's thumb taps "Let the class in ▶" on the phone and the big screen answers** | Matches the real phone-first flow (user-flow §1 rule 5) and shows, wordlessly, that the phone steers. |
| Kids answer | **One over-the-shoulder shot carries the mechanism**: a child's tablet in front, the big screen behind it, the same colours and shapes on both; the finger taps blue ◆, that child's avatar pops into the big screen's top bar | The step unfamiliar teachers miss is how a tablet relates to the wall. Real behaviour: only avatars that answered appear, never which answer (question-flow.md, "Who has answered"). |
| Kids answer, solution, jumping | Insert **the teaching moment**: votes close, the wall shows counts split 6 / 12 / 0 / 2 *without* the tick; heads turn, wordless `?` / `!` bubbles; then the tick, avatars jump on the wall (a real feature), some kids jump, others shrug | "Practice, not testing" and "a teaching moment" are what distinguish the site; root-page.md lists the murmur at the split as something only the film can show. |
| (ends on celebration) | 2 s ranking of avatars, then end card: the mark and `classyquiz.pages.dev` | Closure, and the address once more. Whether the last frame links `/example` stays open. |

## Shots (≈ 60 s)

Camera = one continuous world (desk → laptop → room) with the camera moving over it, so
"zoom out and pan to reveal" is literal. Times are targets for the animatic.

Roughly: preparing 25 s, the classroom 35 s. The classroom follows the real states of a
question (`question-flow.md`): Question (choices veiled, tablets show an eye, the teacher
reads) → Choices (open everywhere) → Answers (the split on the wall, no solution, tablets
locked) → Solution (the winners' band jumps; tablets show ✓ or ✗) → Ranking.

| # | Time | Picture | Reads on a phone? |
|---|---|---|---|
| 1 | 0–5 s | Desk at an angle, teacher from behind (back of head, shoulders), a coffee mug. Two worksheets laid down. Hands raise the phone; two camera flashes, two thumbnails slide into the phone. | Sheets as sheets, yes. |
| 2 | 5–7 s | Push in to the phone. Ring of invented AI icons on black, one pulses and opens. | Yes (shapes). |
| 3 | 7–19 s | Phone screen widens to fill the frame (bezel slides away, chat reflows to wide). Photos attach; the ask types (~25 chars/s) and holds 1.5 s. AI: bars, the `.zip` chip. The real conversation has three asks; the film keeps 1 and the short 3 ("thanks. Can you make a visual preview, just one per question type?"); AI: bars, the preview card (the 646 000 arrow question), `.zip`. | The ask and address: to be checked at 358 px. Bars aren't meant to be read. |
| 4 | 19–23 s | Thumb on the `.zip` → saved. Browser: the site's header, "Upload the quiz your AI made (.zip)" → file sheet → the check: title, questions, **teacher code 63953 47** pulses. | Code: close-up, large. |
| 5 | 23–28 s | Pull out and pan: laptop beside the phone. Teacher types the code in the header box, ▶, taps "Show the quiz here". Thumb taps "Let the class in ▶" on the phone; the laptop answers with class code + QR. | The two-device link, by motion. |
| 6 | 28–35 s | Pull out further: the big screen on the wall, the same join screen. Children (backs of heads, varied heights and hair) come in from the side, sit, type on tablets; avatars pop up one by one on the wall, each child's on their tablet. | Avatars, yes. |
| 7 | 35–38 s | Teacher's thumb: the question appears on the wall, its choices veiled; tablets show an eye; the teacher reads aloud (a wordless bubble pointing at the screen). | The teacher sets the pace. |
| 8 | 38–44 s | **The mechanism shot.** Thumb: choices open. Over one child's shoulder: tablet in front with the four choices (colour, shape, text), the wall behind with the same. Finger taps blue ◆; tablet marks it; that child's avatar pops into the wall's top bar. Cut wide: the other children tap, avatars pop in, "18 / 20 … 20 / 20". | Colours and shapes match: yes. |
| 9 | 44–50 s | Thumb: the split appears, 6 / 12 / 0 / 2, no tick. Heads turn to each other, `?` and `!` bubbles, one hand up; the teacher points at the arrow. | Hold long enough to feel the pause. |
| 10 | 50–55 s | Thumb: tick on blue. The winners' avatars jump on the wall; those children jump (squash at ground only), others shrug, one laughs. One tablet close: ✓. | Yes. |
| 11 | 55–60 s | Ranking of avatars (2 s), end card: the fox and `classyquiz.pages.dev`. | Address large. |

**Poster frame** (shown until ▶, does the strip's job): shot 9 — the class at the wall with
the split vote, tablets in hands, teacher with the phone. Root-page.md already names this
frame as the strip's fallback.

## Page layout

- **Phone:** the film full width where the strip is; under it the strip's four captions as
  small chapter chips (Your sheets · Your AI · Uploaded here · The class), which seek; "The
  example, step by step ›" stays.
- **Desktop:** don't spend a 1120 × 630 block above Build/Run. Film at about two thirds of
  the width, the chapters as a vertical list beside it with tiny thumbnails (the current
  strip's pictures), highlighted as the film plays. Without playing, poster + chapter list
  read like the strip does now.

## Build approach (for the animatic)

- One self-contained page, flat SVG in the puppenfilm style; figures seen from behind, which
  saves faces and most rigging: teacher's arms and hands, children's heads (turn), bodies
  (jump), hands (tap).
- Whole state as a function of film time (Grundsätze body animation, approach b), because
  the chapters seek and the film pauses; no timers chained.
- Screens drawn as vector from the site's tokens (paper `#fbf8f2`, ink, accent `#a8471a`,
  answer colours, Rubik) so they stay sharp in close-ups; the screen texts as per-language
  data. The wall and tablet in the room may use the real `wall-xx` / `tablet-xx` images.
- Checked by rendering at 358 px and desktop, and by stills of each shot as a contact sheet.

## Open for the owner

1. ~~Clock~~ — decided: no clock (owner, 2026-11-06).
2. ~~Second ask~~ — from the real example (owner): turns 1 and 3, wording in `film-text.md`.
3. Sound: none planned; wordless bubbles carry murmur and cheer.
4. Whether the end card links `/example`.
5. Not known until tried: whether teachers watching it say what the class does and what they'd
   type to their AI — the same five-second test proposed for the strip, here after one viewing.
