---
title: "Commands"
description: "Complete CLI command reference for nanosb"
order: 1
---

Complete reference for every `nanosb` subcommand.

## nanosb pull

Pull an image from a container registry.

```bash
nanosb pull <image>
```

Accepts a bare agent name or a fully qualified image reference. Bare agent names
resolve to `ghcr.io/nanosandboxai/nanosandbox/<agent>:latest`; any other bare
name resolves to Docker Hub (`docker.io/library/<name>:latest`).

**Examples:**

```bash
# Pull an agent image by bare name
nanosb pull claude

# Pull an oh-my-* agent image
nanosb pull oh-my-codex

# Pull a specific tag
nanosb pull ghcr.io/nanosandboxai/nanosandbox/claude:v2

# Pull from a custom registry
nanosb pull ghcr.io/myorg/my-agent:latest
```

## nanosb images

List images cached locally.

```bash
nanosb images
```

Displays image name, tag, size, and pull date for every cached image. Use the
global `--format json` flag for machine-readable output.

## nanosb run

Run a command inside a new sandbox.

```bash
nanosb run <image> [cmd...]
```

Creates a sandbox from the specified image and executes `cmd`. If `cmd` is
omitted, the image's default entrypoint is used.

| Flag | Description |
|---|---|
| `--name <name>` | Name for the sandbox (optional) |
| `--cpus <n>` | CPU cores (default: 2) |
| `--memory <mb>` | Memory in MB (default: 4096) |
| `-e KEY=VALUE` | Inject an environment variable (repeatable) |
| `--env-file <path>` | Load env vars from a file (single file; the global `--env-file` is repeatable) |
| `-p, --port <spec>` | Forward a host port to the guest: `HOST:GUEST` or `PORT` (repeatable) |
| `--timeout <secs>` | Maximum runtime in seconds (default: 600) |
| `--disk <mb>` | Per-sandbox disk quota in MB (default: 0 = unlimited) |
| `--max-pids <n>` | Guest process cap (default: 0 = 512) |
| `--run-as-root` | Run the agent command as root inside the guest (default: non-root user) |
| `--user <user>` | Run the guest command as this user (UID, UID:GID, or username) |
| `--home <path>` | Guest home directory (default: `/home/<user>`) |
| `--workdir <path>` | Guest working directory (default: the guest home) |
| `--exec` | Enable the host↔guest exec channel so `nanosb exec` can attach later |
| `-f, --follow` | Stream the sandbox console to stdout (like `tail -f`) |

**Examples:**

```bash
# Run with default entrypoint
nanosb run claude

# Run a specific command
nanosb run claude "echo hello"

# Resource limits and env vars
nanosb run --cpus 4 --memory 8192 -e ANTHROPIC_API_KEY=sk-... claude

# Name the sandbox and forward Claude's OAuth callback port
nanosb run --name my-claude -p 1455 claude

# Keep the exec channel open for later `nanosb exec`
nanosb run --exec --name dev alpine sleep infinity

# Run as root inside the guest (system package installs)
nanosb run --run-as-root claude "apt-get install -y graphviz"
```

> **`--exec` is opt-in.** `nanosb exec` can only attach to a sandbox that was
> started with `--exec`; the exec agent is injected and a host socket is created
> under `~/.nanosandbox/sandboxes/<name>/exec.sock`.

> **About `--run-as-root`.** By default the agent runs as a non-root user inside
> the guest (typically `uid 1000`) because some agents — for example Claude Code
> — refuse to start as root. `--run-as-root` overrides that. It is useful when a
> workflow needs root inside the guest to write outside the user-owned tree (for
> example system package installs or build scripts that touch `/etc`). Keep the
> default off unless a specific workflow requires it.

## nanosb exec

Execute a command in a running sandbox. The sandbox must have been started with
`nanosb run --exec`.

```bash
nanosb exec [flags] <sandbox> <cmd...>
```

| Flag | Description |
|---|---|
| `--shell` | Run through `/bin/sh -c` (interpret shell syntax) |
| `-t, --tty` | Allocate a PTY for interactive programs (implies streaming) |
| `-f, --follow` | Stream output as it is produced |

**Examples:**

```bash
nanosb exec my-sandbox "ls /home/developer"
nanosb exec my-sandbox "cat /tmp/output.log"
nanosb exec --shell my-sandbox "npm test && echo done"
nanosb exec -t my-sandbox "bash"
```

## nanosb ps

List sandboxes.

```bash
nanosb ps [-a]
```

| Flag | Description |
|---|---|
| `-a, --all` | Show all sandboxes, including stopped ones |

By default only running sandboxes are listed. Use `-a` to include stopped and
exited sandboxes.

## nanosb stop

Stop a running sandbox.

```bash
nanosb stop <sandbox>
```

## nanosb pause

Freeze a running sandbox.

```bash
nanosb pause <sandbox>
```

## nanosb resume

Thaw a paused sandbox.

```bash
nanosb resume <sandbox>
```

## nanosb restart

Restart a sandbox from its saved config (recreate).

```bash
nanosb restart <sandbox> [--allow-no-env]
```

| Flag | Description |
|---|---|
| `--allow-no-env` | Restart even when env/secrets cannot be re-resolved (boots keyless) |

## nanosb rm

Remove a sandbox. Alias: `nanosb delete`.

```bash
nanosb rm [-f] <sandbox>
```

| Flag | Description |
|---|---|
| `-f, --force` | Force removal (stop it first if running) |

## nanosb logs

View a sandbox's console logs.

```bash
nanosb logs <sandbox> [--tail <bytes>] [-f]
```

| Flag | Description |
|---|---|
| `--tail <bytes>` | Show only the last N bytes |
| `-f, --follow` | Follow the log (like `tail -f`) |

## nanosb attach

Attach to a sandbox console.

```bash
nanosb attach <sandbox>
```

## nanosb apply

Apply a `sandbox.yml` manifest declaratively (create or recreate sandboxes).

```bash
nanosb apply [-f <file|dir>] [--prune] [--force] [--dry-run] [--sandbox <name>]
```

| Flag | Description |
|---|---|
| `-f, --file <path>` | Path to `sandbox.yml` or a directory containing one (default: `sandbox.yml`) |
| `--prune` | Delete sandboxes that are no longer in the manifest |
| `--force` | Recreate sandboxes even when their config is unchanged |
| `--dry-run` | Show what would change without applying |
| `--sandbox <name>` | Apply only the named sandbox |

## nanosb describe

Show a sandbox's state, resolved config, and mounts.

```bash
nanosb describe <sandbox>
```

## nanosb doctor

Check runtime prerequisites.

```bash
nanosb doctor
```

Exits non-zero when a required check fails, so it can be wired into CI. Use
`--format json` for machine-readable output. See
[Doctor Command](../troubleshooting/doctor-command.md).

## nanosb capacity

Show host capacity, the admission budget, and current resource usage.

```bash
nanosb capacity
```

Use `--format json` for machine-readable output. See
[Resource Management](../architecture/resource-management.md).

## nanosb cleanup

Clean up stale project clones and list `nanosb` branches.

```bash
nanosb cleanup [--project <path>] [--dry-run]
```

| Flag | Description |
|---|---|
| `--project <path>` | Project directory (defaults to the current directory) |
| `--dry-run` | Show what would be cleaned without removing anything |

## nanosb sessions

List saved sessions for a project.

```bash
nanosb sessions [--project <path>]
```

| Flag | Description |
|---|---|
| `--project <path>` | Project directory (defaults to the current directory) |

Resume a session with the global `-r`/`--resume` (most recent) or
`--session <id>` flags.

## nanosb cache prune

Remove unused cache data to reclaim disk space.

```bash
nanosb cache prune [--all]
```

| Flag | Description |
|---|---|
| `--all` | Remove ALL cached data including blobs (full cache reset) |

## nanosb projects

List registered projects.

```bash
nanosb projects
```

## nanosb projects-forget

Remove a project from the registry.

```bash
nanosb projects-forget <path>
```

## nanosb gc

Reclaim disk: dead supervisor directories, unreferenced clones, and expired
sessions.

```bash
nanosb gc [--dry-run]
```

| Flag | Description |
|---|---|
| `--dry-run` | Show what would be removed without deleting anything |

## nanosb supervise

Spawn a supervisor for a `SandboxSpec` in the caller's process tree. This is the
host/shim entrypoint used by the cloud node agent and containerd shim; local
users normally run `nanosb run` or the TUI.

```bash
nanosb supervise --name <name> --spec <spec.json|-> [--foreground]
```

| Flag | Description |
|---|---|
| `--name <name>` | Sandbox name |
| `--spec <path>` | Path to a `SandboxSpec` JSON file, or `-` to read stdin |
| `--foreground` | Keep the supervisor in the caller's process tree (do not daemonize) |

In detached mode it prints the child supervisor pid and returns immediately.
With `--foreground` it owns and reaps the supervisor as a child of the caller.
