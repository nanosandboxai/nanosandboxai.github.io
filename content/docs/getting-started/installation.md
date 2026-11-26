---
title: "Installation"
description: "Install the nanosb CLI on your system"
order: 1
---

## Install on macOS or Linux

The fastest way to install the `nanosb` CLI on macOS or Linux is with the official shell installer:

```bash
curl -fsSL https://github.com/nanosandboxai/nanosandbox/releases/latest/download/install.sh | bash
```

The script detects your platform, downloads the correct binary, and places it on your `PATH`.

### What Gets Installed

The installer sets up three components:

| Component    | Description                                               |
| ------------ | --------------------------------------------------------- |
| **nanosb**   | CLI binary for creating and running microVM sandboxes     |
| **libkrun**  | Lightweight VMM library used by the runtime               |
| **gvproxy**  | User-space networking proxy for bridge networking (Linux) |

By default, binaries are installed to `~/.nanosandbox/bin`. You can override this with the `INSTALL_DIR` environment variable:

```bash
INSTALL_DIR=/usr/local/bin curl -fsSL https://github.com/nanosandboxai/nanosandbox/releases/latest/download/install.sh | bash
```

### Verify the Installation

After installing, confirm the CLI is working:

```bash
nanosb --version
```

## Platform Support

Nanosandbox supports macOS Apple Silicon and Linux hosts. See [System Requirements](./system-requirements.md) for full platform details.
