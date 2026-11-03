# Known bugs

Bugs in what is built, as distinct from backlog omissions. Remove an entry when fixed.


- 2026-11-03, seen in the after-upload walk, not fixed: on a 360 px wall, squeezed answer tiles break a number inside its digit group ("646 00" over "0"); `fitTiles` breaks inside words at its smallest size, and the no-break space between digit groups doesn't stop it.

- 2026-11-03, seen once, not reproduced: a plain `simulate.mjs` run scored one student 4 where 3 was expected (the server counted an answer the simulated tablet never saw confirmed); 28 further runs on the same and the previous commit passed. `.tmp/sim-diag/make_diag.py` builds an instrumented copy of the simulation that prints that student's taps, acknowledgements, drops and the server's record on the next mismatch.
  Owner, 2026-11-03: off by one is typically a race, solved by architecture, not debugging — if it can't happen by design there's nothing to hunt. Not to be chased with the instrumented copy.
  Seen a second time, 2026-11-03, on branch `landing` (which doesn't touch the game or the instance): `simulate.mjs --tempo` scored one student 59 where 45 was expected, one answer with speed points; two re-runs passed.
