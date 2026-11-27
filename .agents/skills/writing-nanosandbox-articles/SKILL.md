---
name: writing-nanosandbox-articles
description: Use when asked to write, plan, draft, update or publish an article, release post, deep dive or announcement for nanosandbox.ai, or when touching files in the nanosandboxai/articles repo (articles/, drafts/).
---

# Writing nanosandbox.ai Articles

## Overview

Articles on nanosandbox.ai are written by an expert in GenAI and agent security for **any** reader: developer, engineering lead, or curious non-technical person. Every claim is sourced, every command has been run, and nothing is published until it passes the review script.

This skill is the entry point. It sets the order of work and hands each stage to a focused skill.

Two repos are involved. Paths below starting with `../articles/` are in the **nanosandboxai/articles** repo, checked out next to this one; the rest are in this site repo (**nanosandboxai.github.io**).

## Stages

| # | Stage | Skill | Output |
|---|---|---|---|
| 1 | Gather facts | `researching-release-facts` | Facts table with sources |
| 2 | Plan | this skill | `../articles/drafts/<slug>-plan.md` from `templates/article-plan.md` |
| 3 | Draft | `writing-plain-language` | `../articles/drafts/<slug>.md` from `templates/article-skeleton.md` |
| 4 | Diagrams (optional) | `embedding-archify-diagrams` | `public/diagrams/<slug>-*.html` + `archify` blocks |
| 5 | Review | `reviewing-articles-before-publishing` | `check_article.py` passes |
| 6 | Publish + post | `writing-launch-posts` | file moved to `../articles/articles/`; post drafted in `../articles/drafts/`, moved to `../articles/posts/` on release day |

Do the stages in order. Stop and ask the user when the plan has open questions (release date, title, positioning); record their answers in the plan's **Decisions** table.

## Where things live

| Path | Read by the site build? | Use for |
|---|---|---|
| `../articles/drafts/` | No | Plans and drafts |
| `../articles/articles/` | Yes: every `.md` on the articles repo's `main` is published | Finished articles only |
| `../articles/coming-soon/` | Yes | Roadmap entries |
| `../articles/posts/` | **Treat as live: posts are published to LinkedIn and X from here** | Companion posts, moved in on release day only |
| `public/diagrams/` | Yes: served publicly | Final Archify HTML only (no receipts) |
| `.archify/` | No (gitignored) | Diagram candidates and receipts |

The site has **no draft flag**: the GitHub Pages deploy checks out the articles repo's `main`, so any file in `articles/` there goes live on the next site deploy (a push to this repo's `main`, or a manual run). Diagrams it embeds must already be on this repo's `main`. To preview locally, copy the draft into `../articles/articles/`, run `npm run dev` here, and delete the copy afterwards.

## Article frontmatter

```yaml
---
title: "Plain, Specific Title: Product vX.Y.Z"
type: article
date: 2026-12-01            # the real publish day, never a placeholder
description: "One sentence, under 200 characters, that says what changed and why it matters."
tags: [release, sdk, sandboxing]
author: "Nanosandbox Team"
---
```

The body starts with `# <title>`, an italic one-to-three-sentence lede, then `---`.

## Common mistakes

| Mistake | Fix |
|---|---|
| Writing a draft straight into `../articles/articles/` | Draft in `../articles/drafts/`; it is never built |
| Keeping notes as `<!-- HTML comments -->` | The renderer shows them as text. Keep notes in the plan file |
| Repeating the earlier articles | Link `/articles/<slug>`; spend words on what is new |
| Comparing with other tools in a release post | Keep release posts release-focused unless the user asks |
