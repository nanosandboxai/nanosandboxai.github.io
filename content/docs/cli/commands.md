---
title: "Commands"
description: "Complete CLI command reference for nanosb"
order: 1
---

# Commands

Complete reference for every `nanosb` subcommand.

## nanosb pull

Pull an image from a container registry.

```bash
nanosb pull <image>
```

Requires a fully qualified image reference.

> **Note:** Bare image names (e.g. `claude`) auto-resolve only inside `sandbox.yml` configuration files. The `pull` command requires the full registry path.

**Examples:**

```bash
# Pull an agent image
nanosb pull ghcr.io/nanosandboxai/agents-registry/claude:latest

# Pull a specific tag
nanosb pull ghcr.io/nanosandboxai/agents-registry/claude:v2

# Pull from a custom registry
nanosb pull ghcr.io/myorg/my-agent:latest
```

## nanosb images

List images cached locally.

```bash
nanosb images
```

Displays image name, tag, size, and pull date for every cached image.

**Examples:**

```bash
nanosb images
nanosb images --format json
```

## nanosb run

Run a command inside a new sandbox.

```bash
nanosb run <image> [cmd]
```

Creates a sandbox from the specified image and executes `cmd`. If `cmd` is omitted, the image's default entrypoint is used.

| Flag | Description |
|---|---|
| `--name <name>` | Name for the sandbox (optional) |
| `--cpus <n>` | CPU cores (default: 2) |
| `--memory <mb>` | Memory in MB (default: 4096) |
| `--timeout <secs>` | Maximum runtime in seconds (default: 600) |
| `-e KEY=VALUE` | Inject environment variable (repeatable) |
| `--env-file <path>` | Load env vars from file (single file; use the global `--env-file` flag for multiple files) |
| `--buffered` | Buffer output instead of streaming (useful with `--format json`) |

**Examples:**

```bash
# Run with default entrypoint
nanosb run claude

# Run a specific command
nanosb run claude "echo hello"

# Run with resource limits and env vars
nanosb run --cpus 4 --memory 8192 -e ANTHROPIC_API_KEY=sk-... claude

# Name the sandbox
nanosb run --name my-claude claude
```

## nanosb exec

Execute a command in a running sandbox.

```bash
nanosb exec <sandbox> <cmd>
```

The `<sandbox>` argument is the sandbox name or ID returned by `nanosb ps`.

| Flag | Description |
|---|---|
| `--buffered` | Buffer output instead of streaming |

**Examples:**

```bash
nanosb exec my-sandbox "ls /workspace"
nanosb exec my-sandbox "cat /tmp/output.log"
nanosb exec --buffered my-sandbox "npm test"
```

## nanosb ps

List sandboxes.

```bash
nanosb ps [-a]
```

| Flag | Description |
|---|---|
| `-a` | Show all sandboxes, including stopped ones |

By default only running sandboxes are listed. Use `-a` to include stopped and exited sandboxes.

**Examples:**

```bash
# List running sandboxes
nanosb ps

# List all sandboxes
nanosb ps -a

# JSON output
nanosb ps -a --format json
```

## nanosb stop

Stop a running sandbox.

```bash
nanosb stop <sandbox>
```

Sends a graceful shutdown signal. The sandbox process is given time to exit before being forcefully terminated.

**Examples:**

```bash
nanosb stop my-sandbox
```

## nanosb rm

Remove a sandbox.

```bash
nanosb rm [-f] <sandbox>
```

| Flag | Description |
|---|---|
| `-f` | Force removal, even if the sandbox is still running |

A sandbox must be stopped before removal unless `-f` is provided.

**Examples:**

```bash
# Remove a stopped sandbox
nanosb rm my-sandbox

# Force-remove a running sandbox
nanosb rm -f my-sandbox
```

## nanosb doctor

Check that all runtime prerequisites are satisfied.

```bash
nanosb doctor
```

Verifies the host environment: kernel support, runtime availability, network connectivity to the default registry, and any other dependencies required by `nanosb`.

**Examples:**

```bash
nanosb doctor
nanosb doctor --format json
```

## nanosb cleanup

Clean up stale project clones.

```bash
nanosb cleanup [--project PATH]
```

| Flag | Description |
|---|---|
| `--project <path>` | Limit cleanup to a specific project directory |

Removes temporary project clones that are no longer associated with a running sandbox.

**Examples:**

```bash
# Clean all stale clones
nanosb cleanup

# Clean clones for a specific project
nanosb cleanup --project ./my-repo
```

## nanosb sessions

List saved TUI sessions for a project.

```bash
nanosb sessions [--project PATH]
```

| Flag | Description |
|---|---|
| `--project <path>` | List sessions for a specific project directory (defaults to current directory) |

Shows session id, last updated time, panel count, and summary.

**Examples:**

```bash
# List sessions for current project
nanosb sessions

# List sessions for another project
nanosb sessions --project ~/work/my-repo

# Resume latest from listed sessions
nanosb -r

# Resume a specific session id
nanosb --session 20260509121030-ab12cd34
```

## nanosb cache prune

Reclaim disk space by removing unused cached data.

```bash
nanosb cache prune [--all]
```

| Flag | Description |
|---|---|
| `--all` | Remove all cached data, not just unreferenced layers |

Without `--all`, only dangling and unreferenced layers are pruned.

**Examples:**

```bash
# Prune unreferenced cache entries
nanosb cache prune

# Prune everything
nanosb cache prune --all
```
