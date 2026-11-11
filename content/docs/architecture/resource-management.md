---
title: "Resource Management"
description: "How nanosb allocates, enforces, and accounts for CPU, memory, disk, and process limits"
order: 2
---

# Resource Management

Nanosandbox separates two ideas that are easy to conflate:

1. **Per-sandbox requests** — what a single sandbox asks for (CPUs, memory,
   timeout, disk quota, process cap).
2. **Host admission budget** — the aggregate ceiling a request is checked
   against before a sandbox is allowed to start.

Requests describe one sandbox. The budget protects the host. Both apply to every
front door: the TUI, `nanosb run`, `nanosb apply`, and the headless supervisor.

## Per-sandbox requests

| Setting | Unit | Default | Meaning |
|---|---|---|---|
| `cpus` | cores | 2 | vCPUs allocated to the microVM |
| `memory` | MB | 4096 | Guest memory allocated to the microVM |
| `timeout` | seconds | 600 | Maximum sandbox lifetime before it is stopped |
| `disk` | MB | 0 (unlimited) | Disk quota for the sandbox state dir + rootfs |
| `max_pids` | processes | 0 (runtime default 512) | Guest process cap (fork-bomb guard) |

Set them in three places, in precedence order (highest first):

1. **CLI flags** — `nanosb --cpus 4 --memory 8192 --timeout 1200 --disk 20480 --max-pids 1024 ...`
2. **Per-sandbox entry** in `sandbox.yml`
3. **`defaults` block** in `sandbox.yml`
4. **Built-in runtime defaults**

```yaml
defaults:
  cpus: 2
  memory: 4096
  timeout: 600
  disk: 20480       # 20 GB per sandbox
  max_pids: 512

sandboxes:
  claude:
    image: claude
    # inherits defaults

  heavy-batch:
    image: codex
    cpus: 8
    memory: 16384
    disk: 102400    # 100 GB
    max_pids: 4096
```

The equivalent for a one-off sandbox:

```bash
nanosb run --cpus 4 --memory 8192 --disk 20480 --max-pids 1024 codex
```

### How each request is enforced

- **CPUs / memory** — written into the guest OCI config as CPU quota and memory
  cgroup limits. Memory is also clamped by the hypervisor at boot.
- **timeout** — enforced by the per-sandbox supervisor process.
- **`max_pids`** — written as the guest `pids.limit` (cgroup). `0` keeps the
  built-in default of 512.
- **`disk`** — the supervisor samples the sandbox state directory **and** its
  rootfs bundle every 30 seconds and stops the VM when the total exceeds the
  quota. A `disk: 0` sandbox is only bounded by the host free-disk floor (below).

## Host admission budget

Before a supervisor is spawned, nanosb checks the request against the host
budget. Budgets are auto-derived from the host and can be overridden with
environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `NANOSB_MAX_VMS` | `2 × CPU count` | Maximum concurrent sandboxes |
| `NANOSB_MEMORY_BUDGET_MB` | 80% of host RAM | Total memory budget (MiB) |
| `NANOSB_CPU_BUDGET` | `2 × CPU count` | Total vCPU budget |
| `NANOSB_DISK_BUDGET_MB` | 2048 | Minimum free disk (MiB) required to start a sandbox |
| `NANOSB_SANDBOX_DISK_MB` | unset | Default per-sandbox disk cap (used when `disk` is unset) |
| `NANOSB_ADMISSION` | `on` | Set to `off` to disable admission control |

Admission is enforced in two places:

1. **Pre-flight, at spawn** — the CLI/TUI refuses to start the supervisor when
   the request would exceed the budget, so the error is immediate and clear.
2. **Authoritatively, in the supervisor** — the supervisor re-checks before
   booting the VM, covering direct `nanosb supervise` / shim invocations.

To make concurrent spawns safe, admission takes a short-lived reservation
(`~/.nanosandbox/admission.lock` plus a `.reserving` marker in the sandbox dir,
TTL 120s) so two simultaneous `/add` or `apply` operations cannot both pass the
same budget check. Reservations are released when the spawn fails or once the
supervisor reports running.

### Failure modes

When a request exceeds the budget, the sandbox is **not started** and the
command fails with a specific message, for example:

```
Error: sandbox VM cap reached (16/16 running); free a sandbox or raise NANOSB_MAX_VMS
Error: host memory budget exceeded (need 4096 MiB, 100 MiB available); free memory or raise NANOSB_MEMORY_BUDGET_MB
Error: host disk too full (13336 MiB free, need at least 2048 MiB); free disk space
```

Free capacity by stopping sandboxes (`nanosb stop`, `/kill` in the TUI) or raise
the relevant budget.

## TUI vs. headless behavior

The same budget applies to both modes; the difference is how it is surfaced.

| | TUI | Headless (`run` / `apply` / supervisor) |
|---|---|---|
| Visibility | Live per-sandbox metrics in the sandbox sidebar | `nanosb capacity` |
| Refusal | Panel shows the admission error | Command exits non-zero with the error |
| Budget | Shared, env-configured | Shared, env-configured |

The TUI sandbox sidebar (open by default, toggle with `/sb`) shows a host header
(`host Ncpu · XG ram · YG free`), a `req …` line flagged `tight` or `OVER RAM`
when the sum of panel requests exceeds available or total host memory, and a live
per-sandbox line (`cpu % · mem used/limit · disk used`). See
[TUI Mode](../cli/tui-mode.md).

Inspect the resolved budget and current usage at any time:

```bash
nanosb capacity
nanosb capacity --format json
```

## Inspecting and tuning

```bash
# What does the host offer, and what is the effective budget?
nanosb capacity

# Allow more sandboxes on a big workstation
NANOSB_MAX_VMS=32 NANOSB_MEMORY_BUDGET_MB=49152 nanosb apply

# Pin a smaller budget for CI
NANOSB_MEMORY_BUDGET_MB=8192 NANOSB_MAX_VMS=4 nanosb apply

# Disable admission entirely (use with care)
NANOSB_ADMISSION=off nanosb run codex
```

## Reserved / not-yet-enforced settings

The runtime config schema also carries `max_inodes` and `io_bps`. These are
**reserved and currently not enforced** on any platform, so they are not exposed
in `sandbox.yml` or the CLI. Do not rely on them for isolation.
