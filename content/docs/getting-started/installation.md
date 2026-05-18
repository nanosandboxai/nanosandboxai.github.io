---
title: "Installation"
description: "Install the nanosb CLI on your system"
order: 1
---

## Install on macOS or Linux

The fastest way to install the `nanosb` CLI on macOS or Linux is with the official shell installer:

```bash
curl -fsSL https://github.com/nanosandboxai/cli/releases/latest/download/install.sh | bash
```

The script detects your platform, downloads the correct binary, and places it on your `PATH`.

### What Gets Installed

The installer sets up three components:

| Component    | Description                                               |
| ------------ | --------------------------------------------------------- |
| **nanosb**   | CLI binary for creating and running microVM sandboxes     |
| **libkrun**  | Lightweight VMM library used by the runtime               |
| **gvproxy**  | User-space networking proxy for bridge networking (Linux) |

By default, binaries are installed to `~/.nanosb/bin`. You can override this with the `INSTALL_DIR` environment variable:

```bash
INSTALL_DIR=/usr/local/bin curl -fsSL https://github.com/nanosandboxai/cli/releases/latest/download/install.sh | bash
```

### Verify the Installation

After installing, confirm the CLI is working:

```bash
nanosb --version
```

## Install on Windows

Use the PowerShell installer:

```powershell
irm https://raw.githubusercontent.com/nanosandboxai/cli/v0.2.0/scripts/install.ps1 | iex
```

On a fresh machine, the installer can enable Hyper-V and WHPX automatically. If Windows needs a reboot, the installer prompts you and then resumes after login.

After installation, verify runtime dependencies:

```terminal
> nanosb doctor
  [ok] WHPX: Windows Hypervisor Platform available
  [ok] libkrunfw.dll: found at C:\Users\you\.nanosandbox\libs\libkrunfw.dll
  [ok] vsock_proxy: found
```

## Platform Support

Nanosandbox supports macOS, Windows 11, and Linux hosts (Linux remains in active development). See [System Requirements](./system-requirements.md) for full platform details.
