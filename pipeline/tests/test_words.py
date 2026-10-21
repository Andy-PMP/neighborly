import pytest

from words import STOPWORDS, edit_distance, is_related, load_blocklist


@pytest.mark.parametrize(
    "a,b",
    [
        ("dog", "dogs"),  # plural (substring)
        ("cook", "cooking"),  # -ing
        ("bake", "baked"),  # -ed
        ("happy", "happiness"),  # shared stem
        ("create", "creation"),  # derivation
        ("color", "colour"),  # spelling variant
        ("theater", "theatre"),
        ("run", "ran"),  # short irregular
        ("man", "men"),
        ("grandmother", "grandparents"),  # compound sharing a 5-letter prefix
        ("sunflower", "sun"),  # clue contained in target
        ("fishing", "fishermen"),  # built on the other's stem
        ("bake", "bakery"),
    ],
)
def test_related_forms(a, b):
    assert is_related(a, b)
    assert is_related(b, a)


@pytest.mark.parametrize(
    "a,b",
    [
        ("dog", "cat"),
        ("ocean", "sea"),
        ("king", "queen"),
        ("bread", "butter"),
        ("teacher", "school"),
    ],
)
def test_unrelated_words(a, b):
    assert not is_related(a, b)


def test_edit_distance():
    assert edit_distance("kitten", "sitting") == 3
    assert edit_distance("", "abc") == 3
    assert edit_distance("same", "same") == 0


def test_blocklist_exact_and_roots():
    blocked = load_blocklist()
    assert "rape" in blocked  # exact, extra list
    assert "unfuckingbelievable" in blocked  # '*fuck' root
    assert "grape" not in blocked  # exact entries must not act as substrings
    assert "class" not in blocked


def test_stopwords_cover_numbers_and_fillers():
    assert {"five", "half", "really", "which"} <= STOPWORDS
