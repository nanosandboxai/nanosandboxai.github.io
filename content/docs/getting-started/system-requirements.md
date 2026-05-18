---
title: "System Requirements"
description: "Platform requirements and prerequisites"
order: 3
---

## Platform Support

| Platform                    | Hypervisor        | Status             |
| --------------------------- | ----------------- | ------------------ |
| macOS Apple Silicon (arm64) | HVF               | **Stable**         |
| Windows 11 (x86_64)         | WHPX              | **Experimental**   |
| Linux (x86_64 / arm64)     | KVM               | **In Development** |

## macOS Requirements

### Hardware

- Apple Silicon Mac (M1 or later). Intel Macs are not supported.

### Software

- macOS 11 (Big Sur) or later
- Xcode Command Line Tools (for codesigning)

### Runtime Dependencies

Install libkrun via Homebrew:

```bash
brew tap slp/krun
brew install libkrun
```

The [installer script](./installation.md) handles this dependency automatically.

### Source Build Dependencies

If building from source, you also need:

- Rust 1.70 or later (install via [rustup](https://rustup.rs))

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Linux Requirements (In Development)

Linux support targets KVM-based virtualization. The following will be required once available:

- Linux kernel 5.10+ with KVM enabled
- arm64 or x86_64 architecture
- libkrun built for your distribution

Linux binaries are not yet published. Check the [releases page](https://github.com/nanosandboxai/cli/releases) for updates.

## Windows Requirements

### Hardware

- 64-bit CPU with virtualization support enabled in BIOS/UEFI

### Software

- Windows 11 (22H2 or later)
- Hyper-V and Windows Hypervisor Platform (WHPX)

The installer can enable missing Windows features automatically and will prompt for a reboot if needed.

### Runtime Dependencies

- `libkrunfw.dll` present in `%USERPROFILE%\\.nanosandbox\\libs\\`
- `vsock_proxy` available in the same runtime folder

These dependencies are installed automatically by the [PowerShell installer](./installation.md).

## Environment Variables

The following environment variables can be used to configure installation and runtime behavior:

| Variable           | Description                                          | Default           |
| ------------------ | ---------------------------------------------------- | ----------------- |
| `NANOSB_VERSION`   | Pin a specific CLI version for the installer script  | `latest`          |
| `INSTALL_DIR`      | Override the binary installation directory            | `~/.nanosb/bin`   |

### Examples

Install a specific version:

```bash
NANOSB_VERSION=0.3.1 curl -fsSL https://github.com/nanosandboxai/cli/releases/latest/download/install.sh | bash
```

Install to a custom directory:

```bash
INSTALL_DIR=/usr/local/bin curl -fsSL https://github.com/nanosandboxai/cli/releases/latest/download/install.sh | bash
```
