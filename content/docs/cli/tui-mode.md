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

The TUI auto-detects `sandbox.yml` in the current directory and starts all configured sandboxes in a multi-panel layout.

## Launching

```bash
# Auto-detect sandbox.yml and start all sandboxes
nanosb

# Use a specific config file
nanosb --config my-config.yml

# Start only one sandbox in TUI mode
nanosb --sandbox claude
```

## Panel Layout

The TUI displays each sandbox in its own panel. Panels are arranged automatically based on terminal size and the number of active sandboxes.

### Panel Modes

Each panel operates in one of three modes:

| Mode | Description |
|---|---|
| **Loading** | Sandbox is starting up. Displays pull progress and initialization status. |
| **Terminal** | Interactive terminal session attached to the sandbox. Keyboard input is forwarded directly. |
| **Headless** | Sandbox is running but no interactive terminal is attached. Output is streamed read-only. |

## Slash Commands

Type a slash command in any active panel to control the TUI.

### Panel Management

| Command | Description |
|---|---|
| `/add <agent> [options]` | Add a new agent panel (`claude`, `goose`, `codex`, `cursor`) or start from a custom image |
| `/focus <index>` | Switch focus to a specific panel index |
| `/close [target]` | Close (hide) a panel — sandbox keeps running in the background |
| `/open [target]` | Show a previously hidden panel |
| `/kill [panel]` | Kill (destroy) a sandbox and remove its panel |
| `/zoom` | Toggle zoom (maximize/minimize) for the focused panel |
| `/reconnect` | Reconnect SSH terminal for the focused panel |
| `/copy` | Copy focused panel content to system clipboard |

`/add` syntax:

```bash
/add <agent> [--tag <version>] [--model <model>] [--auto-mode -p <prompt>] [--image <image>] [--project <path>] [--branch <name>] [--name <name>] [--env-file <path>] [--use-env <KEY>]...
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
/add myagent --image ghcr.io/myorg/agent:v1      # Start from custom image
```

Behavior notes:

- `--auto-mode` requires `-p` or `--prompt`.
- `-p` / `--prompt` consumes the rest of the command line, so place it last.
- `--tag` applies to agent shortcuts (`claude`, `goose`, `codex`, `cursor`); with `--image`, the provided image reference is used as-is.
- `--project` must point to an existing directory.
- `--use-env` imports keys from startup runtime env (for example values passed with `nanosb --env` or `--env-file`).
- Env precedence for `/add` is documented in [Global Flags](/docs/cli/global-flags#env-precedence).

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

- Click a panel to focus it
- Scroll within a panel to navigate output history
- Click UI elements (buttons, tabs) where available

## Session Management

Sessions persist across TUI restarts within the same project directory. When you exit the TUI, running sandboxes continue in the background. Re-launching `nanosb` in the same directory reattaches to the existing session.

To explicitly stop all sandboxes when exiting, use `/destroy` which removes all sandboxes and cleans up session state.

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
| `Tab` | Cycle focus between panels |
| `Shift+Tab` | Cycle focus in reverse |
| `Ctrl+C` | Send interrupt to the focused sandbox |
| `Ctrl+D` | Detach from the focused panel (switches to Headless mode) |
| `/` | Begin a slash command |
| Up / Down | Navigate command history (Terminal mode) |
