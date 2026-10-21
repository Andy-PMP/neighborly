// Daily puzzle numbering. Everything is UTC so every player gets the same puzzle on the same day.

/** Day of puzzle #1 (UTC). After launch, never change it: it would renumber every puzzle. */
export const LAUNCH_DATE = "2026-10-22";

const DAY_MS = 86_400_000;
const LAUNCH_MS = Date.parse(`${LAUNCH_DATE}T00:00:00Z`);

/** Daily puzzle number for a moment in time: 1 on launch day, 2 the next UTC day, ... (≥ 1). */
export function dayNumber(now: Date | number, launchMs: number = LAUNCH_MS): number {
  const t = typeof now === "number" ? now : now.getTime();
  return Math.max(1, Math.floor((t - launchMs) / DAY_MS) + 1);
}

/**
 * Puzzle id (1-based, as in puzzles.json) played on a given day. After the last puzzle the
 * list wraps around: day count+1 plays puzzle 1 again, though the day number keeps counting.
 */
export function puzzleIdForDay(day: number, puzzleCount: number): number {
  return ((day - 1) % puzzleCount) + 1;
}

/** Milliseconds until the next UTC midnight, when the next daily puzzle appears. */
export function msUntilNextPuzzle(now: Date | number): number {
  const t = typeof now === "number" ? now : now.getTime();
  return DAY_MS - (((t % DAY_MS) + DAY_MS) % DAY_MS);
}

/** "5h 12m", or "12m" under an hour, or "<1m". */
export function formatCountdown(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  if (totalMin < 1) return "<1m";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
