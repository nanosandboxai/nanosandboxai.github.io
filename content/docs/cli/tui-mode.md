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
| `/add <agent> [options]` | Add a new agent panel (`claude`, `goose`, `codex`, `cursor`) |
| `/focus <index>` | Switch focus to a specific panel index |
| `/close [target]` | Close (hide) a panel — sandbox keeps running in the background |
| `/open [target]` | Show a previously hidden panel |
| `/kill [panel]` | Kill (destroy) a sandbox and remove its panel |
| `/zoom` | Toggle zoom (maximize/minimize) for the focused panel |
| `/reconnect` | Reconnect SSH terminal for the focused panel |
| `/copy` | Copy focused panel content to system clipboard |

The `/add` command supports these options:

```
/add claude                          # Add with default settings
/add claude --project ~/myapp        # Mount a project directory
/add claude --model claude-sonnet-4-5-20250929  # Specify model
/add claude --name my-sandbox        # Custom sandbox name
/add claude --auto-mode -p "Fix tests"  # Headless autonomous mode
```

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
