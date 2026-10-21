// Practice mode: replay puzzles from past days only (never today's or a future one).

import { puzzleIdForDay } from "./daily";

/** Puzzle ids that have already been a daily puzzle before `today`, excluding today's puzzle. */
export function pastPuzzleIds(today: number, puzzleCount: number): number[] {
  // Before wrap-around, day d played puzzle d; after it, every puzzle has had a past day.
  const todays = puzzleIdForDay(today, puzzleCount);
  const lastPastId = Math.min(today - 1, puzzleCount);
  const ids: number[] = [];
  for (let id = 1; id <= lastPastId; id++) if (id !== todays) ids.push(id);
  return ids;
}

export function isPracticeAllowed(id: number, today: number, puzzleCount: number): boolean {
  return pastPuzzleIds(today, puzzleCount).includes(id);
}

/** A random past puzzle id, avoiding `exclude` when possible; null if there are none yet. */
export function pickPractice(
  today: number,
  puzzleCount: number,
  exclude?: number,
  random: () => number = Math.random,
): number | null {
  const ids = pastPuzzleIds(today, puzzleCount);
  const pool = ids.length > 1 && exclude !== undefined ? ids.filter((id) => id !== exclude) : ids;
  if (pool.length === 0) return null;
  return pool[Math.floor(random() * pool.length)]!;
}
