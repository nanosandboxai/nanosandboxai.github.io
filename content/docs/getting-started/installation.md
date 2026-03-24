---
title: "Installation"
description: "Install the nanosb CLI on your system"
order: 1
---

## Install via Shell Script

The fastest way to install the `nanosb` CLI is with the official installer script:

```bash
curl -fsSL https://github.com/nanosandboxai/cli/releases/latest/download/install.sh | bash
```

The script automatically detects your platform, downloads the correct binary, and places it on your `PATH`.

### What Gets Installed

The installer sets up three components:

| Component    | Description                                              |
| ------------ | -------------------------------------------------------- |
| **nanosb**   | The CLI binary for managing and running microVM sandboxes |
| **libkrun**  | Lightweight VMM library that powers the microVM runtime  |
| **gvproxy**  | User-space networking proxy for sandbox network access    |

By default, binaries are installed to `~/.nanosb/bin`. You can override this with the `INSTALL_DIR` environment variable:

```bash
INSTALL_DIR=/usr/local/bin curl -fsSL https://github.com/nanosandboxai/cli/releases/latest/download/install.sh | bash
```

### Verify the Installation

After installing, confirm the CLI is working:

```bash
nanosb --version
```

## Platform Support

The CLI currently supports **macOS on Apple Silicon (arm64)**. Linux support via KVM is in development. See [System Requirements](./system-requirements.md) for full platform details.
