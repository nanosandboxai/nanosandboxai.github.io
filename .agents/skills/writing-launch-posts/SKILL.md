---
name: writing-launch-posts
description: Use when announcing a published nanosandbox.ai article or release on LinkedIn or X, or when creating or editing files in posts/ of the nanosandboxai/articles repo.
---

# Writing Launch Posts

## Overview

Every published article gets one companion post file with a LinkedIn version and an X version.

Posts live in the **nanosandboxai/articles** repo (`../articles/posts/`). **Treat any file pushed there as posted to LinkedIn and X for real**: CI publishes each post exactly once, tracked in `posts/.published.json`, with no dry run. So:

- Write the post in `../articles/drafts/announce-<slug>.md` first.
- Move it to `../articles/posts/` only on release day, after the article is live at its URL, and only when the user says to post.

## File format

`../articles/posts/announce-<article-slug>.md`:

```markdown
---
title: "Announce <Short Article Name>"
type: post
date: <YYYY-MM-DD, same day as the article>
platforms: [linkedin, x]
tags: [<tag>, <tag>]
author: "Nanosandbox Team"
---

<!-- linkedin -->
We just shipped Nanosandbox v0.3.0.

Every AI coding agent now gets its own hardware-isolated microVM, from eight languages and for eleven agents. You can pause, resume and restart a sandbox like a real machine.

Windows is postponed so we can build on upstream libkrun instead of maintaining forks.

Read what changed: https://nanosandbox.ai/articles/<slug>

#sandboxing #AIagents #microVM #nanosandbox

<!-- x -->
Nanosandbox v0.3.0: 8 SDKs, 11 coding agents, each in its own microVM.

https://nanosandbox.ai/articles/<slug>
```

The `<!-- linkedin -->` and `<!-- x -->` markers are how the posting tool splits platforms. Here comments are required; this is the one place they belong.

## Rules

| Platform | Shape |
|---|---|
| LinkedIn | Hook line, 2–3 short paragraphs (what changed, why it matters, one honest limit), link, 3–5 hashtags |
| X | One or two lines with the strongest number, then the link. Under 280 characters including the URL |

- Every fact in the post appears in the article. No new claims.
- Use the account handle `@nanosandboxai` only where the platform needs it.
- Do not add a new slug to `posts/.published.json` yourself; the publishing tool does that.

## Common mistakes

| Mistake | Fix |
|---|---|
| Writing the post straight into `posts/` | Draft in `drafts/`; a push to `posts/` can post it immediately |
| Writing the post before the article URL exists | Publish the article first and open the URL |
| Restating the whole article | One hook, one reason, one link |
| X version over 280 characters | Count with the full URL |
