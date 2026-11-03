# Known bugs

Bugs in what is built, as distinct from backlog omissions. Remove an entry when fixed.


- 2026-11-03, seen in the after-upload walk, not fixed: on a 360 px wall, squeezed answer tiles break a number inside its digit group ("646 00" over "0"); `fitTiles` breaks inside words at its smallest size, and the no-break space between digit groups doesn't stop it.

- 2026-11-03, seen once, not reproduced: a plain `simulate.mjs` run scored one student 4 where 3 was expected (the server counted an answer the simulated tablet never saw confirmed); 28 further runs on the same and the previous commit passed. `.tmp/sim-diag/make_diag.py` builds an instrumented copy of the simulation that prints that student's taps, acknowledgements, drops and the server's record on the next mismatch.
