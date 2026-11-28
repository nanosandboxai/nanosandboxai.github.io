#!/usr/bin/env python3
"""Structure check for nanosandbox.ai docs pages (stdlib only).

Usage:
  python3 check_doc.py content/docs/<section>/<page>.md [more.md ...]
  python3 check_doc.py --all

FAIL (exit 1): missing frontmatter title/description/order, HTML comments,
duplicate heading ids, heading level jumps (## -> ####), broken relative
./page.md links, section folder without _meta.json.
WARN: body starts with "# Title" (stripped at render), code fences without a
language, no ## headings, description over 160 characters, duplicate order
values in a section.
"""
import pathlib
import re
import sys


def repo_root(start: pathlib.Path) -> pathlib.Path:
    for p in [start, *start.parents]:
        if (p / "content" / "docs").is_dir():
            return p
    sys.exit("check_doc: run inside the nanosandboxai.github.io repo (content/docs not found)")


def slugify(text: str) -> str:  # must match src/app/lib/slug.ts
    text = text.lower().replace("`", "")
    text = re.sub(r"\s+", "-", text)
    return re.sub(r"[^\w-]", "", text)


def frontmatter(text: str):
    m = re.match(r"^---\n(.*?)\n---\n", text, flags=re.S)
    if not m:
        return None, text
    fm = {}
    for line in m.group(1).split("\n"):
        k, sep, v = line.partition(":")
        if sep:
            fm[k.strip()] = v.strip().strip('"')
    return fm, text[m.end():]


def check(path: pathlib.Path) -> tuple[list[str], list[str]]:
    fails, warns = [], []
    text = path.read_text(encoding="utf-8")
    fm, body = frontmatter(text)
    if fm is None:
        return ["no YAML frontmatter"], []
    for key in ("title", "description", "order"):
        if not fm.get(key):
            fails.append(f"frontmatter: missing '{key}'")
    if fm.get("order") and not fm["order"].isdigit():
        fails.append(f"frontmatter: order '{fm['order']}' is not a number")
    if len(fm.get("description", "")) > 160:
        warns.append(f"description is {len(fm['description'])} characters (keep under 160)")
    if not (path.parent / "_meta.json").exists():
        fails.append(f"section folder {path.parent.name}/ has no _meta.json")

    if "<!--" in body:
        fails.append("HTML comment: renders as visible text")

    if re.match(r"^\s*#\s+\S", body):
        warns.append("body starts with '# Title': remove it, the title comes from frontmatter")

    in_fence, prev_level, ids = False, 1, {}
    for n, line in enumerate(body.split("\n"), 1):
        fence = re.match(r"^\s*```(\S*)", line)
        if fence:
            if not in_fence and not fence.group(1):
                warns.append(f"line {n}: code fence without a language (use bash, yaml, json, or text for output)")
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        h = re.match(r"^(#{1,6})\s+(.+?)\s*#*\s*$", line)
        if not h:
            continue
        level = len(h.group(1))
        if level == 1:
            continue  # handled above (leading) or a stray title; outline ignores it
        if level > prev_level + 1 and prev_level >= 2:
            fails.append(f"line {n}: heading jumps from h{prev_level} to h{level}: '{h.group(2)}'")
        prev_level = level
        hid = slugify(h.group(2).replace("**", ""))
        if hid in ids:
            fails.append(f"line {n}: duplicate heading id '{hid}' (also line {ids[hid]})")
        ids[hid] = n
    if not any(True for _ in ids):
        warns.append("no ## headings: the page outline will be empty")

    for target in re.findall(r"\]\(\./([a-z0-9-]+)\.md(?:#[^)]*)?\)", body):
        if not (path.parent / f"{target}.md").exists():
            fails.append(f"broken link ./{target}.md (no such page in {path.parent.name}/)")
    return fails, warns


def main() -> None:
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    root = repo_root(pathlib.Path.cwd().resolve())
    files = sorted((root / "content" / "docs").glob("*/*.md")) if args == ["--all"] else [pathlib.Path(a).resolve() for a in args]

    orders: dict[tuple[str, str], list[str]] = {}
    total_fail = 0
    for f in files:
        fails, warns = check(f)
        fm, _ = frontmatter(f.read_text(encoding="utf-8"))
        if fm and fm.get("order"):
            orders.setdefault((f.parent.name, fm["order"]), []).append(f.name)
        rel = f.relative_to(root) if f.is_relative_to(root) else f
        status = "FAIL" if fails else ("WARN" if warns else "OK  ")
        print(f"{status}  {rel}")
        for x in fails:
            print(f"        FAIL  {x}")
        for x in warns:
            print(f"        WARN  {x}")
        total_fail += len(fails)
    for (section, order), names in sorted(orders.items()):
        if len(names) > 1:
            print(f"WARN  {section}/: order {order} used by {', '.join(names)} (prev/next order is ambiguous)")
    sys.exit(1 if total_fail else 0)


if __name__ == "__main__":
    main()
