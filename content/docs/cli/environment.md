---
title: "Environment Variables"
description: "Every environment variable nanosb and the SDKs read"
order: 6
---

## Installer (`install.sh`)

| Variable | Default | Description |
|---|---|---|
| `NANOSANDBOX_HOME` | `~/.nanosandbox` | Installer base directory. |
| `INSTALL_DIR` | `$NANOSANDBOX_HOME/bin` | Where the `nanosb` binary is placed. |
| `NANOSB_VERSION` | `latest` | CLI version to install (a tag without the `v`). |
| `DEPS_VERSION` | `latest` | Runtime-deps version (libkrunfw + gvproxy). |
| `NANOSB_BINARY` | *(none)* | Local `nanosb` binary to install instead of downloading. |
| `NANOSB_EXEC_AGENT` | *(none)* | Local `exec-agent` binary to install instead of downloading. |

## Runtime and CLI

| Variable | Default | Description |
|---|---|---|
| `NANOSB_HOME` | `~/.nanosandbox` | Runtime state and install root. |
| `NANOSB_LOG` | `warn` | File log level: `debug`, `info`, `trace`, `warn`, or `error`. `--verbose` enables debug on stderr. |
| `NANOSB_BINARY_PATH` | current executable | `nanosb` binary used to spawn the supervisor. |
| `NANOSB_REGISTRY_PATH` | `~/.nanosandbox/registries` | Agents/registry directory; falls back to a sibling `../registries`. |
| `NANOSB_GUEST_BIN_DIR` | `$NANOSB_HOME/guest-bin` | Directory holding the guest `exec-agent`. |
| `NANOSB_BOOT_ENV` | *(internal)* | JSON boot-env payload set by the deploy planner; do not set. |

## Admission control

| Variable | Default | Description |
|---|---|---|
| `NANOSB_ADMISSION` | `on` | Set to `off` to disable admission control. |
| `NANOSB_MAX_VMS` | `2 × CPU count` | Maximum concurrent sandboxes. |
| `NANOSB_MEMORY_BUDGET_MB` | `80%` of host RAM | Total memory budget (MiB). |
| `NANOSB_CPU_BUDGET` | `2 × CPU count` | Total vCPU budget. |
| `NANOSB_DISK_BUDGET_MB` | `2048` | Minimum free disk (MiB) required to start a sandbox. |
| `NANOSB_SANDBOX_DISK_MB` | `0` (unlimited) | Default per-sandbox disk cap (MiB). |

See [Resource Management](../architecture/resource-management.md) for the full
admission model.

## SDK runtime provisioning

| Variable | Default | Description |
|---|---|---|
| `NANOSB_RUNTIME_BIN` | *(discovered)* | Path to an existing `nanosb-runtime` helper; skips discovery/download. |
| `NANOSB_HOME` | `~/.nanosandbox` | Runtime bundle install root. |
| `NANOSB_VERSION` | SDK release version | Runtime version to download. |
| `NANOSB_RUNTIME_URL` | GitHub release base URL | Override the release base URL (internal mirror). |
| `NANOSB_RUNTIME_SHA256` | *(none)* | Expected bundle sha256; when set, a mismatch aborts the install. |
| `NANOSB_OFFLINE` | `0` | Set to `1` to never download; fail if the runtime is absent. |
| `NANOSB_PROVISIONER` | *(packaged copy)* | Path to an explicit `ensure-runtime.sh` provisioner. |
| `NANOSB_VERIFY_COSIGN` | `0` | Set to `1` to verify the cosign signature when `cosign` is installed. |

See [SDK Runtime](../sdk/runtime.md) for the provisioning flow.

## Skills registry

| Variable | Default | Description |
|---|---|---|
| `NANOSB_SKILLS_PUBLIC_CATALOG_URL` | `https://openskills.space/api/skills` | Public skills catalog. |
| `NANOSB_SKILLS_LOCAL_CATALOG_URL` | nanosandbox-ai `skills-local.json` | Local skills catalog source. |
| `NANOSB_LOCAL_SKILLS_RAW_BASE_URL` | `https://raw.githubusercontent.com/nanosandboxai/nanosandbox/main/registries` | Raw base URL for local skill files. |
| `NANOSB_SKILLS_HTTP_TIMEOUT_SECS` | `10` | Skills catalog HTTP timeout. |

## Notes

- `NANOSANDBOX_HOME` is the installer base; `NANOSB_HOME` is the runtime state
  root. Both default to `~/.nanosandbox`.
- Provider API keys (for example `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) are
  passed as sandbox environment variables, not read by nanosb itself. See
  [Agents Overview](../agents/overview.md).
