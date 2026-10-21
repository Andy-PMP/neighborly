// Integration: the real data/ files work with the front-end logic (cross-checks the Python pipeline).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { decodeTarget } from "./decode";
import { applyGuess, newGame, type Judge } from "./game";
import { TOTAL_CLUES } from "./score";
import type { PuzzleFile, VocabFile } from "./types";
import { WordVectors } from "./vectors";

const dataDir = fileURLToPath(new URL("../../../data/", import.meta.url));
const { puzzles } = JSON.parse(readFileSync(join(dataDir, "puzzles.json"), "utf8")) as PuzzleFile;
const vocab = JSON.parse(readFileSync(join(dataDir, "vocab.json"), "utf8")) as VocabFile;
const bin = readFileSync(join(dataDir, "vectors.bin"));
const vectors = new WordVectors(
  vocab.words,
  new Int8Array(bin.buffer, bin.byteOffset, bin.byteLength),
  vocab.dims,
);

describe("real data", () => {
  it("every puzzle decodes to a vocab word with 8 clues", () => {
    for (const p of puzzles) {
      const target = decodeTarget(p.t, p.id);
      expect(vectors.has(target), `puzzle ${p.id}: ${target}`).toBe(true);
      expect(p.clues).toHaveLength(TOTAL_CLUES);
    }
  });

  it("the closest clue ranks much warmer than the farthest", () => {
    let warmer = 0;
    const sample = puzzles.slice(0, 50);
    for (const p of sample) {
      const target = decodeTarget(p.t, p.id);
      const far = vectors.rankOf(p.clues[0]!.w, target)!;
      const near = vectors.rankOf(p.clues.at(-1)!.w, target)!;
      if (near < far) warmer++;
    }
    expect(warmer).toBeGreaterThanOrEqual(45);
  });

  it("plays puzzle 1 to a win and to a loss", () => {
    const p = puzzles[0]!;
    const target = decodeTarget(p.t, p.id);
    const judge: Judge = { target, rankOf: (w) => vectors.rankOf(w, target) };

    let s = applyGuess(newGame(), p.clues[0]!.w, judge).state;
    expect(s.revealed).toBe(2);
    s = applyGuess(s, target.toUpperCase(), judge).state;
    expect(s.status).toBe("won");

    s = newGame();
    for (const w of ["table", "river", "music", "happy", "bread", "cloud", "horse", "paper"]) {
      s = applyGuess(s, w, judge).state;
    }
    expect(s.status).toBe("lost");
  });
});
