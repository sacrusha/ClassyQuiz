import { test } from "node:test";
import assert from "node:assert/strict";
import { addClass, foldDay, type ClassUse, type DayRecord, EDGES } from "../server/telemetry.ts";
import { bucketLabels, objectRequests, pollGbSeconds, realClasses, sumUse } from "./owner-figures.ts";

const klass = (over: Partial<ClassUse> = {}): ClassUse => ({
  kind: "wall", players: 3, late: 0, questions: 5, played: 5, final: true, minutes: 10, rows: 100,
  devices: 4, polled: 1, opened: 3, reconnects: 0, failed: 0, silent: 0, http: 100, sent: 41, pings: 0, pollS: 600, awakeS: 600, quota: 0, slept: 0, errors: 0,
  ...over,
});

test("requests are HTTP requests, sockets opened and one per twenty messages; duration is the awake seconds at 0.128 GB-s", () => {
  const use = addClass(undefined, klass());
  // 100 HTTP + 3 devices off long-poll (a socket each) + ceil(41 / 20) = 3
  assert.equal(objectRequests(use), 106);
  assert.equal(pollGbSeconds(use), 600 * 0.128);
});

test("the classes of a day are those let in less the project's own runs", () => {
  const d: DayRecord = { day: "2026-11-09", uploads: 9, classes: 7, probes: 5, written: 0, peak: 0 };
  assert.equal(realClasses(d), 2);
});

test("days added together keep the buckets and the sums that a month folds the same way", () => {
  const a = addClass(addClass(undefined, klass()), klass({ kind: "peers", players: 30, http: 4000 }));
  const b = addClass(undefined, klass());
  const sum = sumUse([a, undefined, b])!;
  const month = foldDay(foldDay(undefined, { day: "2026-11-01", uploads: 0, classes: 2, written: 0, peak: 0, use: a }), { day: "2026-11-02", uploads: 0, classes: 1, written: 0, peak: 0, use: b });
  assert.deepEqual(sum, month.use);
});

test("buckets are named from their lower edges", () => {
  assert.deepEqual(bucketLabels(EDGES.size), ["0–1", "2–4", "5–14", "15–29", "30+"]);
  assert.deepEqual(bucketLabels(EDGES.requests), ["0–249", "250–999", "1000–2999", "3000+"]);
});
