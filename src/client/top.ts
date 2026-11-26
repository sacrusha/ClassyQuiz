import { JOIN_CODE, TEACHER_CODE } from "../shared/protocol.ts";
import { $, esc, store } from "./dom.ts";
import { LANG_KEY, LANGS, type Lang } from "./landing-text.ts";

/** Never submits by itself, so typing a seven-digit teacher code isn't cut off at five. */
export function codeBox(): void {
  const join = $("#join") as HTMLFormElement;
  const codeInput = $("#code") as HTMLInputElement;
  join.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = codeInput.value.replace(/\D/g, "");
    if (JOIN_CODE.test(code) || TEACHER_CODE.test(code)) location.href = `/play#${code}`;
    else {
      codeInput.focus();
      codeInput.select();
    }
  });
  codeInput.addEventListener("input", () => {
    const code = codeInput.value.replace(/\D/g, "");
    if (code !== codeInput.value) codeInput.value = code;
  });
}

/** Made here, not in the HTML, so an AI's fetcher doesn't read four language
 *  names. The returned function shows `l`, with `label` as the switch's name
 *  in that language. */
export function langSwitch(onPick: (l: Lang) => void): (l: Lang, label: string) => void {
  const box = document.createElement("label");
  box.className = "lang";
  const shown = document.createElement("span");
  const select = document.createElement("select");
  select.innerHTML = LANGS.map((l) => `<option value="${l.id}" lang="${l.id}">${esc(l.name)}</option>`).join("");
  box.append(shown, select);
  $("header.top .bar").append(box);
  select.addEventListener("change", () => {
    const next = LANGS.find((l) => l.id === select.value)?.id;
    if (!next) return;
    store.set(LANG_KEY, next);
    onPick(next);
  });
  return (l, label) => {
    select.value = l;
    shown.textContent = `${l.toUpperCase()} ▾`;
    box.title = label;
    select.setAttribute("aria-label", label);
  };
}
