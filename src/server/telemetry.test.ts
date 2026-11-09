import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyLine, readLine } from "../shared/line.ts";
import { addClass, foldDay, monthOf, objectRequests, summarize, type ClassFacts } from "./telemetry.ts";

const facts: ClassFacts = { kind: "remote", players: 25, late: 1, questions: 15, played: 15, final: true, minutes: 18, rows: 140 };

test("a device's line keeps only the closed list's word and bounded whole numbers", () => {
  const line = readLine({ mode: "poll", opened: 3.7, http: -5, sent: 1e12, quota: "x", title: "Fractions", token: "abc", errors: 2 });
  assert.ok(line);
  assert.deepEqual(Object.keys(line).sort(), Object.keys(emptyLine()).sort(), "nothing but the line's own fields");
  assert.equal(line.mode, "poll");
  assert.equal(line.opened, 3);
  assert.equal(line.http, 0);
  assert.ok(line.sent <= 100_000);
  assert.equal(line.quota, 0);
  assert.equal(readLine({ mode: "Fractions for 4b" }), null, "a mode off the list is no line");
  assert.equal(readLine("ws"), null);
});

test("a class's summary sums its devices; a reconnect is a socket after the first", () => {
  const ws = { ...emptyLine(), opened: 4, sent: 60, pings: 140 };
  const poll = { ...emptyLine(), mode: "poll" as const, opened: 0, failed: 3, http: 2900, pollS: 900 };
  const u = summarize(facts, [ws, poll]);
  assert.equal(u.devices, 2);
  assert.equal(u.polled, 1);
  assert.equal(u.reconnects, 3);
  assert.equal(u.failed, 3);
  assert.equal(objectRequests(u), 2900 + 4 + 10);
});

test("a day adds its classes into buckets; a month keeps use and cost, and leaves the problems behind", () => {
  const small = summarize({ ...facts, kind: "peers", players: 3, rows: 60 }, [{ ...emptyLine(), opened: 1, errors: 2 }]);
  const polling = summarize(facts, [{ ...emptyLine(), mode: "poll", http: 3200, quota: 1 }]);
  const day = addClass(addClass(undefined, small), polling);
  assert.equal(day.classes, 2);
  assert.deepEqual(day.kinds, { peers: 1, remote: 1, wall: 0 });
  assert.deepEqual(day.size, [0, 1, 0, 1, 0], "the size counts set a class of three apart from one of 25");
  assert.equal(day.requests[3], 1, "a polling class of about 3,000 requests");
  assert.equal(day.withPoller, 1);
  assert.deepEqual(day.problems, { failed: 0, quota: 1, errors: 2 });

  const one = foldDay(undefined, { day: "2026-11-09", uploads: 4, classes: 2, written: 200, peak: 9000, atOnce: 2, use: day });
  const two = foldDay(one, { day: "2026-11-10", uploads: 1, classes: 0, written: 0, peak: 0 });
  assert.equal(two.month, "2026-11");
  assert.equal(two.days, 2);
  assert.equal(two.uploads, 5);
  assert.equal(two.busiest, 2);
  assert.equal(two.atOnce, 2);
  assert.equal(two.use.classes, 2);
  assert.equal(two.use.http, 3200);
  assert.ok(!("problems" in two.use), "problems are kept by the day only");
});

test("months are counted back across a year's turn", () => {
  const t = Date.UTC(2026, 0, 15);
  assert.equal(monthOf(t), "2026-01");
  assert.equal(monthOf(t, 1), "2025-12");
  assert.equal(monthOf(t, 24), "2024-01");
});
