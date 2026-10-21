// Warm/cold label for a guess's similarity rank (1 = closest word to the target).

export interface Temperature {
  label: string;
  emoji: string;
  /** CSS modifier, e.g. "hot". */
  level: "hot" | "warm" | "mild" | "cool" | "cold";
}

const BANDS: [maxRank: number, t: Temperature][] = [
  [10, { label: "Hot", emoji: "🔥", level: "hot" }],
  [100, { label: "Warm", emoji: "☀️", level: "warm" }],
  [1000, { label: "Mild", emoji: "🌤️", level: "mild" }],
  [5000, { label: "Cool", emoji: "🌥️", level: "cool" }],
];
const COLD: Temperature = { label: "Cold", emoji: "❄️", level: "cold" };

export function temperature(rank: number): Temperature {
  for (const [max, t] of BANDS) if (rank <= max) return t;
  return COLD;
}
