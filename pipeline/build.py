"""Build data/: puzzles.json, vocab.json, vectors.bin, meta.json. Validates at the end.

Run: .\\.venv\\Scripts\\python pipeline\\build.py [--dims 96]
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from datetime import UTC, datetime

import numpy as np

import obfuscate
import validate
from paths import DATA, TARGETS_TXT
from vocab import CLUE_MAX_RANK, CLUE_MIN_RANK, build_vocab
from words import STOPWORDS, is_related, load_blocklist

# Clue slots by rank among filtered neighbors, farthest first.
SLOTS = [30, 22, 16, 11, 7, 4, 2, 1]
POOL_SIZE = 60  # filtered neighbors kept per target
SEARCH_K = 400  # raw neighbors scanned to fill the pool
REDUCED_DIMS = 96  # 64d gave Spearman 0.86 vs full vectors; 96d gives 0.90
SHUFFLE_SEED = 20261021  # fixed: changing it reorders every puzzle


def load_targets() -> list[str]:
    seen: dict[str, None] = {}
    # utf-8-sig: tolerate the BOM that Windows PowerShell 5.1 adds when editing the file
    for raw in TARGETS_TXT.read_text(encoding="utf-8-sig").splitlines():
        word = raw.split("#", 1)[0].strip().lower()
        if word:
            seen.setdefault(word, None)
    return list(seen)


def filtered_neighbors(
    target: str, order: np.ndarray, sims: np.ndarray, words: np.ndarray
) -> list[tuple[str, float]]:
    """Nearest neighbors of target, closest first, minus giveaways and near-duplicates."""
    pool: list[tuple[str, float]] = []
    for i in order:
        w = str(words[i])
        if is_related(target, w) or any(is_related(w, kept) for kept, _ in pool):
            continue
        pool.append((w, float(sims[i])))
        if len(pool) == POOL_SIZE:
            break
    return pool


def pick_clues(pool: list[tuple[str, float]]) -> list[dict]:
    """One clue per slot, farthest first. `rank` is 1-based position in the filtered pool."""
    if len(pool) < max(SLOTS):
        raise ValueError(f"pool has {len(pool)} words, need {max(SLOTS)}")
    return [{"w": pool[r - 1][0], "rank": r, "sim": round(pool[r - 1][1], 3)} for r in SLOTS]


def map_coords(vecs: np.ndarray) -> list[list[float]]:
    """PCA to 2D, scaled so the largest coordinate is 1."""
    centered = vecs - vecs.mean(axis=0)
    _, _, vt = np.linalg.svd(centered, full_matrices=False)
    xy = centered @ vt[:2].T
    xy /= np.abs(xy).max()
    return [[round(float(x), 3), round(float(y), 3)] for x, y in xy]


def reduce_vectors(vecs: np.ndarray, dims: int) -> np.ndarray:
    """PCA-reduce unit vectors, re-normalize, quantize each row to int8."""
    centered = vecs - vecs.mean(axis=0)
    _, _, vt = np.linalg.svd(centered, full_matrices=False)
    red = centered @ vt[:dims].T
    red /= np.linalg.norm(red, axis=1, keepdims=True)
    scale = 127 / np.abs(red).max(axis=1, keepdims=True)
    return np.round(red * scale).astype(np.int8)


def _spearman(a: np.ndarray, b: np.ndarray) -> float:
    ra = a.argsort().argsort().astype(np.float64)
    rb = b.argsort().argsort().astype(np.float64)
    return float(np.corrcoef(ra, rb)[0, 1])


def reduction_quality(full: np.ndarray, q: np.ndarray, target_idx: list[int]) -> dict:
    """How well int8 reduced similarities preserve full-vector ordering, per target."""
    red = q.astype(np.float32)
    red /= np.linalg.norm(red, axis=1, keepdims=True)
    rho, overlap = [], []
    for i in target_idx:
        s_full, s_red = full @ full[i], red @ red[i]
        rho.append(_spearman(s_full, s_red))
        top_full = set(np.argsort(-s_full)[1:101])
        top_red = set(np.argsort(-s_red)[1:101])
        overlap.append(len(top_full & top_red) / 100)
    return {
        "spearman": round(float(np.mean(rho)), 3),
        "top100_overlap": round(float(np.mean(overlap)), 3),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dims", type=int, default=REDUCED_DIMS)
    args = ap.parse_args()

    vocab = build_vocab()
    words, ranks, vecs = vocab["words"], vocab["ranks"], vocab["vecs"]
    index = {str(w): i for i, w in enumerate(words)}
    clue_mask = (
        (ranks >= CLUE_MIN_RANK) & (ranks < CLUE_MAX_RANK) & ~np.isin(words, list(STOPWORDS))
    )
    clue_idx = np.flatnonzero(clue_mask)
    clue_words, clue_vecs = words[clue_idx], vecs[clue_idx]
    blocked = load_blocklist()

    puzzles, dropped = [], []
    for target in load_targets():
        if target in blocked:
            dropped.append((target, "blocked"))
            continue
        i = index.get(target)
        if i is None:
            dropped.append((target, "not in common vocab"))
            continue
        sims = clue_vecs @ vecs[i]
        order = np.argpartition(-sims, SEARCH_K)[:SEARCH_K]
        order = order[np.argsort(-sims[order])]
        pool = filtered_neighbors(target, order, sims, clue_words)
        try:
            clues = pick_clues(pool)
        except ValueError as e:
            dropped.append((target, str(e)))
            continue
        pts = np.stack([vecs[i]] + [vecs[index[c["w"]]] for c in clues])
        puzzles.append({"target": target, "clues": clues, "map": map_coords(pts)})

    random.Random(SHUFFLE_SEED).shuffle(puzzles)
    out = []
    for n, p in enumerate(puzzles, 1):
        out.append(
            {"id": n, "t": obfuscate.encode(p["target"], n), "clues": p["clues"], "map": p["map"]}
        )

    q = reduce_vectors(vecs, args.dims)
    sample_idx = [index[p["target"]] for p in puzzles[:60]]
    quality = reduction_quality(vecs, q, sample_idx)

    DATA.mkdir(exist_ok=True)
    compact = {"separators": (",", ":"), "ensure_ascii": False}
    (DATA / "puzzles.json").write_text(
        json.dumps({"version": 1, "puzzles": out}, **compact), encoding="utf-8"
    )
    (DATA / "vocab.json").write_text(
        json.dumps({"dims": args.dims, "words": [str(w) for w in words]}, **compact),
        encoding="utf-8",
    )
    (DATA / "vectors.bin").write_bytes(q.tobytes())
    meta = {
        "built": datetime.now(UTC).strftime("%Y-%m-%d"),
        "source": "GloVe 6B 300d (PDDL 1.0)",
        "puzzles": len(out),
        "vocab": len(words),
        "dims": args.dims,
        "slots": SLOTS,
        "reduction": quality,
    }
    (DATA / "meta.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")

    for word, why in dropped:
        print(f"dropped {word}: {why}")
    size_kb = sum(f.stat().st_size for f in DATA.iterdir()) / 1024
    print(f"{len(out)} puzzles, {len(dropped)} dropped, vocab {len(words)}, data/ {size_kb:.0f} KB")
    print(f"reduction to {args.dims}d: {quality}")
    sys.exit(validate.main())


if __name__ == "__main__":
    main()
