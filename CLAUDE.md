# Nearby

Daily browser word game: guess a hidden word from its embedding nearest neighbors, revealed farthest → closest. Full spec in [SPEC.md](SPEC.md). Portfolio piece; runs fully client-side (no server, no runtime API calls).

## Decisions
- Word vectors: GloVe 6B 300d (PDDL 1.0). Dictionary filter: SCOWL size 50 (permissive). Blocklist: LDNOOBW en (CC BY 4.0) + `pipeline/blocklist_extra.txt`.
- Front end (P2+): Astro + TypeScript, no UI framework; Vitest. Deploy as a GitHub Pages project page (`base: '/nearby'`) via `withastro/action`, linked from the Astro portfolio.
- Generated data in `data/` is committed; the raw sources in `pipeline/.cache/` are not.

## Environment
Windows 11. **Use PowerShell syntax for every command.** Python venv at `.venv` (Python 3.14).

```powershell
py -3.14 -m venv .venv
.\.venv\Scripts\python -m pip install -r pipeline\requirements.txt
.\.venv\Scripts\python pipeline\download.py      # one-time, ~860 MB GloVe zip into pipeline\.cache
.\.venv\Scripts\python pipeline\build.py         # rebuild data\ (runs validate at the end)
.\.venv\Scripts\python pipeline\validate.py      # check data\ only
.\.venv\Scripts\python pipeline\sample.py -n 5   # print puzzles for review (--all for every one)
.\.venv\Scripts\python -m pytest
.\.venv\Scripts\ruff check pipeline
```

## Data contract (what `web/` consumes)
- `data/puzzles.json`: `{version: 1, puzzles: [{id, t, clues: [{w, rank, sim}] (8, farthest→nearest), map: [[x,y]] (target first, then clues in the same order, in [-1,1])}]}`. `id` is 1..N.
- `t` decodes as: base64 → bytes, XOR byte i with `key[i % len(key)]` where key = UTF-8 of `"nearby:" + id`.
- `data/vocab.json`: `{dims, words: [...]}` (~27.8k guessable words). `data/vectors.bin`: int8, row-major, `words.length × dims`, row i ↔ `words[i]`; rows are scaled, so normalize before cosine.
- Warm/cold plan: decode target → its row; cosine vs all rows; feedback from the guess's rank among all vocab words (fast enough in JS, ~2.7M multiply-adds).
- `rank` = position among the target's filtered neighbors (not raw GloVe rank). Clues come from words ranked 300–25,000 in GloVe frequency, minus stopwords/fillers/numbers.
- Targets are append-only once live: `targets.txt` order goes through a fixed-seed shuffle, so editing it reorders every puzzle.

## Conventions
- Pipeline scripts run as `python pipeline\<script>.py`; they import each other as top-level modules (`from paths import ...`). Shared paths live in `pipeline/paths.py`.
- Any change to targets, filters or blocklists: rebuild, then validate; never hand-edit `data/`.
- Answers in `puzzles.json` are obfuscated (XOR + base64, see `pipeline/obfuscate.py`); the front end must mirror that decoding exactly.
- Commit only when asked.

## Phases
- [x] **P0 Setup**: repo layout, venv, ruff/pytest config, CI workflow, README, this file
- [x] **P1 Data pipeline + validation**: download, vocab, targets, build, validate, sample, tests. Result: 599 puzzles, 0 validation errors, data/ 3.1 MB, 96d vectors (Spearman 0.906 vs full 300d)
  - [ ] Owner review of `pipeline\.cache\review.txt` (`sample.py --all`) for clue quality/tone; trim `targets.txt` toward ~400 favorites if wanted
- [ ] **P2 Core game**: Astro scaffold in `web/`, load data, one puzzle playable end to end, warm/cold feedback, guess normalization, Vitest
- [ ] **P3 Daily/practice/share/stats**: UTC-date puzzle number, practice mode, share line, localStorage stats + streaks
- [ ] **P4 How it works + 2D map**: docs content, map revealed after finishing
- [ ] **P5 Polish + deploy**: accessibility pass, mobile, GitHub Pages deploy, link from portfolio
