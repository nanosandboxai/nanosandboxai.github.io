#!/usr/bin/env python3
"""Pre-publish check for a nanosandbox.ai article (stdlib only).

Usage: python3 check_article.py <article.md>

Exit 1 on any FAIL, 0 otherwise.

The article lives in the nanosandboxai/articles repo (articles/, drafts/); the
site and its diagrams live in nanosandboxai.github.io (public/diagrams/). The
site is found from this script's location; the articles repo is
NS_ARTICLES_DIR, or ../articles next to the site.
"""
import os
import importlib.util
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve()


SITE = HERE.parents[4]  # <site>/.agents/skills/<skill>/scripts/check_article.py


def articles_root() -> pathlib.Path:
    root = pathlib.Path(os.environ.get("NS_ARTICLES_DIR", SITE.parent / "articles")).resolve()
    if not (root / "articles").is_dir():
        sys.exit(f"check_article: articles repo not found at {root} (set NS_ARTICLES_DIR)")
    return root


def load_readability():
    path = HERE.parents[2] / "writing-plain-language" / "scripts" / "readability.py"
    if not path.exists():
        return None
    spec = importlib.util.spec_from_file_location("readability", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def parse_frontmatter(text: str):
    m = re.match(r"^---\n(.*?)\n---\n", text, flags=re.S)
    if not m:
        return None, text
    fm = {}
    for line in m.group(1).split("\n"):
        k, sep, v = line.partition(":")
        if sep:
            fm[k.strip()] = v.strip().strip('"')
    return fm, text[m.end():]


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    article = pathlib.Path(sys.argv[1]).resolve()
    root = articles_root()
    if not (SITE / "public").is_dir():
        sys.exit(f"check_article: site public/ not found at {SITE}")
    text = article.read_text(encoding="utf-8")
    fails, warns = [], []

    fm, body = parse_frontmatter(text)
    if fm is None:
        fails.append("no YAML frontmatter at the top of the file")
        fm = {}
    for key in ("title", "type", "date", "description", "tags", "author"):
        if not fm.get(key):
            fails.append(f"frontmatter: missing '{key}'")
    if fm.get("type") and fm["type"] != "article":
        fails.append(f"frontmatter: type is '{fm['type']}', expected 'article'")
    if fm.get("date") and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", fm["date"]):
        fails.append(f"frontmatter: date '{fm['date']}' is a placeholder or not YYYY-MM-DD")
    if len(fm.get("description", "")) > 200:
        fails.append(f"frontmatter: description is {len(fm['description'])} characters (max 200)")

    if "<!--" in body:
        fails.append("HTML comments found: the site renders them as visible text; move notes to the plan")

    code_free = re.sub(r"```.*?```", "", body, flags=re.S)
    for marker in ("[verify]", "TODO", "TBD", "FIXME", "XX"):
        for line_no, line in enumerate(code_free.split("\n"), 1):
            if marker == "XX":
                if re.search(r"\b20\d\d-\d\d-XX\b|\bXX\b", line):
                    fails.append(f"placeholder 'XX' left in text: {line.strip()[:80]}")
            elif marker in line:
                fails.append(f"unresolved '{marker}': {line.strip()[:80]}")

    for kind, folder in (("articles", "articles"), ("coming-soon", "coming-soon")):
        for slug in sorted(set(re.findall(rf"\]\(/{kind}/([a-z0-9-]+)\)", body))):
            if not (root / folder / f"{slug}.md").exists():
                fails.append(f"broken link /{kind}/{slug}: no {folder}/{slug}.md in the articles repo")

    for src in re.findall(r"```archify\s*\n(?:.*\n)*?\s*src:\s*(\S+)", body):
        if not (SITE / "public" / src.lstrip("/").split("#")[0]).exists():
            fails.append(f"archify src {src} does not exist under the site's public/")
    receipts = sorted((SITE / "public" / "diagrams").glob("*.json")) if (SITE / "public" / "diagrams").is_dir() else []
    if receipts:
        fails.append(f"{len(receipts)} Archify receipt(s) in public/diagrams/ would be published; move to .archify/")

    if not re.search(r"^##\s+Sources\b", body, flags=re.M):
        warns.append("no '## Sources' section")

    rd = load_readability()
    if rd:
        r = rd.report(str(article))
        for h in r["hype_words"]:
            fails.append(f"hype word: '{h}'")
        if r["flesch_reading_ease"] < 50:
            warns.append(f"reading ease {r['flesch_reading_ease']} is below 50 (target ~60)")
        if r["avg_sentence_words"] > 20:
            warns.append(f"average sentence is {r['avg_sentence_words']} words (target < 20)")
        summary = f"{r['total_words']} words, ~{r['reading_minutes']} min, reading ease {r['flesch_reading_ease']}, avg sentence {r['avg_sentence_words']}"
    else:
        warns.append("readability script not found; skipped prose checks")
        summary = ""

    rel = article.relative_to(root) if article.is_relative_to(root) else article
    print(f"{rel}  {summary}")
    for f in fails:
        print(f"  FAIL  {f}")
    for w in warns:
        print(f"  WARN  {w}")
    if not fails and not warns:
        print("  OK    all checks passed")
    elif not fails:
        print("  OK    no failures (review the warnings)")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
