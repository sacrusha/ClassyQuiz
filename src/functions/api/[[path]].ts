// The site's API, as a Pages Function in front of the Durable Objects of the
// state Worker. Only /api/* runs code: Pages generates the routes from this
// folder, so every page and script is a static file, which keeps the Free
// plan's request budget for the quiz itself.
//
//   POST /api/quiz          {text, leaveOut?} upload: parse, create an instance
//   POST /api/quiz          multipart         … with pictures: text, leaveOut?, image files
//   POST /api/join          {code}            the quiz's code → instance id
//   GET  /api/i/:id/img/:secret/:n            a picture of the quiz
//   GET  /api/i/:id/ws                        WebSocket to the instance
//   POST /api/i/:id/poll    {auth, v}         long-poll fallback
//   POST /api/i/:id/cmd     {auth, cmd}       command over HTTP (fallback)
//   POST /api/i/:id/info    {secret}          the pasting device: title, code, when it closes
//   POST /api/i/:id/end     {secret}          the pasting device: delete the quiz now
//   GET  /api/ping                            network check
//   GET  /api/echo                            network check: WebSocket echo
//   POST /api/attempt       {format}          count an upload attempt by format
//   GET  /api/stats                           upload attempts by format

import { JOIN_CODE, MAX_QUIZ_BYTES, MAX_UPLOAD_BYTES, type UploadResult } from "../../shared/protocol.ts";
import { isUploadFormat } from "../../shared/upload.ts";
import { isQuotaError } from "../../shared/limits.ts";
import type { Env } from "../../server/env.ts";

interface Ctx {
  request: Request;
  env: Env;
}

export const onRequest = async ({ request, env }: Ctx): Promise<Response> => {
  const url = new URL(request.url);
  const parts = url.pathname.replace(/^\/api\//, "").split("/");
  try {
    if (parts[0] === "ping") return json({ ok: true, t: Date.now() });
    if (parts[0] === "echo") return echo(request);
    if (parts[0] === "stats" && request.method === "GET") return json(await stats(env).read());
    if (parts[0] === "i" && parts.length === 3) return await toInstance(request, env, parts[1], parts[2]);
    if (parts[0] === "i" && parts.length === 5 && parts[2] === "img" && request.method === "GET") return await toInstance(request, env, parts[1], "img");
    if (request.method !== "POST") return json({ error: "not found" }, 404);
    if (parts[0] === "quiz" && parts.length === 1 && /^multipart\/form-data/i.test(request.headers.get("content-type") ?? "")) return await uploadWithImages(request, env);
    const body = await readJson(request);
    if (body === null) return json({ error: "The request was too large or not readable." }, 400);
    if (parts[0] === "quiz" && parts.length === 1) return await upload(env, body);
    if (parts[0] === "join" && parts.length === 1) return await join(env, body);
    if (parts[0] === "attempt" && parts.length === 1) {
      await stats(env).count(isUploadFormat(body.format) ? body.format : "other");
      return json({ ok: true });
    }
    return json({ error: "not found" }, 404);
  } catch (e) {
    // The account's daily allowance is spent (a best reading of an
    // undocumented error, decisions.md): the page says so and when it comes
    // back, instead of looking like a network problem.
    if (isQuotaError(e)) return json(parts[0] === "quiz" ? { ok: false, errors: [], warnings: [], error: "quota" } : { error: "quota" }, 503);
    // No request content in logs (decisions.md); the message only.
    console.error("api error", parts[0], e instanceof Error ? e.message : "unknown");
    return json({ error: "Something went wrong on the server. Try again." }, 500);
  }
};

async function upload(env: Env, body: Record<string, unknown>): Promise<Response> {
  if (typeof body.text !== "string" || body.text.trim() === "") return json({ ok: false, errors: [{ message: "The quiz text is empty." }], warnings: [] });
  // Parsed in the Durable Object, which has the CPU time for a long quiz;
  // with errors, nothing is stored and the id is never used again.
  const id = env.INSTANCE.newUniqueId();
  const r = await env.INSTANCE.get(id).create(body.text, [], body.leaveOut === "missing");
  if (!r.ok) return json({ ok: false, errors: r.errors, warnings: r.warnings, missingImages: r.missingImages, error: r.error } satisfies UploadResult);
  return json({ ok: true, id: id.toString(), secret: r.secret, code: r.code, token: r.token } satisfies UploadResult);
}

/**
 * The upload with pictures goes to the new instance unread: a Function on
 * the Free plan has 10 ms of CPU, too little to take apart a few megabytes
 * of multipart; the Durable Object has the time, and answers the same JSON.
 */
async function uploadWithImages(request: Request, env: Env): Promise<Response> {
  const len = Number(request.headers.get("content-length") ?? "NaN");
  if (!(len <= MAX_UPLOAD_BYTES)) return json({ ok: false, errors: [{ message: "The quiz with its pictures is too large for the site." }], warnings: [] }, 413);
  return env.INSTANCE.get(env.INSTANCE.newUniqueId()).fetch(request);
}

async function join(env: Env, body: Record<string, unknown>): Promise<Response> {
  const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
  if (!JOIN_CODE.test(code)) return json({ error: "code" }, 404);
  const instance = await env.JOIN.get(env.JOIN.idFromName(code)).resolve();
  if (!instance) return json({ error: "code" }, 404);
  const opens = await env.INSTANCE.get(env.INSTANCE.idFromString(instance)).opens(code);
  if (!opens) return json({ error: "code" }, 404);
  return json({ instance });
}

async function toInstance(request: Request, env: Env, id: string, action: string): Promise<Response> {
  if (!/^[0-9a-f]{64}$/.test(id) || !["ws", "poll", "cmd", "img", "info", "end"].includes(action)) return json({ error: "not found" }, 404);
  let doId: DurableObjectId;
  try {
    doId = env.INSTANCE.idFromString(id);
  } catch {
    return json({ error: "not found" }, 404);
  }
  if (request.method === "POST") {
    // Read here, capped: a body sent without a length (chunked) would
    // otherwise reach the instance whole, and a big one could take down a
    // class's instance mid-lesson.
    const body = await readCapped(request, MAX_COMMAND_BYTES);
    if (body === null) return json({ error: "too large" }, 413);
    return env.INSTANCE.get(doId).fetch(new Request(request.url, { method: "POST", headers: { "content-type": "application/json" }, body }));
  }
  return env.INSTANCE.get(doId).fetch(request);
}

/** A command, a poll, or the pasting device's info/end call. */
const MAX_COMMAND_BYTES = 20_000;

/** The body as text, or null past `max` bytes, whatever the request says its length is. */
async function readCapped(request: Request, max: number): Promise<string | null> {
  const len = Number(request.headers.get("content-length") ?? "0");
  if (len > max) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

function stats(env: Env) {
  return env.STATS.get(env.STATS.idFromName("uploads"));
}

function echo(request: Request): Response {
  if (request.headers.get("Upgrade") !== "websocket") return json({ error: "expected a WebSocket" }, 426);
  const pair = new WebSocketPair();
  const server = pair[1];
  server.accept();
  let n = 0;
  server.addEventListener("message", (e) => {
    if (++n > 20) return server.close(1000, "enough");
    server.send(typeof e.data === "string" ? e.data : "binary");
  });
  return new Response(null, { status: 101, webSocket: pair[0] });
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const text = await readCapped(request, MAX_QUIZ_BYTES * 2);
  if (text === null) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
