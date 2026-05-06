---
title: "MCP Servers"
description: "Configuring Model Context Protocol servers"
order: 2
---

## What is MCP

The Model Context Protocol (MCP) is an open standard for connecting AI agents to external tools and data sources. MCP servers expose capabilities (tools, resources, prompts) over a standardized JSON-RPC transport. Agents that support MCP can discover and invoke these capabilities at runtime.

In Nanosandbox, the agent-gateway manages MCP server configuration inside the sandbox. It generates the correct config format for each agent type so servers work consistently across Claude, Goose, Codex, and Cursor.

## Config vs Commands

> **sandbox.yml** and **TUI commands** are two ways to manage MCP servers. They behave differently:
>
> | | `sandbox.yml` | TUI `/mcp add` |
> |---|---|---|
> | **When applied** | Every time the sandbox starts (bootstrap) | Immediately, once |
> | **Source tag** | `config` | `runtime` |
> | **On sandbox restart** | Re-applied from config (always fresh) | Preserved — survives restarts |
> | **On sandbox.yml change** | Old config servers replaced with new ones | Untouched — runtime servers kept |
> | **Persisted where** | In your `sandbox.yml` file | In `~/.nanosandbox/state.json` inside the VM |
>
> **In short:** `sandbox.yml` is your declarative baseline. TUI commands are for ad-hoc additions that persist alongside the config without interfering with it. If a config server and a runtime server share the same name, the config version wins on next bootstrap.

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
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
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
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
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

The agent-gateway generates the correct MCP config format for each agent type. Each agent reads MCP config from a different location and in a different format:

| Agent | Config Format | Config Location |
|---|---|---|
| Claude Code | JSON (`mcpServers` in settings) | `~/.claude.json` |
| Goose | YAML (`extensions:` with `cmd:`/`envs:`) | `~/.config/goose/config.yaml` |
| Codex | TOML (`[mcp_servers.<name>]`) | `~/.codex/config.toml` |
| Cursor | JSON (`mcpServers` in settings) | `~/.cursor/mcp.json` |

### Cross-Agent Compatibility

MCP servers defined with `npx` commands automatically get `uvx` equivalents generated for agents that use Python tooling (Goose). The gateway handles this transparently — you define the server once and it works across all agents.

```
sandbox.yml:  command: npx, args: ["-y", "@modelcontextprotocol/server-github"]
    ├── Claude:  npx -y @modelcontextprotocol/server-github
    ├── Codex:   npx -y @modelcontextprotocol/server-github
    ├── Cursor:  npx -y @modelcontextprotocol/server-github
    └── Goose:   uvx mcp-server-github  (auto-generated override)
```

## Managing MCP in TUI

The TUI provides slash commands for managing MCP servers interactively:

```
/mcp                                      Toggle the MCP sidebar
/mcp list                                 List configured MCP servers
/mcp add <name> <command> [args...]       Add an MCP server to the focused sandbox
/mcp add --all <name> <command> [args...] Add an MCP server to all sandboxes
/mcp add --sandbox <name> <server> ...    Add an MCP server to a specific sandbox
/mcp remove <name>                        Remove an MCP server
/mcp remove --all <name>                  Remove from all sandboxes
/mcp enable <name>                        Enable a disabled MCP server
/mcp disable <name>                       Disable an MCP server
```

### Example: Adding an MCP Server via TUI

```
/mcp add memory npx -y @modelcontextprotocol/server-memory
# Added MCP server: memory

/mcp add --all github npx -y @modelcontextprotocol/server-github
# Added MCP server 'github' to all sandboxes
```

MCP servers added via TUI are tagged as **runtime-sourced** and persist across sandbox restarts, even if they are not in `sandbox.yml`.

After adding or removing an MCP server, the TUI prompts you to reconnect (`/reconnect`) so the agent picks up the updated MCP configuration.

## State Persistence

MCP server definitions (along with skills) are persisted to `~/.nanosandbox/state.json` inside the VM. This file is saved on every mutation and reloaded on startup. The `~/.nanosandbox/` directory is symlinked to `/workspace/.nanosb-state/.nanosandbox/`, so it survives VM restarts via virtio-fs.

## Troubleshooting

### MCP server fails to start

Check that the server package is available. The `npx -y` flag auto-installs if needed, but requires network access.

```bash
# Test inside a sandbox
nanosb exec my-sandbox "npx -y @modelcontextprotocol/server-memory"
```

### Agent does not see MCP tools

Verify the agent supports MCP. Check that the MCP servers are listed as enabled:

```
# In the TUI
/mcp list
```

### Environment variable not set

If a `${VAR}` reference in `sandbox.yml` is undefined, you see:

```
Error: environment variable 'VAR' is not set (referenced in mcp server config)
```

Export the variable before running the sandbox.
