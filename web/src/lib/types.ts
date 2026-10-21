// Shapes of the files in data/ (see "Data contract" in CLAUDE.md).

export interface Clue {
  w: string;
  rank: number;
  sim: number;
}

export interface Puzzle {
  id: number;
  /** Obfuscated target; see decode.ts. */
  t: string;
  /** Eight clues, farthest first. */
  clues: Clue[];
  /** 2D points: target first, then clues in order. */
  map: [number, number][];
}

export interface PuzzleFile {
  version: number;
  puzzles: Puzzle[];
}

export interface VocabFile {
  dims: number;
  words: string[];
}
