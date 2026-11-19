# Known bugs

Bugs in what is built, as distinct from what the backlog hasn't built yet.

- Where no layout fits a question's text answers (`layQuestion`, `client/stage.ts`), the squeezed tiles break words anywhere, a number inside its digit group too ("646 00" over "0"): the no-break space between digit groups doesn't stop it.
- In a room someone steers, after the teacher's Exit, the tab lands on the start page, whose resume card asks `/api/i/<id>/info` after the quiz it uploaded (`findOpen`, `client/home.ts`), gets a 404 because the quiz has just ended, logs it and forgets the quiz. Harmless: one request, nothing shown. The player page forgets a quiz it hears is gone, so a Peers room's opener no longer asks; the teacher's pages (`client/screen.ts`, `client/teach.ts`, their "gone") could forget it the same way (`forgetQuiz`, `client/dom.ts`).
