---
title: "MCP Servers"
description: "Configuring Model Context Protocol servers"
order: 2
---

## What is MCP

The Model Context Protocol (MCP) is an open standard for connecting AI agents to external tools and data sources. MCP servers expose capabilities (tools, resources, prompts) over a standardized JSON-RPC transport. Agents that support MCP can discover and invoke these capabilities at runtime.

In Nanosandbox, MCP servers run inside the sandbox alongside the agent, providing secure access to tools without exposing the host system.

## Configuring MCP Servers

MCP servers are configured in the `mcp` section of `sandbox.yml`. Each entry is a named server with a command and arguments.

```yaml
# sandbox.yml
sandboxes:
  claude:
    image: claude
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
| `command` | `string` | Yes | The executable to run |
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

In this example, the `claude` sandbox gets both the `memory` server (from defaults) and the `github` server (from its own config). If a sandbox defines a server with the same name as a default, the sandbox version takes precedence.

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

## Agent-Gateway Integration

When Nanosandbox launches an agent with MCP servers configured, it:

1. Starts each MCP server process inside the sandbox.
2. Waits for each server to emit its capabilities on stdout (JSON-RPC initialization).
3. Configures the agent's MCP client to connect to the running servers via stdio transport.
4. The agent can then discover and invoke tools from all configured servers.

```
+-------------------------------------------------------+
|                     Sandbox VM                         |
|                                                        |
|  +--------+    stdio    +-------------------+          |
|  | Agent  | <---------> | MCP Server (GitHub)|         |
|  |        |    stdio    +-------------------+          |
|  |        | <---------> | MCP Server (Memory)|         |
|  |        |    stdio    +-------------------+          |
|  |        | <---------> | MCP Server (FS)    |         |
|  +--------+             +-------------------+          |
+-------------------------------------------------------+
```

## Managing MCP in TUI

The TUI provides slash commands for managing MCP servers interactively:

```
/mcp              Toggle the MCP sidebar
/mcp list         List configured MCP servers
/mcp add <name>   Add an MCP server
/mcp remove <name> Remove an MCP server
/mcp enable <name> Enable a disabled MCP server
/mcp disable <name> Disable an MCP server
```

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
