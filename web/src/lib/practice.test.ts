import { describe, expect, it } from "vitest";
import { isPracticeAllowed, pastPuzzleIds, pickPractice } from "./practice";

describe("practice puzzles", () => {
  it("has nothing on launch day", () => {
    expect(pastPuzzleIds(1, 598)).toEqual([]);
    expect(pickPractice(1, 598)).toBeNull();
  });

  it("offers only days before today", () => {
    expect(pastPuzzleIds(4, 598)).toEqual([1, 2, 3]);
    expect(isPracticeAllowed(3, 4, 598)).toBe(true);
    expect(isPracticeAllowed(4, 4, 598)).toBe(false); // today's
    expect(isPracticeAllowed(5, 4, 598)).toBe(false); // future
  });

  it("offers every puzzle except today's after wrap-around", () => {
    const ids = pastPuzzleIds(600, 598); // day 600 plays puzzle 2
    expect(ids).toHaveLength(597);
    expect(ids).not.toContain(2);
  });

  it("never picks a future puzzle", () => {
    for (let i = 0; i < 200; i++) {
      const id = pickPractice(10, 598)!;
      expect(id).toBeGreaterThanOrEqual(1);
      expect(id).toBeLessThan(10);
    }
  });

  it("avoids repeating the current practice puzzle when it can", () => {
    expect(pickPractice(3, 598, 1, () => 0)).toBe(2);
    expect(pickPractice(2, 598, 1, () => 0)).toBe(1); // only one past puzzle
  });
});
