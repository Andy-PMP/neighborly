// Spoiler-free share text: puzzle number, result, one emoji per guess. Never any words.

import { temperature } from "./feedback";
import type { GameState } from "./game";
import { TOTAL_CLUES } from "./score";

export function shareText(day: number, state: GameState, url?: string): string {
  if (state.status === "playing") throw new Error("Game isn't finished");
  const headline =
    state.status === "won"
      ? `Neighborly #${day} — got it on clue ${state.guesses.at(-1)!.clue}/${TOTAL_CLUES}`
      : `Neighborly #${day} — missed it (${TOTAL_CLUES} clues)`;
  const trail = state.guesses
    .map((g) => (g.rank === null ? "✅" : temperature(g.rank).emoji))
    .join("");
  return [headline, trail, url].filter(Boolean).join("\n");
}
