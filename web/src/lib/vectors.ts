// Warm/cold support: rank a guess by cosine similarity to the target among the whole vocabulary.

import type { VocabFile } from "./types";

export class WordVectors {
  readonly size: number;
  private readonly index: Map<string, number>;
  private readonly vecs: Float32Array;
  private cachedTarget = -1;
  private cachedSims: Float32Array | null = null;

  /** `raw` is int8, row-major, words.length x dims (vectors.bin). Rows are normalized here. */
  constructor(
    readonly words: string[],
    raw: Int8Array,
    readonly dims: number,
  ) {
    if (raw.length !== words.length * dims) {
      throw new Error(`vectors: expected ${words.length * dims} values, got ${raw.length}`);
    }
    this.size = words.length;
    this.index = new Map(words.map((w, i) => [w, i]));
    this.vecs = new Float32Array(raw.length);
    for (let r = 0; r < this.size; r++) {
      const off = r * dims;
      let norm = 0;
      for (let d = 0; d < dims; d++) norm += raw[off + d]! * raw[off + d]!;
      norm = Math.sqrt(norm) || 1;
      for (let d = 0; d < dims; d++) this.vecs[off + d] = raw[off + d]! / norm;
    }
  }

  has(word: string): boolean {
    return this.index.has(word);
  }

  /** Cosine similarity of every word to the target (cached for the current target). */
  private similarities(target: number): Float32Array {
    if (this.cachedTarget === target && this.cachedSims) return this.cachedSims;
    const { dims, vecs } = this;
    const sims = new Float32Array(this.size);
    const t = target * dims;
    for (let r = 0; r < this.size; r++) {
      let dot = 0;
      const off = r * dims;
      for (let d = 0; d < dims; d++) dot += vecs[off + d]! * vecs[t + d]!;
      sims[r] = dot;
    }
    this.cachedTarget = target;
    this.cachedSims = sims;
    return sims;
  }

  /**
   * 1-based rank of `guess` among all other vocab words by closeness to `target`
   * (1 = the closest word). Null if either word is unknown.
   */
  rankOf(guess: string, target: string): number | null {
    const g = this.index.get(guess);
    const t = this.index.get(target);
    if (g === undefined || t === undefined || g === t) return null;
    const sims = this.similarities(t);
    const s = sims[g]!;
    let closer = 0;
    for (let r = 0; r < this.size; r++) {
      if (r !== t && sims[r]! > s) closer++;
    }
    return closer + 1;
  }
}

/** Fetch vocab.json and vectors.bin from `baseUrl` (e.g. "/data/"). */
export async function loadVectors(baseUrl: string): Promise<WordVectors> {
  const [vocabRes, binRes] = await Promise.all([
    fetch(`${baseUrl}vocab.json`),
    fetch(`${baseUrl}vectors.bin`),
  ]);
  if (!vocabRes.ok || !binRes.ok) throw new Error("Could not load word vectors");
  const vocab = (await vocabRes.json()) as VocabFile;
  const raw = new Int8Array(await binRes.arrayBuffer());
  return new WordVectors(vocab.words, raw, vocab.dims);
}
