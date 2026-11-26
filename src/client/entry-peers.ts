// Peers: the quiz goes up as a room that runs on its
// own, and this tab joins it as its first player.

import { esc, playerKey, store } from "./dom.ts";
import type { Entry } from "./entries.ts";
import { TEXT } from "./landing-text.ts";
import { openRoom, type RoomResult } from "./opening.ts";
import { roomRefusal } from "./refusal.ts";
import { T, lang } from "./room-text.ts";

export const peers: Entry = {
  name: "Peers",
  line: T.peersLine,
  picture: "/landing/way-peers.svg",
  pictureAlt: T.picPeers,
  button: T.peersButton,
  note: T.peersRoomNote,
  plays: true,
  async start(quiz, ctx) {
    ctx.say(`<p class="muted" lang="${lang}">${esc(TEXT[lang].sending)}</p>`);
    let r: RoomResult;
    try {
      r = await openRoom(quiz, "peers");
    } catch {
      ctx.say(roomRefusal(null));
      return;
    }
    if (!r.ok) {
      ctx.say(roomRefusal(r));
      return;
    }
    if (!r.player) {
      // A site from before Peers took the quiz as a steered room.
      ctx.say(roomRefusal({ ok: false, errors: [], warnings: [], error: T.peersNotHere }));
      return;
    }
    // The player page comes back as this player, as a reloaded device does.
    store.set(playerKey(r.code), { instance: r.id, token: r.player });
    // Replaced, not followed: Back from the room passes this page, where the
    // same button would open a second room.
    location.replace(`/play#${r.code}`);
  },
};
