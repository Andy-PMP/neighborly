// Round state and the rules for applying a guess. Pure: no DOM, no fetching.

import { isCorrect, normalize } from "./normalize";
import { TOTAL_CLUES } from "./score";

export type Status = "playing" | "won" | "lost";

export interface GuessRecord {
  word: string;
  /** Similarity rank among the vocab (1 = closest); null for the winning guess. */
  rank: number | null;
  /** Clue number showing when the guess was made. */
  clue: number;
}

export interface GameState {
  /** Number of clues revealed, 1..TOTAL_CLUES. */
  revealed: number;
  guesses: GuessRecord[];
  status: Status;
}

export type GuessOutcome =
  | { kind: "win" }
  | { kind: "wrong"; rank: number }
  | { kind: "lost"; rank: number }
  | { kind: "unknown"; word: string }
  | { kind: "repeat"; word: string }
  | { kind: "invalid" };

export interface Judge {
  target: string;
  /** Similarity rank of a known word, or null if it isn't in the vocabulary. */
  rankOf(word: string): number | null;
}

export function newGame(): GameState {
  return { revealed: 1, guesses: [], status: "playing" };
}

/**
 * Apply one guess. Unknown, repeated and empty guesses cost nothing.
 * A wrong guess reveals the next clue; a wrong guess on the last clue loses.
 */
export function applyGuess(
  state: GameState,
  raw: string,
  judge: Judge,
): { state: GameState; outcome: GuessOutcome } {
  if (state.status !== "playing") throw new Error("Game is over");
  const word = normalize(raw);
  if (!word) return { state, outcome: { kind: "invalid" } };
  if (state.guesses.some((g) => g.word === word)) {
    return { state, outcome: { kind: "repeat", word } };
  }

  if (isCorrect(word, judge.target)) {
    const guesses = [...state.guesses, { word, rank: null, clue: state.revealed }];
    return { state: { ...state, guesses, status: "won" }, outcome: { kind: "win" } };
  }

  const rank = judge.rankOf(word);
  if (rank === null) return { state, outcome: { kind: "unknown", word } };

  const guesses = [...state.guesses, { word, rank, clue: state.revealed }];
  if (state.revealed >= TOTAL_CLUES) {
    return { state: { ...state, guesses, status: "lost" }, outcome: { kind: "lost", rank } };
  }
  return {
    state: { revealed: state.revealed + 1, guesses, status: "playing" },
    outcome: { kind: "wrong", rank },
  };
}
