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

```
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

```
  [✗] KVM Device: /dev/kvm not accessible
      Fix: sudo usermod -aG kvm $USER && log out and back in
```

### Windows

| Check | What it verifies |
| --- | --- |
| `HCS Service` | `vmcompute` service is running (depends on Hyper-V) |
| `Hyper-V Access` | The current user is in the `Hyper-V Administrators` group or running elevated |
| `WSL Kernel` | `C:\Program Files\WSL\tools\kernel` is present |
| `libkrunfw.dll` | Guest kernel firmware in `%USERPROFILE%\.nanosandbox\libs\` |
| `busybox` | Static Linux ELF used as the guest init shell |
| `vsock_proxy` | Static Linux ELF that bridges HvSocket and AF_VSOCK |
| `fuse_mount` | Static Linux ELF that mounts the rootfs and workspace over FUSE |
| `Disk` | SSD detected (warning only on HDD/unknown) |
| `Memory` | At least a few GB of free RAM |

> **About `Hyper-V Access`.** The Host Compute Service (HCS) APIs that boot the microVM require the caller to be a member of the local `Hyper-V Administrators` group or to be running elevated as `Administrator`. Without either, sandbox creation fails with confusing access-denied errors from `vmcompute`. The fastest fix is to add the user to the group once:
>
> ```powershell
> # Run in an elevated PowerShell:
> Add-LocalGroupMember -Group 'Hyper-V Administrators' -Member $env:USERNAME
> # Then log out and back in for the group to take effect.
> ```

Sample failure with fix hint:

```
  [✗] fuse_mount: fuse_mount not found. Required for Windows VM boot path.
      Fix: Install runtime deps:
             irm https://github.com/nanosandboxai/install-deps/releases/latest/download/install.ps1 | iex
```

> The four Linux ELFs (`busybox`, `vsock_proxy`, `fuse_mount`, and the kernel firmware `libkrunfw.dll`) are installed automatically by the Windows installer. They live in `%USERPROFILE%\.nanosandbox\libs\` and have no `.exe` extension — they run inside the Linux guest.

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

### Windows (all passing)

```powershell
> nanosb doctor

Checking runtime prerequisites...

  [✓] HCS Service: running (vmcompute)
  [✓] Hyper-V Access: user has Hyper-V access (admin or Hyper-V Administrators)
  [✓] WSL Kernel: found
  [✓] libkrunfw.dll: found
  [✓] busybox: found
  [✓] vsock_proxy: found
  [✓] fuse_mount: found
  [✓] Disk: SSD detected
  [✓] Memory: sufficient RAM available

9 checks passed, 0 errors, 0 warnings

Ready to run sandboxes.
  Logs: C:\Users\you\.nanosandbox\logs
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
  "platform": "windows",
  "arch": "x86_64",
  "errors": [],
  "warnings": []
}
```

When checks fail, each entry in `errors` includes a `check` name, a `message`, and an optional `fix_hint`:

```json
{
  "ok": false,
  "platform": "windows",
  "arch": "x86_64",
  "errors": [
    {
      "check": "fuse_mount",
      "message": "fuse_mount not found. Required for Windows VM boot path.",
      "fix_hint": "Install runtime deps:\n irm https://github.com/nanosandboxai/install-deps/releases/latest/download/install.ps1 | iex"
    }
  ],
  "warnings": []
}
```
