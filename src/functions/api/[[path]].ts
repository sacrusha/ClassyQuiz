// The site's API, as a Pages Function in front of the Durable Objects of the
// state Worker. Only /api/* runs code: Pages generates the routes from this
// folder, so every page and script is a static file, which keeps the Free
// plan's request budget for the quiz itself.
//
//   POST /api/quiz          {text, leaveOut?} upload: parse, create an instance
//   POST /api/quiz          multipart         … with pictures: text, leaveOut?, image files
//   POST /api/join          {code}            join code → instance id
//   GET  /api/i/:id/img/:secret/:n            a picture of the quiz
//   GET  /api/i/:id/ws                        WebSocket to the instance
//   POST /api/i/:id/poll    {auth, v}         long-poll fallback
//   POST /api/i/:id/cmd     {auth, cmd}       command over HTTP (fallback)
//   POST /api/pair/new      {role}            a device asks for a pairing code
//   POST /api/pair/wait     {code, nonce}     … and waits for its grant
//   GET  /api/ping                            network check
//   GET  /api/echo                            network check: WebSocket echo
//   POST /api/attempt       {format}          count an upload attempt by format
//   GET  /api/stats                           upload attempts by format

import { JOIN_CODE, MAX_QUIZ_BYTES, MAX_UPLOAD_BYTES, PAIR_CODE, type UploadResult } from "../../shared/protocol.ts";
import { isUploadFormat } from "../../shared/upload.ts";
import type { Env } from "../../server/env.ts";
import { randomCode, randomToken } from "../../server/random.ts";

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
    if (parts[0] === "pair" && parts[1] === "new") return await pairNew(env, body);
    if (parts[0] === "pair" && parts[1] === "wait") return await pairWait(env, body);
    if (parts[0] === "attempt" && parts.length === 1) {
      await stats(env).count(isUploadFormat(body.format) ? body.format : "other");
      return json({ ok: true });
    }
    return json({ error: "not found" }, 404);
  } catch (e) {
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
  if (!r.ok) return json({ ok: false, errors: r.errors, warnings: r.warnings, missingImages: r.missingImages } satisfies UploadResult);
  return json({ ok: true, id: id.toString(), secret: r.secret } satisfies UploadResult);
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
  const running = await env.INSTANCE.get(env.INSTANCE.idFromString(instance)).hasRun(code);
  if (!running) return json({ error: "code" }, 404);
  return json({ instance });
}

async function toInstance(request: Request, env: Env, id: string, action: string): Promise<Response> {
  if (!/^[0-9a-f]{64}$/.test(id) || !["ws", "poll", "cmd", "img"].includes(action)) return json({ error: "not found" }, 404);
  let doId: DurableObjectId;
  try {
    doId = env.INSTANCE.idFromString(id);
  } catch {
    return json({ error: "not found" }, 404);
  }
  if (action !== "ws") {
    const len = Number(request.headers.get("content-length") ?? "0");
    if (len > 20_000) return json({ error: "too large" }, 413);
  }
  return env.INSTANCE.get(doId).fetch(request);
}

async function pairNew(env: Env, body: Record<string, unknown>): Promise<Response> {
  const role = body.role === "screen" || body.role === "teacher" ? body.role : null;
  if (!role) return json({ error: "role" }, 400);
  const nonce = randomToken();
  for (let i = 0; i < 20; i++) {
    const code = randomCode(6);
    if (await env.PAIR.get(env.PAIR.idFromName(code)).open(role, nonce)) return json({ code, nonce });
  }
  return json({ error: "No free code; try again." }, 503);
}

async function pairWait(env: Env, body: Record<string, unknown>): Promise<Response> {
  const code = typeof body.code === "string" ? body.code : "";
  const nonce = typeof body.nonce === "string" ? body.nonce : "";
  if (!PAIR_CODE.test(code) || !nonce) return json({ expired: true });
  return json(await env.PAIR.get(env.PAIR.idFromName(code)).wait(nonce));
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
  const len = Number(request.headers.get("content-length") ?? "0");
  if (len > MAX_QUIZ_BYTES * 2) return null;
  try {
    const text = await request.text();
    if (text.length > MAX_QUIZ_BYTES * 2) return null;
    const v = JSON.parse(text);
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
