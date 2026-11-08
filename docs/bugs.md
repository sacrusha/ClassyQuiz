# Known bugs

Bugs in what is built, as distinct from backlog omissions. Remove an entry when fixed.


- 2026-11-03, seen in the after-upload walk, not fixed: on a 360 px wall, squeezed answer tiles break a number inside its digit group ("646 00" over "0"); `fitTiles` breaks inside words at its smallest size, and the no-break space between digit groups doesn't stop it.
- 2026-11-08, seen in a walk of the wall (`.tmp/v5-solo/wall-walk.mjs`), not fixed: on a 360x740 phone wall, the reveal moves the tiles' rows by about 2 px (the first row a little shorter, the second taller), against `class-and-wall.md`'s "Tiles do not move at the reveal"; the text tiles' grid rows are sized by their content, and the tick changes it. Not seen at 1366 px, nor on a player's own device (`client/device.ts`).
- 2026-11-08, seen in the Peers walk on the merged v5 tree, not fixed: after Exit at a Peers room's final ranking, the opener's tab lands on the root page and logs one 404 from `/api/i/<id>/info`, the room having just ended; the other players' tabs don't. Harmless as far as seen; the cause (the resume card asking after the ended room) is an inference, not established.
