// Score: higher for solving with fewer clues revealed.

export const TOTAL_CLUES = 8;

/** Points for solving with `cluesRevealed` clues showing (1..8): 8 down to 1. Null = not solved: 0. */
export function score(cluesRevealed: number | null): number {
  if (cluesRevealed === null) return 0;
  if (!Number.isInteger(cluesRevealed) || cluesRevealed < 1 || cluesRevealed > TOTAL_CLUES) {
    throw new RangeError(`cluesRevealed must be 1..${TOTAL_CLUES}, got ${cluesRevealed}`);
  }
  return TOTAL_CLUES + 1 - cluesRevealed;
}
