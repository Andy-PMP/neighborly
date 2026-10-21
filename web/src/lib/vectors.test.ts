import { describe, expect, it } from "vitest";
import { WordVectors } from "./vectors";

// 2D toy vectors: "dog" points east; others fan out counter-clockwise.
const words = ["dog", "puppy", "cat", "car", "rock"];
const raw = Int8Array.from([
  [127, 0], // dog
  [120, 20], // puppy: almost the same direction
  [90, 90], // cat: 45 degrees
  [0, 127], // car: 90 degrees
  [-127, 0], // rock: opposite
].flat());

describe("WordVectors.rankOf", () => {
  const v = new WordVectors(words, raw, 2);

  it("ranks other words by closeness to the target, 1 = closest", () => {
    expect(v.rankOf("puppy", "dog")).toBe(1);
    expect(v.rankOf("cat", "dog")).toBe(2);
    expect(v.rankOf("car", "dog")).toBe(3);
    expect(v.rankOf("rock", "dog")).toBe(4);
  });

  it("works for a different target (cache is per target)", () => {
    expect(v.rankOf("cat", "car")).toBe(1);
    expect(v.rankOf("dog", "car")).toBe(3);
  });

  it("returns null for unknown words or the target itself", () => {
    expect(v.rankOf("zebra", "dog")).toBeNull();
    expect(v.rankOf("dog", "zebra")).toBeNull();
    expect(v.rankOf("dog", "dog")).toBeNull();
  });

  it("rejects a vector file of the wrong size", () => {
    expect(() => new WordVectors(words, new Int8Array(3), 2)).toThrow();
  });
});
