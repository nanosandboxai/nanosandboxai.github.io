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
when_to_use: Use when working with git, creating commits, managing branches, or opening PRs
allowed_tools: [Bash]
user_invocable: true
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
| `when_to_use` | `string` | No | Hint for when the agent should auto-invoke this skill |
| `allowed_tools` | `string[]` | No | Tools pre-approved for this skill (Claude-specific) |
| `user_invocable` | `boolean` | No | Whether the skill appears in `/skills` menu (default: `true`) |
| `paths` | `string[]` | No | Glob patterns — skill auto-attaches when matching files are in context |

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

## Config vs Commands

> **sandbox.yml** and **TUI commands** are two ways to manage skills. They behave differently:
>
> | | `sandbox.yml` | TUI `/skills add` |
> |---|---|---|
> | **When applied** | Every time the sandbox starts (bootstrap) | Immediately, once |
> | **Source tag** | `config` | `runtime` |
> | **On sandbox restart** | Re-applied from config (always fresh) | Preserved — survives restarts |
> | **On sandbox.yml change** | Old config skills replaced with new ones | Untouched — runtime skills kept |
> | **Persisted where** | In your `sandbox.yml` file | In `~/.nanosandbox/state.json` inside the VM |
>
> **In short:** `sandbox.yml` is your declarative baseline. TUI commands are for ad-hoc additions that persist alongside the config without interfering with it. If a config skill and a runtime skill share the same name, the config version wins on next bootstrap.

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
    type: claude
    skills:
      - git-workflow
      - code-review
      - security-best-practices
    env:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
```

Per-sandbox skills **replace** defaults skills (they are not merged). In this example, the `claude` sandbox gets `git-workflow`, `code-review`, and `security-best-practices` — not `tdd` from defaults.

Skills defined in `sandbox.yml` are tagged as **config-sourced**. They are re-applied on every bootstrap (sandbox restart).

## Using Skills in TUI

The TUI provides slash commands for managing skills interactively:

```
/skills list                              List all available skills
/skills add <name>                        Add a skill to the focused sandbox
/skills add --all <name>                  Add a skill to all sandboxes
/skills add --sandbox <name> <skill>      Add a skill to a specific sandbox
/skills remove <name>                     Remove a skill from the focused sandbox
/skills remove --all <name>               Remove a skill from all sandboxes
/skills show <name>                       Show the content of a skill
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

/skills add --all tdd
# Added skill 'tdd' to all sandboxes

/skills show git-workflow
# (displays the full markdown content of the skill)
```

## How Skills Work

When a skill is added to a sandbox, the agent-gateway generates agent-specific config files. Each agent reads skills in a different format:

| Agent | Skill Format | Location |
|---|---|---|
| Claude Code | Individual `SKILL.md` files with YAML frontmatter | `~/.claude/skills/<name>/SKILL.md` |
| Cursor | Individual `.mdc` rule files with frontmatter | `~/.cursor/rules/nanosb-<name>.mdc` |
| Goose | All skills concatenated into a single hints file | `~/.config/goose/.goosehints` |
| Codex | Individual `SKILL.md` files | `~/.agents/skills/<name>/SKILL.md` |

The gateway writes these files to the agent's HOME directory (not `/workspace/`), so they never appear in the user's git tree. These HOME paths are symlinked to `/workspace/.nanosb-state/` by the init script, which means they persist across VM restarts via virtio-fs.

The `.nanosb-state/` directory is automatically excluded from git tracking via `.git/info/exclude`, so it never shows up in `git status` or gets accidentally committed.

### Two-Layer Config Model

Nanosandbox uses a two-layer approach for agent configuration:

**Layer 1 — Gateway-managed (HOME paths):**
Files generated by the agent-gateway (skill files, MCP configs, prompt files). Written to HOME directories like `~/.claude/`, `~/.codex/`, etc. Persisted via `.nanosb-state/` symlinks. Never pollute the user's git tree.

**Layer 2 — User-owned (project files):**
Files the user places in `/workspace/` themselves (e.g., `CLAUDE.md`, `.cursor/rules/`). These are read by agents natively alongside Layer 1. The gateway does not touch these.

Both layers are read by the agent — they complement each other.

## Source Tracking: Config vs Runtime

Skills have a **source** that determines their lifecycle:

| Source | Origin | Survives bootstrap? |
|---|---|---|
| `config` | Defined in `sandbox.yml` | Replaced with fresh version on every bootstrap |
| `runtime` | Added via TUI (`/skills add`) | Preserved across bootstrap cycles |

When you modify `sandbox.yml` and restart, config-sourced skills are refreshed from the new config, but runtime-added skills (from TUI) are preserved. This means you can add skills interactively without losing them on restart.

State is persisted to `~/.nanosandbox/state.json` inside the VM, which survives VM restarts via the `.nanosb-state/` symlink mechanism.

## Skill Sources

### Public Registry

Skills published to the public MCP/skills registries. These are community-maintained and cover general development practices.

### Agents Registry

Skills bundled with the Nanosandbox agents registry at `ghcr.io/nanosandboxai/agents-registry`. These are curated for use with the supported agents (Claude Code, Goose, Codex, Cursor).

Both sources are available in the TUI via `/skills list` and on the [Skills page](/skill) of this website.
