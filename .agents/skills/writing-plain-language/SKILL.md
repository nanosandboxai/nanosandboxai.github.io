---
name: writing-plain-language
description: Use when drafting or editing article prose for nanosandbox.ai that must be readable by non-experts, when a draft feels dense, jargon-heavy, hype-y or too long, or when a reading-ease score is below target.
---

# Writing in Plain Language

## Overview

Write as an expert explaining to a smart friend: calm, specific, no hype. Plain words come first and the technical term second ("its own small virtual computer, a *microVM*").

## Every feature section has three beats

```markdown
**What it is.** Until now you drove Nanosandbox from the terminal. Now your program can ask for a sandbox.

**Why it matters.** Teams building agent platforms need isolation inside their own software, in the language they already write.

**The expert detail.** All eight SDKs are thin clients over one versioned protocol, so a sandbox behaves the same from Python or Java.
```

"What it is" and "Why it matters" must stand alone. The expert detail is a bonus for experts.

## Rules

| Rule | Target |
|---|---|
| Sentence length | Average under 20 words; split anything over 30 |
| Paragraph | One idea, at most four sentences |
| Jargon | Defined in plain words the first time it appears |
| Analogy | One running analogy for the whole article; never mix metaphors |
| Headings | Say what the section tells you ("What We Postponed: Windows"), not clever labels |
| Numbers over adjectives | "boots in about 180 ms", not "blazing fast" |
| Honesty | State limits and postponed work early and plainly, without apology |
| Reading ease | Flesch about 60 for body text (code, tables excluded); 50+ is acceptable with defined technical terms |

Avoid: revolutionary, game-changing, seamless, blazing, cutting-edge, effortless, simply, just (as a minimiser), "not X, but Y" framing, rhetorical questions as headings.

## Check the draft

```bash
python3 .agents/skills/writing-plain-language/scripts/readability.py ../articles/drafts/<slug>.md
```

It reports words, average sentence length, Flesch reading ease, the longest sentences and any hype words. Fix the longest sentences first: splitting four or five usually lifts the score by several points.

## Common mistakes

| Mistake | Fix |
|---|---|
| Defining a term after using it three times | Define on first use, then use it consistently |
| Every section opens with the technical name | Open with what the reader gets; name the mechanism after |
| A second analogy appears halfway through | Rewrite it in terms of the first analogy |
| Long em-dash asides | Make them their own sentence |
