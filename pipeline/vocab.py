"""Build the common-English vocabulary with unit-normalized GloVe vectors.

A word is kept if it is lowercase a-z (3+ letters), within GloVe's most frequent
GUESS_MAX_RANK entries, listed in lowercase in SCOWL (size <= 50), and not blocked.
Any vocab word can be a target; clues must rank between CLUE_MIN_RANK and CLUE_MAX_RANK.
"""

from __future__ import annotations

import numpy as np

from paths import GLOVE_TXT, SCOWL_DIR
from words import WORD_RE, load_blocklist

GUESS_MAX_RANK = 50_000
CLUE_MAX_RANK = 25_000
CLUE_MIN_RANK = 300  # the most frequent words (way, going, really) make filler clues
SCOWL_MAX_SIZE = 50
SCOWL_CATEGORIES = ("english-words", "american-words", "british-words")


def load_scowl() -> set[str]:
    words: set[str] = set()
    for path in (SCOWL_DIR / "final").iterdir():
        category, _, size = path.name.rpartition(".")
        if category in SCOWL_CATEGORIES and size.isdigit() and int(size) <= SCOWL_MAX_SIZE:
            for w in path.read_text(encoding="latin-1").split():
                if w.islower():
                    words.add(w)
    return words


def build_vocab() -> dict[str, np.ndarray]:
    scowl = load_scowl()
    blocked = load_blocklist()
    words, ranks, vecs = [], [], []
    with open(GLOVE_TXT, encoding="utf-8") as f:
        for rank, line in enumerate(f):
            if rank >= GUESS_MAX_RANK:
                break
            word, _, rest = line.partition(" ")
            if not WORD_RE.match(word) or word not in scowl or word in blocked:
                continue
            words.append(word)
            ranks.append(rank)
            vecs.append(np.array(rest.split(), dtype=np.float32))
    mat = np.stack(vecs)
    mat /= np.linalg.norm(mat, axis=1, keepdims=True)
    return {"words": np.array(words), "ranks": np.array(ranks, dtype=np.int32), "vecs": mat}


if __name__ == "__main__":
    v = build_vocab()
    n_clue = int(((v["ranks"] >= CLUE_MIN_RANK) & (v["ranks"] < CLUE_MAX_RANK)).sum())
    print(f"vocab: {len(v['words'])} words ({n_clue} clue-eligible), dims {v['vecs'].shape[1]}")
