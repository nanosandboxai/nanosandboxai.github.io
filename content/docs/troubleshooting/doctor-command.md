---
title: "Doctor Command"
description: "Diagnosing runtime prerequisites"
order: 2
---

## Overview

The `nanosb doctor` command checks that all runtime prerequisites are installed and properly configured. Run it whenever sandbox creation fails or as a first step when setting up Nanosandbox on a new machine.

```bash
nanosb doctor
```

The command prints a colored checklist. Each line uses one of three markers:

| Marker | Meaning |
| --- | --- |
| `[✓]` | Check passed |
| `[!]` | Warning — not fatal, but worth knowing |
| `[✗]` | Check failed — fix before running a sandbox |

If anything fails, `nanosb doctor` exits with a non-zero status so it can be wired into CI.

## What It Checks

The exact checks depend on the host OS.

### macOS

| Check | What it verifies |
| --- | --- |
| `Architecture` | Apple Silicon (aarch64) |
| `libkrunfw Kernel Firmware` | `libkrunfw.5.dylib` is reachable from `~/.nanosandbox/libs`, Homebrew prefix, or `/usr/local/lib` |
| `Hypervisor.framework` | macOS HVF is available |
| `gvproxy` | Optional bridge-networking helper |

Sample failure with fix hint:

```text
  [✗] libkrunfw Kernel Firmware: libkrunfw.5.dylib not found in ~/.nanosandbox/libs/, /opt/homebrew/lib, or /usr/local/lib
      Fix: brew install libkrunfw
```

### Linux

| Check | What it verifies |
| --- | --- |
| `libkrunfw Kernel Firmware` | `libkrunfw.so.5` is reachable via the dynamic linker |
| `KVM Device` | `/dev/kvm` is accessible by the current user |
| `gvproxy` | Optional bridge-networking helper |

Sample failure with fix hint:

```text
  [✗] KVM Device: /dev/kvm not accessible
      Fix: sudo usermod -aG kvm $USER && log out and back in
```

## Full Output Example

### macOS (all passing)

```bash
$ nanosb doctor

Checking runtime prerequisites...

  [✓] Architecture: Apple Silicon (aarch64)
  [✓] libkrunfw Kernel Firmware: found (libkrunfw.5.dylib)
  [✓] Hypervisor.framework: available
  [✓] gvproxy: available (full outbound networking)

4 checks passed, 0 errors, 0 warnings

Ready to run sandboxes.
  Logs: /Users/you/.nanosandbox/logs
```

### Linux (one failure)

```bash
$ nanosb doctor

Checking runtime prerequisites...

  [✓] libkrunfw Kernel Firmware: found (libkrunfw.so.5)
  [✗] KVM Device: /dev/kvm not accessible
      Fix: sudo usermod -aG kvm $USER && log out and back in
  [✓] gvproxy: available (full outbound networking)

2 checks passed, 1 errors, 0 warnings

Cannot run sandboxes. Fix the errors above.
```

## Fixing Common Issues

### Missing libkrun

**macOS:**
```bash
brew tap slp/krun
brew install libkrun
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install libkrun-dev
```

**Fedora:**
```bash
sudo dnf install libkrun-devel
```

**From source:**
```bash
git clone https://github.com/containers/libkrun.git
cd libkrun
make && sudo make install
```

### Missing gvproxy

**macOS:**
```bash
brew install gvproxy
```

**Ubuntu/Debian:**
```bash
sudo apt install gvproxy
```

**From source:**
```bash
git clone https://github.com/containers/gvisor-tap-vsock.git
cd gvisor-tap-vsock
make gvproxy
sudo cp bin/gvproxy /usr/local/bin/
```

### KVM Access on Linux

```bash
# Check if KVM module is loaded
lsmod | grep kvm

# Load KVM module (Intel)
sudo modprobe kvm_intel

# Load KVM module (AMD)
sudo modprobe kvm_amd

# Make it persistent
echo "kvm_intel" | sudo tee /etc/modules-load.d/kvm.conf

# Grant access to your user
sudo usermod -aG kvm $USER

# Verify (after logging out and back in)
ls -la /dev/kvm
# crw-rw---- 1 root kvm 10, 232 ... /dev/kvm
```

### JSON Output

For scripting and CI, use `--format json` to get machine-readable output:

```bash
nanosb doctor --format json
```

```json
{
  "ok": true,
  "platform": "macos",
  "arch": "arm64",
  "errors": [],
  "warnings": []
}
```

When checks fail, each entry in `errors` includes a `check` name, a `message`, and an optional `fix_hint`:

```json
{
  "ok": false,
  "platform": "macos",
  "arch": "arm64",
  "errors": [
    {
      "check": "libkrunfw Kernel Firmware",
      "message": "libkrunfw.5.dylib not found",
      "fix_hint": "brew install libkrunfw"
    }
  ],
  "warnings": []
}
```
