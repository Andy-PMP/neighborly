// Stats and streaks, derived from saved daily games. Practice games are never saved, so never count.

import type { GameState } from "./game";
import { TOTAL_CLUES } from "./score";

export interface Stats {
  played: number;
  wins: number;
  /** 0..100, rounded. */
  winPct: number;
  currentStreak: number;
  maxStreak: number;
  /** distribution[i] = wins on clue i + 1. */
  distribution: number[];
}

const won = (g: GameState | undefined) => g?.status === "won";

/**
 * Streak rules: a streak is a run of consecutive daily puzzles solved. A loss or a skipped day
 * ends it. While today's puzzle is unfinished (or unplayed), the streak through yesterday still
 * counts as current; losing today drops it to 0.
 */
export function computeStats(daily: Record<string, GameState>, today: number): Stats {
  const finished = Object.entries(daily)
    .map(([day, g]) => [Number(day), g] as const)
    .filter(([, g]) => g.status !== "playing")
    .sort((a, b) => a[0] - b[0]);

  const distribution = Array<number>(TOTAL_CLUES).fill(0);
  let wins = 0;
  let maxStreak = 0;
  let run = 0;
  let prevDay = Number.NaN;
  for (const [day, g] of finished) {
    if (g.status === "won") {
      wins++;
      const clue = g.guesses.at(-1)?.clue ?? g.revealed;
      if (clue >= 1 && clue <= TOTAL_CLUES) distribution[clue - 1]!++;
      run = day === prevDay + 1 ? run + 1 : 1;
      maxStreak = Math.max(maxStreak, run);
    } else {
      run = 0;
    }
    prevDay = day;
  }

  const todayGame = daily[String(today)];
  let currentStreak = 0;
  if (todayGame?.status !== "lost") {
    let d = won(todayGame) ? today : today - 1;
    while (won(daily[String(d)])) {
      currentStreak++;
      d--;
    }
  }

  const played = finished.length;
  return {
    played,
    wins,
    winPct: played ? Math.round((wins / played) * 100) : 0,
    currentStreak,
    maxStreak,
    distribution,
  };
}
