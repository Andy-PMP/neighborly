import copy

import pytest

import obfuscate
from build import SLOTS
from validate import check_puzzle, validate_data
from words import load_blocklist

VOCAB = {"ocean", "sea", "waves", "coast", "water", "deep", "shore", "tide", "beach", "atlantic"}
CLUE_WORDS = ["water", "deep", "coast", "waves", "shore", "tide", "beach", "sea"]


def make_puzzle(pid=1, target="ocean"):
    return {
        "id": pid,
        "t": obfuscate.encode(target, pid),
        "clues": [
            {"w": w, "rank": r, "sim": round(0.3 + i * 0.05, 3)}
            for i, (w, r) in enumerate(zip(CLUE_WORDS, SLOTS, strict=True))
        ],
        "map": [[0.0, 0.0]] + [[0.5, -0.5]] * 8,
    }


def errors_for(p):
    return check_puzzle(p, load_blocklist(), VOCAB)


def test_valid_puzzle_passes():
    assert errors_for(make_puzzle()) == []


@pytest.mark.parametrize(
    "mutate,expected",
    [
        (lambda p: p["clues"].pop(), "has 7 clues"),
        (lambda p: p["clues"][3].update(rank=40), "not strictly descending"),
        (lambda p: p["clues"][0].update(w="oceans"), "contains or is contained"),
        (lambda p: p["clues"][0].update(w="oceanic"), "contains or is contained"),
        (lambda p: p["clues"][0].update(w="rape"), "blocked"),
        (lambda p: p["clues"][0].update(w="which"), "stopword"),
        (lambda p: p["clues"][1].update(w="water"), "duplicate"),
        (lambda p: p["clues"][0].update(w="unknown"), "missing from vocab"),
        (lambda p: p["clues"][0].update(sim=0.99), "not ascending"),
        (lambda p: p["map"].pop(), "map has 8 points"),
        (lambda p: p.update(t="!!notbase64"), "does not decode"),
    ],
)
def test_broken_puzzles_are_caught(mutate, expected):
    p = copy.deepcopy(make_puzzle())
    mutate(p)
    errs = errors_for(p)
    assert any(expected in e for e in errs), errs


def test_validate_data_checks_vector_size_and_ids():
    doc = {"puzzles": [make_puzzle(1), make_puzzle(3)]}
    vocab_doc = {"dims": 4, "words": sorted(VOCAB)}
    errs = validate_data(doc, vocab_doc, n_vector_bytes=7)
    assert any("vectors.bin" in e for e in errs)
    assert any("ids are not 1..N" in e for e in errs)
    assert any("only 2 puzzles" in e for e in errs)
