# The landing film: the shots

What the film is for, what it lives with and how it is made: `README.md`.
The words on its screens and their sources: `film-text.md`. The times below
are the film's (`build/film.js`, `T`, `PRESS` and `COMMON.chapters`); where
this file and the source disagree, the source is current.

The film started from the owner's brief (a desk, the phone, the AI, the
upload, the laptop, the big screen, the class). The table says where the film
departs from it, and why.

## Changes to the brief, and why

| Brief | The film | Why |
|---|---|---|
| Opens on the desk | Same, over the teacher's head onto the desk as the owner sketched it; a coffee mug as set dressing only, **no clock** | Owner: teachers infer the break themselves; a clock implies real time, and the AI's minutes of building are sped up in the film. |
| Ring of popular AI logos | **One app tile reading AI** (KI, IA: the page's language's letters), named with the AI chapter's name, *Your AI*; it opens into the chat | Real logos are others' trademarks and read as endorsement. A ring of invented app icons stood here first, for "any good AI" by many-and-one; the owner, watching: nothing in it said AI. The letters do, in every language of the page. |
| Typed ask | **The Build step's labelled ask, word for word**, in the visitor's language, `classyquiz.pages.dev` underlined in the accent as on the page | The film then demonstrates exactly the sentence printed below it; the address is the one thing a teacher must remember. |
| AI answers with bars, slides, zip | Bars, the `.zip` chip; then **the real conversation's second ask, which changes the quiz** ("Please add some questions where the number is given …"), bars, a second `.zip` chip, and that one is tapped | What the chat should leave behind is that the quiz is made, and changed, by asking. A preview card stood here first (the AI's mock-up of the 646 000 question, for the rhyme with the wall); the owner found the ask that changed the quiz more relevant than the AI's drawing of it. |
| Upload "if difficult, skip" | **Keep it**: tap Upload → file sheet with the `.zip` on top → tap → the local check, its three ways to play it (Solo, Peers, Quizmaster) → tap "Open the lobby ▶" → the lobby's check → tap "Screen and remote" → the teacher code, about 5 s | The owner found "the step where the zip goes to classyQuiz isn't obvious"; it's the one step the strip of stills was redesigned for. The two checks are the screens a newcomer meets after the upload (`docs/design/local-check.md`, `docs/design/teacher-devices.md`, "How the screens are arranged"), and the teacher code shows only under Screen and remote. |
| Laptop types teacher code, lobby | Same, then **the teacher's thumb taps "Let everyone in ▶" on the phone and the big screen answers** | Matches the real phone-first flow (user-flow §1 rule 5) and shows, wordlessly, that the phone steers. |
| Kids answer | **One over-the-shoulder shot carries the mechanism**: a child's tablet in front, the big screen behind it, the same colours and shapes on both; the finger taps red ▲, that child's avatar pops into the big screen's top bar | The step unfamiliar teachers miss is how a tablet relates to the wall. Real behaviour: only avatars that answered appear, never which answer (question-flow.md, "Who has answered"). |
| Kids answer, solution, jumping | Insert **the teaching moment**: answering closes, the wall shows the counts split 12 / 6 / 2 / 0 *without* the tick; heads turn, wordless `?` / `!` bubbles; then the tick, avatars jump on the wall (a real feature), some kids jump, others shrug | "Practice, not testing" and "a teaching moment" are what distinguish the site; the split is what only a film can show of it. |
| (ends on celebration) | The wall's counter runs quickly from 1 / 13 to 13 / 13, then the final ranking of avatars, then the end card: the mark and `classyquiz.pages.dev`; once the film has played to its end, a replay icon on it | Closure, and the address once more. After one question twelve children would tie at ★ 1; a ranking after the whole quiz has places. |

## The quiz in the film

Question 1 of the example quiz ("Big numbers on the number line", 13
questions): "Which number does the arrow show?", the arrow at 646 000. The
example has it as `Order: fixed` with the right answer first, so on the wall
and the tablets the right answer is red ▲ 646 000; blue ◆ 645 000 is the
halfway mistake, yellow ● 644 000 one tick off, green ■ 647 000. Without that
line the site shuffles the choices (`docs/design/quiz-format.md`). Twenty children:
12 right, 6 on blue, 2 on yellow, none on green. The over-the-shoulder child
answers right.

## Shots (60 s)

One world with a camera moving over it (the desk, the laptop, the room), so
"zoom out and pan to reveal" is literal; what must be read gets the full
frame. Roughly: preparing 28 s, the classroom 32 s. The classroom follows the
real states of a question (`docs/design/question-flow.md`): Question (choices
veiled, tablets show an eye, the teacher reads) → Choices (open everywhere) →
Answers (the split on the wall, no solution, tablets locked) → Solution (the
winners' band jumps; tablets show ✓ or ✗) → Ranking.

The five chapters start at 0, 4.4, 19.6, 28.7 and 38.0 s, ticks on the page's time bar.

| # | Time | Picture | Reads on a phone? |
|---|---|---|---|
| 1 | 0–4.3 s | **Chapter "Your exercise sheets".** Over the teacher's head onto the desk: the back of the head large, cut at the bottom centre; a mug on the left. Two sheets laid down, fanned. The left hand raises the phone from below, the thumb on the shutter; two flashes, two thumbnails slide into the phone. | Sheets as sheets, yes. |
| 2 | 4.3–7.3 s | **Chapter "Your AI".** Push in to the phone. On its black home screen one white tile with the letters **AI** (KI, IA) and the chapter's name under it; it pulses under the thumb and its white grows to the full frame. | The letters, yes (about 20 CSS px); the name, just. |
| 3 | 7.3–19.5 s | The chat, its header the tile and *Your AI*: the two photos attach; Build's ask types and holds about 1.4 s for the address, then is sent. The AI: a status line, bars, the `.zip` chip. The teacher's second message, the real conversation's second ask ("Please add some questions where the number is given and they have to pick the matching marked number line."); the AI: a status line, bars, a second `.zip` chip. Each ask types at the speed that ends it in time, whatever its length in the language. | The asks and the address, yes (46 units); the second ask is in the frame about 4 s. Bars aren't meant to be read. |
| 4 | 19.5–25.1 s | **Chapter "The .zip, opened here".** Thumb on the second `.zip`. The site on the phone: its header, the Run box "Open the quiz your AI made (.zip)" → the file sheet with the `.zip` on top → the local check: title, "How will it be played?", the cards Solo, Peers and Quizmaster, about 1 s → the thumb taps Quizmaster's "Open the lobby ▶" → the lobby's check: "How are the screens arranged?", One screen pressed → the thumb taps "Screen and remote" → the how-to under it, **teacher code 63953 47** zoomed and pulsing. The site shrinks back into the phone. | The entries' names and buttons, yes; their lines, no. Code: close-up, large. |
| 5 | 25.4–29.1 s | Cut to the laptop's screen: the teacher types the code in the header box, ▶, "Show the quiz here"; the screen: "Joining opens in a moment." Cut to the room, the camera still: the teacher seen from the side, the laptop and the wall's edge in one frame. The teacher holds the phone at the chest and taps "Let everyone in ▶"; **chapter "What the class sees"**: laptop and wall answer with the join code and the QR code. | The two-device link: the same screen on the laptop and the wall, the phone in hand. |
| 6 | 29.1–35 s | Pull out to the room. The teacher walks to stand before the class; children (backs of heads, varied heights and hair) come in from the door on the right, the farthest seats first, sit, type on tablets; avatars pop up one by one on the wall, each child's on their tablet. | Avatars, yes. |
| 7 | 35–38 s | "Start quiz ▶": the question appears on the wall, its tiles faint and without their text; tablets show an eye; the teacher reads aloud (a wordless bubble). | The teacher sets the pace. |
| 8 | 38–44 s | **Chapter "Each student taps".** Over one child's shoulder, from the reading state on: "▶ Choices", and in one frame the wall's tiles get their text and the tablet changes from the eye to the four buttons (colour, shape, text). The finger taps red ▲; the tablet marks it; that child's avatar pops into the wall's top bar. Wide again: the others tap, avatars pop in, the count rises to 20 / 20. | Colours and shapes match: yes. |
| 9 | 44–50 s | "▶ Answers": the split appears, 12 / 6 / 2 / 0, no tick; the camera moves in a little. Heads turn to each other, `?` and `!` bubbles; the teacher points at the arrow. The pointing arm lies over the lower-left tile (yellow, 2 votes): every straight arm from the teacher to the arrow does. | The counts, just; hold long enough to feel the pause. |
| 10 | 50–55.4 s | "▶ Solution": the tick on red, the other tiles fade. The winners' avatars jump on the wall; those children jump, the others shrug (the head sinks into the shoulders), one laughs. Over the shoulder again: the tablet's ✓. | Yes. |
| 11 | 55.4–60 s | The camera onto the wall; the counter runs 1 / 13 → 13 / 13; "▶ Final ranking": the podium of avatars. End card: the fox and `classyquiz.pages.dev`. | Address large. |

**Poster frame** (shown until a press): shot 9 at
47.3 s, the class at the wall with the split vote, tablets in hands, the
teacher with the phone.

The page around the film (the player's bar, the layout, full screen, the
replay): `docs/design/root-page.md`, "The film".
