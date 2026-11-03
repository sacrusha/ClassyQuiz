# Known bugs

Bugs in what is built, as distinct from backlog omissions. Remove an entry when fixed.


- 2026-11-03, seen by an implementer, not fixed: on a 360 px self-steering wall the steering bar shows a stray "1" where the code is cut off (layout from the −5/+5 work).

- 2026-11-03, seen once, not reproduced: a plain `simulate.mjs` run scored one student 4 where 3 was expected (the server counted an answer the simulated tablet never saw confirmed); 28 further runs on the same and the previous commit passed. `.tmp/sim-diag/make_diag.py` builds an instrumented copy of the simulation that prints that student's taps, acknowledgements, drops and the server's record on the next mismatch.
  Owner, 2026-11-03: off by one is typically a race, solved by architecture, not debugging — if it can't happen by design there's nothing to hunt. Not to be chased with the instrumented copy.
