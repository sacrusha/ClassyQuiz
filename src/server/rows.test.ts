import { test } from "node:test";
import assert from "node:assert/strict";
import { add, ahead, asCost, atLetIn, grown, moved, room, spent, tail, within } from "./rows.ts";
import { DAY_FOR_CLASSES, DAY_FOR_JOINS } from "../shared/limits.ts";
import { emptyLine } from "../shared/line.ts";
import { objectRequests, summarize } from "./telemetry.ts";

const NONE = { rows: 0, requests: 0, awakeS: 0 };

// Bookings settle at the final ranking, so these are classes at the same
// time, not in the day. The owner, 2026-11-09: about 60 at once is plenty.
test("sixty lobbies fit at once in every allowance", () => {
  assert.ok(room(NONE, atLetIn(15), DAY_FOR_CLASSES) >= 60, `sixty lobbies can be let in at once (${room(NONE, atLetIn(15), DAY_FOR_CLASSES)})`);
});

test("from the start a class books no more rows than at letting in, a class of 25 fewer", () => {
  const letIn = atLetIn(15);
  assert.ok(ahead({ players: 60, devices: 62, pollers: 0, questionsLeft: 15 }).rows <= letIn.rows);
  assert.ok(ahead({ players: 25, devices: 27, pollers: 0, questionsLeft: 15 }).rows < letIn.rows);
});

test("a class on WebSockets books no awake time; one poller books the lesson", () => {
  const ws = ahead({ players: 25, devices: 27, pollers: 0, questionsLeft: 15 });
  const one = ahead({ players: 25, devices: 27, pollers: 1, questionsLeft: 15 });
  assert.equal(ws.awakeS, 0);
  assert.ok(one.awakeS >= 15 * 60, "a poller keeps the object awake for the questions ahead");
  assert.ok(one.requests > ws.requests);
});

test("what a class spent is what telemetry counts as its requests", () => {
  const lines = [
    { ...emptyLine(), http: 40, opened: 1, sent: 0, mode: "poll" as const, pollS: 900 },
    { ...emptyLine(), http: 0, opened: 3, sent: 45, pollS: 0 },
  ];
  const facts = { kind: "wall" as const, players: 2, late: 0, questions: 5, played: 5, final: true, minutes: 15, rows: 30 };
  const s = spent(lines, 30);
  assert.equal(s.requests, objectRequests(summarize(facts, lines)));
  assert.equal(s.awakeS, 900);
  assert.equal(s.rows, 30);
});

test("devices left polling on the final ranking book their time until they sleep; none, nothing", () => {
  assert.deepEqual(tail(0), NONE);
  assert.ok(tail(3).awakeS > 0 && tail(3).requests > tail(1).requests);
});

test("a booking grows when a poller appears, and holds while the class spends as booked", () => {
  const booked = add(NONE, ahead({ players: 25, devices: 27, pollers: 0, questionsLeft: 15 }));
  assert.equal(grown(booked, booked), null);
  const more = grown(booked, ahead({ players: 25, devices: 27, pollers: 1, questionsLeft: 14 }));
  assert.ok(more && more.awakeS > booked.awakeS);
  assert.ok(more.rows >= booked.rows, "a booking that grows never gives rows back");
});

test("a ledger from before requests were booked reads as rows; moving never goes below nothing", () => {
  assert.deepEqual(asCost(1030), { rows: 1030, requests: 0, awakeS: 0 });
  assert.deepEqual(moved(asCost(100), atLetIn(15), NONE), NONE);
});

test("a join may reach further than letting in", () => {
  assert.ok(within(DAY_FOR_CLASSES, DAY_FOR_JOINS));
  assert.ok(!within(DAY_FOR_JOINS, DAY_FOR_CLASSES));
});
