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

Use the PowerShell installer. Run PowerShell as Administrator on a fresh machine so the installer can enable Windows features in one step:

```powershell
irm https://github.com/nanosandboxai/cli/releases/latest/download/install.ps1 | iex
```

The installer:

1. Enables Hyper-V, Windows Hypervisor Platform, Windows Subsystem for Linux, and Virtual Machine Platform if any are missing.
2. Installs the Microsoft Visual C++ Redistributable inline (no reboot).
3. If any Windows feature required a restart, prompts you once. After login the installer resumes automatically via a one-shot RunOnce entry.
4. Downloads `nanosb.exe` to `%USERPROFILE%\.nanosandbox\`.
5. Installs the four runtime files into `%USERPROFILE%\.nanosandbox\libs\`:
   - `libkrunfw.dll` — guest kernel firmware
   - `busybox` — Linux ELF used as guest init shell
   - `vsock_proxy` — Linux ELF that bridges HvSocket and AF_VSOCK
   - `fuse_mount` — Linux ELF that mounts the rootfs and workspace over FUSE
6. Adds the install directory to your user `PATH`.

After installation, verify everything is in place:

```powershell
> nanosb doctor

Checking runtime prerequisites...

  [✓] HCS Service: running (vmcompute)
  [✓] WSL Kernel: found
  [✓] libkrunfw.dll: found
  [✓] busybox: found
  [✓] vsock_proxy: found
  [✓] fuse_mount: found
  [✓] Disk: SSD detected
  [✓] Memory: sufficient RAM available

8 checks passed, 0 errors, 0 warnings

Ready to run sandboxes.
```

If `nanosb doctor` reports a missing dependency, re-run the installer or follow the fix hint it prints.

## Platform Support

Nanosandbox supports macOS, Windows 11, and Linux hosts (Linux remains in active development). See [System Requirements](./system-requirements.md) for full platform details.
