#!/usr/bin/env python3
"""Check that jsdelivr package pins in index.html match THIRD_PARTY.md and PARITY.md.

index.html is the single source of truth for pinned CDN versions. THIRD_PARTY.md
and PARITY.md restate those versions in prose; nothing previously compared the
two, so they could silently drift apart. This script extracts every jsdelivr
(package, version) pair from index.html and confirms each is named, with the
matching version, in THIRD_PARTY.md, and (where PARITY.md also names it) in
PARITY.md too.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

NPM_PIN_RE = re.compile(
    r"cdn\.jsdelivr\.net/npm/(@[\w.-]+/[\w.-]+|[\w.-]+)@([\w.-]+)/"
)
PYODIDE_PIN_RE = re.compile(r"cdn\.jsdelivr\.net/pyodide/v([\w.-]+)/")
VERSION_TOKEN_RE = re.compile(r"`?v?(\d+(?:\.\d+){1,3})")
NAME_WINDOW = 40


def name_pattern(name: str) -> re.Pattern[str]:
    """Case-insensitive pattern matching a package's basename with any punctuation/spacing."""
    basename = name.rsplit("/", 1)[-1]
    segments = [seg for seg in re.split(r"[^A-Za-z0-9]+", basename) if seg]
    return re.compile(r"[\s.\-_/]*".join(re.escape(seg) for seg in segments), re.IGNORECASE)


def collect_index_pins(html: str) -> dict[str, set[str]]:
    pins: dict[str, set[str]] = {}
    for name, version in NPM_PIN_RE.findall(html):
        pins.setdefault(name, set()).add(version)
    for version in PYODIDE_PIN_RE.findall(html):
        pins.setdefault("pyodide", set()).add(version)
    return pins


def find_versions(doc_text: str, name: str) -> set[str]:
    """Versions mentioned immediately after a mention of the package's name."""
    versions: set[str] = set()
    pattern = name_pattern(name)
    for line in doc_text.splitlines():
        for match in pattern.finditer(line):
            window = line[match.end() : match.end() + NAME_WINDOW]
            found = VERSION_TOKEN_RE.search(window)
            if found:
                versions.add(found.group(1))
    return versions


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compare jsdelivr pins in index.html against THIRD_PARTY.md and PARITY.md."
    )
    parser.add_argument("--index-html", default="index.html", help="Canonical HTML source")
    parser.add_argument("--third-party", default="THIRD_PARTY.md", help="Third-party notices doc")
    parser.add_argument("--parity", default="PARITY.md", help="Parity doc")
    args = parser.parse_args()

    index_path = Path(args.index_html)
    third_party_path = Path(args.third_party)
    parity_path = Path(args.parity)

    for path in (index_path, third_party_path, parity_path):
        if not path.is_file():
            raise SystemExit(f"not found: {path}")

    index_html = index_path.read_text(encoding="utf-8")
    third_party_text = third_party_path.read_text(encoding="utf-8")
    parity_text = parity_path.read_text(encoding="utf-8")

    pins = collect_index_pins(index_html)
    if not pins:
        raise SystemExit(f"no jsdelivr pins found in {index_path}")

    ok = True
    for name in sorted(pins):
        index_versions = pins[name]
        index_display = "/".join(sorted(index_versions))

        third_party_versions = find_versions(third_party_text, name)
        parity_versions = find_versions(parity_text, name)

        third_party_display = "/".join(sorted(third_party_versions)) or "MISSING"
        parity_display = "/".join(sorted(parity_versions)) if parity_versions else "-"

        print(
            f"{name}: index.html={index_display} THIRD_PARTY.md={third_party_display} "
            f"PARITY.md={parity_display}"
        )

        if not third_party_versions:
            print(f"  FAIL: {name} is not named with a version in {third_party_path}")
            ok = False
            continue

        if len(index_versions) > 1:
            print(f"  FAIL: {name} is pinned to multiple versions in {index_path}: {index_display}")
            ok = False
        elif third_party_versions != index_versions:
            print(
                f"  FAIL: {name} version differs between {index_path} ({index_display}) "
                f"and {third_party_path} ({third_party_display})"
            )
            ok = False

        if parity_versions and parity_versions != index_versions:
            print(
                f"  FAIL: {name} version differs between {index_path} ({index_display}) "
                f"and {parity_path} ({parity_display})"
            )
            ok = False

    if ok:
        print("check-pins: PASS")
        return 0
    print("check-pins: FAIL")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
