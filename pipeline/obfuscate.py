"""Light answer obfuscation: XOR with a per-puzzle key, then base64.

Not security, just enough that answers aren't readable at a glance in puzzles.json.
The front end must implement the same `decode`.
"""

import base64

SALT = "nearby"


def _key(puzzle_id: int) -> bytes:
    # id first, so even short answers get a key that differs per puzzle
    return f"{puzzle_id}:{SALT}".encode()


def _xor(data: bytes, key: bytes) -> bytes:
    return bytes(b ^ key[i % len(key)] for i, b in enumerate(data))


def encode(word: str, puzzle_id: int) -> str:
    return base64.b64encode(_xor(word.encode(), _key(puzzle_id))).decode()


def decode(token: str, puzzle_id: int) -> str:
    return _xor(base64.b64decode(token), _key(puzzle_id)).decode()
