---
title: "Package Installation"
description: "How code agents install development tools"
order: 3
---

Code agents frequently need to install development tools such as compilers, language runtimes, and libraries to complete their tasks. Nanosandbox supports this without giving agents unrestricted root access.

## User-space package managers

Agents run as a non-root user inside the sandbox VM, so language package managers that install into the user's home work normally:

- `pip`, `uv`, `uvx`
- `npm`, `pnpm`, `yarn`
- `cargo install`
- `go install`
- `gem install`
- `rustup`

No special handling is required for these tools.

## System packages

Current next-mode agent images do **not** ship an in-VM privileged package
gateway. `sudo` is not installed, and setuid/setgid bits are stripped from the
rootfs, so an unprivileged agent cannot run `apt-get`/`dpkg` directly.

If a workflow truly needs system packages:

1. **Run the sandbox with root enabled** — set `run_as_root: true` in
   `sandbox.yml` or pass `--run-as-root` to `nanosb run`. The agent process then
   runs as root inside the disposable microVM and can use `apt-get`.
2. **Build a custom image** with the packages preinstalled and use it as the
   sandbox image (preferred for repeatable workflows).

Root is contained by the hardware VM boundary; it is not host root.

## Streaming output

Package installation output streams in real-time, so the agent sees progress as
it happens.

## Security considerations

- The VM boundary — not in-guest privilege separation — is the primary security
  control.
- Prefer user-space package managers; they keep the agent unprivileged.
- Only enable root (`run_as_root` / `--run-as-root`) with trusted images and
  workflows, because the whole agent process runs as root in that VM.
- The sandbox and its installed packages are destroyed with the VM.
