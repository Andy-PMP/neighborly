# Nearby

A daily word game built on word embeddings. You see clue words one at a time — the hidden word's nearest neighbors in meaning, from farthest to closest — and try to guess the word in as few clues as possible. Everything runs in the browser.

## Layout
- `pipeline/`: Python scripts that build the puzzle data offline (see [CLAUDE.md](CLAUDE.md) for commands)
- `data/`: generated JSON and vectors the game loads
- `web/`: the game (Astro + TypeScript)
- `docs/`: "How it works" content

## Credits and licenses
- **GloVe** word vectors (glove.6B, 300d): Jeffrey Pennington, Richard Socher and Christopher D. Manning, Stanford NLP. Released under the [Open Data Commons Public Domain Dedication and License (PDDL) 1.0](https://opendatacommons.org/licenses/pddl/1-0/). https://nlp.stanford.edu/projects/glove/
- **SCOWL** (Spell Checker Oriented Word Lists), used at build time as a dictionary filter. Copyright 2000–2020 by Kevin Atkinson and contributors; permission to use, copy, modify, distribute and sell granted provided the copyright notice appears. http://wordlist.aspell.net/
- **List of Dirty, Naughty, Obscene, and Otherwise Bad Words** (English), used at build time as a blocklist. Shutterstock, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words
- **NLTK** Snowball stemmer, Apache 2.0.
