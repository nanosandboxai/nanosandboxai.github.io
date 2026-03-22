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

### Codesigning on macOS

On macOS, the `nanosb` binary and bundled libraries must be properly codesigned to use the Hypervisor.framework entitlement. The installer handles this automatically. If you build from source, you will need to sign the binary yourself with the `com.apple.security.hypervisor` entitlement:

```bash
codesign --entitlements entitlements.plist --force -s - target/release/nanosb
```

## Build from Source

To build `nanosb` from source, you need Rust 1.70 or later and the libkrun dependency.

### Prerequisites

Install libkrun via Homebrew:

```bash
brew tap slp/krun
brew install libkrun
```

### Clone and Build

```bash
git clone https://github.com/nanosandboxai/cli.git
cd cli
cargo build --release
```

The compiled binary is located at `target/release/nanosb`.

### Verify the Installation

After installing via either method, confirm the CLI is working:

```bash
nanosb --version
```

## Platform Support

The CLI currently supports **macOS on Apple Silicon (arm64)**. Linux support via KVM is in development. See [System Requirements](./system-requirements.md) for full platform details.
