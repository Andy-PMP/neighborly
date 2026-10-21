import { describe, expect, it } from "vitest";
import type { GameState } from "./game";
import { computeStats, finishedDays } from "./stats";

const W = (clue: number): GameState => ({
  revealed: clue,
  status: "won",
  guesses: [{ word: "x", rank: null, clue }],
});
const L: GameState = { revealed: 8, status: "lost", guesses: [] };
const P: GameState = { revealed: 2, status: "playing", guesses: [] };

const days = (entries: Record<number, GameState>) =>
  Object.fromEntries(Object.entries(entries).map(([d, g]) => [String(d), g]));

describe("finishedDays (which puzzles may show a map)", () => {
  it("lists finished games only, most recent first", () => {
    expect(finishedDays(days({ 2: W(3), 5: P, 3: L, 1: W(1) }))).toEqual([3, 2, 1]);
  });

  it("never includes an in-progress game", () => {
    expect(finishedDays(days({ 7: P }))).toEqual([]);
  });

  it("ignores junk keys", () => {
    expect(finishedDays({ abc: W(1), "0": W(1), "4": W(2) })).toEqual([4]);
  });
});

describe("computeStats", () => {
  it("is all zeros with no games", () => {
    expect(computeStats({}, 5)).toEqual({
      played: 0,
      wins: 0,
      winPct: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0, 0, 0, 0],
    });
  });

  it("counts consecutive wins ending today", () => {
    const s = computeStats(days({ 3: W(2), 4: W(5), 5: W(1) }), 5);
    expect(s.currentStreak).toBe(3);
    expect(s.maxStreak).toBe(3);
    expect(s.distribution).toEqual([1, 1, 0, 0, 1, 0, 0, 0]);
  });

  it("keeps yesterday's streak while today is unplayed or in progress", () => {
    const history = { 3: W(2), 4: W(3) };
    expect(computeStats(days(history), 5).currentStreak).toBe(2);
    expect(computeStats(days({ ...history, 5: P }), 5).currentStreak).toBe(2);
  });

  it("does not count in-progress games as played", () => {
    expect(computeStats(days({ 4: W(3), 5: P }), 5).played).toBe(1);
  });

  it("resets on a loss today", () => {
    const s = computeStats(days({ 3: W(2), 4: W(3), 5: L }), 5);
    expect(s.currentStreak).toBe(0);
    expect(s.maxStreak).toBe(2);
  });

  it("resets on a skipped day", () => {
    const s = computeStats(days({ 1: W(1), 2: W(1), 4: W(1), 5: W(1) }), 5);
    expect(s.currentStreak).toBe(2);
    expect(s.maxStreak).toBe(2);
  });

  it("is 0 when the last win was two or more days ago", () => {
    expect(computeStats(days({ 1: W(1), 2: W(1) }), 4).currentStreak).toBe(0);
  });

  it("finds the longest run anywhere in history", () => {
    const s = computeStats(days({ 1: W(1), 2: W(1), 3: W(1), 4: L, 5: W(1) }), 5);
    expect(s.maxStreak).toBe(3);
    expect(s.currentStreak).toBe(1);
    expect(s).toMatchObject({ played: 5, wins: 4, winPct: 80 });
  });
});
