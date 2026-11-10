// Quizmaster (backlog v5 item 4): someone runs the quiz for a class or a
// group, the questions on a big screen, the answers on everyone's own
// device. Built as the classroom's lobby: opening it uploads the quiz, and
// this tab becomes the Projector on the lobby's check
// (docs/design/teacher-devices.md, "The single tab: check, then join").

import { esc, tabLobby, tabRole } from "./dom.ts";
import type { Entry } from "./entries.ts";
import { TEXT } from "./landing-text.ts";
import { openRoom, roomRefusal, visitorLang, type RoomResult } from "./opening.ts";

export const quizmaster: Entry = {
  name: "Quizmaster",
  line: "For a class or a group: the questions on a big screen, the answers on everyone's own device. You run it and don't play.",
  button: "Open the lobby ▶",
  note: "Sends the quiz to the site, into a room that only people with its code can join. The room is deleted when you end it, or three hours after its last use.",
  plays: false,
  async start(quiz, ctx) {
    const lang = visitorLang();
    ctx.say(`<p class="muted" lang="${lang}">${esc(TEXT[lang].sending)}</p>`);
    let r: RoomResult;
    try {
      r = await openRoom(quiz);
    } catch {
      ctx.say(roomRefusal(null));
      return;
    }
    if (!r.ok) {
      ctx.say(roomRefusal(r));
      return;
    }
    // This tab is the Projector that steers itself; it opens on the lobby's check
    // (docs/design/teacher-devices.md, "The single tab: check, then join").
    tabRole.set(r.id, { role: "screen", token: r.token, code: r.code, teacher: r.teacher });
    tabLobby.set(r.id, "check");
    // Replaced, not followed: Back from the lobby passes this page, where the
    // same button would put up a second quiz.
    location.replace(`/screen?q=${r.id}`);
  },
};
