---
title: "Global Flags"
description: "Flags available across all nanosb commands"
order: 3
---

# Global Flags

These flags can be used with any `nanosb` subcommand.

## Reference

| Flag | Type | Default | Description |
|---|---|---|---|
| `--format` | `text` \| `json` | `text` | Output format. Use `json` for machine-readable output. |
| `--verbose` | boolean | `false` | Enable debug logging. Prints internal state, API calls, and timing information to stderr. |
| `--config <path>` | string (repeatable) | `./sandbox.yml` | Path to a `sandbox.yml` configuration file. Can be specified multiple times; files are merged in order. |
| `--sandbox <name>` | string | *(all)* | Start only the named sandbox from the configuration file. |
| `--project <path>` | string | *(cwd)* | Project directory to mount into the sandbox at `/workspace`. |
| `--cpus <n>` | integer | *(from config)* | Override the number of CPU cores allocated to the sandbox. |
| `--memory <mb>` | integer | *(from config)* | Override memory allocation in MB. |
| `--timeout <secs>` | integer | *(from config)* | Override the maximum runtime in seconds. |
| `--permissions <level>` | string | `default` | Agent permission level: `default`, `accept-edits`, or `allow-all`. |
| `-e KEY=VALUE` | string (repeatable) | *(none)* | Inject an environment variable into the sandbox. Can be specified multiple times. |
| `--env-file <path>` | string (repeatable) | *(none)* | Load environment variables from a file. Can be specified multiple times. |

## Repeatable Flags

Flags marked as **repeatable** can appear more than once on the command line. Each occurrence accumulates rather than overwriting the previous value.

> **Note:** The global `--env-file` and `-e` flags are repeatable and apply to all sandboxes. The `nanosb run` subcommand also accepts its own `--env-file` flag, but that one is **not** repeatable — use the global flag position (before the subcommand) when you need multiple env files.

```bash
# Global flags (before the subcommand) are repeatable
nanosb \
  --config base.yml \
  --config override.yml \
  -e API_KEY=sk-abc \
  -e DEBUG=true \
  --env-file .env \
  --env-file .env.local \
  run claude
```

## Precedence

When the same setting is specified in multiple places, the following precedence order applies (highest to lowest):

1. CLI flags (`--cpus`, `--memory`, `--timeout`, `-e`)
2. Later `--config` files
3. Earlier `--config` files
4. Auto-detected `./sandbox.yml`
5. Built-in defaults

## Output Formats

### Text (default)

Human-readable tabular output suited for terminal use.

```bash
nanosb ps
```

```
NAME     IMAGE    STATUS   CPUS  MEMORY  UPTIME
claude   claude   running  2     4096    5m32s
codex    codex    running  4     4096    3m17s
```

### JSON

Machine-readable output for scripting and automation.

```bash
nanosb ps --format json
```

```json
[
  {
    "name": "claude",
    "image": "claude",
    "status": "running",
    "cpus": 2,
    "memory": 4096,
    "uptime": "5m32s"
  }
]
```

## Debug Logging

The `--verbose` flag enables detailed debug output on stderr. This is useful for diagnosing connectivity issues, configuration loading problems, or unexpected behavior.

```bash
nanosb --verbose run claude
```

Debug output is written to stderr so it does not interfere with `--format json` output on stdout.
