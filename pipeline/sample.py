"""Print puzzles in readable form for review.

Run: .\\.venv\\Scripts\\python pipeline\\sample.py -n 5 [--seed 1] | --all | --ids 3 17
"""

from __future__ import annotations

import argparse
import json
import random

import obfuscate
from paths import DATA


def format_puzzle(p: dict) -> str:
    lines = [f"Puzzle #{p['id']}"]
    for i, c in enumerate(p["clues"], 1):
        lines.append(f"  clue {i}: {c['w']:<14} rank {c['rank']:>2}  sim {c['sim']:.3f}")
    lines.append(f"  answer: {obfuscate.decode(p['t'], p['id'])}")
    return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("-n", type=int, default=5)
    ap.add_argument("--seed", type=int)
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--ids", type=int, nargs="+")
    args = ap.parse_args()

    puzzles = json.loads((DATA / "puzzles.json").read_text(encoding="utf-8"))["puzzles"]
    if args.all:
        chosen = puzzles
    elif args.ids:
        chosen = [puzzles[i - 1] for i in args.ids]
    else:
        chosen = sorted(random.Random(args.seed).sample(puzzles, args.n), key=lambda p: p["id"])
    print("\n\n".join(format_puzzle(p) for p in chosen))


if __name__ == "__main__":
    main()
