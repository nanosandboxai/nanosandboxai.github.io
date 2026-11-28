#!/usr/bin/env python3
"""Readability report for a Markdown article (stdlib only).

Usage: python3 readability.py <article.md> [--json]

Measures body prose only: frontmatter, code blocks, HTML comments, tables and
headings are excluded. Bullet text and bold-led paragraphs are included.
Exit code is always 0; this is a report, not a gate.
"""
import json
import re
import sys

HYPE = ["revolutionary", "game-changing", "game changing", "seamless", "seamlessly", "blazing",
        "cutting-edge", "cutting edge", "effortless", "effortlessly", "next-generation", "best-in-class",
        "world-class", "supercharge", "unleash", "magic"]


def prose_lines(text: str) -> list[str]:
    text = re.sub(r"^---\n.*?\n---\n", "", text, count=1, flags=re.S)  # frontmatter
    text = re.sub(r"```.*?```", "", text, flags=re.S)                  # code blocks
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)                 # comments
    out = []
    for line in text.split("\n"):
        s = line.strip()
        if not s or s == "---" or s.startswith(("|", "#", ">")):
            continue
        s = re.sub(r"^[-*]\s+|^\d+\.\s+", "", s)                       # list markers
        s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)                  # links -> text
        s = re.sub(r"[*_`]", "", s)                                     # emphasis, code ticks
        out.append(s)
    return out


def syllables(word: str) -> int:
    return max(1, len(re.findall(r"[aeiouy]+", word.lower())))


def report(path: str) -> dict:
    raw = open(path, encoding="utf-8").read()
    text = " ".join(prose_lines(raw))
    words = re.findall(r"[A-Za-z0-9'’]+", text)
    sentences = [s for s in re.split(r"(?<=[.!?])\s+", text) if len(s.split()) > 2]
    w, n = len(words), max(1, len(sentences))
    syl = sum(syllables(x) for x in words) or 1
    flesch = 206.835 - 1.015 * (w / n) - 84.6 * (syl / max(1, w))
    longest = sorted(sentences, key=lambda s: -len(s.split()))[:5]
    lower = raw.lower()
    hype = sorted({h for h in HYPE if re.search(r"\b" + re.escape(h) + r"\b", lower)})
    return {
        "file": path,
        "total_words": len(re.findall(r"\w+", re.sub(r"^---\n.*?\n---\n", "", raw, count=1, flags=re.S))),
        "prose_words": w,
        "sentences": n,
        "avg_sentence_words": round(w / n, 1),
        "flesch_reading_ease": round(flesch),
        "reading_minutes": round(w / 230 + 0.5),
        "longest_sentences": [{"words": len(s.split()), "text": s[:200]} for s in longest],
        "hype_words": hype,
    }


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    r = report(sys.argv[1])
    if "--json" in sys.argv:
        print(json.dumps(r, indent=2))
        return
    print(f"{r['file']}")
    print(f"  words: {r['total_words']} total, {r['prose_words']} prose  (~{r['reading_minutes']} min)")
    print(f"  sentences: {r['sentences']}, average {r['avg_sentence_words']} words (target < 20)")
    print(f"  Flesch reading ease: {r['flesch_reading_ease']} (target ~60, 50+ acceptable)")
    print(f"  hype words: {', '.join(r['hype_words']) or 'none'}")
    print("  longest sentences:")
    for s in r["longest_sentences"]:
        print(f"    [{s['words']}] {s['text']}")


if __name__ == "__main__":
    main()
