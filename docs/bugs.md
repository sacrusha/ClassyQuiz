# Known bugs

Bugs in what is built, as distinct from what the backlog hasn't built yet.

- On a 360 px wall, squeezed answer tiles break a number inside its digit group ("646 00" over "0"); `fitTiles` breaks inside words at its smallest size, and the no-break space between digit groups doesn't stop it.
- On a 360x740 phone wall, the reveal moves the tiles' rows by about 2 px (the first row a little shorter, the second taller), against `class-and-wall.md`'s "Tiles do not move at the reveal"; the text tiles' grid rows are sized by their content, and the tick changes it. Not seen at 1366 px, nor on a player's own device (`client/device.ts`). A walk that shows it: `.tmp/v5-solo/wall-walk.mjs`.
- In a room someone steers, after the teacher's Exit, the tab lands on the start page, whose resume card asks `/api/i/<id>/info` after the quiz it uploaded (`findOpen`, `client/home.ts`), gets a 404 because the quiz has just ended, logs it and forgets the quiz. Harmless: one request, nothing shown. The player page forgets a quiz it hears is gone, so a Peers room's opener no longer asks; the teacher's pages (`client/screen.ts`, `client/teach.ts`, their "gone") could forget it the same way (`forgetQuiz`, `client/dom.ts`).
