"""Word-level helpers: blocklist and morphological relatedness."""

from __future__ import annotations

import re
from functools import cache

from nltk.stem.snowball import SnowballStemmer

from paths import BLOCKLIST_EXTRA_TXT, BLOCKLIST_LDNOOBW_TXT

WORD_RE = re.compile(r"^[a-z]{3,}$")
_stemmer = SnowballStemmer("english")

# Function words, number words and vague fillers make useless clues.
# (Words under 3 letters are already excluded.)
STOPWORDS = frozenset(
    """
about above after again against all also although among and another any anyone anything
are around because been before being below between both but can cannot could did does
doing done down during each either else enough even ever every few for from further had
has have having her here hers herself him himself his how however into its itself just
least less let like made make many may might more most much must myself near neither
never nor not now off often once one only onto other others ought our ours ourselves out
over own perhaps quite rather said same say says several shall she should since some
someone something still such than that the their theirs them themselves then there these
they this those though through thus too toward towards under unless until upon very was
were what whatever when whenever where whether which while who whoever whom whose why will
with within without would yet you your yours yourself yourselves
one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen
sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety
hundred hundreds thousand thousands million millions billion billions dozen dozens
first second third fourth fifth sixth seventh eighth ninth tenth half twice
actually already always anyway certainly especially exactly indeed instead maybe really
simply sure truly came come comes coming gave get gets getting give given gives going gone
got keep kept kind know knew look looked looking makes making need needed put seem seemed
seems take taken takes taking tell think thing things told took tried trying want wanted
went
""".split()
)


@cache
def stem(word: str) -> str:
    return _stemmer.stem(word)


def common_prefix_len(a: str, b: str) -> int:
    n = 0
    for x, y in zip(a, b, strict=False):
        if x != y:
            break
        n += 1
    return n


def edit_distance(a: str, b: str) -> int:
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def is_related(a: str, b: str) -> bool:
    """True if a and b look like forms of the same word (would give the answer away)."""
    if a == b or a in b or b in a:
        return True
    sa, sb = stem(a), stem(b)
    if sa == sb:
        return True
    # one word built on the other's stem: fishing/fishermen, bake/bakery
    if (len(sa) >= 4 and b.startswith(sa)) or (len(sb) >= 4 and a.startswith(sb)):
        return True
    prefix = common_prefix_len(a, b)
    # derivations and compounds: create/creation, decide/decision, grandmother/grandparents
    if prefix >= 5:
        return True
    # spelling variants and small inflections: color/colour, theater/theatre
    if prefix >= 4 and edit_distance(a, b) <= 2:
        return True
    # short irregular forms: run/ran, man/men, sing/sang
    if len(a) == len(b) <= 5 and edit_distance(a, b) == 1 and prefix >= 1:
        return True
    return False


class Blocklist:
    """Exact words plus substring roots (lines starting with '*' in the extra list)."""

    def __init__(self, exact: set[str], roots: set[str]):
        self.exact = exact
        self.roots = roots

    def __contains__(self, word: str) -> bool:
        return word in self.exact or any(r in word for r in self.roots)


def _read_lines(path) -> list[str]:
    lines = []
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip().lower()
        if line and not line.startswith("#"):
            lines.append(line)
    return lines


@cache
def load_blocklist() -> Blocklist:
    exact: set[str] = set()
    roots: set[str] = set()
    for line in _read_lines(BLOCKLIST_LDNOOBW_TXT):
        if " " not in line:
            exact.add(line)
    for line in _read_lines(BLOCKLIST_EXTRA_TXT):
        if line.startswith("*"):
            roots.add(line[1:])
        else:
            exact.add(line)
    return Blocklist(exact, roots)
