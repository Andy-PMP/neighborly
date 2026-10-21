import { describe, expect, it } from "vitest";
import { decodeTarget } from "./decode";

describe("decodeTarget", () => {
  // Tokens copied from data/puzzles.json; answers from pipeline/obfuscate.py.
  it.each([
    [1, "Uk8cDA4HEQ==", "curious"],
    [2, "QlscBAIaFw1X", "parachute"],
    [598, "WVZNXg==", "loud"],
  ])("puzzle %i decodes", (id, token, answer) => {
    expect(decodeTarget(token, id)).toBe(answer);
  });

  it("depends on the puzzle id, even for short answers", () => {
    expect(decodeTarget("Uk8cDA4HEQ==", 2)).not.toBe("curious");
    expect(decodeTarget("WVZNXg==", 597)).not.toBe("loud");
  });
});
