---
title: "Configuration"
description: "sandbox.yml configuration reference"
order: 2
---

# Configuration

Nanosb is configured through a `sandbox.yml` file. When launched, the CLI auto-detects `sandbox.yml` in the current working directory. You can also specify a path explicitly with `--config <path>`.

## Full Example

```yaml
defaults:
  cpus: 2
  memory: 4096
  timeout: 600
  skills:
    - git-workflow
    - tdd
  network:
    enabled: true
    mode: tsi
    scope: any
  mcp:
    memory:
      command: npx
      args: ["-y", "@modelcontextprotocol/server-memory"]

sandboxes:
  claude:
    image: claude
    type: claude
    model: claude-sonnet-4-5-20250929
    agent: rust-developer
    permissions: accept_edits
    env:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    mcp:
      github:
        command: npx
        args: ["-y", "@modelcontextprotocol/server-github"]
        env:
          GITHUB_TOKEN: "${GITHUB_TOKEN}"

  codex:
    image: codex
    type: codex
    cpus: 4
    auto_mode: true
    prompt: "Refactor the database module"
    env:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
```

## defaults

The `defaults` section sets baseline values applied to every sandbox unless overridden.

| Key | Type | Description |
|---|---|---|
| `image` | string | Default container image |
| `cpus` | integer | CPU cores allocated (runtime default: 1) |
| `memory` | integer | Memory in MB (runtime default: 512) |
| `timeout` | integer | Maximum runtime in seconds (runtime default: 300) |
| `env` | map | Environment variables injected into every sandbox |
| `env_file` | string | Path to a file containing `KEY=VALUE` environment variables |
| `network` | object | Network configuration (see [network](#network)) |
| `mounts` | list | Host directory mounts (see [mounts](#mounts)) |
| `mcp` | map | MCP server definitions (see [mcp](#mcp)) |
| `project` | object | Project directory configuration (see [project](#project)) |
| `agent` | string | Agent definition name |
| `skills` | list | Skill names to load (see [skills](#skills)) |
| `auto_mode` | boolean | Run the agent fully autonomously (default: `false`) |
| `permissions` | string | Permission level: `default`, `accept_edits`, or `allow_all` |
| `prompt` | string | Prompt text for the agent (required when `auto_mode: true`) |
| `model` | string | Model to use (validated against the agent type) |

All fields are optional. When omitted, the runtime's built-in defaults are used.

## sandboxes

The `sandboxes` map defines one or more named sandbox configurations. Each key becomes the sandbox name.

```yaml
sandboxes:
  <name>:
    image: <image>           # required (unless set in defaults)
    name: <display-name>     # optional display name override
    type: <agent-type>       # claude, codex, goose, or cursor
    model: <model-id>        # model for this agent type
    cpus: <n>
    memory: <mb>
    timeout: <secs>
    agent: <agent-name>
    skills: [<skill>, ...]
    auto_mode: <bool>
    permissions: <level>
    prompt: <text>
    env_file: <path>
    env:
      KEY: value
    network:
      enabled: <bool>
      mode: <mode>
      scope: <scope>
      ports: [<mapping>, ...]
      dns: [<server>, ...]
    mounts:
      - host: <path>
        container: <path>
        readonly: <bool>
        type: <mount-type>
    mcp:
      <server-name>:
        command: <cmd>
        args: [...]
        env: { ... }
        enabled: <bool>
    project:
      path: <path>
      branch: <branch>
      mount_point: <path>
      auto_sync: <bool>
```

Per-sandbox values override `defaults`. The `type` field (agent type) is **per-sandbox only** and is not inherited from defaults.

### image

Required (either in `defaults` or per-sandbox). The container image to use.

Bare names are automatically resolved to the default agents registry:

```
claude  ->  ghcr.io/nanosandboxai/agents-registry/claude:latest
codex   ->  ghcr.io/nanosandboxai/agents-registry/codex:latest
```

You can also provide a fully qualified image reference:

```yaml
image: ghcr.io/myorg/custom-agent:v3
```

### type

The agent type. Per-sandbox only, not inherited from defaults.

| Value | Aliases |
|---|---|
| `claude` | `claude-code` |
| `codex` | |
| `goose` | |
| `cursor` | `cursor-agent` |

When both `type` and `model` are set, the model is validated against the known models for that agent type.

### Per-Sandbox Resource Overrides

Each sandbox can override the values set in `defaults`. Only the fields you specify are overridden; the rest inherit from `defaults`.

```yaml
sandboxes:
  heavy-task:
    image: claude
    cpus: 8
    memory: 16384
    timeout: 1800
```

### env

A map of environment variables injected into the sandbox at startup. Values support `${VAR}` syntax, which resolves against the host environment.

```yaml
env:
  ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
  CUSTOM_FLAG: "true"
  DATABASE_URL: ${DATABASE_URL}
```

All environment variables are encrypted before entering the VM. See [Secrets Management](/docs/security/secrets) for details.

If a referenced host variable is not set, sandbox creation **fails with an error**.

Environment variables can also be injected at runtime via the `-e` flag or `--env-file` flag, which take precedence over values defined in `sandbox.yml`.

**Merge order** (highest priority last):
1. `defaults.env_file`
2. `defaults.env`
3. Per-sandbox `env_file`
4. Per-sandbox `env`
5. CLI `-e` / `--env-file` flags

### env_file

Path to a file containing `KEY=VALUE` pairs, one per line. Lines starting with `#` are comments. Relative paths are resolved from the directory containing `sandbox.yml`.

```yaml
env_file: secrets.env
```

### network

Configure sandbox networking.

```yaml
network:
  enabled: true
  mode: tsi
  scope: any
  ports:
    - "8080:80"
    - "3000:3000/udp"
  dns:
    - "8.8.8.8"
    - "1.1.1.1"
```

| Key | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `true` | Enable/disable networking |
| `mode` | string | `tsi` | Network mode: `none`, `tsi`, or `bridge` |
| `scope` | string | `any` | Access scope: `none`, `group`, `public`, or `any` |
| `ports` | list | `[]` | Port mappings (`"host:container"` or `"host:container/protocol"`) |
| `dns` | list | `[]` | DNS server addresses |

Per-sandbox network fields merge at the field level with defaults, except `ports` which replaces entirely.

### mounts

Mount host directories into the sandbox.

```yaml
mounts:
  - host: ~/data
    container: /data
    readonly: true
    type: bind
```

| Key | Type | Default | Description |
|---|---|---|---|
| `host` | string | *(required)* | Host directory path |
| `container` | string | *(required)* | Mount point inside the sandbox |
| `readonly` | boolean | `false` | Mount as read-only |
| `type` | string | `bind` | Mount type: `bind` or `virtiofs` |

Per-sandbox mounts **replace** defaults mounts entirely (no merge).

### mcp

Configure Model Context Protocol (MCP) servers. Each key under `mcp` is the server name.

```yaml
mcp:
  github:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_TOKEN: "${GITHUB_TOKEN}"
    enabled: true
```

| Key | Type | Default | Description |
|---|---|---|---|
| `command` | string | *(required)* | Executable to launch the MCP server |
| `args` | list | `[]` | Arguments passed to the command |
| `env` | map | `{}` | Environment variables for this server process |
| `enabled` | boolean | `true` | Whether this server is active |

Per-sandbox MCP servers are **merged** with defaults. If both define a server with the same name, the per-sandbox version takes precedence.

### project

Configure the project directory mounted into the sandbox.

```yaml
project:
  path: ~/repos/my-project
  branch: nanosb/feature
  mount_point: /workspace
  auto_sync: true
```

| Key | Type | Default | Description |
|---|---|---|---|
| `path` | string | config directory | Path to the project directory |
| `branch` | string | *(auto-generated)* | Git branch name |
| `mount_point` | string | `/workspace` | Mount point inside the sandbox |
| `auto_sync` | boolean | `false` | Auto-sync git changes |

Paths starting with `~` are expanded. Relative paths are resolved from the directory containing `sandbox.yml`. Per-sandbox project **replaces** defaults project entirely.

### skills

A list of skill names to load into the sandbox. Skills provide prompt-based guidance to the agent.

```yaml
skills:
  - tdd
  - git-workflow
  - code-review
```

Per-sandbox skills **replace** defaults skills (not merged).

### auto_mode and prompt

When `auto_mode: true`, the agent runs fully autonomously with no user confirmation. The `prompt` field is **required** when auto mode is enabled.

```yaml
sandboxes:
  auto-claude:
    image: claude
    auto_mode: true
    permissions: allow_all
    prompt: "Fix all failing tests in the project"
```

When `auto_mode` is true, permissions are always set to `allow_all` regardless of the `permissions` field.

### permissions

Controls what the agent can do without asking for confirmation.

| Value | Description |
|---|---|
| `default` | Agent uses its default approval mode |
| `accept_edits` | Auto-accepts file edits, asks for other operations |
| `allow_all` | Fully autonomous, no confirmation |

## Merge Order

When the same setting is specified in multiple places, the following precedence applies (highest to lowest):

1. CLI flags (`--cpus`, `--memory`, `--timeout`, `-e`)
2. Per-sandbox definition in `sandbox.yml`
3. `defaults` section in `sandbox.yml`
4. Built-in runtime defaults

## Name Validation

Sandbox names must be:
- Lowercase alphanumeric characters and hyphens only (`a-z`, `0-9`, `-`)
- 1 to 64 characters long
- Cannot start or end with a hyphen

## Multiple Config Files

The `--config` flag is repeatable. When multiple files are provided, they are merged in order with later files taking precedence:

```bash
nanosb --config base.yml --config override.yml
```

## Selecting a Single Sandbox

Use `--sandbox <name>` to start only one sandbox from a multi-sandbox configuration:

```bash
nanosb --sandbox claude
```
