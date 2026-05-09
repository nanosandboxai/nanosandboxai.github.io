---
title: "Package Installation"
description: "How code agents install development tools without root access"
order: 3
---

# Package Installation

Code agents frequently need to install development tools such as compilers, language runtimes, and libraries to complete their tasks. Nanosandbox enables this without giving agents root access.

## How It Works

Agents run as a non-root user inside the sandbox VM. When an agent runs a system package command like `apt-get install`, the command is forwarded to a privileged gateway endpoint that executes it with root privileges within the VM.

```
agent (non-root)  →  apt-get install python3
                          │
                          ▼
                     gateway endpoint (root)  →  installs the package
                          │
                          ▼
                     package installed  ✓
```

The agent never has direct root access. The gateway mediates all system-level package operations through a controlled API with an allowlist of permitted commands. Only `apt-get`, `apt`, and `dpkg` are allowed. Any other command is rejected.

## User-Space Package Managers

Language-specific package managers work directly without the gateway because they install to the user's home directory by default. Tools like `pip`, `npm`, `cargo`, `go install`, `gem`, and `rustup` all function normally as a non-root user. No special handling is required for these tools.

## Streaming Output

Package installation output streams in real-time. When an agent runs a package installation command, it sees progress as it happens, just like on a regular system.

```
$ apt-get install python3
Hit:1 http://deb.debian.org/debian bookworm InRelease
Reading package lists...
Building dependency tree...
Setting up python3 (3.11.2-1) ...
```

## Security Considerations

The `sudo` binary is not installed in the sandbox. All setuid and setgid bits are stripped from every binary in the rootfs. The gateway endpoint only permits a small set of package management commands. Even the gateway's root access is contained within the disposable VM, which is destroyed after use.

This approach follows the same pattern used by major cloud development platforms where the security boundary is the VM itself, not OS-level privilege restrictions within it. The key difference is that Nanosandbox does not grant agents unrestricted root access. Instead, root operations are mediated through a single, auditable endpoint.
