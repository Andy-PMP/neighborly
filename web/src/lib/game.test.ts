import { describe, expect, it } from "vitest";
import { applyGuess, newGame, type GameState, type Judge } from "./game";
import { TOTAL_CLUES } from "./score";

const RANKS: Record<string, number> = { puppy: 3, cat: 12, bone: 40, car: 900, rock: 6000 };
const judge: Judge = { target: "dog", rankOf: (w) => RANKS[w] ?? null };

function play(...guesses: string[]): GameState {
  let s = newGame();
  for (const g of guesses) s = applyGuess(s, g, judge).state;
  return s;
}

describe("applyGuess", () => {
  it("starts on clue 1", () => {
    expect(newGame()).toEqual({ revealed: 1, guesses: [], status: "playing" });
  });

  it("wins on the target or an inflection of it", () => {
    expect(applyGuess(newGame(), "Dog", judge).outcome).toEqual({ kind: "win" });
    expect(applyGuess(newGame(), "dogs", judge).state.status).toBe("won");
  });

  it("records the clue number of a winning guess", () => {
    const s = play("cat", "bone", "dog");
    expect(s.status).toBe("won");
    expect(s.guesses.at(-1)).toEqual({ word: "dog", rank: null, clue: 3 });
  });

  it("reveals the next clue on a wrong known word", () => {
    const { state, outcome } = applyGuess(newGame(), "cat", judge);
    expect(outcome).toEqual({ kind: "wrong", rank: 12 });
    expect(state.revealed).toBe(2);
  });

  it("does not spend a clue on unknown, repeated or empty guesses", () => {
    let s = play("cat");
    const unknown = applyGuess(s, "zzzz", judge);
    expect(unknown.outcome).toEqual({ kind: "unknown", word: "zzzz" });
    expect(unknown.state).toBe(s);

    const repeat = applyGuess(s, " CAT ", judge);
    expect(repeat.outcome).toEqual({ kind: "repeat", word: "cat" });
    expect(repeat.state).toBe(s);

    s = applyGuess(s, "  ", judge).state;
    expect(s.revealed).toBe(2);
  });

  it("loses on a wrong guess while the last clue is showing", () => {
    const anyKnown: Judge = { target: "dog", rankOf: (w) => w.length * 10 };
    let s = newGame();
    const words = ["aa", "bb", "cc", "dd", "ee", "ff", "gg"];
    for (const w of words) s = applyGuess(s, w, anyKnown).state;
    expect(s).toMatchObject({ revealed: TOTAL_CLUES, status: "playing" });

    const last = applyGuess(s, "hh", anyKnown);
    expect(last.outcome).toEqual({ kind: "lost", rank: 20 });
    expect(last.state.status).toBe("lost");
    expect(last.state.revealed).toBe(TOTAL_CLUES);
    expect(last.state.guesses).toHaveLength(TOTAL_CLUES);
  });

  it("refuses guesses after the game ends", () => {
    expect(() => applyGuess(play("dog"), "cat", judge)).toThrow();
  });
});
