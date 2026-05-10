---
title: "Agents Overview"
description: "AI coding agents supported by Nanosandbox"
order: 1
---

## Supported Agents

Nanosandbox provides pre-built, sandboxed environments for popular AI coding agents. Each agent runs inside its own lightweight VM with full filesystem and network isolation.

| Agent | CLI Name | Image | Agent Type |
|---|---|---|---|
| Claude Code | `claude` | `ghcr.io/nanosandboxai/agents-registry/claude:latest` | `claude` |
| Goose | `goose` | `ghcr.io/nanosandboxai/agents-registry/goose:latest` | `goose` |
| Codex | `codex` | `ghcr.io/nanosandboxai/agents-registry/codex:latest` | `codex` |
| Cursor | `cursor` | `ghcr.io/nanosandboxai/agents-registry/cursor:latest` | `cursor` |

## Base Image

All agent images are built on a common base:

- **OS**: Debian (node:22-slim)
- **Runtime**: Node.js 22 (LTS), Python 3 + uv/uvx
- **Included tools**: git, curl, bash, sudo, openssh (dropbear)
- **Registry**: `ghcr.io/nanosandboxai/agents-registry/`

The base image includes the **agent-gateway** binary — an HTTP server (`:8080`) that manages skill files, MCP config generation, and state persistence inside the VM.

## Architecture

Each sandbox VM runs:

```
+-----------------------------------------------------------+
|                       Sandbox VM                          |
|                                                           |
|  nanosb-init.sh (PID 1)                                  |
|    ├── agent-gateway :8080  (skills, MCP, state mgmt)    |
|    ├── dropbear sshd :2222  (terminal access)            |
|    └── agent process        (claude, goose, codex, etc.) |
|                                                           |
|  /workspace/          ← project mounted via virtio-fs    |
|  /home/developer/     ← agent HOME (symlinked to state)  |
|  .nanosb-state/       ← persisted state directory        |
+-----------------------------------------------------------+
```

The **agent-gateway** is the bridge between the CLI and the agent. It:
- Receives skill and MCP definitions from the CLI via bootstrap
- Generates agent-specific config files (each agent reads a different format)
- Persists state to `~/.nanosandbox/state.json` so skills/MCPs survive VM restarts
- Serves a REST API for runtime skill/MCP management from the TUI

## Pulling Agent Images

```bash
# Pull a specific agent
nanosb pull ghcr.io/nanosandboxai/agents-registry/claude:latest

# Pull using short names (auto-resolves to full registry path)
nanosb pull claude
nanosb pull goose
nanosb pull codex
nanosb pull cursor
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

## API Keys

Each agent requires its own API key passed as an environment variable:

| Agent | Environment Variable |
|---|---|
| Claude Code | `ANTHROPIC_API_KEY` |
| Goose | `OPENAI_API_KEY` |
| Codex | `OPENAI_API_KEY` |
| Cursor | `CURSOR_API_KEY` |

API keys are injected into the sandbox as environment variables. They are never written to disk inside the guest.

You can also use an env file:

```bash
nanosb run --env-file .env claude
```

## Context Sharing Between Agents

Agents can share context through several mechanisms.

### Project Mount

All agents mount the project directory at `/workspace` via virtio-fs. This is the fixed mount point for all sandboxes. Use the `--project` flag to specify which directory to mount:

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
