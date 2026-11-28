---
title: "Architecture Overview"
description: "How nanosb builds and runs a sandbox across macOS and Linux"
order: 1
---

## Components

| Layer | Component | Role |
|---|---|---|
| Host | `nanosb` CLI/TUI | User surface; builds a deploy plan and spawns the supervisor |
| Host | supervisor (`nanosb __supervise`, or `nanosb supervise --foreground`) | Owns one sandbox: state, console, exec channel, lifecycle |
| Host | `nanosb-runtime` helper | Protocol endpoint the language SDKs talk to; starts a supervisor |
| Host | `runtime` crate + libkrun | Boots the microVM through the platform hypervisor |
| Host | gvproxy | User-space networking (TSI by default, optional bridge) |
| Guest | exec-agent | PID 1 in next mode; serves exec, filesystem, console and streams |
| Guest | agent process | The coding agent (Claude, Codex, OmO, …) |
| Guest | project + state mounts | The mounted project and per-agent state directories |

The runtime state root is `~/.nanosandbox` (`NANOSB_HOME`): sandbox state,
console logs, sockets, bundles and guest binaries live there.

## Boot and lifecycle

1. The CLI/TUI/helper writes a deploy plan and spawns the supervisor.
2. The supervisor pulls the image, extracts the rootfs, starts gvproxy, and
   hands the VM to libkrun (`krun_*` FFI).
3. The guest init mounts the project and per-agent state virtio-fs devices,
   configures the guest network, and starts the exec agent.
4. The sandbox reaches `running`; `nanosb ps`/`status` report the state and pid.

States are `starting → running → (stopped | error)`; a terminal state carries an
exit code. `restart` re-boots in place on the same sandbox identity, `pause`
freezes the guest and `resume` thaws it, and `stop`/`kill` tear the VM down.
Each supervisor persists a `state.json` in its sandbox directory.

## Networking

`gvproxy` provides user-space networking so the guest needs no host bridge:

- **TSI** (default) — user-mode TCP/IP; outbound networking works without host
  configuration. Set `network.mode: bridge` for a host bridge.
- **Scope** — `any` (default), `public`, `group`, or `none` controls egress.
- **Ports/DNS** — `network.ports` forwards host ports to the guest;
  `network.dns` overrides resolvers.

Agent OAuth callbacks that bind `localhost` are forwarded from the host browser
into the guest through gvproxy.

## Workspace sharing

Your project directory is mounted into the sandbox so the agent can read and
edit files directly. The default mount point is the guest home
(`/home/developer`); `project.mount_point`/`--project` can change it.

| Platform | Workspace mount | Permissions behavior | Extended attributes | Directory listings |
| --- | --- | --- | --- | --- |
| macOS | virtio-fs (direct) | POSIX-style | Supported | Stable |
| Linux | virtio-fs (direct) | POSIX-style | Supported | Stable |

In the default `workspace.mode: isolated`, the agent works on a host-owned
clone; changes are reviewed and applied explicitly (`/diff`, `/apply`,
`/sync`). `workspace.mode: shared` mounts the source directory read-write for
legacy workflows.

## Isolation boundary

The guest runs its own Linux kernel inside a libkrun microVM on Apple
Hypervisor.framework (macOS) or KVM (Linux). The agent cannot see other
sandboxes or the host filesystem outside the mounts it was given. See
[Security Overview](../security/overview.md) and
[Resource Management](./resource-management.md) for the host admission model.

## Related Reading

- [How We See Sandboxing Today](/articles/how-we-see-sandboxing-today)
- [Troubleshooting: Common Errors](/docs/troubleshooting/common-errors)
