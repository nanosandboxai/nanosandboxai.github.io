---
title: "Agents Overview"
description: "AI coding agents supported by Nanosandbox"
order: 1
---

## Supported Agents

Nanosandbox provides pre-built, sandboxed environments for popular AI coding agents. Each agent runs inside its own lightweight VM with full filesystem and network isolation.

| Agent | CLI Name | Image | Agent Type |
|---|---|---|---|
| Claude Code | `claude` | `ghcr.io/nanosandboxai/nanosandbox/claude:latest` | `claude` |
| Goose | `goose` | `ghcr.io/nanosandboxai/nanosandbox/goose:latest` | `goose` |
| Codex | `codex` | `ghcr.io/nanosandboxai/nanosandbox/codex:latest` | `codex` |
| Cursor | `cursor-agent` | `ghcr.io/nanosandboxai/nanosandbox/cursor:latest` | `cursor` |
| OpenCode | `opencode` | `ghcr.io/nanosandboxai/nanosandbox/opencode:latest` | `opencode` |
| Aider | `aider` | `ghcr.io/nanosandboxai/nanosandbox/aider:latest` | `aider` |
| Gemini CLI | `gemini` | `ghcr.io/nanosandboxai/nanosandbox/gemini:latest` | `gemini` |
| Crush | `crush` | `ghcr.io/nanosandboxai/nanosandbox/crush:latest` | `crush` |
| Oh-My-OpenAgent (OmO) | `omo` | `ghcr.io/nanosandboxai/nanosandbox/oh-my-openagent:latest` | `oh-my-openagent` (alias `omo`) |
| Oh-My-Codex (OMX) | `omx` | `ghcr.io/nanosandboxai/nanosandbox/oh-my-codex:latest` | `oh-my-codex` (alias `omx`) |
| Oh-My-Claude (OMC) | `omc` | `ghcr.io/nanosandboxai/nanosandbox/oh-my-claude:latest` | `oh-my-claude` (alias `omc`) |

The three `oh-my-*` agents are agent harnesses that wrap a base CLI: OmO runs its
own `omo` binary, OMX drives Codex, and OMC drives Claude Code. They are
first-class agent types — usable from `sandbox.yml`, `nanosb run`, and the TUI's
`/add` — and are published by the same CI pipeline as the other images. They
support inline [`agent_config`](/docs/cli/configuration#agent_config) files and
the same `default` / `accept_edits` / `allow_all` permission levels as the
built-in agents.

> **Licensing:** `oh-my-openagent` (OmO) is distributed under the Sustainable Use
> License 1.0 (source-available, non-commercial), not an OSI license. Review the
> upstream terms before commercial use. `oh-my-codex` and `oh-my-claude` are MIT.

## Base Image

All agent images are built on a common base:

- **OS**: Debian (node:22-slim)
- **Runtime**: Node.js 22 (LTS), Python 3 + uv/uvx
- **Included tools**: git, curl, bash, sudo, openssh (dropbear)
- **Registry**: `ghcr.io/nanosandboxai/nanosandbox/`

## Architecture

Each sandbox runs a hardware-isolated microVM (libkrun) managed by a host-side
supervisor:

```text
Host
  └── supervisor (nanosb __supervise)
        └── microVM (libkrun)
              ├── guest exec-agent (PID 1 in next mode)
              │     └── agent process (claude, codex, omo, ...)
              ├── /home/developer    ← project mount (virtio-fs; default, overridable)
              └── per-agent state dirs (RW, 0700) ← sessions, config, tokens
```

Agent config (MCP servers, skills, inline `agent_config` files) and the agent
command are generated **host-side** by the deploy planner on every launch and
written into the per-agent state mounts; there is no in-guest config server.
Interactive agents run their own TUI through the guest exec-agent's PTY.

## Pulling Agent Images

```bash
# Pull a specific agent
nanosb pull ghcr.io/nanosandboxai/nanosandbox/claude:latest

# Pull using short names (auto-resolves to full registry path)
nanosb pull claude
nanosb pull goose
nanosb pull codex
nanosb pull cursor
nanosb pull oh-my-openagent
nanosb pull oh-my-codex
nanosb pull oh-my-claude
```

Every agent type in the table above resolves to
`ghcr.io/nanosandboxai/nanosandbox/<agent>:latest` when you use its bare name.

`latest` is published by the release pipeline on a clean `v*` tag. Between
releases, CI builds publish semver, `sha-<sha>` and optional RC tags (for
example `:rc2`) — use an explicit tag until the next release.

## Running Agents

### Via sandbox.yml (Recommended)

The recommended way to run agents is through a `sandbox.yml` configuration file:

```yaml
# sandbox.yml
defaults:
  cpus: 2
  memory: 4096
  timeout: 600

sandboxes:
  claude:
    image: claude
    type: claude
    skills:
      - git-workflow
      - tdd
    env:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    mcp:
      memory:
        command: npx
        args: ["-y", "@modelcontextprotocol/server-memory"]
```

Then launch the TUI:

```bash
nanosb
```

Or run a specific sandbox:

```bash
nanosb --sandbox claude
```

### Via CLI

```bash
# Run with default entrypoint
nanosb run claude

# Run with resource limits and env vars
nanosb run --cpus 4 --memory 8192 -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY claude

# Run a specific command
nanosb run -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY claude "Fix the failing tests"
```

### Agent-Specific Examples

**Claude Code:**
```bash
nanosb run -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY claude
```

**Goose:**
```bash
nanosb run -e OPENAI_API_KEY=$OPENAI_API_KEY goose
```

**Codex:**
```bash
nanosb run -e OPENAI_API_KEY=$OPENAI_API_KEY codex
```

**Cursor:**
```bash
nanosb run -e CURSOR_API_KEY=$CURSOR_API_KEY cursor
```

**Oh-My-OpenAgent (OmO):**
```bash
nanosb run -e OPENAI_API_KEY=$OPENAI_API_KEY oh-my-openagent
```

**Oh-My-Codex (OMX):**
```bash
nanosb run -e OPENAI_API_KEY=$OPENAI_API_KEY oh-my-codex
```

**Oh-My-Claude (OMC):**
```bash
nanosb run -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY oh-my-claude
```

### How agents are launched

The TUI's `/add` and `sandbox.yml` share one command builder, so the same
invocation is used whether you start from the TUI or the CLI:

| Agent | Interactive | Headless (`--headless -p "…"`) |
|---|---|---|
| Claude Code | `claude` | `claude --print <prompt> --verbose --output-format stream-json --include-partial-messages` |
| Codex | `codex` | `codex exec --skip-git-repo-check --json <prompt>` |
| Goose | `goose session` | `goose run --text <prompt>` |
| Cursor | `cursor-agent` | `cursor-agent --message <prompt>` |
| OpenCode | `opencode` | `opencode run <prompt>` |
| Aider | `aider` | `aider --message <prompt> --yes --no-auto-commits` |
| Gemini CLI | `gemini` | `gemini -p <prompt>` |
| Crush | `crush` | `crush run <prompt>` |
| `oh-my-openagent` | `omo` | `omo -p --no-session "<prompt>"` |
| `oh-my-codex` | `omx --direct` | `omx exec --skip-git-repo-check --json "<prompt>"` |
| `oh-my-claude` | `omc launch` | `omc ask claude "<prompt>"` |

Permission flags follow the same `--permissions` levels as the built-in agents,
in both interactive and headless mode:

| Agent | `default` | `accept_edits` | `allow_all` |
|---|---|---|---|
| OmO (`oh-my-openagent`) | — | `--permission-preset accept-edits` | `--permission-preset full-access` |
| OMX (`oh-my-codex`) | — | `--yolo` (interactive) / `--dangerously-bypass-approvals-and-sandbox` (headless) | same as accept_edits |
| OMC (`oh-my-claude`) | — | `--madmax` | `--madmax` |

Because the underlying CLIs expose a single "bypass" switch, `accept_edits` and
`allow_all` map to the same flag for OMX and OMC; OmO has a distinct
`accept-edits` preset. `default` adds no flag (manual approval).

OMX launches interactively with `omx --direct`: the panel already provides the
PTY, and OMX's default detached tmux leader fails its authority handshake under
the sandbox (`malformed detached leader authority`).

Headless invocations redirect stdin to `/dev/null`; OMX reads extra input from
stdin when it is not a TTY, so without the redirect it would block.

Model selection:

- **OmO** — `model:` or the `--model` flag (`--model <provider/model>`).
- **OMX** — `model:` or the `--model` flag (`-m`).
- **OMC** — set the model through `agent_config` (for example
  `.config/claude-omc/`) — the `omc` CLI has no `--model` flag.

Agent-native config (model profiles, per-category models, provider settings) is
supplied inline with [`agent_config`](/docs/cli/configuration#agent_config).
For OmO, the native file is `~/.omo/omo.jsonc` plus
`~/.omo/agent/settings.json` (`defaultProvider` + `defaultModel`).

The `oh-my-*` agents keep their state in per-sandbox mounts:
`~/.omo` (OmO), `~/.codex` + `~/.agents` (OMX), and
`~/.claude` + `~/.config/claude-omc` + `~/.omc` (OMC).

```bash
# TUI: interactive OmO panel
/add oh-my-openagent

# TUI: headless OMX panel
/add oh-my-codex --headless -p "list the failing tests"

# CLI equivalent
nanosb run -e OPENAI_API_KEY=$OPENAI_API_KEY oh-my-codex -- omx exec --skip-git-repo-check --json "list the failing tests"
```

## API Keys

Each agent requires its own API key passed as an environment variable:

| Agent | Required environment |
|---|---|
| Claude Code | `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` |
| Codex | `OPENAI_API_KEY` or `CODEX_API_KEY` |
| Goose | `GOOSE_PROVIDER` + `GOOSE_MODEL` + one of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY` |
| Cursor | `CURSOR_API_KEY` |
| OpenCode | one of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY` |
| Aider | one of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY` |
| Gemini CLI | `GEMINI_API_KEY` or `GOOGLE_API_KEY` |
| Crush | one of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY` |
| Oh-My-OpenAgent | one of the provider keys (e.g. `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`); the builder picks the key from the selected model's provider |
| Oh-My-Codex | `OPENAI_API_KEY` or `CODEX_API_KEY` (either) |
| Oh-My-Claude | `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` (either) |

The `oh-my-*` agents have no browser sign-in flow, so the TUI blocks `/add` for
them until one of their credentials is present (see
[Prerequisite validation](/docs/cli/tui-mode#prerequisite-validation)).

API keys are injected into the sandbox as environment variables. Values are resolved on the host and injected at boot; they are not written to the sandbox state on disk. See [Secrets Management](/docs/security/secrets) for details.

When adding an agent in the TUI with `/add`, these requirements are validated
**before** the sandbox is created. Most built-in agents support **browser
sign-in** (OAuth / device flow), so validation is **advisory** for them: a
missing variable is shown as a hint but the agent still starts and signs in
through the auto-opened browser URL. Agents without a browser sign-in path are
blocked, so they cannot boot and immediately exit with code 1. See
[TUI Mode → Prerequisite validation](/docs/cli/tui-mode#prerequisite-validation)
for the per-agent requirements and the browser sign-in hosts.

### TUI-first env workflows (recommended)

Start the TUI from your project directory and add panels with `/add`:

```bash
nanosb
# then in the TUI input bar:
/add claude
```

`nanosb` auto-loads `./.env` (when present) into a startup runtime env pool, so `/add` panels inherit those values automatically.

For panel-specific overrides, use `/add --env-file`:

```bash
/add claude --env-file .env.local
```

To force an explicit key from startup runtime env, use `/add --use-env`:

```bash
/add claude --use-env OPENAI_API_KEY
```

See [TUI Mode](/docs/cli/tui-mode) and [Global Flags](/docs/cli/global-flags#env-precedence) for precedence details.

You can also use env files with direct `nanosb run` commands:

```bash
nanosb run --env-file .env claude
```

## Context Sharing Between Agents

Agents can share context through several mechanisms.

### Project Mount

All agents mount the project directory at the guest home (`/home/developer`) by default, via virtio-fs. Override the mount point per sandbox with `project.mount_point`, and the agent's working directory with `workdir`. Use the `--project` flag to specify which directory to mount:

```bash
nanosb run --project ./my-project claude
```

Or in `sandbox.yml`, launch from the project directory and it auto-detects.

### MCP Memory Server

The [MCP Memory server](./mcp-servers.md) provides persistent key-value storage that agents can read and write. This allows one agent to leave notes, decisions, or context for another.

```yaml
# sandbox.yml
sandboxes:
  claude:
    image: claude
    mcp:
      memory:
        command: npx
        args: ["-y", "@modelcontextprotocol/server-memory"]
```

### Git History

Agents produce commits in the mounted workspace. Subsequent agents can read the git log to understand what previous agents did.

```bash
# Inside the sandbox
git log --oneline -10
# a1b2c3d (HEAD) fix: resolve null pointer in parser
# d4e5f6g feat: add retry logic to HTTP client
```

## Managing Agents in TUI

The TUI provides slash commands for managing agents interactively:

```text
/agent           Show the current agent definition
/agent list      List available agents
/agent show <name>  Show an agent's details
```
