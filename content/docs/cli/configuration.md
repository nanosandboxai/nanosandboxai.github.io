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
| `disk` | integer | Per-sandbox disk quota in MB (0 = unlimited) |
| `max_pids` | integer | Maximum processes in the guest (0 = runtime default 512) |
| `env` | map | Environment variables injected into every sandbox |
| `env_file` | string | Path to a file containing `KEY=VALUE` environment variables |
| `network` | object | Network configuration (see [network](#network)) |
| `mounts` | list | Host directory mounts (see [mounts](#mounts)) |
| `mcp` | map | MCP server definitions (see [mcp](#mcp)) |
| `project` | object | Project directory configuration (see [project](#project)) |
| `agent` | string | Agent definition name |
| `skills` | list | Skill names to load (see [skills](#skills)) |
| `auto_mode` | boolean | Run the agent fully autonomously (default: `false`) |
| `interactive` | boolean | Run the agent interactively on a TTY (default: `false`); mutually exclusive with `auto_mode` |
| `permissions` | string | Permission level: `default`, `accept_edits`, or `allow_all` |
| `prompt` | string | Prompt text for the agent (required when `auto_mode: true`) |
| `model` | string | Model to use (enforced at config load against the built-in catalog; extendable via `~/.nanosandbox/models.json`) |
| `agent_config` | map | Inline agent-native config files (see [`agent_config`](#agent_config)) |

All fields are optional. When omitted, the runtime's built-in defaults are used.
For how resource limits (`cpus`, `memory`, `disk`, `max_pids`) are enforced and
how host admission budgets work, see
[Resource Management](../architecture/resource-management.md).

## sandboxes

The `sandboxes` map defines one or more named sandbox configurations. Each key becomes the sandbox name.

```yaml
sandboxes:
  <name>:
    image: <image>           # required (unless set in defaults)
    name: <display-name>     # optional display name override
    type: <agent-type>       # claude, codex, goose, cursor, opencode, aider, gemini, crush, oh-my-openagent|omo, oh-my-codex|omx, oh-my-claude|omc
    model: <model-id>        # model for this agent type
    interactive: <bool>      # run the agent's own TUI on a PTY
    agent_config:            # inline agent-native config files
      .omo/omo.jsonc: |
        { "[native]": { "model_profile": "openrouter/deepseek/deepseek-v4.1-flash-1017" } }
    cpus: <n>
    memory: <mb>
    timeout: <secs>
    disk: <mb>            # per-sandbox disk quota (0 = unlimited)
    max_pids: <n>         # guest process cap (0 = default 512)
    agent: <agent-name>
    skills: [<skill>, ...]
    auto_mode: <bool>
    permissions: <level>
    run_as_root: <bool>
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

Bare agent names are automatically resolved to the default agents registry:

```
claude          ->  ghcr.io/nanosandboxai/nanosandbox/claude:latest
codex           ->  ghcr.io/nanosandboxai/nanosandbox/codex:latest
oh-my-openagent ->  ghcr.io/nanosandboxai/nanosandbox/oh-my-openagent:latest
oh-my-codex     ->  ghcr.io/nanosandboxai/nanosandbox/oh-my-codex:latest
oh-my-claude    ->  ghcr.io/nanosandboxai/nanosandbox/oh-my-claude:latest
```

Every supported agent type resolves this way; any other bare name resolves to
Docker Hub (`docker.io/library/<name>:latest`).

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
| `opencode` | `open-code` |
| `aider` | |
| `gemini` | `gemini-cli` |
| `crush` | |
| `oh-my-openagent` | `omo` |
| `oh-my-codex` | `omx` |
| `oh-my-claude` | `omc` |

The three `oh-my-*` types are agent harnesses: OmO runs its own `omo` binary,
OMX drives Codex, and OMC drives Claude Code. See
[Agents Overview](/docs/agents/overview) for their images and licensing.

When both `type` and `model` are set, the model is enforced at config load against the built-in model catalog (extendable via `~/.nanosandbox/models.json`). The `oh-my-*` agents can additionally select a model through [`agent_config`](#agent_config) when it is not in the built-in catalog.

### Strict validation

`sandbox.yml` is validated strictly before any microVM is created. Unknown or
misspelled fields are rejected at every level (`defaults`, each sandbox, `mcp`
servers, `network`, `mounts`, `project`, `claude`, `workspace`) with a clear
error such as `unknown field 'interactivee', expected one of ...`. Unknown
`skills` are also rejected when an agents registry is available
(`skill 'foo' not found in agents registry`); if no registry is found, skill
validation is skipped. The `model` is enforced against a built-in catalog
compiled into the binary, extendable via `~/.nanosandbox/models.json` or
`~/.nanosandbox/models.yaml`.

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

### Compute Defaults

When `cpus` and `memory` are omitted, nanosb applies built-in defaults for each supported agent type. You can override these defaults globally via `~/.nanosandbox/agent_defaults.yaml`.

| Agent type | `cpus` | `memory` (MB) |
|---|---|---|
| `claude` | 2 | 4096 |
| `codex` | 2 | 2048 |
| `goose` | 2 | 2048 |
| `cursor` | 2 | 2048 |
| `opencode` | 2 | 2048 |
| `aider` | 2 | 2048 |
| `gemini` | 2 | 2048 |
| `crush` | 2 | 2048 |
| `oh-my-openagent` | 2 | 2048 |
| `oh-my-codex` | 2 | 2048 |
| `oh-my-claude` | 2 | 2048 |

- Built-in defaults are applied before per-sandbox overrides.
- Explicit `cpus`/`memory` values in `sandbox.yml` always win.
- CLI flags (`--cpus`, `--memory`) override both.

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

In TUI mode without `sandbox.yml`, nanosb auto-loads `./.env` into a runtime env pool. That runtime pool behavior is documented in [Global Flags](/docs/cli/global-flags#env-precedence).

### run_as_root

Run processes as `root` inside the sandbox instead of the default `developer` user.

```yaml
run_as_root: true
```

Use this only when a workflow requires elevated privileges (for example package install steps that cannot run rootless).

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
  mount_point: /home/developer
  auto_sync: true
```

| Key | Type | Default | Description |
|---|---|---|---|
| `path` | string | config directory | Path to the project directory |
| `branch` | string | *(auto-generated)* | Git branch name |
| `mount_point` | string | `/home/developer` | Mount point inside the sandbox |
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

The concrete CLI flag differs per agent and is applied in both interactive and
headless modes:

| Agent | `accept_edits` | `allow_all` |
|---|---|---|
| Claude Code | `--permission-mode acceptEdits` | `--dangerously-skip-permissions` |
| Codex | `-a on-request -s workspace-write` (interactive); bypass flag (headless) | `--dangerously-bypass-approvals-and-sandbox` |
| Goose | `GOOSE_MODE=smart_approve` | `GOOSE_MODE=auto` |
| Cursor | `--trust` (auto mode) | `--force` (plus `--trust --approve-mcps` in auto mode) |
| OpenCode | — | `--auto` |
| Aider | `--yes-always` (interactive) | `--yes-always` (interactive); headless always passes `--yes` |
| Gemini CLI | `--approval-mode auto_edit` | `--approval-mode yolo` |
| Crush | — | `--yolo` |
| OmO | `--permission-preset accept-edits` | `--permission-preset full-access` |
| OMX | `--yolo` (interactive) / `--dangerously-bypass-approvals-and-sandbox` (headless) | same as accept_edits |
| OMC | `--madmax` | `--madmax` |

### interactive

When `interactive: true`, the agent's own interactive TUI runs in the panel on a
real PTY and keystrokes are forwarded to it. This is the opposite of
`auto_mode`; the two are mutually exclusive. Interactive is the default when a
panel is added from the TUI (`/add`); `--headless` switches to auto mode.

```yaml
sandboxes:
  claude:
    type: claude
    image: claude
    interactive: true
    permissions: accept_edits
    env:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
```

### agent_config

`agent_config` injects agent-native config files inline, so a sandbox can run
with a different model/provider set without editing host state dirs, baking a
custom image, or using an out-of-band script.

- **Keys** are guest-relative paths under the agent's state dirs (for example
  `.omo/omo.jsonc`, `.codex/config.toml`, `.claude/settings.json`).
- **Values** are the raw file body, written verbatim (JSONC/TOML/YAML as the
  agent expects); nanosb does not parse the content.
- **Precedence:** available on `defaults` and per-sandbox; per-sandbox entries
  override `defaults` per key, and win over generated config at the same path.
- **Validation:** keys must be relative, non-empty, with no NUL, `..`, or `.`
  components, and must resolve under the guest home and an allowed agent state
  dir. Limits: ≤ 32 files, ≤ 256 KiB each, ≤ 1 MiB total.
- **Security:** for **non-secret** settings only; secrets belong in
  `env:`/`secrets`. Files are written `0644` in the guest, and their parent
  state dirs are kept private (`0700`).

```yaml
sandboxes:
  omo-openrouter:
    type: oh-my-openagent
    image: oh-my-openagent:rc2
    interactive: true
    env:
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
    agent_config:
      .omo/omo.jsonc: |
        {
          "[native]": {
            "model_profile": "openrouter/deepseek/deepseek-v4.1-flash-1017",
            "categories": { "default": { "model": "openrouter/deepseek/deepseek-v4.1-flash-1017" } }
          }
        }
      .omo/agent/settings.json: |
        {
          "defaultProvider": "openrouter",
          "defaultModel": "deepseek/deepseek-v4.1-flash-1017"
        }
```

> **OmO 5.1.79 config shape.** OmO reads `[native].model_profile` and
> `[native].categories` from `~/.omo/omo.jsonc`, and `defaultProvider` +
> `defaultModel` from `~/.omo/agent/settings.json`. The top-level
> `model_profile` / `categories` shape is ignored by 5.1.79, which makes OmO
> silently fall back to its built-in default model.

The same field is exposed on the wire as `SandboxSpec.agent_config`, so
cloud/shim/SDK consumers can deliver config files through the shared host layer.

## Merge Order

When the same setting is specified in multiple places, the following precedence applies (highest to lowest):

1. CLI flags (`--cpus`, `--memory`, `--timeout`, `--disk`, `--max-pids`, `-e`)
2. Per-sandbox definition in `sandbox.yml`
3. `defaults` section in `sandbox.yml`
4. Built-in runtime defaults

For TUI runtime env source order (`./.env`, `--env-file`, `--use-env`), see [Global Flags](/docs/cli/global-flags#env-precedence).

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
