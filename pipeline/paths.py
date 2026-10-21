"""Shared file locations for the pipeline."""

from pathlib import Path

PIPELINE = Path(__file__).resolve().parent
ROOT = PIPELINE.parent
CACHE = PIPELINE / ".cache"
DATA = ROOT / "data"

GLOVE_TXT = CACHE / "glove.6B.300d.txt"
SCOWL_DIR = CACHE / "scowl-2020.12.07"

TARGETS_TXT = PIPELINE / "targets.txt"
# LDNOOBW is vendored (CC BY 4.0) so validation can run in CI without downloads.
BLOCKLIST_LDNOOBW_TXT = PIPELINE / "blocklist_ldnoobw.txt"
BLOCKLIST_EXTRA_TXT = PIPELINE / "blocklist_extra.txt"
