# classyQuiz

Hosted website for live classroom quizzes. A teacher makes the quiz from
exercise sheets with their own AI by naming the site, uploads it, and the class
plays it on the projector and their own devices. Product definition,
constraints and versions: docs/backlog.md.

## Layout

- README.md — public github landing
- docs/ — for people and agents working on the project: backlog.md (the
  product's situation, versions, what is open), design/ (one file per part of
  the site: its purpose, the situation it meets, how the site meets it, what
  isn't known), user-flow.md (the screens and their words), brand/ (the
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
none does; one that stops looking plausible is raised, not obeyed. The example
class is the design target, a decision, not an assumption. History, evidence
and logs are git's: describe what is, not what happened.
