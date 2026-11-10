# classyQuiz

Hosted website for playing quizzes. Whoever wants one makes it from their own
material — exercise sheets, say — with their own AI by naming the site, opens
the file here, and plays it: alone, among friends on their own devices, or run
by a quizmaster for a class or another group on a big screen. Product
definition, constraints and versions: docs/backlog.md.

## Layout

- README.md — public github landing
- docs/ — for people and agents working on the project: backlog.md (the
  product's situation, versions, what is open), design/ (one file per part of
  the site: its purpose, the situation it meets, how the site meets it, what
  isn't known), brand/ (the
  mark: its guidelines, SVG masters and the scripts that draw them), film/
  (the root page's film: its design, its words, and the source and scripts
  that build it into src/public), example/ (the worked example's
  conversation pictures and translated quizzes: the source and the scripts
  that build them into src/public), and working notes.
  src/DEVELOPING.md is for whoever changes the code.
- src/ — the site, in whatever layout its toolchain expects.
- secrets/ — local deploy credentials, git-ignored except its README.

## Docs

Docs carry situation and purpose. Situation is kept current, with one home
per fact and pointers elsewhere; purpose is refined, stated first, and never
displaced by the rules or rulings that came from it — write the purpose and
situation behind a ruling instead. A purpose the sources don't give is asked
for, not supplied. A fact that is assumed rather than observed is written as
a plausible assumption, beside the ruling that rests on it, and dropped if
none does; one that stops looking plausible is raised, not obeyed. History, evidence
and logs are git's: describe what is, not what happened.
