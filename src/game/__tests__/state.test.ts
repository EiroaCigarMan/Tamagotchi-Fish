import { describe, expect, test } from "bun:test";
import { applyAction, applyDecay, cooldownRemaining, defaultState } from "../state";
import { getMood } from "../mood";
import { formatClock } from "../time";
import { DECAY_PER_HOUR } from "../constants";

describe("offline decay", () => {
  test("decays proportionally to elapsed hours and clamps at 0", () => {
    const s = defaultState(0);
    const after10h = applyDecay(s, 10 * 3_600_000);
    expect(after10h.hunger).toBeCloseTo(80 - 10 * DECAY_PER_HOUR.hunger, 5);
    expect(after10h.lastSeenAt).toBe(10 * 3_600_000);
    const afterWeek = applyDecay(s, 7 * 24 * 3_600_000);
    expect(afterWeek.hunger).toBe(0);
    expect(afterWeek.happiness).toBe(0);
    expect(afterWeek.cleanliness).toBe(0);
  });
  test("clock going backwards does not heal the fish", () => {
    const s = { ...defaultState(1000), hunger: 40 };
    expect(applyDecay(s, 500).hunger).toBe(40);
  });
});

describe("actions", () => {
  test("feed raises hunger and is refused during cooldown", () => {
    const s = defaultState(0);
    const fed = applyAction(s, "feed", 1000);
    expect(fed.hunger).toBeGreaterThan(s.hunger);
    expect(cooldownRemaining(fed, "feed", 2000)).toBeGreaterThan(0);
    expect(applyAction(fed, "feed", 2000)).toBe(fed); // same reference = refused
    expect(applyAction(fed, "feed", 1000 + 6_000)).not.toBe(fed);
  });
  test("stats never exceed 100", () => {
    let s = { ...defaultState(0), cleanliness: 95 };
    s = applyAction(s, "clean", 1);
    expect(s.cleanliness).toBe(100);
  });
});

describe("mood", () => {
  test("priority order", () => {
    expect(getMood({ hunger: 10, happiness: 10, cleanliness: 10 })).toBe("sad");
    expect(getMood({ hunger: 80, happiness: 80, cleanliness: 10 })).toBe("dirty");
    expect(getMood({ hunger: 10, happiness: 80, cleanliness: 80 })).toBe("hungry");
    expect(getMood({ hunger: 80, happiness: 10, cleanliness: 80 })).toBe("bored");
    expect(getMood({ hunger: 40, happiness: 80, cleanliness: 80 })).toBe("sleepy");
    expect(getMood({ hunger: 80, happiness: 80, cleanliness: 80 })).toBe("content");
  });
});

describe("clock", () => {
  test("12h and 24h formatting", () => {
    const d = new Date(2026, 0, 1, 15, 7);
    expect(formatClock(d, "12h")).toEqual({ display: "3:07", meridiem: "PM" });
    expect(formatClock(d, "24h")).toEqual({ display: "15:07", meridiem: "" });
    const m = new Date(2026, 0, 1, 0, 0);
    expect(formatClock(m, "12h")).toEqual({ display: "12:00", meridiem: "AM" });
  });
});
