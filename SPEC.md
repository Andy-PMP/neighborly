# Nearby — Spec

## Concept
A daily word-guessing game built on word embeddings. The player sees clue words one at a time and guesses the hidden target word. The clues are the target's nearest neighbors in meaning, revealed from farthest to closest. Guess early for a higher score.

Purpose: a portfolio piece for my personal site that shows embeddings and nearest-neighbor search in something anyone can play in two minutes. It must run entirely in the browser: no server, no API calls, no per-play cost.

## How a round works
1. A new puzzle each day, the same for every player (based on the UTC date).
2. The game shows clue #1: a fairly distant neighbor (around rank 30).
3. The player guesses. Unlimited guesses per clue.
4. Each wrong guess reveals the next clue, moving closer to the target (around 8 clues total, ending near rank 1–2).
5. If the target is guessed: show the score and every clue with its rank. If all clues are used: reveal the answer.
6. Score: higher for guessing with fewer clues revealed.
7. Wrong guesses get warm/cold feedback based on the guess's similarity to the target, if the guess is in our vocabulary.

## Features
- Daily mode (date-seeded) and a practice mode (random past puzzles).
- A shareable, spoiler-free result line (e.g., "Nearby #12 — got it on clue 3/8").
- Stats and streaks stored only in the browser (localStorage, wrapped in try/catch).
- A "How it works" page explaining embeddings and nearest neighbors in plain language, with a small 2D map of the day's target and its clues (only revealed after the puzzle is finished).
- Mobile-first, keyboard friendly, accessible (contrast, focus states, screen-reader labels).

## Data pipeline (Python, run on my machine, not in the browser)
- Use pretrained word vectors suited to single words (e.g., GloVe or fastText). Check and document each candidate's license before choosing.
- Vocabulary: common English words only. Remove proper nouns, numbers, misspellings, and very rare words.
- Content safety: apply an offensive-word blocklist to both targets and clues. Nothing offensive should ever appear as a clue.
- Target list: about 400 curated common words (mostly nouns, some verbs and adjectives), enough for a year plus practice.
- For each target, compute the top ~60 neighbors, then filter out:
  - Words that contain the target or share its stem (plurals, -ing forms, etc.)
  - Blocked, rare, or duplicate words
- Pick ~8 clues spaced from around rank 30 down to rank 1–2.
- Precompute a small vector set (reduced dimensions if needed) for warm/cold feedback on guesses, keeping the total download small (target: under a few MB).
- Precompute 2D coordinates for each puzzle's map (e.g., PCA or UMAP on the target plus its clues).
- Output: compact JSON files the game loads. Lightly obfuscate answers so they aren't readable at a glance in the file.
- Validation script: every puzzle has 8 clues, no clue contains the target string, no blocked words, ranks are in descending order.

## Front end
- If this will live inside my existing site's repo, match that site's stack. Otherwise: a standalone static site (plain HTML/CSS/JS or Vite + TypeScript; recommend one with a one-line reason).
- Guess normalization: case-insensitive; accept simple plurals and common inflections of the target as correct.
- No external requests at runtime except optional web fonts.

## Testing
- Unit tests: date → puzzle number, guess normalization, scoring, share-line output.
- Pipeline tests: the validation script runs in CI or before every data rebuild.

## Repo layout
pipeline/ (Python: build data, validate), data/ (generated JSON), web/ (the game), docs/ (how-it-works content), README.md, CLAUDE.md

## Environment
Windows 11, PowerShell syntax for all commands. Python venv for the pipeline. Secrets: none needed.

## Phases
P0 Setup (repo, venv, tooling) · P1 Data pipeline + validation · P2 Core game (one puzzle playable end to end) · P3 Daily mode, practice, share line, stats · P4 How-it-works page + 2D map · P5 Polish, accessibility pass, deploy to my site