"""Fetch the raw sources into pipeline/.cache/. Skips anything already present.

Sources and licenses:
- GloVe 6B (Stanford NLP), PDDL 1.0: https://nlp.stanford.edu/projects/glove/
- SCOWL 2020.12.07 (Kevin Atkinson), permissive (copyright notice kept in README)
- LDNOOBW English list, CC BY 4.0
"""

from __future__ import annotations

import io
import shutil
import sys
import tarfile
import urllib.request
import zipfile

from paths import BLOCKLIST_LDNOOBW_TXT, CACHE, GLOVE_TXT, SCOWL_DIR

GLOVE_URLS = [
    "https://nlp.stanford.edu/data/glove.6B.zip",
    "https://huggingface.co/stanfordnlp/glove/resolve/main/glove.6B.zip",
]
SCOWL_URL = (
    "https://downloads.sourceforge.net/project/wordlist/SCOWL/2020.12.07/scowl-2020.12.07.tar.gz"
)
LDNOOBW_URL = (
    "https://raw.githubusercontent.com/LDNOOBW/"
    "List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en"
)
UA = {"User-Agent": "nearby-pipeline/1.0"}


def fetch(url: str, dest) -> None:
    print(f"Downloading {url}")
    req = urllib.request.Request(url, headers=UA)
    tmp = dest.with_suffix(dest.suffix + ".part")
    with urllib.request.urlopen(req, timeout=60) as resp, open(tmp, "wb") as out:
        total = int(resp.headers.get("Content-Length") or 0)
        done = 0
        while chunk := resp.read(1 << 20):
            out.write(chunk)
            done += len(chunk)
            if total and done % (50 << 20) < (1 << 20):
                print(f"  {done >> 20} / {total >> 20} MB", flush=True)
    tmp.replace(dest)


def get_glove() -> None:
    if GLOVE_TXT.exists():
        return
    zpath = CACHE / "glove.6B.zip"
    if not zpath.exists():
        for url in GLOVE_URLS:
            try:
                fetch(url, zpath)
                break
            except OSError as e:
                print(f"  failed: {e}")
        else:
            sys.exit("Could not download GloVe")
    print("Extracting glove.6B.300d.txt")
    with (
        zipfile.ZipFile(zpath) as z,
        z.open("glove.6B.300d.txt") as src,
        open(GLOVE_TXT, "wb") as dst,
    ):
        shutil.copyfileobj(src, dst, 1 << 20)


def get_scowl() -> None:
    if SCOWL_DIR.exists():
        return
    req = urllib.request.Request(SCOWL_URL, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tar:
        tar.extractall(CACHE, filter="data")
    if not SCOWL_DIR.exists():
        sys.exit(f"SCOWL archive did not contain {SCOWL_DIR.name}")


LDNOOBW_HEADER = """\
# List of Dirty, Naughty, Obscene, and Otherwise Bad Words (English)
# https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words
# (c) Shutterstock, licensed CC BY 4.0. Vendored unmodified below this header.
"""


def get_ldnoobw() -> None:
    """Vendored into the repo; only fetched if the file was deleted."""
    if BLOCKLIST_LDNOOBW_TXT.exists():
        return
    req = urllib.request.Request(LDNOOBW_URL, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = resp.read().decode("utf-8")
    BLOCKLIST_LDNOOBW_TXT.write_text(LDNOOBW_HEADER + body, encoding="utf-8", newline="\n")


def main() -> None:
    CACHE.mkdir(exist_ok=True)
    get_ldnoobw()
    get_scowl()
    get_glove()
    print("All sources present in", CACHE)


if __name__ == "__main__":
    main()
