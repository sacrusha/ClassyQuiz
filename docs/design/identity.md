# The site's identity

## Purpose

A teacher deciding whether to rely on the site in front of a class meets one
product, made on purpose: the same name and mark, the same paper, ink and
type on every page they pass through, from the landing to the wall.

## Situation

- The mark is the avatars' fox in a top hat; its drawings, files and sizes
  are `docs/brand/README.md`.
- The answers are marked with Kahoot's colours and shapes
  (`class-and-wall.md`). Plausible assumption: children who know Kahoot
  read them at once. The teacher's controls stand beside the answer tiles
  on the wall's bar and on the Remote, where a control with a hue can be
  taken for an answer; the site's controls are ink, which has none.
- Projectors wash dark backgrounds out. The wall stays light; pages for a
  teacher follow the device's dark mode.
- The wall fits a question and its answers by measuring them
  (`client/stage.ts`, `layQuestion`), and quiz text is in any language and
  script, so a quiz's own words are in the device's system font: a webfont
  that arrives after the first measure would leave a wrong fit. The brand
  face (Rubik Bold, self-hosted) is subset to Latin, which covers the
  languages the site's own words are in now.
- Teachers' AIs fetch the root page to read its guidance, so the mark drawn
  inline in its header is written after the guidance and referenced by
  `<use>` (`<!--#brand-use-->`, `scripts/build.mjs`).
- Plausible assumption: school laptops run Chromium browsers, which take
  the SVG tab icon; so the `.ico` and the touch icon have no keyline for a
  dark tab strip.

## The maker's name

Purpose: classyQuiz is teaching material for Graculus, the
owner's personal training in instructing AI (graculus.ch): creative AI uses
for creative quizzes, a vibecoded page, an embedded skill, an AI training
video. The association isn't hidden, and classyQuiz is a way back to
graculus.ch for someone who comes from that material, as from a Graculus
video to classyQuiz to graculus.ch. The root page's About names the maker,
linked to graculus.ch (`root-page.md`).

## Not known

- Whether teachers read the answer marks as Kahoot's, and whether that helps
  or costs trust; nobody has asked one.
- The ink controls and the rust accent on a real washed-out projector, and
  on Android and iPad (seen in Edge on Windows only).
- Which icon each browser puts in its tab.
