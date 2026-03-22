---
title: "Skills"
description: "Extending agent capabilities with skills"
order: 3
---

## What Are Skills

Skills are markdown-based prompt files that guide how an agent approaches specific tasks. A skill defines best practices, workflows, and guidelines that get injected into the agent's context at runtime.

Skills solve a common problem: agents need domain-specific guidance to follow consistent patterns (commit conventions, code review standards, testing practices). Instead of relying on ad-hoc prompting, skills provide reusable, versioned guidance bundles.

## Skill Format

Each skill is a Markdown file with YAML frontmatter:

```markdown
---
name: git-workflow
description: Git workflow best practices with conventional commits and clean history
version: "1.0"
tags: [git, workflow, collaboration]
---

## Commit Messages

Use conventional commits format...

## Branch Strategy

Follow trunk-based development...
```

### Frontmatter Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Unique skill identifier (kebab-case) |
| `description` | `string` | Yes | Human-readable description |
| `version` | `string` | No | Semantic version |
| `tags` | `string[]` | No | Keywords for categorization and discovery |

The markdown body contains the actual guidance content that gets injected into the agent's context.

## Available Skills

Skills are available from two sources: the **public registry** (community-maintained) and the **Nanosandbox agents registry**.

### Registry Skills

| Skill | Description | Tags |
|---|---|---|
| `git-workflow` | Git workflow best practices with conventional commits | git, workflow |
| `code-review` | Code review practices for correctness and clarity | review, quality |
| `tdd` | Test-driven development practices | testing, tdd |
| `documentation` | Documentation writing guidelines | docs, writing |
| `security-best-practices` | Security-focused development practices | security, best-practices |

## Configuring Skills in sandbox.yml

Skills can be pre-configured in `sandbox.yml` so they load automatically when a sandbox starts:

```yaml
# sandbox.yml
defaults:
  skills:
    - git-workflow
    - tdd

sandboxes:
  claude:
    image: claude
    skills:
      - git-workflow
      - code-review
      - security-best-practices
    env:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
```

Per-sandbox skills **replace** defaults skills (they are not merged). In this example, the `claude` sandbox gets `git-workflow`, `code-review`, and `security-best-practices` — not `tdd` from defaults.

## Using Skills in TUI

The TUI provides slash commands for managing skills interactively:

```
/skills list          List all available skills
/skills add <name>    Add a skill to the current sandbox
/skills remove <name> Remove a skill from the current sandbox
/skills show <name>   Show the content of a skill
```

### Example Session

```bash
$ nanosb

# Inside the TUI, in any panel:
/skills list
# NAME                     DESCRIPTION
# git-workflow              Git workflow best practices...
# code-review               Code review practices...
# tdd                       Test-driven development...
# documentation             Documentation writing guidelines
# security-best-practices   Security-focused development...

/skills add git-workflow
# Added skill: git-workflow

/skills add tdd
# Added skill: tdd

/skills show git-workflow
# (displays the full markdown content of the skill)
```

## How Skills Work

When a skill is added to a sandbox:

1. The skill's markdown content is loaded from the registry.
2. The content is injected into the agent's system context.
3. The agent follows the guidance defined in the skill while performing tasks.

Skills are lightweight — they add context, not dependencies. They don't install packages or modify the filesystem. The agent simply receives the skill's instructions as part of its prompt context.

## Skill Sources

### Public Registry

Skills published to the public MCP/skills registries. These are community-maintained and cover general development practices.

### Agents Registry

Skills bundled with the Nanosandbox agents registry at `ghcr.io/nanosandboxai/agents-registry`. These are curated for use with the supported agents (Claude Code, Goose, Codex, Cursor).

Both sources are available in the TUI via `/skills list` and on the [Skills page](/skill) of this website.
