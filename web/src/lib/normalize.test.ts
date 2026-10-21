import { describe, expect, it } from "vitest";
import { inflections, isCorrect, normalize } from "./normalize";

describe("normalize", () => {
  it("lowercases, trims and drops non-letters", () => {
    expect(normalize("  Cat ")).toBe("cat");
    expect(normalize("DOG!")).toBe("dog");
    expect(normalize("ice-cream")).toBe("icecream");
    expect(normalize(" 123 ")).toBe("");
  });
});

describe("isCorrect", () => {
  it.each([
    ["cat", "cat"],
    ["CAT", "cat"],
    ["cats", "cat"],
    ["beaches", "beach"],
    ["boxes", "box"],
    ["berries", "berry"],
    ["keys", "key"],
    ["baked", "bake"],
    ["baking", "bake"],
    ["climbed", "climb"],
    ["climbing", "climb"],
    ["digging", "dig"],
    ["swimming", "swim"],
    ["cried", "cry"],
    ["crying", "cry"],
    ["mice", "mouse"],
    ["teeth", "tooth"],
    ["ran", "run"],
    ["stole", "steal"],
  ])("accepts %s for %s", (guess, target) => {
    expect(isCorrect(guess, target)).toBe(true);
  });

  it.each([
    ["catalog", "cat"],
    ["dog", "cat"],
    ["bakery", "bake"],
    ["cooker", "cook"],
    ["", "cat"],
    ["ca", "cat"],
  ])("rejects %s for %s", (guess, target) => {
    expect(isCorrect(guess, target)).toBe(false);
  });
});

describe("inflections", () => {
  it("does not double consonants after two vowels or for w/x/y endings", () => {
    expect(inflections("cook")).not.toContain("cookking");
    expect(inflections("snow")).not.toContain("snowwed");
    expect(inflections("dig")).toContain("digging");
  });
});
