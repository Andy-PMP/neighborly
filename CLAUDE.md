# Neighborly

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

# web (run from the repo root; npm workspaces forward to web/)
npm install          # once
npm run dev          # http://localhost:4321/ ; copies data\ into web\public\data first
                     # dev-only URL params: ?date=YYYY-MM-DD (pretend it's that UTC day), ?id=N (play any puzzle)
npm test             # Vitest
npm run build        # astro check + static build into web\dist
npm run preview      # serve web\dist at http://localhost:4321/
```
Windows PowerShell 5.1 drops `--` when passing args through npm, so `npm run preview -- --port X` doesn't work; run `npx -w web astro preview --port X` instead.

## Data contract (what `web/` consumes)
- `data/puzzles.json`: `{version: 1, puzzles: [{id, t, clues: [{w, rank, sim}] (8, farthest→nearest), map: [[x,y]] (target first, then clues in the same order, in [-1,1])}]}`. `id` is 1..N.
- `t` decodes as: base64 → bytes, XOR byte i with `key[i % len(key)]` where key = UTF-8 of `id + ":nearby"` (id first so short answers still get a per-puzzle key).
- `data/vocab.json`: `{dims, words: [...]}` (~27.8k guessable words). `data/vectors.bin`: int8, row-major, `words.length × dims`, row i ↔ `words[i]`; rows are scaled, so normalize before cosine.
- Warm/cold plan: decode target → its row; cosine vs all rows; feedback from the guess's rank among all vocab words (fast enough in JS, ~2.7M multiply-adds).
- `rank` = position among the target's filtered neighbors (not raw GloVe rank). Clues come from words ranked 300–25,000 in GloVe frequency, minus stopwords/fillers/numbers.
- **Launched 2026-10-22 (`LAUNCH_DATE` in `web/src/lib/daily.ts`): puzzle #1 is that UTC day. Never change it.**
- **Targets are now append-only.** `targets.txt` goes through a fixed-seed shuffle, so removing or reordering a line reorders every puzzle (and changes past days' answers). To retire a bad puzzle, block its answer differently or swap it in place in a coordinated change; to add, append and rebuild, then confirm puzzles 1..N are unchanged. The 598 puzzles run out on day 599 (2028-06-11), after which the game wraps to puzzle 1 while the day number keeps counting; append targets before then.

## Conventions
- Pipeline scripts run as `python pipeline\<script>.py`; they import each other as top-level modules (`from paths import ...`). Shared paths live in `pipeline/paths.py`.
- Any change to targets, filters or blocklists: rebuild, then validate; never hand-edit `data/`.
- Answers in `puzzles.json` are obfuscated (XOR + base64, see `pipeline/obfuscate.py`); the front end must mirror that decoding exactly.
- Front end: game logic lives in pure, unit-tested modules in `web/src/lib/` (decode, normalize, vectors, feedback, score, game, daily, practice, share, stats, storage, map); browser-only helpers in `web/src/scripts/` (env, map-render); shared chrome in `web/src/layouts/Layout.astro` and `web/src/components/` (Nav, StatsDialog); `web/src/pages/index.astro` holds only markup plus one client script that wires the DOM. Keep new logic in `lib/` with tests.
- Game rules (P2): unknown, repeated and empty guesses cost nothing; a wrong known word reveals the next clue; a wrong guess on clue 8 loses. Score = 9 − clue number solved on (0 if lost). Warm/cold bands by vocab rank: Hot ≤10, Warm ≤100, Mild ≤1,000, Cool ≤5,000, else Cold.
- P3 rules: daily = `/`; practice = `/?practice[=N]`, past puzzles only (none on launch day). Only daily games are saved (key `nearby:v1`, in-progress too, so reloads resume and can't replay). Streak = consecutive daily wins; a loss or skipped day resets it; an unfinished today keeps yesterday's streak. Share text: `Neighborly #N — got it on clue c/8` or `Neighborly #N — missed it (8 clues)`, then one emoji per guess, then the URL.
- Name: the game is **Neighborly** (renamed from Nearby during P4). Internal identifiers keep "nearby" on purpose: storage key `nearby:v1`, obfuscation salt, repo/folder and npm package names. Don't rename those (it would wipe saves or change every answer token).
- P4: the 2D map names the answer, so it is only drawn after a game ends (`renderEnd`) or, on `/how-it-works/`, for daily games in `finishedDays(save)`. Label layout is in `lib/map.ts`; `data.test.ts` lays out all real puzzles and fails on real label collisions. Explainer text is `docs/how-it-works.md` (plain Markdown + raw HTML, imported by `web/src/pages/how-it-works.astro`); its example words must not be puzzle answers.
- Clue slots stay `[30, 22, 16, 11, 7, 4, 2, 1]` (owner chose 30 over 25/20 as harder).
- Commit only when asked.

## Phases
- [x] **P0 Setup**: repo layout, venv, ruff/pytest config, CI workflow, README, this file
- [x] **P1 Data pipeline + validation**: download, vocab, targets, build, validate, sample, tests. Result: 599 puzzles, 0 validation errors, data/ 3.1 MB, 96d vectors (Spearman 0.906 vs full 300d)
  - [x] Owner review of `pipeline\.cache\review.txt` (`sample.py --all`) for clue quality/tone; trim `targets.txt` toward ~400 favorites if wanted
- [x] **P2 Core game**: Astro scaffold in `web/`, load data, one puzzle playable end to end, warm/cold feedback, guess normalization, Vitest (56 tests, incl. real-data integration)
  - [x] Owner play-test in a browser: went well; "bitter" removed as a target (news-sense vectors), data rebuilt to 598 puzzles before launch
- [x] **P3 Daily/practice/share/stats**: UTC-date puzzle number, practice mode, share line, localStorage stats + streaks (88 tests)
  - [x] Owner play-test of P3 in a browser: no notes
- [x] **P4 How it works + 2D map**: `docs/how-it-works.md` rendered at `/how-it-works/`; map on the end screen and (finished daily games only) on the explainer; renamed the game to Neighborly (101 tests)
  - [ ] Owner play-test of P4 in a browser (no browser tool in the P4 session): map look at phone width, dark mode, explainer read-through
- [ ] **P5 Polish + deploy**: accessibility pass, mobile, GitHub Pages deploy, link from portfolio
