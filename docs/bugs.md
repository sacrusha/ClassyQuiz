# Known bugs

- Where no layout fits a question's text answers (`layQuestion`, `client/stage.ts`), the squeezed tiles break words anywhere, a number inside its digit group too ("646 00" over "0"): the no-break space between digit groups doesn't stop it.
- A 320 px wall clips the ranking.
- In a Peers room, while a question is up, the connection dot sits under the foot bar, so only the offline banner shows a dropped line.
- In a Peers room on long-poll, the room ends 10–15 minutes after its last device was touched, while the podium is still showing on it: a device at rest counts as having left.
- After the teacher's Exit, the start page's resume card asks `/api/i/<id>/info` for the quiz that just ended, logs the 404 and forgets it (`findOpen`, `client/home.ts`); nothing shows. The teacher's pages could forget the quiz on hearing it is gone, as the player page does (`forgetQuiz`, `client/dom.ts`).
