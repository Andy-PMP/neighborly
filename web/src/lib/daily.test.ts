import { describe, expect, it } from "vitest";
import {
  LAUNCH_DATE,
  dayNumber,
  formatCountdown,
  msUntilNextPuzzle,
  puzzleIdForDay,
} from "./daily";

const utc = (iso: string) => new Date(`${iso}Z`);

describe("dayNumber", () => {
  it("is 1 for the whole launch day (UTC)", () => {
    expect(dayNumber(utc(`${LAUNCH_DATE}T00:00:00.000`))).toBe(1);
    expect(dayNumber(utc(`${LAUNCH_DATE}T23:59:59.999`))).toBe(1);
  });

  it("ticks over exactly at UTC midnight", () => {
    expect(dayNumber(utc("2026-10-22T23:59:59.999"))).toBe(1);
    expect(dayNumber(utc("2026-10-23T00:00:00.000"))).toBe(2);
    expect(dayNumber(utc("2026-11-02T00:00:00.000"))).toBe(12);
  });

  it("ignores the player's time zone: same instant, same puzzle", () => {
    // 23:30 on Oct 22 in New York (UTC-4) is already Oct 23 in UTC.
    expect(dayNumber(new Date("2026-10-22T23:30:00-04:00"))).toBe(2);
    // 08:30 on Oct 23 in Tokyo (UTC+9) is still Oct 22 in UTC.
    expect(dayNumber(new Date("2026-10-23T08:30:00+09:00"))).toBe(1);
  });

  it("clamps to puzzle 1 before launch", () => {
    expect(dayNumber(utc("2026-10-21T12:00:00"))).toBe(1);
    expect(dayNumber(utc("2020-01-01T00:00:00"))).toBe(1);
  });

  it("crosses a leap day and a year boundary", () => {
    expect(dayNumber(utc("2027-01-01T00:00:00"))).toBe(72);
    expect(dayNumber(utc("2028-03-01T00:00:00")) - dayNumber(utc("2028-02-28T00:00:00"))).toBe(2);
  });

  it("accepts a timestamp", () => {
    expect(dayNumber(Date.parse("2026-10-24T05:00:00Z"))).toBe(3);
  });
});

describe("puzzleIdForDay", () => {
  it("plays puzzle d on day d, then wraps around", () => {
    expect(puzzleIdForDay(1, 598)).toBe(1);
    expect(puzzleIdForDay(598, 598)).toBe(598);
    expect(puzzleIdForDay(599, 598)).toBe(1);
    expect(puzzleIdForDay(1200, 598)).toBe(4);
  });
});

describe("countdown", () => {
  it("counts down to the next UTC midnight", () => {
    expect(msUntilNextPuzzle(utc("2026-10-22T23:59:00"))).toBe(60_000);
    expect(msUntilNextPuzzle(utc("2026-10-22T00:00:00"))).toBe(86_400_000);
  });

  it("formats hours and minutes", () => {
    expect(formatCountdown(5 * 3_600_000 + 12 * 60_000 + 30_000)).toBe("5h 12m");
    expect(formatCountdown(12 * 60_000)).toBe("12m");
    expect(formatCountdown(30_000)).toBe("<1m");
  });
});
