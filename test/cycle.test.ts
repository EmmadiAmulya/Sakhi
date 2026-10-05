import test from "node:test";
import assert from "node:assert/strict";
import {
  refineCycleMetrics,
  getCyclePhaseForDay,
  calculateCycle,
  getCurrentCycleDay,
  getPhaseName,
  type CycleLog,
} from "../src/lib/cycle.ts";

test("refineCycleMetrics: returns defaults on empty or period-free logs", () => {
  const emptyRes = refineCycleMetrics([], 28, 5);
  assert.deepEqual(emptyRes, { cycleLength: 28, periodLength: 5 });

  const noPeriodLogs: CycleLog[] = [
    { date: "2026-01-01", isPeriod: false, symptoms: [] },
    { date: "2026-01-02", isPeriod: false, symptoms: [] },
  ];
  const noPeriodRes = refineCycleMetrics(noPeriodLogs, 30, 6);
  assert.deepEqual(noPeriodRes, { cycleLength: 30, periodLength: 6 });
});

test("refineCycleMetrics: correctly averages multi-cycle period runs and intervals", () => {
  const logs: CycleLog[] = [
    // Cycle 1: Jan 1 to Jan 5 (5 days)
    { date: "2026-01-01", isPeriod: true, symptoms: [] },
    { date: "2026-01-02", isPeriod: true, symptoms: [] },
    { date: "2026-01-03", isPeriod: true, symptoms: [] },
    { date: "2026-01-04", isPeriod: true, symptoms: [] },
    { date: "2026-01-05", isPeriod: true, symptoms: [] },
    // Cycle 2: Jan 29 to Feb 2 (28 days gap, 5 days period)
    { date: "2026-01-29", isPeriod: true, symptoms: [] },
    { date: "2026-01-30", isPeriod: true, symptoms: [] },
    { date: "2026-01-31", isPeriod: true, symptoms: [] },
    { date: "2026-02-01", isPeriod: true, symptoms: [] },
    { date: "2026-02-02", isPeriod: true, symptoms: [] },
    // Cycle 3: Feb 26 to Mar 2 (28 days gap, 5 days period)
    { date: "2026-02-26", isPeriod: true, symptoms: [] },
    { date: "2026-02-27", isPeriod: true, symptoms: [] },
    { date: "2026-02-28", isPeriod: true, symptoms: [] },
    { date: "2026-03-01", isPeriod: true, symptoms: [] },
    { date: "2026-03-02", isPeriod: true, symptoms: [] },
  ];

  const metrics = refineCycleMetrics(logs, 28, 5);
  assert.equal(metrics.cycleLength, 28);
  assert.equal(metrics.periodLength, 5);
});

test("refineCycleMetrics: rejects outliers and clamps to bounds [21-40] and [3-10]", () => {
  // Extreme short cycle (8 days gap -> ignored as < 15 days)
  const outlierLogs: CycleLog[] = [
    { date: "2026-01-01", isPeriod: true, symptoms: [] },
    { date: "2026-01-09", isPeriod: true, symptoms: [] }, // 8 days later, outlier!
  ];
  const res = refineCycleMetrics(outlierLogs, 28, 4);
  assert.equal(res.cycleLength, 28); // outlier ignored, keeps default

  // Clamping test: single 1-day run clamped to minimum 3
  const shortRunLogs: CycleLog[] = [
    { date: "2026-01-01", isPeriod: true, symptoms: [] },
    { date: "2026-01-22", isPeriod: true, symptoms: [] },
  ];
  const clampedRes = refineCycleMetrics(shortRunLogs, 28, 5);
  assert.equal(clampedRes.periodLength, 3); // clamped to min 3
});

test("getCyclePhaseForDay: partitions a standard 28-day cycle correctly", () => {
  // Menstrual: Days 1..5
  assert.equal(getCyclePhaseForDay(1, 28, 5).id, "menstrual");
  assert.equal(getCyclePhaseForDay(5, 28, 5).id, "menstrual");

  // Follicular: Days 6..12 (ovulation is day 14; 14-2 = 12)
  assert.equal(getCyclePhaseForDay(6, 28, 5).id, "follicular");
  assert.equal(getCyclePhaseForDay(12, 28, 5).id, "follicular");

  // Ovulatory: Days 13..15 (14 - 1 to 14 + 1)
  assert.equal(getCyclePhaseForDay(13, 28, 5).id, "ovulatory");
  assert.equal(getCyclePhaseForDay(14, 28, 5).id, "ovulatory");
  assert.equal(getCyclePhaseForDay(15, 28, 5).id, "ovulatory");

  // Luteal: Days 16..28
  assert.equal(getCyclePhaseForDay(16, 28, 5).id, "luteal");
  assert.equal(getCyclePhaseForDay(28, 28, 5).id, "luteal");
});

test("calculateCycle: calculates timeline, fertile window, and period predictions", () => {
  const lastPeriod = "2026-03-01";
  const targetDate = new Date("2026-03-14T10:00:00Z"); // Cycle day 14 (Ovulation day)

  const calc = calculateCycle(lastPeriod, 28, 5, targetDate);

  assert.equal(calc.cycleDay, 14);
  assert.equal(calc.phase.id, "ovulatory");
  assert.equal(calc.isFertile, true);
  assert.equal(calc.isPeriodDay, false);
  assert.equal(calc.fertileWindow.length, 6); // 5 days pre-ovulation + ovulation day
  assert.equal(calc.periodWindow.length, 5);
  assert.equal(calc.daysUntilNextPeriod, 15);
});

test("getCurrentCycleDay: computes modular cycle day correctly", () => {
  assert.equal(getCurrentCycleDay(null, 28), 12); // Default fallback
  assert.equal(getCurrentCycleDay(new Date().toISOString().slice(0, 10), 28), 1); // Day 1
});

test("getPhaseName: maps every stored phase id, passes through legacy/empty", () => {
  // Every phase produced by the calculator has a matching display name...
  for (const day of [1, 8, 14, 20]) {
    const phase = getCyclePhaseForDay(day, 28, 5);
    assert.equal(getPhaseName(phase.id), phase.name);
  }
  // ...and legacy display-name rows / the empty string survive unchanged.
  assert.equal(getPhaseName("Luteal Phase"), "Luteal Phase");
  assert.equal(getPhaseName(""), "");
});
