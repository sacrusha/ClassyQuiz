// The final ranking on the wall (docs/design/class-and-wall.md, "The final
// ranking"): its own screen, not the intermediate ranking with a trophy.
// Places 1 to 3 on a podium, everyone else in front of it as a crowd (no
// rank below the podium; look.ts, crowdPlaces), the class's result beside
// it, and all of them jumping. It stays as it is until the teacher's Exit, so it can be
// photographed.

import type { Avatar, RankingView, ScreenView } from "../shared/protocol.ts";
import { esc } from "./dom.ts";
import { ICON, avatarSvg, crowdHeight, crowdPlaces, finalSize } from "./look.ts";

/** One avatar, cheering: the delay comes from its id, so a view arriving again draws the same html and the jumps go on undisturbed. */
function cheer(id: string, avatar: Avatar): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `<span class="cheer" data-id="${esc(id)}" style="animation-delay:${((h % 1000) / 1000 * -1.6).toFixed(2)}s">${avatarSvg(avatar)}</span>`;
}

/** Sizes the final ranking to the stage it has and stands the crowd; again on every view and resize, since the html may be the same. */
export function fitFinal(root: ParentNode): void {
  const stage = root.querySelector<HTMLElement>(".finalstage");
  if (!stage) return;
  const crowd = stage.querySelector<HTMLElement>(".crowdfront");
  const members = crowd ? [...crowd.querySelectorAll<HTMLElement>(".cheer")] : [];
  const box = stage.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return;
  const { a, s } = finalSize(members.length, box.width, box.height);
  stage.style.setProperty("--a", `${a}px`);
  stage.style.setProperty("--av", `${s}px`);
  if (!crowd) return;
  crowd.style.height = `${crowdHeight(members.length, box.width, s)}px`;
  const places = crowdPlaces(members.map((m) => m.dataset.id ?? ""), box.width, s);
  members.forEach((m, i) => {
    const p = places[i];
    m.style.left = `${p.x.toFixed(1)}px`;
    m.style.top = `${p.y.toFixed(1)}px`;
    m.style.width = m.style.height = `${p.size.toFixed(1)}px`;
    m.style.zIndex = String(p.z);
  });
}

window.addEventListener("resize", () => fitFinal(document));

function step(r: RankingView, place: number): string {
  const here = r.top.filter((e) => e.place === place);
  if (here.length === 0) return `<div class="place s${place} empty"><div class="block"></div></div>`;
  const score = `${ICON.star} ${here[0].score}${r.speed ? "" : ` / ${r.of}`}`;
  return `<div class="place s${place}">
    <div class="avs">${here.map((e) => cheer(e.id, e.avatar)).join("")}</div>
    <div class="score">${score}</div>
    <div class="block"><span>${place}</span></div>
  </div>`;
}

export function finalHtml(v: ScreenView): string {
  const r = v.ranking;
  if (!r) return "";
  const pct = r.given > 0 ? Math.round((100 * r.right) / r.given) : 0;
  const onPodium = new Set(r.top.map((e) => e.id));
  const crowd = v.players.filter((p) => !onPodium.has(p.id));
  return `
    <div class="bar"><span class="grow">${esc(v.title)}</span><span>${ICON.trophy}</span></div>
    <div class="final">
      <div class="finalstage">
        <div class="podium">${step(r, 2)}${step(r, 1)}${step(r, 3)}</div>
        ${crowd.length ? `<div class="crowdfront">${crowd.map((p) => cheer(p.id, p.avatar)).join("")}</div>` : ""}
      </div>
      <div class="classres">
        <div class="pct">${pct}%</div>
        <div class="muted">${ICON.check} ${r.right} / ${r.given}</div>
        <div class="bars">${r.perQuestion.map((p) => `<span><i style="height:${p.given ? (100 * p.right) / p.given : 0}%"></i></span>`).join("")}</div>
      </div>
    </div>`;
}
