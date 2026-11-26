---
title: "TUI Mode"
description: "Interactive terminal UI for managing sandboxes"
order: 4
---

# TUI Mode

Running `nanosb` with no subcommand launches the interactive terminal UI.

```bash
nanosb
```

The TUI auto-detects `sandbox.yml` in the current directory and starts all configured sandboxes as agent tabs.

## Launching

```bash
# Auto-detect sandbox.yml and start all sandboxes
nanosb

# Resume the latest saved session for this project
nanosb -r

# Resume a specific saved session id
nanosb --session 20260509121030-ab12cd34

# Use a specific config file
nanosb --config my-config.yml

# Start only one sandbox in TUI mode
nanosb --sandbox claude
```

## Agent Tabs

Each sandbox is shown as an **agent tab**. A horizontal tab strip runs across the top of the main area — one tab per sandbox, labelled with a status dot and the agent name — and the active tab's panel fills the area below it. The sandbox sidebar stays docked on the right.

Switch to the next/previous tab with `Tab` / `Shift+Tab`, jump to a specific tab with `/focus <index>`, or click a tab directly. Use `/zoom` to expand the active tab to the full main area.

### Panel Modes

Each open tab's panel operates in one of three modes:

| Mode | Description |
|---|---|
| **Loading** | Sandbox is starting up. Displays pull progress and initialization status. |
| **Terminal** | Interactive terminal session attached to the sandbox. Keyboard input is forwarded directly. |
| **Headless** | Sandbox is running but no interactive terminal is attached. Output is streamed read-only. |

### Sandbox sidebar & resource usage

The **sandbox sidebar** is open by default (toggle with `/sandboxes` or `/sb`) and
shows, for every panel, a live resource line and a host-capacity header:

```
┌ Sandboxes ───────────────────────┐
│ host 8cpu · 16G ram · 120G free  │
│ [0] ● claude *                   │
│  cpu 12% mem 1.4G/4.0G disk 820M │
│/sb to toggle                     │
└──────────────────────────────────┘
```

- `host …` — detected host CPU count, total RAM, and free disk.
- `req …` — total memory requested by all panels, flagged `tight` or `OVER RAM`
  when it exceeds available or total host memory.
- per-sandbox line — live CPU%, memory used/configured-limit, and sandbox-dir disk
  usage, sampled every ~2s from the sandbox supervisor.
- `cpu N mem -/LIMIT disk -` — configured limits for a sandbox whose live metrics
  are not yet available.

Resource numbers are host-side: `mem` is the sandbox supervisor process RSS and
`disk` is the sandbox state directory size (shared image blobs are excluded).

### Admission control

Sandbox creation is guarded against host overcommit. Before a supervisor starts,
`nanosb` checks the requested CPU/memory against the host budget and refuses to
start a sandbox that would exceed it (also enforcing a minimum free-disk floor).
Budgets are auto-derived from the host and can be tuned via environment:

| Variable | Meaning |
|---|---|
| `NANOSB_MAX_VMS` | Maximum concurrent sandboxes |
| `NANOSB_MEMORY_BUDGET_MB` | Total memory budget (MiB) |
| `NANOSB_CPU_BUDGET` | Total vCPU budget |
| `NANOSB_DISK_BUDGET_MB` | Minimum free disk (MiB) required to start a sandbox |
| `NANOSB_SANDBOX_DISK_MB` | Per-sandbox disk cap (MiB); the supervisor stops a sandbox whose state dir exceeds it |
| `NANOSB_ADMISSION` | Set to `off` to disable admission control |

The same budget is enforced for the TUI, `nanosb run`, `nanosb apply`, and the
headless supervisor. Run `nanosb capacity` to inspect host capacity, the resolved
budget, and current usage. See
[Resource Management](../architecture/resource-management.md) for the full model
(per-sandbox requests, budgets, reservations, and failure modes).

## Slash Commands

Type a slash command in any active panel to control the TUI.

### Panel Management

| Command | Description |
|---|---|
| `/add <agent> [options]` | Add a new agent panel (`claude`, `codex`, `goose`, `cursor`, `opencode`, `aider`, `gemini`, `crush`, `oh-my-openagent`, `oh-my-codex`, `oh-my-claude`) or start from a custom image |
| `/focus <index>` | Switch to the agent tab at the given index |
| `/close [target]` | Close (hide) a panel — sandbox keeps running in the background |
| `/open [target]` | Show a previously hidden panel |
| `/stop [target]` | Stop a sandbox and keep its panel |
| `/restart [target]` | Re-boot a sandbox in place |
| `/pause [target]` | Freeze a running sandbox |
| `/resume [target]` | Thaw a paused sandbox |
| `/kill [panel]` | Kill (destroy) a sandbox and remove its panel |
| `/zoom` | Toggle zoom (maximize/minimize) for the focused panel |
| `/reconnect` | Reconnect SSH terminal for the focused panel |
| `/copy` | Copy focused panel content to system clipboard |
| `/sandboxes` | Toggle the sandbox sidebar (alias `/sb`) |

`/add` syntax:

```bash
/add <agent> [--tag <version>] [--model <model>] [--auto-mode -p <prompt>] [--image <image>] [--project <path>] [--branch <name>] [--name <name>] [--permissions <default|accept-edits|allow-all>] [--env-file <path>] [--use-env <KEY>]...
```

`/add` options:

| Option | Description |
|---|---|
| `--image <image>` | Use a custom image instead of the built-in agent shortcut. |
| `--tag <version>` | Override tag for shortcut agents (for example `claude:rc11`). Ignored when `--image` is set. |
| `--model <model>` | Set the model id for the new panel. |
| `--project <path>` | Mount a specific project directory for this panel. |
| `--branch <name>` | Set project clone branch name for this panel. |
| `--name <name>` | Set a custom sandbox name. |
| `--env-file <path>` | Load `KEY=VALUE` pairs from a file for this panel only. |
| `--auto-mode` | Start in headless autonomous mode. |
| `-p`, `--prompt <prompt>` | Prompt text for autonomous mode. Required with `--auto-mode`; it consumes the rest of the command line. |
| `--use-env <KEY>` | Import one startup runtime env key into this panel. Repeat for multiple keys. |
| `--permissions <level>` | Agent permissions for this panel: `default`, `accept-edits`, or `allow-all`. `allow-all` runs the agent unattended; with `default`/`accept-edits` the agent asks for human approval of edits. Forced to `allow-all` in `--auto-mode`. |
| `--run-as-root` | Run agent commands as root inside the guest VM. |

Examples:

```bash
/add claude                                      # Add with default settings
/add claude --tag rc11                           # Use a non-latest agent tag
/add claude --model claude-sonnet-4-5-20250929   # Specify model
/add claude --project ~/myapp --branch feat/auth # Mount project + custom branch
/add claude --name my-sandbox                    # Custom sandbox name
/add claude --env-file .env.local                # Per-panel env file
/add codex --auto-mode -p "Fix tests and open a PR"  # Headless autonomous mode
/add claude --use-env OPENAI_API_KEY --use-env GITHUB_TOKEN # Import startup env keys
/add claude --run-as-root                        # Run as root inside guest VM
/add claude --permissions allow-all               # Run unattended (no human approval)
/add myagent --image ghcr.io/myorg/agent:v1      # Start from custom image
```

Behavior notes:

- `--auto-mode` requires `-p` or `--prompt`.
- `-p` / `--prompt` consumes the rest of the command line, so place it last.
- `--tag` applies to all agent shortcuts (`claude`, `codex`, `goose`, `cursor`, `opencode`, `aider`, `gemini`, `crush`, `oh-my-openagent`, `oh-my-codex`, `oh-my-claude`); with `--image`, the provided image reference is used as-is.
- `--project` must point to an existing directory.
- `--use-env` imports keys from startup runtime env (for example values passed with `nanosb --env` or `--env-file`).
- `--permissions` accepts `default`, `accept-edits`, or `allow-all` (mirrors the global `--permissions` flag); `--auto-mode` always runs with `allow-all`.
- Agents added with `/add` **auto-accept the workspace-trust prompt** (Cursor `--trust`, Gemini `--skip-trust`, Codex `trust_level`, Claude `hasTrustDialogAccepted`), because the mounted workspace is a disposable per-sandbox clone.
- On failure the panel **keeps the agent's last output** (frozen terminal) and shows the exit reason (e.g. `agent exited with code 1`) as a banner, so you can read the actual error. Credentials are checked by `/add` before the sandbox starts (see [Prerequisite validation](#prerequisite-validation)); the panel never opens a credential popup.
- Env precedence for `/add` is documented in [Global Flags](/docs/cli/global-flags#env-precedence).

### Prerequisite validation

`/add` validates that the agent has the credentials it needs **before** it
creates the sandbox. This avoids the common failure mode where the agent boots
and immediately exits with code 1 — for example Goose prints
`No provider configured. Run 'goose configure' first.` and exits 1, which the
TUI surfaces as `agent exited with code 1`.

Validation has **two severities**, because most modern coding agents support
**interactive browser sign-in** (OAuth / device flow):

| Severity | Behaviour |
|---|---|
| **Advisory** | The agent supports browser sign-in. The TUI shows the missing variable as a hint but **lets the agent start**. The agent's sign-in flow opens the provider's authorization URL in your host browser automatically. |
| **Blocking** | The agent has no interactive sign-in path. Missing credentials would leave a dead panel whose only symptom is an opaque exit code, so `/add` is **rejected** before the sandbox starts. |

All built-in agents except the three `oh-my-*` harnesses (`claude`, `codex`,
`goose`, `gemini`, `cursor`, `opencode`, `aider`, `crush`) support browser
sign-in, so for them validation is **advisory**: you can start the panel with no
credentials and sign in through the browser. The `oh-my-*` agents
(`oh-my-openagent`, `oh-my-codex`, `oh-my-claude`) have **no browser sign-in
path**, so their validation is **blocking**: `/add` is rejected until the
required API key is present. Custom images (`--image`) are not validated — they
may have their own credential requirements.

The browser sign-in flow auto-opens URLs for these providers:

| Agent | Sign-in host(s) |
|---|---|
| `claude` | `claude.ai`, `claude.com`, `platform.claude.com`, `auth.anthropic.com`, `console.anthropic.com` |
| `codex` | `auth.openai.com`, `login.live.com`, `login.microsoftonline.com` |
| `gemini` | `accounts.google.com`, `oauth2.googleapis.com` |
| `cursor` | `cursor.com`, `www.cursor.com`, `authenticator.cursor.sh`, `cursor.sh` |
| `goose` | `block.github.io`, `goose.ai` |
| `opencode` | `opencode.ai`, `auth.opencode.ai` |
| `crush` | `charm.sh`, `crush.ai` |
| `aider` | `aider.chat` |

URLs on other hosts are not auto-opened, so an agent cannot flood your browser
with arbitrary tabs.

#### What each agent needs

| Agent | Required environment | Severity |
|---|---|---|
| `claude` | `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` | advisory |
| `codex` | `OPENAI_API_KEY` or `CODEX_API_KEY` | advisory |
| `goose` | `GOOSE_PROVIDER` + `GOOSE_MODEL` + one provider key (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, or `OPENROUTER_API_KEY`) | advisory |
| `gemini` | `GEMINI_API_KEY` or `GOOGLE_API_KEY` | advisory |
| `cursor` | `CURSOR_API_KEY` | advisory |
| `opencode` | one of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY` | advisory |
| `aider` | one of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY` | advisory |
| `crush` | one of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY` | advisory |
| `oh-my-openagent` | `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`) | blocking |
| `oh-my-codex` | `OPENAI_API_KEY` or `CODEX_API_KEY` | blocking |
| `oh-my-claude` | `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` | blocking |

To satisfy a requirement without the browser flow, export the variable in the
host environment before launching the TUI, or use one of the per-panel options:

```bash
# Export in the host environment before launching the TUI
export ANTHROPIC_API_KEY=sk-ant-...
nanosb

# Or load a per-panel env file
/add claude --env-file .env

# Or set it at runtime in the TUI
/env ANTHROPIC_API_KEY=sk-ant-...
```

For Goose, the TUI infers `GOOSE_PROVIDER` and `GOOSE_MODEL` from an available
provider key (`anthropic` → `claude-sonnet-4-5-20250929`, `openai` → `gpt-4o`).
Set both explicitly to use a different model.

> The `--run-as-root` flag is the same one available on `nanosb run`. By default the agent runs as a non-root user (some agents refuse to start as root). Pass `--run-as-root` only when a workflow needs root in the guest.

### Agent & Environment

| Command | Description |
|---|---|
| `/agent show` | Show current agent definition |
| `/agent list` | List available agents |
| `/agent set` | Set the agent for the focused panel |
| `/env` | Set or list environment variables for the focused panel |

### MCP Servers

| Command | Description |
|---|---|
| `/mcp` | Toggle the MCP sidebar |
| `/mcp list` | List configured MCP servers |
| `/mcp add <name> <command> [args...]` | Add an MCP server to the focused sandbox |
| `/mcp add --all <name> <command> [args...]` | Add an MCP server to all sandboxes |
| `/mcp add --sandbox <name> <server> <cmd> [args...]` | Add to a specific sandbox |
| `/mcp remove <name>` | Remove an MCP server from the focused sandbox |
| `/mcp remove --all <name>` | Remove from all sandboxes |
| `/mcp enable <name>` | Enable a disabled MCP server |
| `/mcp disable <name>` | Disable an MCP server |

### Skills

| Command | Description |
|---|---|
| `/skills` | Toggle the skills sidebar |
| `/skills list` | List available skills |
| `/skills add <name>` | Add a skill to the focused sandbox |
| `/skills add --all <name>` | Add a skill to all sandboxes |
| `/skills add --sandbox <name> <skill>` | Add to a specific sandbox |
| `/skills remove <name>` | Remove a skill from the focused sandbox |
| `/skills remove --all <name>` | Remove from all sandboxes |
| `/skills show <name>` | Show the content of a skill |

### Git & Files

| Command | Description |
|---|---|
| `/gitsync` | Show git sync status |
| `/gitsync on` | Enable automatic git sync |
| `/gitsync off` | Disable automatic git sync |
| `/gitsync now` | Trigger a manual git sync |
| `/branches` | List git branches created by nanosb sandboxes |
| `/upload <host-path>` | Upload a file from the host into the sandbox VM |
| `/paste-image` | Paste an image from the system clipboard into the sandbox VM |

### Session & UI

| Command | Description |
|---|---|
| `/sandboxes` | Toggle the sandbox sidebar |
| `/edit [tool]` | Open clone directory in an external tool |
| `/theme [name]` | Switch or list TUI colour themes |
| `/clearhistory` | Clear the command history |
| `/help` | Show help text |
| `/quit` (or `/q`) | Exit the TUI (sandboxes keep running) |
| `/destroy` | Destroy all sandboxes, remove session state, and exit |

### Available Themes

```
/theme nanosandbox
/theme nanosandbox-light
/theme dracula
/theme catppuccin
/theme tokyo-night
/theme nord
```

## Mouse Support

The TUI supports mouse interaction:

- Click a tab to switch to that agent
- Scroll within the active panel to navigate output history
- Click UI elements (buttons, tabs) where available

## Session Management

Sessions persist across TUI restarts within the same project directory. When you exit the TUI, running sandboxes continue in the background.

Session startup is explicit:

- `nanosb` starts a fresh session
- `nanosb -r` resumes the latest saved session
- `nanosb --session <id>` resumes a specific saved session id

Use `nanosb sessions` to list saved sessions for the current project.

A panel that was used in a previous session and recorded a native agent session id is relaunched with that id, so the agent conversation continues instead of starting fresh. This applies to agents whose session store is readable from the sandbox state (currently Codex, via its `~/.codex/sessions` rollouts); agents without a detected id start a new conversation.

To explicitly stop all sandboxes when exiting, use `/destroy` which removes all sandboxes and cleans up session state.

```bash
# List saved sessions for current project
nanosb sessions

# Resume the latest session
nanosb -r

# Resume a specific session id
nanosb --session 20260509121030-ab12cd34
```

To stop individual sandboxes via the CLI:

```bash
nanosb ps
nanosb stop <sandbox>
```

## Command History

The TUI maintains a command history per panel. Use the up and down arrow keys to navigate previous commands within a Terminal-mode panel.

## Keyboard Reference

| Key | Action |
|---|---|
| `Tab` | Switch to the next agent tab |
| `Shift+Tab` | Switch to the previous agent tab |
| `Ctrl+C` | Send interrupt to the focused sandbox |
| `Ctrl+D` | Detach from the focused panel (switches to Headless mode) |
| `/` | Begin a slash command |
| Up / Down | Navigate command history (Terminal mode) |
