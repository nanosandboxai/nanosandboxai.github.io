---
name: reviewing-articles-before-publishing
description: Use when a nanosandbox.ai draft is about to move into articles/ of the nanosandboxai/articles repo, be committed or be published, or when asked whether an article is ready, correct or complete.
---

# Reviewing Articles Before Publishing

## Overview

An article is ready only when the automated check passes **and** the human-judgement items below are done. "It reads well" is not a review.

## 1. Run the check

```bash
python3 .agents/skills/reviewing-articles-before-publishing/scripts/check_article.py ../articles/drafts/<slug>.md
```

Run it from this site repo. It finds the articles repo at `../articles` (override with `NS_ARTICLES_DIR`) and the diagrams in this repo's `public/diagrams/`.

It fails (exit 1) on:
- missing or invalid frontmatter, a placeholder `date` (`XX`, `TBD`), a description over 200 characters
- `<!-- HTML comments -->` (the site renders them as visible text)
- unresolved `[verify]` / `TODO` / `TBD` markers
- links to `/articles/<slug>` or `/coming-soon/<slug>` that do not exist in the articles repo
- `archify` blocks whose `src` is missing from `public/diagrams/`, and `.json` receipts in `public/diagrams/`
- hype words

It warns on reading ease below 50, average sentence length over 20, and a missing Sources section. Fix every failure; justify or fix each warning.

## 2. Check by hand

| Item | How |
|---|---|
| Release status | For a release article: the final tag exists (not only `-rc`), and every install command points at a published package. Otherwise the answer is "not ready", whatever the deadline |
| Facts | Every number, command and capability matches a facts-table row with an opened source; nothing inferred |
| Commands | Each command and snippet was actually run (macOS and Linux for install steps) |
| Honesty | Limits and postponed work are stated plainly, early |
| Diagrams | Viewed in the running site at 1280px, dark and light |
| Phone | Article read at 375px wide: tables and code scroll, nothing overflows |
| Tone | Plain-language rules from `writing-plain-language` |

## 3. Publish

1. Set `date` to the real publish day.
2. Commit any diagrams to this repo first; they must reach `main` before the article does.
3. Move (not copy) the file to `../articles/articles/<slug>.md`, delete any preview copy, and merge it to the articles repo's `main`.
4. Run the site deploy (push to `main` here, or run the Deploy workflow) and open `/articles/<slug>`.
5. Write the companion post with `writing-launch-posts`.

## Common mistakes

| Mistake | Fix |
|---|---|
| Reporting "ready" because the script passed | The script cannot know whether commands work or facts are current |
| Leaving a preview copy in `../articles/articles/` | It is live on the next deploy once pushed; delete it |
| Article merged before its diagrams | The embed shows nothing; ship `public/diagrams/` to this repo's `main` first |
