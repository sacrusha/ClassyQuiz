// A device that should steer a quiz uploaded elsewhere (the phone, when the
// quiz was pasted on the laptop; or a phone replacing one whose battery
// died). It shows a code; the device holding the quiz types it in. Seeing
// the code gives nobody anything (decisions.md, "Pairing").

import type { Grant } from "../shared/protocol.ts";
import { $, saveQuiz } from "./dom.ts";
import { api } from "./net.ts";

const box = $("#box");

async function run(): Promise<void> {
  for (;;) {
    let code: string, nonce: string;
    try {
      const r = await api<{ code: string; nonce: string }>("/api/pair/new", { role: "teacher" });
      if (!r.body.code) throw new Error();
      ({ code, nonce } = r.body);
    } catch {
      box.innerHTML = `<p class="muted">No connection to the site yet. Retrying…</p>`;
      await new Promise((res) => setTimeout(res, 3000));
      continue;
    }
    box.innerHTML = `<div class="codebig" style="font-size:3rem;font-weight:800;letter-spacing:.1em">${code}</div>
      <p>On the device that has the quiz, open <strong>Connect the projector · other devices</strong> and type this code. If that device is gone (battery), type it at the projector computer instead: press <strong>C</strong> there.</p>
      <p class="muted">The code is good for 10 minutes.</p>`;
    for (;;) {
      let r: { grant?: Grant; waiting?: true; expired?: true };
      try {
        r = (await api<typeof r>("/api/pair/wait", { code, nonce })).body;
      } catch {
        await new Promise((res) => setTimeout(res, 2000));
        continue;
      }
      if (r.grant && r.grant.role === "teacher") {
        saveQuiz({ id: r.grant.instance, secret: r.grant.secret, title: "", at: Date.now() });
        location.href = `/teach?q=${r.grant.instance}`;
        return;
      }
      if (r.expired) break;
      // Neither a grant nor "still waiting": an error page; don't hammer the site.
      if (!r.waiting) await new Promise((res) => setTimeout(res, 3000));
    }
  }
}

void run();
