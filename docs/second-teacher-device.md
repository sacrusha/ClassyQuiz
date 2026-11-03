# classyQuiz — A second teacher device once the class is in

> **Superseded in part, 2026-11-03, by the after-upload flow**
> (docs/after-upload.md, draft 5; decisions.md, "After upload: the check,
> the teacher code, one question, Swap"). The teacher code, the class code
> plus two digits, is the gate, before and after the first student alike;
> the class code never reaches a role. So rule 2 (the secret on devices that
> took a role) is no longer needed: the secret stays for Resume and Delete
> on the uploading device only. Rule 3 ("Allow a device to join" and its
> two-minute window) and rule 4 (any device at `/teacher` when nothing
> steers) are gone: a dead phone, a closed tab or a new phone mid-lesson
> types the teacher code again. Rules 1 and 5 hold. The screens and words
> below are as built before; user-flow.md §3 has the current ones.

Backlog v2 item 8. **Revision 2, 2026-11-03.** It narrows the gate in
decisions.md, "One code per quiz, two teacher roles per tab" ("No new
steering once students are in"). Once settled, it goes into user-flow.md §1
rules 5–7, §3.3–3.5 and §5.

**The owner, on revision 1** (a two-digit number and a yes for every
request): "why would a child rejoin at /teacher? Imaginary problems don't
need solving."
- So the guard against a child at `/teacher` is gone, along with the race
  on a mirrored wall that it answered.
- What remains is his original direction: the screen that steers has one
  button that lets the next device in, with no handshake.
- Case 9 (a phone-only start handing the wall to a laptop): allowed, with
  no warning.
- The wall's lobby text before the first student stays as it is.

Terms: the **wall** is the Projector. **Projector + Remote** is the wall
while it steers itself, as named on the lobby's Start button.

## 1. The rules

1. **A tab that holds its role comes back by itself.** This covers sleep,
   Wi-Fi, a reload, and a restored tab. Unchanged.
2. **A device that set the quiz up comes back without the button.** That is
   the device that opened the .zip, and any device that took a role before
   the first student joined.
   - It holds the quiz's secret, which is today the uploading device's
     credential for Resume and Delete.
   - The server sends the secret with a role taken while no student is
     in. The page saves it in the list an upload uses, so the phone's root
     page also shows "Resume Prozente ▶".
   - With the secret, `/teacher` offers a role nobody holds, or whose tab
     is away, as in the lobby. It never pushes aside a tab that is there.
   - The cost is one field in the role reply, one in `takeRole`, and one
     `saveQuiz` call.
3. **"Allow a device to join" on Projector + Remote.** Once the class is
   in, it lets the next device at `/teacher` take the role that is free or
   dropped.
   - The Remote, when none is there.
   - Or the Projector itself, which turns this screen into the Remote (the
     phone-only start).
   - It stays open until one device does, or for 2 minutes. No handshake.
4. **When nobody steers** (the Projector and the Remote both away or
   left), any device at `/teacher` takes a role. Before, Leave on
   Projector + Remote with students in ended the steering for the class,
   and a dead laptop that steered itself could only come back with its
   tab.
5. **A free Projector while a Remote steers** stays open to any device, as
   today. The Remote now says when the Projector is gone, and how to bring
   it back.

## 2. Screens and words

**Projector + Remote, the wall:**
- **Lobby before the first student:** unchanged.
- **Lobby after it:**
  - The line under Start reads "Remote connected ✓", or a button **Allow a
    device to join**.
  - When a Remote was there and is gone, the line is "Remote gone" followed
    by the button.
- **During the quiz:**
  - While a Remote that was there is away, the steering bar carries **Remote
    gone [Allow a device to join]**. Today's 8 s notice stays as well. On a
    phone-sized wall, the bar has no room for it, so it is in ⋯ only.
  - ⋯ has **Allow a device to join** once students are in. Before that, it
    has "Steer from your phone…", as today.
- **While the window is open:** the line, or the bar, reads "One device can
  join: **classyquiz.pages.dev/teacher** and the code. [Close]". When a
  device takes the role, the window closes. The Remote's arrival shows as
  "Remote connected", as today.

**`/teacher`, Remote closed** (the class is in, the window shut): the note
reads "first, on the projector screen: ⋯ Allow a device to join". A device
holding the secret sees the role as free.

**The Remote, Projector gone** (during the quiz too, not only in the lobby):
"Projector gone. On the projector computer: open
classyquiz.pages.dev/teacher, type 63953, choose Projector." On a wide
screen, which is the two-screen laptop whose projector window got closed,
it adds **[Open the projector window]**.

**Confirmations:**
- **"Steer from here"**, while students are in: "The remote stops
  steering. To steer from it again: ⋯ Allow a device to join."
- **"Stop being the remote"**, while students are in:
  - with the secret: "This device can come back at …/teacher";
  - without it: "To come back: on the projector, ⋯ Allow a device to join".
- **Leave on Projector + Remote:** "Nothing steers the quiz until a device
  opens classyquiz.pages.dev/teacher with the code."

## 3. The cases

| Case | What happens |
|---|---|
| The Remote drops and its tab comes back | Unchanged. Meanwhile the wall steers and shows "Remote gone [Allow a device to join]" |
| The Remote died and comes back without its tab, and it was set up in the lobby | Resume on its root page, or `/teacher`: Remote, no button |
| The Remote never connected, or was first let in mid-class, or another phone replaces it | On the wall: Allow a device to join. Then the phone at `/teacher`: Remote |
| The Projector dies while a Remote steers | The Remote says so. The laptop, or any computer, at `/teacher`: Projector, as today. A closed projector window: [Open the projector window] on the Remote |
| The Projector dies while it steered itself | Nobody steers: any device at `/teacher` takes a role |
| A role dropped on purpose | A device that set the quiz up comes back. Otherwise: Allow a device to join, or, if nothing steers now, any device |
| A phone-only start, and the laptop should take the wall | On the phone: Allow a device to join. Then the laptop at `/teacher`: Projector. The phone becomes the Remote |
| "Again with another class" | A lobby without students: everything open, as today |

The tablets see nothing new. A countdown keeps running while the steering
moves.

## 4. Built

See decisions.md, "A second teacher device once the class is in".
