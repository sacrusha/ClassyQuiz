# Pictures

## Purpose

Most exercise sheets have pictures, and for many the figure is the
exercise. The question on the big screen is what makes the quiz feel
interactive, with no need for it on the voting devices. A picture can also
be a choice itself, and then every device needs it.

## Situation

- Pictures come in the quiz's `.zip`. A teacher whose AI can't make a zip
  has no way to bring pictures (backlog, Later).
- The AI writes the picture lines and can't see the wall, so the page lays
  out pictures, not the AI or the teacher; the guidance page carries what an
  AI can't derive (`guidance-page.md`).
- Real sheets give wide strips (number lines, 6:1 to 2.6:1), squares,
  upright figures and photos, and often a run of questions with the same
  text ("Welche Zahl ist mit dem Pfeil markiert?"), which the teacher's
  question list tells apart only by the picture.
- Plausible assumption: the projector is read from the back row, eight to
  ten metres away; a blurry figure reads better there than a small one.
- Phone photos are several MB and carry the camera, time and GPS. Redrawing
  in the teacher's browser drops that and shrinks them, and leaves the
  server PNG and JPEG only, so no SVG with its scripts is ever served. The
  server checks every file again.
- A shared school laptop keeps nothing once the page is closed, so pictures
  are served `no-store`, and each page fetches each picture once into a
  blob URL.
- The Free plan's limits bind every request and stored byte
  (`hosting-and-limits.md`, "The plan"); a Function can't parse an upload
  in its CPU time, so the quiz's Durable Object does. A class of 25
  fetching per picture on 15 questions with picture answers would be 1,500
  requests, so a device fetches the small copies in packs.
- Every student device knows the instance id, so the pictures need their
  own secret, and the students' devices get one that opens only the packs.
- A transparent answer picture shows its tile's colour, which is shuffled
  with the answers.

## Not known

- How large a question picture or an answer picture reads from the back row
  on a real projector; the layouts were judged on drawn and sample quizzes
  only.
- Whether teachers find enlarging by `Z` and the click, or only the
  Remote's button.
- Whether the quiz's background at the lobby and the rankings is liked.
- Whether AIs crop tighter, leave pupils' writing out of the crop, and draw
  a question's answer pictures alike, with the guidance as it stands.
- How children take pictures on their tablets.
- Whether picture lines after the answers, an error since they may be meant
  for the next question, are common enough that the error costs more round
  trips than a guess would cost wrong figures.
