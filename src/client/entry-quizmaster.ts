// Quizmaster (backlog v5 item 4): someone runs the quiz for a class or a
// group, the questions on a big screen, the answers on everyone's own
// device. Built as the classroom's lobby: opening it uploads the quiz, and
// this tab becomes the Projector on the lobby's check
// (docs/design/teacher-devices.md, "The single tab: check, then join").

import { esc, tabLobby, tabRole } from "./dom.ts";
import type { Entry } from "./entries.ts";
import { TEXT } from "./landing-text.ts";
import { openRoom, type RoomResult } from "./opening.ts";
import { roomRefusal } from "./refusal.ts";
import { T, lang } from "./room-text.ts";

export const quizmaster: Entry = {
  name: "Quizmaster",
  line: T.quizmasterLine,
  button: T.quizmasterButton,
  note: T.roomNote,
  plays: false,
  async start(quiz, ctx) {
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
