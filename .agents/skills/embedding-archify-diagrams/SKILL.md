---
name: embedding-archify-diagrams
description: Use when a nanosandbox.ai article or doc needs a diagram, when adding or regenerating files in public/diagrams/, when an archify block renders blank or shows viewer controls, or when Archify finalize fails on layout, spacing or label gaps.
---

# Embedding Archify Diagrams

## Overview

Diagrams in articles are **bare, moving illustrations**: the site's `archify` block shows only the animated drawing (no toolbar, legend, cards, title or caption, no clicks). The article text must carry every fact; the diagram illustrates it.

Diagrams are generated with the vendored Archify skill in `.agents/skills/archify/` (pinned v3.3.2). Read its `SKILL.md` and `references/authoring-defaults.md` before writing a candidate.

## Choose the type

| The reader's question | Type |
|---|---|
| What is it made of, where is the wall? | `architecture` (use `layout.mode: "grid"` with row/col; auto layout tends to stack tall) |
| What happens, step by step, between parts? | `sequence` |
| What states can it be in? | `lifecycle` (schema v3) |
| What happens, as a process with decisions? | `workflow` |

One diagram per question. Two or three per article is plenty.

## Candidate rules for embedding

Write candidates to `.archify/<slug>/<name>.json` (gitignored). In every candidate:

- `meta.legend: {"mode": "hidden"}` and **no** `cards`: neither is displayed.
- `meta.output`: `public/diagrams/<slug>-<name>.html` (lowercase, digits, dashes only).
- `meta.locale: "en"`, `meta.quality_profile: "showcase"`.
- Give each node a plain-words `explanation` (it shows on the full-size page).
- Short arrow labels; put long detail in the article text.

## Generate

```bash
export ARCHIFY_UPDATE_CHECK_DISABLED=1 ARCHIFY_UPDATE_NOTICE_DISABLED=1   # no network
node .agents/skills/archify/bin/archify.mjs finalize <type> .archify/<slug>/<name>.json \
  public/diagrams/<slug>-<name>.html --quality showcase --json
mv public/diagrams/*.json .archify/<slug>/receipts/    # receipts must not be served
```

`finalize` passing means validate, deliver, check and browser-check all passed. A re-run onto an existing output needs its own `--out-dir .archify/<slug>/review-<n>`.

## Embed

````markdown
```archify
src: /diagrams/<slug>-<name>.html
title: <accessible label, not displayed>
height: 500
```
````

Then look at it in the running site at 1280px, in dark and light themes.

## Repair

| Diagnostic | Fix |
|---|---|
| `layout/constraint`, `sequence/note-overlap` | Space messages ≥ 32px apart; leave ≥ 44px after a message with a note; move segments and activations with them |
| `composition/label-gap` | The label needs more room: shorten it, or keep auto routing (don't force sides) |
| Advisory `visualReviewRecommendation` only | Optional. One placement edit at most; if it fails, restore the candidate |
| Embedded diagram tall and cropped | Switch architecture to a grid that wraps the path |

Stop after two failed repairs of the same diagram and tell the user what is wrong.

## Common mistakes

| Mistake | Fix |
|---|---|
| Running finalize without the two env vars | It makes an update-check network call |
| Leaving `*.json` receipts in `public/diagrams/` | They get published; move them to `.archify/` |
| Upgrading Archify with `npx skills@latest` | Copy a pinned, reviewed tag; update `VENDORED.txt` |
| Facts only in the diagram | Embeds are not clickable; say it in the text too |
