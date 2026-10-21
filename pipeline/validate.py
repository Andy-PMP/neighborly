"""Validate the generated files in data/. Exits non-zero on any error.

Run: .\\.venv\\Scripts\\python pipeline\\validate.py
"""

from __future__ import annotations

import json
import sys

import obfuscate
from paths import DATA
from words import STOPWORDS, WORD_RE, is_related, load_blocklist

CLUES_PER_PUZZLE = 8
MIN_PUZZLES = 365
MIN_FIRST_RANK = 20
MAX_LAST_RANK = 2


def check_puzzle(p: dict, blocked, vocab: set[str]) -> list[str]:
    pid = p.get("id")
    errs: list[str] = []

    def err(msg: str) -> None:
        errs.append(f"puzzle {pid}: {msg}")

    try:
        target = obfuscate.decode(p["t"], pid)
    except Exception as e:  # noqa: BLE001 - any decode failure is a data error
        return [f"puzzle {pid}: target does not decode ({e})"]
    if not WORD_RE.match(target):
        err(f"target {target!r} is not a plain lowercase word")
    if target in blocked:
        err("target is blocked")
    if target not in vocab:
        err("target missing from vocab.json (no warm/cold feedback possible)")

    clues = p.get("clues", [])
    if len(clues) != CLUES_PER_PUZZLE:
        err(f"has {len(clues)} clues, expected {CLUES_PER_PUZZLE}")
        return errs
    ws = [c["w"] for c in clues]
    ranks = [c["rank"] for c in clues]
    sims = [c["sim"] for c in clues]
    if len(set(ws)) != len(ws):
        err("duplicate clues")
    if any(a <= b for a, b in zip(ranks, ranks[1:], strict=False)):
        err(f"ranks not strictly descending: {ranks}")
    if ranks[0] < MIN_FIRST_RANK or ranks[-1] > MAX_LAST_RANK:
        err(f"rank range {ranks[0]}..{ranks[-1]} outside expected")
    if any(a > b for a, b in zip(sims, sims[1:], strict=False)):
        err(f"similarities not ascending: {sims}")
    for w in ws:
        if target in w or w in target:
            err(f"clue {w!r} contains or is contained by the target")
        elif is_related(target, w):
            err(f"clue {w!r} is a form of the target")
        if w in blocked:
            err(f"clue {w!r} is blocked")
        if w in STOPWORDS:
            err(f"clue {w!r} is a stopword")
        if w not in vocab:
            err(f"clue {w!r} missing from vocab.json")

    pts = p.get("map", [])
    if len(pts) != CLUES_PER_PUZZLE + 1:
        err(f"map has {len(pts)} points, expected {CLUES_PER_PUZZLE + 1}")
    elif any(abs(v) > 1 for pt in pts for v in pt):
        err("map coordinates outside [-1, 1]")
    return errs


def validate_data(puzzles_doc: dict, vocab_doc: dict, n_vector_bytes: int) -> list[str]:
    errors: list[str] = []
    blocked = load_blocklist()
    words = vocab_doc["words"]
    vocab = set(words)
    if len(vocab) != len(words):
        errors.append("vocab.json has duplicate words")
    bad = [w for w in words if w in blocked]
    if bad:
        errors.append(f"vocab.json contains blocked words: {bad[:10]}")
    if n_vector_bytes != len(words) * vocab_doc["dims"]:
        errors.append(
            f"vectors.bin is {n_vector_bytes} bytes, expected {len(words)} x {vocab_doc['dims']}"
        )

    puzzles = puzzles_doc["puzzles"]
    if len(puzzles) < MIN_PUZZLES:
        errors.append(f"only {len(puzzles)} puzzles, need at least {MIN_PUZZLES}")
    if [p["id"] for p in puzzles] != list(range(1, len(puzzles) + 1)):
        errors.append("puzzle ids are not 1..N in order")
    targets = []
    for p in puzzles:
        errors.extend(check_puzzle(p, blocked, vocab))
        try:
            targets.append(obfuscate.decode(p["t"], p["id"]))
        except Exception:  # noqa: BLE001 - already reported by check_puzzle
            pass
    if len(set(targets)) != len(targets):
        errors.append("duplicate targets")
    return errors


def main() -> int:
    puzzles_doc = json.loads((DATA / "puzzles.json").read_text(encoding="utf-8"))
    vocab_doc = json.loads((DATA / "vocab.json").read_text(encoding="utf-8"))
    n_bytes = (DATA / "vectors.bin").stat().st_size
    errors = validate_data(puzzles_doc, vocab_doc, n_bytes)
    for e in errors:
        print("ERROR", e)
    print(f"validate: {len(puzzles_doc['puzzles'])} puzzles, {len(errors)} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
