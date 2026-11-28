---
title: "MCP Servers"
description: "Configuring Model Context Protocol servers"
order: 2
---

## What is MCP

The Model Context Protocol (MCP) is an open standard for connecting AI agents to external tools and data sources. MCP servers expose capabilities (tools, resources, prompts) over a standardized JSON-RPC transport. Agents that support MCP can discover and invoke these capabilities at runtime.

In Nanosandbox, nanosb generates MCP server configuration host-side and writes it into the sandbox. It generates the correct config format for each agent type so servers work consistently across Claude, Goose, Codex, and Cursor.

## Declarative configuration

> MCP configuration is **declarative**: define servers in `sandbox.yml` and run
> `nanosb apply` (or restart the sandbox). The TUI only lists the configured
> servers (`/mcp`, `/mcp list`); there are no `/mcp add` or `/mcp remove`
> commands.

## Configuring MCP Servers

MCP servers are configured in the `mcp` section of `sandbox.yml`. Each entry is a named server with a command and arguments.

```yaml
# sandbox.yml
sandboxes:
  claude:
    image: claude
    type: claude
    env:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    mcp:
      memory:
        command: npx
        args: ["-y", "@modelcontextprotocol/server-memory"]
      filesystem:
        command: npx
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/developer"]
      github:
        command: npx
        args: ["-y", "@modelcontextprotocol/server-github"]
        env:
          GITHUB_TOKEN: "${GITHUB_TOKEN}"
```

### Configuration Fields

Each named MCP server entry supports:

| Field | Type | Required | Description |
|---|---|---|---|
| `command` | `string` | Yes | The executable to run (`npx`, `uvx`, or a binary) |
| `args` | `string[]` | No | Arguments passed to the command |
| `env` | `map` | No | Additional environment variables for this server |
| `enabled` | `boolean` | No | Whether this server is enabled (default: `true`) |

### Default MCP Servers

MCP servers can be defined in the `defaults` section and inherited by all sandboxes:

```yaml
defaults:
  cpus: 2
  memory: 4096
  mcp:
    memory:
      command: npx
      args: ["-y", "@modelcontextprotocol/server-memory"]

sandboxes:
  claude:
    image: claude
    mcp:
      github:
        command: npx
        args: ["-y", "@modelcontextprotocol/server-github"]
```

In this example, the `claude` sandbox gets both the `memory` server (from defaults) and the `github` server (from its own config). If both define a server with the same name, the sandbox version takes precedence.

### Variable Substitution

Environment variables from the host can be interpolated using `${VAR_NAME}` syntax:

```yaml
mcp:
  github:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_TOKEN: "${GITHUB_TOKEN}"
```

If the variable is not set on the host, sandbox creation fails with an error.

## Common MCP Servers

### GitHub Server

Provides tools for interacting with GitHub repositories, issues, and pull requests.

```yaml
mcp:
  github:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_TOKEN: "${GITHUB_TOKEN}"
```

**Exposed tools**: `create_issue`, `list_issues`, `create_pull_request`, `get_file_contents`, `search_repositories`, `create_branch`, and more.

### Memory Server

A persistent key-value store that agents use to save and retrieve context across invocations. Useful for multi-agent workflows where one agent needs to pass information to another.

```yaml
mcp:
  memory:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-memory"]
```

**Exposed tools**: `store`, `retrieve`, `list_keys`, `delete`.

### Filesystem Server

Provides safe, scoped file access. The agent can read and write files only within the specified directory.

```yaml
mcp:
  filesystem:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/developer"]
```

**Exposed tools**: `read_file`, `write_file`, `list_directory`, `search_files`, `get_file_info`.

### Brave Search Server

Gives agents the ability to search the web.

```yaml
mcp:
  brave-search:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-brave-search"]
    env:
      BRAVE_API_KEY: "${BRAVE_API_KEY}"
```

**Exposed tools**: `brave_web_search`, `brave_local_search`.

### PostgreSQL Server

Read-only access to a PostgreSQL database for data analysis tasks.

```yaml
mcp:
  postgres:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-postgres", "${DATABASE_URL}"]
```

**Exposed tools**: `query` (read-only SQL execution).

## How MCP Config Is Generated

Nanosb generates the correct MCP config format for each agent type. Each agent reads MCP config from a different location and in a different format:

| Agent | Config Format | Config Location |
|---|---|---|
| Claude Code | JSON (`mcpServers` in settings) | `~/.claude.json` |
| Goose | YAML (`extensions:` with `cmd:`/`envs:`) | `~/.config/goose/config.yaml` |
| Codex | TOML (`[mcp_servers.<name>]`) | `~/.codex/config.toml` |
| Cursor | JSON (`mcpServers` in settings) | `~/.cursor/mcp.json` |
| Oh My OpenAgent | none (deferred) | — |
| Oh My Codex | none (deferred) | — |
| Oh My Claude | none (deferred) | — |

> The three `oh-my-*` agents do not receive generated MCP config in this release —
> MCP delivery for them is deferred. `mcp` entries on those sandboxes are
> accepted but not materialized.

### Cross-Agent Compatibility

MCP servers defined with `npx` commands automatically get `uvx` equivalents generated for agents that use Python tooling (Goose). Nanosb handles this transparently — you define the server once and it works across all agents.

```text
sandbox.yml:  command: npx, args: ["-y", "@modelcontextprotocol/server-github"]
    ├── Claude:  npx -y @modelcontextprotocol/server-github
    ├── Codex:   npx -y @modelcontextprotocol/server-github
    ├── Cursor:  npx -y @modelcontextprotocol/server-github
    └── Goose:   uvx mcp-server-github  (auto-generated override)
```

## Managing MCP in the TUI

```text
/mcp        Toggle the MCP sidebar
/mcp list   List servers configured in sandbox.yml
```

To change servers, edit `sandbox.yml`, run `nanosb apply`, then `/reconnect` so
the agent reloads its config. MCP config is generated host-side on every launch,
so it survives sandbox restarts and redeploys.

## Troubleshooting

### MCP server fails to start

Check that the server package is available. The `npx -y` flag auto-installs if needed, but requires network access.

```bash
# Test inside a sandbox
nanosb exec my-sandbox "npx -y @modelcontextprotocol/server-memory"
```

### Agent does not see MCP tools

Verify the agent supports MCP. Check that the MCP servers are listed as enabled:

```text
# In the TUI
/mcp list
```

### Environment variable not set

If a `${VAR}` reference in `sandbox.yml` is undefined, you see:

```text
Error: environment variable 'VAR' is not set (referenced in mcp server config)
```

Export the variable before running the sandbox.
