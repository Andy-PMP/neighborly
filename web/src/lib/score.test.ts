import { describe, expect, it } from "vitest";
import { temperature } from "./feedback";
import { score } from "./score";

describe("score", () => {
  it("is 8 on the first clue down to 1 on the last", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(score)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it("is 0 when not solved", () => {
    expect(score(null)).toBe(0);
  });

  it("rejects impossible clue counts", () => {
    expect(() => score(0)).toThrow(RangeError);
    expect(() => score(9)).toThrow(RangeError);
    expect(() => score(2.5)).toThrow(RangeError);
  });
});

describe("temperature", () => {
  it.each([
    [1, "hot"],
    [10, "hot"],
    [11, "warm"],
    [100, "warm"],
    [101, "mild"],
    [1000, "mild"],
    [5000, "cool"],
    [5001, "cold"],
  ])("rank %i is %s", (rank, level) => {
    expect(temperature(rank).level).toBe(level);
  });
});
