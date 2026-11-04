# Connections

## Purpose

A lesson goes on when a connection drops, a phone goes to sleep or a device
dies. From the backlog's constraint "Survives school Wi-Fi": "Failure in front
of the class ends adoption." A teacher who sees the quiz stumble once in front
of thirty children does not use it again. The constraint itself is in
`backlog.md` (Constraints); this file says how the site meets it.

For a student the aim is that nothing needs doing: a device that comes back
shows the same avatar, the same score and the current screen. For a teacher it
is that a step is never skipped or counted twice because a tap was sent
twice, and that a flaky line never costs a question.

## Situation

- School networks are hostile to long-lived connections. Some filters block
  the WebSocket upgrade; others accept it and then drop every frame. NAT
  tables and proxies drop idle sockets.
- Phones and tablets sleep mid-lesson and come back minutes later. A battery
  can die with the socket still open, so the server sees silence rather than a
  close.
- A deploy or a Durable Object restart in the middle of a run is the same
  situation from the server's side. The backlog notes nobody has tested it
  yet.
- A student whose device died joins again as a new player (or picks their
  avatar back, `class-and-wall.md`). When they do not pick it back, the earlier
  score is lost: that is accepted because it is rare, the ranking is
  "somewhat anonymous" (the owner's words) and grading is unlikely.
- A lesson is 45 minutes. Tablets are often left on afterwards.
- The free plan has a daily allowance (`hosting-and-limits.md`). Every open
  connection or poll spends some of it.

## How the site meets it

### State lives in one place, views are sent whole

One Durable Object per quiz instance (`server/instance.ts`) holds the quiz,
the teacher's fixes and the current run with its players and answers. Every
change is written before it is acknowledged, so a restarted object loses
nothing.

The server sends each device the complete view for its role (projector,
teacher, student), never a diff (`shared/protocol.ts`). A device that slept
just draws the newest one. Scores are never stored; they are computed from
answers plus fixes. That is why a changed key moves the points, and why speed
scoring needs only the answer times already recorded (`question-flow.md`).

### Transport: WebSocket first, long-polling when the network breaks it

The line is `Line` in `src/client/net.ts`; the same messages and views travel
either way.

- WebSocket first, hibernating on the server, so an idle instance costs
  nothing.
- The client pings every 20 s (`PING_EVERY`). The runtime answers `pong`
  without waking the object (`setWebSocketAutoResponse`) and notes the time;
  the server uses that time to tell a present device from one that is away
  (`FRESH_MS`, 45 s, in `server/instance.ts`). No pong within 8 s
  (`PONG_WITHIN`) means the line is dead and the device reconnects.
- Waking, coming back online, a page restored from the cache or the tab
  becoming visible reconnects at once rather than waiting out the backoff
  (0.5 s doubling to 5 s). A socket that looks open after sleep is tested with
  a ping first.
- A socket counts as working only once a message has arrived through it, not
  when it opened. One that stays silent for 8 s (`FIRST_MESSAGE_WITHIN`)
  counts as failed. After three failures in a row the page switches to HTTP
  long-polling for the rest of its life; it does not go back to WebSocket.
  The quiz then runs a moment slower.
- Long-polling: a poll is held up to 25 s (`POLL_HOLD_MS`) until the device's
  view changes. Polls never follow each other closer than 300 ms
  (`MIN_POLL_GAP`); a quick empty answer waits 1.5 s. A device with no player
  yet (choosing an avatar or a role) is held like any other poller, until the
  choices on offer change. When a tab changes identity (a guest becomes a
  player) the held poll is let go and asked again as the new one.
- Server-Sent Events were rejected: proxies buffer them too, commands would
  still need POST, and they do not hibernate.

### Everything a device sends is safe to repeat

Commands are kept by the client until the server acknowledges them and are
resent after a reconnect. A double tap, or a retry after a dropped line, never
skips a question or counts twice, because each kind of command is idempotent:

- Step commands (`play`, `lastCall`, `begin`, ...) name the state they were
  pressed in (`At`); the server ignores them once the quiz has moved on.
- Answers carry a sequence number; a late older one changes nothing. An
  answer given just before the phone slept is therefore not lost.
- Fixes set a value rather than toggle one.
- Starting a class ("Again with another class") names the state it was
  given in and acts only from the final ranking, so a resend cannot wipe a
  class that has started joining.
- A join remembers its command id, so a resent join gets the same player, not
  a second avatar (`run.joins` in `server/instance.ts`; the newest
  `JOINS_KEPT` are kept).

Taps that looked in time but arrived late, and answers settling, are in
`question-flow.md`. Rejoining with an avatar is in `class-and-wall.md`.

### Devices left on

A tab whose view has not changed for 45 minutes (`SLEEP_AFTER_MS`,
`shared/limits.ts`) goes to sleep: the line closes, the wake lock is released
and "Tap to continue" covers the page. A lesson is 45 minutes and in a running
quiz the view changes with every step, so a live class never sleeps; a tablet
left on after the lesson stops costing requests all day.

- The waking tap or key does not reach the page, so it presses nothing and
  cannot advance the quiz from a clicker. Coming back to the tab (a tablet
  switched on) wakes it too.
- A page's own timers (the `tick` command) neither count as activity nor wake
  it. Any other command is someone at the device and does.
- It lives in `client/net.ts`, so it covers every page with a line, the
  picture screens included.

### The allowance spent

When the account's daily allowance is spent, devices say so instead of showing
the offline dot. The words, with the hour it comes back computed in Swiss time,
are `quotaMessage` in `shared/limits.ts`; joining and uploading on the root
page show the same words. The cap itself and what the budget is made of are in
`hosting-and-limits.md`.

- The Function maps a platform error whose message reads like a spent limit
  (`isQuotaError`: "free tier", "daily limit", "quota") to `{error: "quota"}`
  with status 503.
- An instance whose write fails that way answers `{t: "quota"}` and reloads
  its state from storage, so nothing shows that is not stored.
- The client also takes a 429, or a response body mentioning error 1027, as
  spent (`readApi` in `client/net.ts`).
- While spent, a device asks again once a minute (`QUOTA_RETRY`), not every
  few seconds. The notice goes once something is stored or an HTTP call
  succeeds again.

### Bodies without a length

Every POST to an instance (command, poll, info, end) is read in the Function
and capped at 20 KB (`MAX_COMMAND_BYTES`), whatever its Content-Length says,
then forwarded as text. JSON uploads are capped likewise at twice the quiz
limit (`MAX_QUIZ_BYTES`). Without this a chunked body reached the instance
whole, and a large one could have reset a class's instance mid-lesson. Uploads
with pictures already need a length.

## Not known

- Whether dead devices are common in real classes; if they are, losing the
  score of a student who does not pick their avatar back may not stay
  acceptable.
- A deploy or Durable Object restart during a run has not been tested.
- The wording of the platform's spent-limit error is a best reading, matched
  on "free tier", "daily limit", "quota". What Cloudflare returns once Pages
  Functions pass their requests is undocumented (the Workers documentation
  names error 1027; status and Pages behaviour are not). To check in the
  dashboard the first time it happens.
