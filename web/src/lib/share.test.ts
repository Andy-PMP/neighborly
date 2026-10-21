import { describe, expect, it } from "vitest";
import type { GameState } from "./game";
import { shareText } from "./share";

const won: GameState = {
  revealed: 3,
  status: "won",
  guesses: [
    { word: "ocean", rank: 6000, clue: 1 },
    { word: "river", rank: 450, clue: 2 },
    { word: "lake", rank: null, clue: 3 },
  ],
};

const lost: GameState = {
  revealed: 8,
  status: "lost",
  guesses: [5, 50, 500, 2000, 9000, 8, 70, 700].map((rank, i) => ({
    word: `w${i}`,
    rank,
    clue: i + 1,
  })),
};

describe("shareText", () => {
  it("formats a win", () => {
    expect(shareText(12, won)).toBe("Nearby #12 — got it on clue 3/8\n❄️🌤️✅");
  });

  it("formats a loss", () => {
    expect(shareText(40, lost)).toBe("Nearby #40 — missed it (8 clues)\n🔥☀️🌤️🌥️❄️🔥☀️🌤️");
  });

  it("appends the link when given", () => {
    expect(shareText(12, won, "https://example.com/nearby/").split("\n")).toEqual([
      "Nearby #12 — got it on clue 3/8",
      "❄️🌤️✅",
      "https://example.com/nearby/",
    ]);
  });

  it("handles a first-clue win", () => {
    const first: GameState = {
      revealed: 1,
      status: "won",
      guesses: [{ word: "lake", rank: null, clue: 1 }],
    };
    expect(shareText(1, first)).toBe("Nearby #1 — got it on clue 1/8\n✅");
  });

  it("never contains guessed words", () => {
    const text = shareText(12, won) + shareText(40, lost);
    for (const g of [...won.guesses, ...lost.guesses]) expect(text).not.toContain(g.word);
  });

  it("refuses an unfinished game", () => {
    expect(() => shareText(1, { revealed: 1, status: "playing", guesses: [] })).toThrow();
  });
});
