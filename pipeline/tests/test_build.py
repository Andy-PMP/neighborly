import numpy as np
import pytest

import obfuscate
from build import SLOTS, filtered_neighbors, map_coords, pick_clues, reduce_vectors


def test_obfuscation_round_trip():
    for pid in (1, 42, 365):
        token = obfuscate.encode("elephant", pid)
        assert "elephant" not in token
        assert obfuscate.decode(token, pid) == "elephant"
    assert obfuscate.encode("elephant", 1) != obfuscate.encode("elephant", 2)


def test_filtered_neighbors_drops_forms_of_target_and_each_other():
    words = np.array(["dogs", "puppy", "puppies", "cat", "doggy", "pet", "cats"])
    sims = np.array([0.9, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55])
    pool = filtered_neighbors("dog", np.arange(len(words)), sims, words)
    assert [w for w, _ in pool] == ["puppy", "cat", "pet"]


def test_pick_clues_follows_slots_far_to_near():
    pool = [(f"w{i}", 1 - i / 100) for i in range(1, 61)]
    clues = pick_clues(pool)
    assert [c["rank"] for c in clues] == SLOTS
    assert clues[0]["w"] == f"w{SLOTS[0]}"
    assert clues[-1]["w"] == "w1"
    sims = [c["sim"] for c in clues]
    assert sims == sorted(sims)


def test_pick_clues_rejects_short_pool():
    with pytest.raises(ValueError):
        pick_clues([("a", 0.5)] * (max(SLOTS) - 1))


def test_map_coords_shape_and_range():
    rng = np.random.default_rng(0)
    pts = map_coords(rng.normal(size=(9, 300)))
    assert len(pts) == 9
    assert max(abs(v) for p in pts for v in p) == pytest.approx(1.0)


def test_reduce_vectors_int8():
    rng = np.random.default_rng(0)
    vecs = rng.normal(size=(200, 300)).astype(np.float32)
    vecs /= np.linalg.norm(vecs, axis=1, keepdims=True)
    q = reduce_vectors(vecs, 16)
    assert q.shape == (200, 16)
    assert q.dtype == np.int8
    assert np.abs(q).max(axis=1).min() == 127
