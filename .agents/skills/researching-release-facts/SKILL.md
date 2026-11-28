---
name: researching-release-facts
description: Use when an article, release note or announcement needs facts about a Nanosandbox release, feature, SDK, agent or platform, or when a claim in a draft is marked [verify] or has no source.
---

# Researching Release Facts

## Overview

An article is only as trustworthy as its least-checked number. Every claim comes from the code, not from memory, an older article, or a commit title alone.

**Rule:** no claim enters a draft without a row in the plan's facts table that names its source.

## Where the facts are

The product lives in the sibling repo `../nanosandbox` (next to this site repo).

| Question | Look here |
|---|---|
| Current version, tags, release dates | `VERSION`; `git tag --sort=-creatordate`; `git log -1 --format=%ad --date=short <tag>` |
| What changed since the last release | `git log --oneline --no-merges <prev-tag>..<tag>`, then `git show -s --format=%b <sha>` for each `feat:` |
| Install, platforms, CLI usage, agents | `README.md` (Install, Quick Start, Usage) |
| SDKs, install commands, protocol version | `sdk/README.md`, `sdk/<lang>/README.md` |
| Exact CLI command names | `README.md` code blocks and `docs/*.md`; grep `nanosb <verb>` |
| Why a decision was made | `docs/decisions/`; `../analysis/` (internal: paraphrase, never cite publicly) |

## Facts table

Fill this in the plan before drafting:

| Area | Fact (one checkable sentence) | Source |
|---|---|---|
| SDKs | 8 SDKs share protocol v1.0.0 and 40 conformance scenarios | `README.md` "Language SDKs" |
| Lifecycle | `pause`, `resume`, `restart`, `stop`, `rm` are CLI verbs; `kill` is protocol/SDK only | `README.md` usage block; PR #231 |

A row whose source you have not opened yourself is **[verify]**. That includes anything you *inferred* ("the other READMEs probably have the same example") and anything taken from an earlier article. In the draft, put `[verify]` right after such a claim, so the review check blocks publishing until it is resolved. Resolve every [verify] before review, or cut the claim.

For a release article, also record its status: is the final tag cut (`git tag --list '<version>*'`; an `-rc` tag alone is not final), and are the install commands live (published packages)? If not, the article waits.

## Common mistakes

| Mistake | Fix |
|---|---|
| Copying a count from a PR title or old doc ("35/35 conformance") | Re-read the current README; counts change between releases |
| Claiming a capability for the wrong surface (CLI vs SDK vs protocol) | Grep for the exact command before writing "run `nanosb <verb>`" |
| Citing an internal analysis doc in Sources | Cite the public README, tag or PR; paraphrase internal reasons |
| Inventing a workaround (e.g. "use WSL2") | Only state what the repo documents or the user confirms |
| Leading with a speed claim | Use numbers measured for this release, or counts instead |
