# Teacher devices

## Purpose

The teacher steers a quiz while the class watches the big screen, the
**Projector**, and plays on its tablets; the teacher's own steering view is
the **Remote**.

Bringing in a second teacher device: easy to go right, hard to go wrong. A
teacher who starts on the phone and ends on the
laptop, or the other way round, or whose phone died, gets the quiz onto the
device they want without learning terms or steps, and a misclick is
recoverable from either device. Outside scripts must not be able
to take the steering of a quiz because they know its class code.

Before the class joins, the teacher sees at once that this is the right quiz
and can spot a wrong key: the run is the review (backlog, Project), and the
lobby's check is where a wrong key is caught
before it reaches the wall.

The same screens serve a host who runs a quiz for a crowd that isn't a class
(Quizmaster): a pub, a family, a training room, a video
call. Such a host needs the screens to read as theirs, and to be shown only
the setup they have: some steer from a phone, many from the one screen
everyone sees.

## Situation

Who teaches and with which devices is in `backlog.md` (Project,
Constraints). What bears on this part:

- **One to three devices:** a laptop that is also the projector (shared or
  mirrored), a phone, sometimes a tablet. Sharing and not sharing a screen
  is a button press, sometimes with the fn modifier; less technically adept
  users use the cable or the button on the big screen. Every teacher uses
  the laptop for shared and not shared sections. A big all-in-one touch screen as the wall leaves nothing private.
- **Both directions are real.** Snapping pictures of hand-drawn notes,
  feeding them into the AI, downloading the zip and opening the quiz all on
  the phone, then connecting the projector, is a powerful workflow; so is
  doing the same with a PDF or document from the laptop that serves as
  projector or hybrid. Some teachers set up before the students are
  involved, some join the remote on the last screen in parallel with them.
  By the time a second device arrives, the teacher knows projector and
  remote and which this device is.
- **The site cannot sense the setup.** Second-screen detection is
  unreliable; how it works with phones and Miracast is unknown. Laptops
  might gain the second screen only after the check, and window size
  differs from screen size. Tablets sit in between and share all of these
  complications.
- **Drops are rare and teachers are not trained for them.** Expected: a
  device loses its connection and comes back
  with its role; a phone's battery dies and the teacher carries on from the
  laptop; a dead projector means reading the questions off the remote and
  improvising. Both devices dying ends the quiz.
- **The attacker** is the backlog's (Project). Children may take the remote
  by accident: whatever the wall shows, a pupil can type.
- **Addresses.** Everyone behind a school's NAT shares one address, the
  teacher's own devices included. Cloudflare sets `cf-connecting-ip`, and a
  request that sets it itself gets Cloudflare's 403 (seen on a copy of the
  site, 2026-11-09).
- **Arrangements of screens:** a screen and a remote (the example class's
  laptop on the projector and the teacher's phone); one screen that steers
  itself, by its bar, the keyboard or a clicker; devices only, the question
  on each player's device and no wall (Peers' room, `peers.md`; not
  built for a steered room). A video call that shares a window has a big
  screen: the shared window. A teacher at a mirrored laptop, a pub host at
  the TV and a trainer in a call need no remote.
- **Words that name the classroom's roles** (teacher, class, "your
  teacher") tell a host who isn't a teacher that the screens are someone
  else's (`root-page.md`, "Words for whoever comes"). This file speaks of
  the example class.
- **A Quizmaster reaches the lobby, as a rule, without having seen the
  questions:** the local check keeps them folded for whoever will play
  (`local-check.md`).
- Plausible assumptions the lobby rests on: the number of questions is what
  most often tells two versions of a quiz apart; a phone that uploads first
  is nearly never the one screen, and a laptop or phone is used the same way
  lesson after lesson (the arrangement defaults to a remote and is
  remembered per browser).

## Not known

- Whether teachers read "63953 47" as theirs and "63953" as the class's,
  and whether the words (Big screen, Remote, Show the quiz here, Steer it
  from here, A second device, Swap, ‹ Back, Join code, Let everyone in, Ask
  whoever runs it) are the ones teachers and hosts reach for; no one outside
  the project has read them.
- Whether hosts read the arrangement toggle as a question about their
  setup, and whether a host at one screen takes the remote's how-to for a
  step they must take.
- How a phone's browser behaves while casting by Miracast; whether 45 s
  without a sign from the Remote, after which the wall steers again
  (`FRESH_MS`), suits a phone in a pocket in a lesson, and whether a throttled hidden
  projector tab is wrongly counted away.
- How often teachers upload at the front with the class waiting, where
  opening on the check costs a tap every lesson.
- Whether the limit on wrong teacher codes works against a real attacker on
  Cloudflare.
