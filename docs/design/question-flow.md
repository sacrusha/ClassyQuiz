# Question flow

How one question moves from the teacher reading it out to the key on the wall, how the teacher steers it, what counts as a right answer and how it scores, and when a student's tap counts. Screens and wording are in `user-flow.md` (§3.3–3.7); this file is about the states and the rules behind them.

## Purpose

- **The quiz is a teaching moment.** The teacher sets the tempo, stops to explain, shows the answer; "no clock pressures the teacher" (backlog v1 item 6). Nothing moves on by itself.
- **Closure for the whole class, slow readers included** (v1 item 8). A child who needed longer to read must not be out of the ranking for it.
- **A broken question is seen before the key is on the wall.** Showing how the class answered first gives the pause-and-discuss moment, and lets the teacher see a bad question before the key (v2 item 6). AI-made keys are wrong now and then; with break-time authoring, the run is the review (v1 item 9).
- **What a tablet shows and what the server counts are one fact.** A student who tapped in time, as far as their tablet showed, and then finds it did not count is disappointed, and the fun is dented for the whole class (v1 item 15).
- **Energy for the classes that want it** (v2 item 3): points for speed, optional, never a substitute for the teacher's pace.

## Situation

- Plausible assumptions: the teacher reads the question aloud while the class looks at the projector (the Question state, choices hidden), and a mis-tap is likelier than a tactic (the tap rules below trust the device). The answers on the tablets are colour-coded buttons.
- The teacher steers from a phone (the Remote), from the projector page itself, or with a presentation clicker that has forward keys only. A hand in flow presses fast; clickers bounce; a double press may be a mistake or a deliberate fast-forward. What misleads a hand is the screen moving under it, not the time since the press (the owner's observation).
- Device clocks are not synchronised, and on school Wi-Fi a delivery can take longer than any window that would still be fair. A tablet that is offline still shows the question as open.
- The teacher is in the room and deals with a child who copies the key from the projector. The design is against the normal user, not a malicious one.
- Free-plan cost: every state of a question is a view sent to every device, so a question with four or five steps costs noticeably more requests than one with three (budget in `hosting-and-limits.md`; see Not known).

## How the site meets it

### The states of a question

No mode and no tempo: every question steps through the same states, each by the teacher's press (`server/game.ts`: `answering()`, `play()`). A Peers room has nobody to press: it shows the choices with the question and steps on when everyone present is done (`peers.md`, "Nobody steers").

1. **Question**: the answers are hidden while the teacher reads it out. The wall shows the question and its picture with the tiles veiled in their final places, so nothing moves when the answers appear; tablets show an eye. Taps are refused.
2. **Answering**: the answers are open on every device; the time for speed starts here.
3. **Locked in**: answering is closed and the spread is on the wall, without the key. Tablets are locked with the choice marked. Nobody copies the majority. An enlarged picture goes back beside the question, as it would cover the spread.
4. **Revealed**: the key and the winners' band; tablets show right or wrong (and points).
5. **Ranking**, then the next question; after the last question's reveal, the final ranking directly (no intermediate ranking right before it).

The blank state before a question (the question shown alone, before its reading) is skipped to keep the default short: five states per question times twenty questions is a hundred presses, and expectation management, not count, is the problem. Showing the question together with its answers is left to a later configuration item with presets (backlog Later).

The final ranking can be called from any point (the bell rings at question 9). A question whose key was not revealed does not count. Late joiners and removing an avatar belong to `class-and-wall.md`.

### The steering bar

Two buttons, the same size and in the same place in every state, on the Remote and on the wall's steering bar, so a hand in flow always finds them (`client/steps.ts`, `steeringButtons`).

**The words.** A teacher must be able to say before a press what will change on the wall and on the tablets. Labels named one by one after the states fail it: commands, nouns and motions side by side leave a teacher unsure whether a button says where they are or where it goes, and a word for two things ("answers" for the tiles, the key and what the class tapped) makes "show the answers" and "reveal" both read as showing the key. One vocabulary holds on every teacher screen:

- **choices**: the tiles a question offers;
- **answers**: what the class tapped;
- **solution**: the key, one tile or several (German teachers say *Lösung*).

The guidance, the `/layout` page and the format's errors and warnings use the same words, because the check shows those messages to the teacher and "Copy the message for your AI" hands them to the AI: one vocabulary for both readers. In the code, `answers` stays the name of a question's choices.

- **Play ▶** steps one slice and is labelled with a noun for what the class sees next: Choices, Answers, Solution, Ranking, Question 4 (its number among the questions shown, as on the wall's "4 / 12"); Final ranking after the last reveal. The ▶ is the verb. The owner on labels: "Reveal" and "Ranking" name a thing the class sees; "Next question" and "Straight to answering" name a motion, which is why a fast-forward button had no labels that worked. Solution is that thing for the reveal, and the number makes the next question a thing too, with information in it. A noun alone can read as where the teacher is rather than where Play goes; a stepper naming the question's states is the intended remedy (Not known).
- **Nouns, not verbs**, because the labels must fit the wall's bar and translate: the bar's Play has room for about 13–15 characters, and a noun needs no verb form, gender or word order (*Lösung zeigen*, *Afficher la solution* would not fit; "Next: …" adds a gender in French and German). One label set serves every width, so the wall and the Remote say the same words, also after ⇄ Swap.
- **A small line under the label** where the step has a consequence the noun doesn't name: "closes answering" under Answers, "15 s, then closes" under Countdown, the seconds from `LAST_CALL_MS`. The buttons keep one height whether or not it is there.
- **Countdown** (`lastCall` in the code), in Question and Answering: from Question it shows the choices too; then `LAST_CALL_MS` (15 s, `shared/tempo.ts`) later answering closes by itself, with the answers on the wall, or sooner once everyone present has answered. Once per question. While it runs the button is greyed, and the bar drains with no digits (`client/clock.ts`); where it does not apply it stays in place, invisible, so Play never moves. Answers during Countdown ends it. An idiom such as "last call" is unknown to many German-speaking teachers; "Countdown" is a loanword in German and Italian, and French needs its own word ("Décompte", or "Top chrono") or "⏱ 15 s" where the word is long (backlog, Localization).
- **The solution stays the teacher's press.** Countdown says "we're done answering", never "show the key". The server's step at the deadline is the Durable Object alarm (`scheduleAlarm` takes the earliest of the lifetime alarms and the deadline).
- "Everyone present" means the devices that are there plus any that answered and left; a tablet away 45 s (`FRESH_MS`, `server/instance.ts`) stops holding it open. The teacher tabs' ticks check it too (`closeIfAllIn`), so the last missing tablet going away does not leave Countdown running while the wall already reads "all in".
- There is no fast-forward button. A deliberate double press of Play is the fast-forward (below); ⋯ → End the quiz: final ranking ends early.
- **Exit**, at the final ranking, is the bar's only button, in its middle; Play's place is empty. Ending is one click from the final ranking, without a confirmation (owner), so it must not sit where the presses of the quiz land: a stray press, the second half of a double press on Final ranking, or a clicker would end the lesson. No key presses it, and like Start it is not taken within 0.4 s of the screen moving. Exit deletes the quiz and sends every screen to the root page (`endInstance`, the `gone` message with `home`).

Sizes, labels at narrow widths and the wall's layout are `user-flow.md` §3.4–3.5.

**Keys.** Space, Enter, →, ↓, PageDown and N are Play. There is no key for Countdown: a clicker has forward only, and a stray key must not start a clock. No key starts the quiz: Start is one deliberate press on the steering screen while the class is still joining. A key held with Ctrl, Alt or Windows/Cmd does nothing (F, full screen, and Z, picture zoom, otherwise). While a Remote steers, only a clicker's keys (PageDown, →, ↓) move on from the wall: the teacher is on the phone, and Space, Enter and N are the keys a lean on the laptop hits. While the wall steers itself all Play keys work, and a single stray Space then still reveals: that keyboard is the teacher's steering.

### Presses

A press in flow does what the teacher meant; a bounce, or a press landing on a screen that has just moved, does nothing; a deliberate double press fast-forwards. One `Presses` object per steering tab serves its buttons, its keys and the clicker (`client/steps.ts`):

- **A bounce**: a press within `BOUNCE_MS` (80 ms) of the last is the same press. Switch bounce and a clicker repeating its code are far below that; double-clicks run about 150–300 ms.
- **A double**: a second press within `DOUBLE_MS` (450 ms) is one gesture and steps once more, sent with the state the first press leads to, so the server takes it only after the first. One double is two slices; a third press does nothing. 450 ms is a little under the usual double-click setting.
- **Never across a question's start**: a double whose first press shows the answers, or brings up the next question, steps once. A second slice there (closing answering with nobody answered, or answers before anyone read the question) is never wanted.
- **A press on a screen that just moved** (within `SETTLE_MS`, 400 ms, of the view arriving, not of the press) does nothing, also when the screen moved by itself (Countdown closing answering): the press was aimed at what was there before. On a slow line the screen moves late, which is when it misleads.
- Countdown and Start follow the bounce and settle rules; a Play right after Countdown does nothing. The buttons are never disabled after a step: a disabled button would swallow a double's second press.

Independently of timing, every step command names the state it was pressed in (`At`), so a resend or a stale press is ignored by the server whatever its timing. Accepted: hardware that bounces slower than 80 ms reveals instead of locking in.

### Fixing a question during the run

AI-made keys are wrong now and then (v1 item 9). At any time while the instance lives, the teacher can:

- **change which answers count**: any number from one to all. A question where all answers are right has its own fun; nothing constrains the number except what the display can show. At least one has to count; "void" covers none. The reveal marks every answer that counts and dims the rest;
- **void**: shown, but counts for nobody;
- **skip** a question not yet shown. For the open question, Skip moves on and drops its answers (`skipCurrent`); a question the class has seen can only be voided, and one behind the current can't come back in this run.

Points are computed from the stored answers under the current fixes and never stored, so a key changed after the reveal moves the points with it, speed bonus included. Fixes belong to the instance and go with it; a parallel class plays its own upload without them, until the Later item "corrected quiz download" hands the teacher a corrected file. The quiz-text side of several right answers (marking with "+", the key check's "N right") is `quiz-format.md`.

### Scoring

`points` in `server/game.ts`:

- **Without points for speed**, a right answer scores 1 ("right out of so many").
- **With them**, `POINTS_RIGHT` (10) plus `speedBonus`: up to `SPEED_BONUS` (5) whole points, by the share of `SPEED_REFERENCE_MS` (20 s) left when the tap was made (`shared/tempo.ts`, one place for a self-hoster to tilt). The ratio is Kahoot's: two fast right answers weigh as much as three slow ones; a smaller bonus makes speed a tie-breaker, a larger one a race. A tap after 20 s scores 10 and no bonus. Whole points keep ties possible, and ties share a place.
- The reference is fixed because the teacher's pace has no length of its own, and Countdown starts whenever the teacher presses it: a bonus by its share would reward the class the teacher hurried. It runs from the answers appearing, not from the question: the reading happens while they are hidden, so a slow reader who listened to the teacher starts level.
- **The switch** is on the join screen under Start and in the Remote's lobby (the check has none), off by default, fixed at Start (`setSpeed` refuses after it). It can't change mid-quiz, so earlier questions are never rescaled. It says "A right answer 10, up to 5 more the quicker it comes." (`client/manage.ts`).
- **Whose time it is**: the device measures from the answers appearing on its own screen to the tap, so a slow line or a reconnect costs no speed (on school Wi-Fi the podium would otherwise go to the best line). Views carry `sinceMs` so a reloaded tablet still measures from the answers' appearing. The server caps the device's figure at its own count (which includes both trips) and never goes below zero; a page that sends none gets the server's count. This trusts the client, which fits "a normal user, not a malicious one". The last tap counts, with its own time: a change of mind costs speed.
- A key changed afterwards moves the points with their speed. Only revealed questions that are neither void nor skipped score.
- How the tablet and the ranking display scores is `class-and-wall.md` and `user-flow.md` §3.6–3.7.

### When a tap counts

A student can change their answer until answering closes; the last tap counts (`MAX_ANSWER_CHANGES`, `shared/limits.ts`, bounds the changes). The rule is the device's view, not the arrival time (`answerOutcome`):

- Every view carries a version; the server notes in `Run.closedView` the version of the first view that showed answering closed (the lock-in, or the reveal if nothing locked before it). A tap names the version it was made on. If that is older than the closing view's, the tablet still showed the question as open, so the tap counts whenever it arrives. Time would be the wrong basis for the reasons in Situation.
- **The record settles when the class leaves the question's reveal** (the ranking, the next question, the final ranking). Until then a tap on an older view counts, including during the reveal, and the spread grows by one. After it, nothing changes what the question scored except the teacher's fixes, so a podium that was shown does not change. Nothing counts while the class is reading, for a skipped question, or for one not revealed before an early final ranking.
- **One fact, the record the server holds.** Each answer's acknowledgement carries the record as it stands after the tap, whatever happened to this tap (`AnswerAck`); the tablet's view carries the same (`mine`). A resend of what is held is confirmed also after the reveal. The server holds the open question's answers in memory and writes them with the lock-in and the steps after it (`open-period-in-memory.md`); a device away at the lock-in that comes back with its tap is the late tap above. A design with two facts (a tap's acknowledgement and the stored record) left a tablet and the server disagreeing about a score whenever an acknowledgement was lost.
- **On the tablet**: a tapped button is marked at once with a dashed, pulsing outline (on its way); it turns solid when the tablet's view has the answer held; a refused tap falls back to what the view stores. A tap still on its way when the class moves on is shown as on its way, never as accepted, and does not count. Only the marks change in place, so a tap landing as a view arrives is not swallowed by a redraw.
- Countdown's bar is one CSS animation started from the `leftMs` the view carries (`client/clock.ts`), so a device that arrives mid-countdown picks up where it is. A device runs it from when the view arrived, so its end is at or after the server's, never before.
- Accepted risk: a tablet that is offline still shows the question, so a child could copy the key from the projector and tap. A device that sends no version (an old cached page) gets the strict rule.

### Who has answered

The wall's top bar shows only the avatars that have answered, popping in as answers arrive, in arrival order, no placeholders: the projector exposes nobody (v1 item 5), a child sees theirs land, and nobody is shown as missing. The mark says an answer arrived, never which one; a change of mind changes nothing. The display is `class-and-wall.md`; the counting rule is here:

- "Of" is the players whose device is there, or who answered and went away since (without the second part a device that answered and dropped would give 26/25). A tablet away 45 s (`FRESH_MS`) stops holding the count below full.
- Presence changes with time, not with events, so the wall asks for its view every 15 s while a question is up with its answers shown (`client/screen.ts`).
- The Remote shows "Waiting for" with the avatars of those the class waits for once six or fewer are left, while answering is open (`client/teach.ts`).

## Not known

- Whether teachers find Countdown and use it, and whether fifteen seconds is right.
- Whether "Answers" reads as the step that closes answering; "Votes" was the alternative, set aside because it suggests majority voting.
- The stepper: a row naming the question's states (Question · Choices · Answers · Solution · Ranking) with the current one marked, so the noun on Play reads as the next step. Its room on the wall's bar, which also carries the address and code, is unmeasured; on the wall it may fit only as dots. The Remote has a line of where the question stands above the choices meanwhile.
- Whether a deliberate double press is found at all, and whether 80/450/400 ms suit a real clicker and a real hand (only headless timing so far).
- An accidental Countdown can't be cancelled (the earlier bar had "Stop the countdown"); a press blocked by the settle window gives no feedback.
- Whether the dashed "on its way" outline is noticed, or needed, on school Wi-Fi.
- Whether 20 s as the speed reference suits questions much longer than that (every slow right answer scores 10).
- Whether a hint on the Remote, when most of the class chose an answer not marked right, is wanted: the counts sit beside the key already.
- A 320 px wall still clips the ranking.
- Runs by itself (backlog Later): a quiz that carries on while the teacher's hands are elsewhere, for classes that read for themselves, would need a cadence with nobody pressing, a close rule per question (everyone present has answered, or some seconds after the last answer, with a cap) and a way back: any press makes it manual. It is an option, never the default; it would share the clock machinery with Countdown.
- Per-question time hints ("needs more time") stay parked until a teacher asks; a length per question was rejected because every addition to the format is something an AI must write reliably.
