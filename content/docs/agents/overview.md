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
| Codex | `codex` | `ghcr.io/nanosandboxai/nanosandbox/codex:latest` | `codex` |
| Goose | `goose` | `ghcr.io/nanosandboxai/nanosandbox/goose:latest` | `goose` |
| Cursor | `cursor` | `ghcr.io/nanosandboxai/nanosandbox/cursor:latest` | `cursor` |
| OpenCode | `opencode` | `ghcr.io/nanosandboxai/nanosandbox/opencode:latest` | `opencode` |
| Aider | `aider` | `ghcr.io/nanosandboxai/nanosandbox/aider:latest` | `aider` |
| Gemini CLI | `gemini` | `ghcr.io/nanosandboxai/nanosandbox/gemini:latest` | `gemini` |
| Crush | `crush` | `ghcr.io/nanosandboxai/nanosandbox/crush:latest` | `crush` |
| Oh-My-OpenAgent (OmO) | `omo` | `ghcr.io/nanosandboxai/nanosandbox/oh-my-openagent:latest` | `oh-my-openagent` (alias `omo`) |
| Oh-My-Codex (OMX) | `omx` | `ghcr.io/nanosandboxai/nanosandbox/oh-my-codex:latest` | `oh-my-codex` (alias `omx`) |
| Oh-My-Claude (OMC) | `omc` | `ghcr.io/nanosandboxai/nanosandbox/oh-my-claude:latest` | `oh-my-claude` (alias `omc`) |

The `oh-my-*` agents are multi-agent orchestration front-ends: **OmO** (`omo`) wraps a
provider-agnostic coding agent, **OMX** (`omx`) wraps Codex CLI with team/parallel
workflows, and **OMC** (`omc`) wraps Claude Code. They support inline
[`agent_config`](/docs/cli/configuration#agent_config) files and the same
`default` / `accept_edits` / `allow_all` permission levels as the built-in agents.

## Base Image

All agent images are built on a common base:

- **OS**: Debian (node:22-slim)
- **Runtime**: Node.js 22 (LTS), Python 3 + uv/uvx
- **Included tools**: git, curl, bash, sudo, openssh (dropbear)
- **Registry**: `ghcr.io/nanosandboxai/nanosandbox/`

## Architecture

Each sandbox runs a hardware-isolated microVM (libkrun) managed by a host-side
supervisor:

```
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

The **agent-gateway** is the bridge between the CLI and the agent. It:
- Receives skill and MCP definitions from the CLI via bootstrap
- Generates agent-specific config files (each agent reads a different format)
- Persists state to `~/.nanosandbox/state.json` so skills/MCPs survive VM restarts
- Serves a REST API for runtime skill/MCP management from the TUI

## Pulling Agent Images

```bash
# Pull a specific agent
nanosb pull ghcr.io/nanosandboxai/nanosandbox/claude:latest

# Pull using short names (auto-resolves to full registry path inside sandbox.yml)
nanosb pull ghcr.io/nanosandboxai/nanosandbox/omo:latest
nanosb pull ghcr.io/nanosandboxai/nanosandbox/oh-my-openagent:latest
nanosb pull ghcr.io/nanosandboxai/nanosandbox/oh-my-codex:latest
nanosb pull ghcr.io/nanosandboxai/nanosandbox/oh-my-claude:latest
```

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
nanosb run -e OPENROUTER_API_KEY=$OPENROUTER_API_KEY \
  ghcr.io/nanosandboxai/nanosandbox/oh-my-openagent:latest
```

**Oh-My-Codex (OMX):**
```bash
nanosb run -e OPENAI_API_KEY=$OPENAI_API_KEY \
  ghcr.io/nanosandboxai/nanosandbox/oh-my-codex:latest
```

**Oh-My-Claude (OMC):**
```bash
nanosb run -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  ghcr.io/nanosandboxai/nanosandbox/oh-my-claude:latest
```

### Oh-My-* agents — permissions, model, and config

The `oh-my-*` agents honor the same `permissions` levels as the built-in agents,
in both interactive and headless mode:

| Agent | `default` | `accept_edits` | `allow_all` |
|---|---|---|---|
| OmO (`oh-my-openagent`) | — | `--permission-preset accept-edits` | `--permission-preset full-access` |
| OMX (`oh-my-codex`) | — | `--yolo` (interactive) / `--dangerously-bypass-approvals-and-sandbox` (headless) | same as accept_edits |
| OMC (`oh-my-claude`) | — | `--madmax` | `--madmax` |

Because the underlying CLIs expose a single "bypass" switch, `accept_edits` and
`allow_all` map to the same flag for OMX and OMC; OmO has a distinct
`accept-edits` preset. `default` adds no flag (manual approval).

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

## API Keys

Each agent requires its own API key passed as an environment variable:

| Agent | Environment Variable |
|---|---|
| Claude Code | `ANTHROPIC_API_KEY` (or `CLAUDE_CODE_OAUTH_TOKEN`) |
| Codex | `OPENAI_API_KEY` (or `CODEX_API_KEY`) |
| Goose | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, or `OPENROUTER_API_KEY` |
| Cursor | `CURSOR_API_KEY` |
| OpenCode | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, or `OPENROUTER_API_KEY` |
| Aider | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, or `DEEPSEEK_API_KEY` |
| Gemini CLI | `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) |
| Crush | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, or `OPENROUTER_API_KEY` |
| Oh-My-OpenAgent | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `OPENROUTER_API_KEY` (any one) |
| Oh-My-Codex | `OPENAI_API_KEY` or `CODEX_API_KEY` (either) |
| Oh-My-Claude | `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` (either) |

The `oh-my-*` agents have no browser sign-in flow, so the TUI blocks `/add` for
them until one of their credentials is present (see
[Prerequisite validation](/docs/cli/tui-mode#prerequisite-validation)).

API keys are injected into the sandbox as environment variables. All environment variables are encrypted before entering the VM and are never written to disk inside the guest. See [Secrets Management](/docs/security/secrets) for details.

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

```
/agent show      Show current agent definition
/agent list      List available agents
/agent set       Set the agent for the focused panel
```
