---
name: writing-nanosandbox-docs
description: Use when adding, editing, moving or reviewing a page in content/docs/ of nanosandboxai.github.io, when a docs page outline, title, breadcrumbs, prev/next order or callout renders wrong, or when documenting a new CLI command, flag or feature.
---

# Writing nanosandbox.ai Docs Pages

## Overview

Docs pages render in the reader layout: section tree on the left, the page in the middle, an "On this page" outline on the right, and previous/next at the bottom. The layout is driven entirely by each file's frontmatter and headings, so page structure is not cosmetic.

For prose, follow `writing-plain-language`. For facts, follow `researching-release-facts`. For diagrams, follow `embedding-archify-diagrams`.

## How a file maps to the page

| In the file | Becomes |
|---|---|
| Folder `content/docs/<section>/` + its `_meta.json` (`{ "label": "Security", "order": 3 }`) | Section in the tree and breadcrumb; `order` sets section order |
| `title` | Page `<h1>`, tree entry, breadcrumb, prev/next label |
| `description` | Grey lead sentence under the title |
| `order` | Position inside the section, and in the global prev/next sequence |
| `## Heading` / `### Heading` | Anchored headings and the outline (two levels) |
| `> text` | A blue **Note** callout |
| ` ```bash ` fence | Code block with a copy button |
| ` ```archify ` / ` ```mermaid ` | Diagram |

## Page template

```markdown
---
title: "Secrets Management"
description: "How environment variables are delivered to agent sandboxes"
order: 4
---

One or two plain sentences: what this page covers and when you need it.

## Configuration

...

### Using an env file

...
```

## Rules

- **No `# Title` in the body.** The title comes from frontmatter. A leading H1 is stripped at render time; write without it.
- **Headings are `##` then `###`.** `####` is not shown in the outline. Never skip from `##` to `####`.
- **Headings are unique on the page.** They become anchor ids; two identical headings collide.
- **Every code fence has a language** (`bash`, `yaml`, `json`; `text` for command output and error messages). Shell commands are copy-pasteable: no `$ ` prompt inside the fence.
- **`>` blockquotes are notes**, not quotes. Use them for one important caveat per section at most.
- **Link other docs pages relatively**: `[System Requirements](./system-requirements.md)` within a section.
- **No HTML comments.** They show as text.
- **New page:** pick `order` so prev/next reads as a sensible sequence; update neighbours' `order` if needed.

## Check

```bash
python3 .agents/skills/writing-nanosandbox-docs/scripts/check_doc.py content/docs/<section>/<page>.md
python3 .agents/skills/writing-nanosandbox-docs/scripts/check_doc.py --all
```

Then open `/docs/<section>/<page>` in the running site (`npm run dev` restarts are needed for content changes) and confirm the outline, prev/next and callouts.

## Common mistakes

| Mistake | Fix |
|---|---|
| Body starts with `# Title` | Delete it; frontmatter `title` is the title |
| `#` comment lines inside a bash block read as headings | They are fine inside a fence; the outline ignores fenced code |
| A page missing from prev/next where expected | Check `order` in frontmatter and the section's `_meta.json` |
| Same heading twice ("Examples") | Make it specific: "Examples: exec" |
