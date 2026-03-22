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

## What It Checks

### Platform Detection

Identifies the host OS, architecture, and available hypervisor.

```
[ok] Platform: macOS (Apple Silicon)
[ok] Architecture: arm64
```

On Linux, it checks the kernel version (requires 5.10+):

```
[ok] Platform: Linux
[ok] Architecture: x86_64
[ok] Kernel: 6.5.0-generic (>= 5.10 required)
```

### Hypervisor Availability

Verifies the platform hypervisor is accessible.

**macOS (HVF):**
```
[ok] Hypervisor: HVF available
```

If HVF is not available, the output indicates possible causes:
```
[FAIL] Hypervisor: HVF not available
  -> Ensure you are running macOS 12.0 or later
  -> Check that SIP (System Integrity Protection) is enabled
```

**Linux (KVM):**
```
[ok] Hypervisor: KVM available (/dev/kvm accessible)
```

```
[FAIL] Hypervisor: /dev/kvm not accessible
  -> Run: sudo usermod -aG kvm $USER
  -> Then log out and back in
```

```
[FAIL] Hypervisor: KVM module not loaded
  -> Run: sudo modprobe kvm_intel   (Intel CPUs)
  -> Run: sudo modprobe kvm_amd     (AMD CPUs)
```

### libkrun

Checks that libkrun is installed and the version is compatible.

```
[ok] libkrun: v1.9.2 (>= 1.7.0 required)
```

```
[FAIL] libkrun: not found
  -> macOS:  brew install libkrun
  -> Linux:  sudo apt install libkrun-dev
  -> Or build from source: https://github.com/containers/libkrun
```

```
[WARN] libkrun: v1.5.0 (>= 1.7.0 required, some features may not work)
  -> Upgrade: brew upgrade libkrun
```

### libkrunfw

Checks the firmware library that bundles the guest kernel and initrd.

```
[ok] libkrunfw: v4.2.0
```

```
[FAIL] libkrunfw: not found
  -> macOS:  brew install libkrunfw
  -> Linux:  sudo apt install libkrunfw
```

### Codesigning (macOS only)

Verifies the nanosb binary has the hypervisor entitlement.

```
[ok] Codesigning: valid entitlements (com.apple.security.hypervisor)
```

```
[FAIL] Codesigning: missing com.apple.security.hypervisor entitlement
  -> Run: codesign --entitlements entitlements.plist --force -s - $(which nanosb)
  -> See: /docs/getting-started/system-requirements
```

### gvproxy (optional)

Checks for gvproxy, needed for bridge networking mode. This is a warning, not a failure, since TSI mode works without it.

```
[ok] gvproxy: found at /opt/homebrew/bin/gvproxy (v0.7.3)
```

```
[WARN] gvproxy: not found
  -> Bridge networking will not work
  -> TSI mode (default) does not require gvproxy
  -> Install: brew install gvproxy  (macOS)
  -> Install: sudo apt install gvproxy  (Linux)
```

### Image Cache

Checks the cache directory is accessible and reports usage.

```
[ok] Cache: /Users/you/.nanosandbox/cache (1.2 GB, 47 blobs)
```

```
[WARN] Cache: directory not found, will be created on first pull
```

## Full Output Example

### macOS (all passing)

```bash
$ nanosb doctor

Nanosandbox Doctor
==================

[ok] Platform: macOS (Apple Silicon)
[ok] Architecture: arm64
[ok] Hypervisor: HVF available
[ok] libkrun: v1.9.2
[ok] libkrunfw: v4.2.0
[ok] Codesigning: valid entitlements
[ok] gvproxy: found at /opt/homebrew/bin/gvproxy (v0.7.3)
[ok] Cache: /Users/you/.nanosandbox/cache (1.2 GB, 47 blobs)

All checks passed. Nanosandbox is ready to use.
```

### Linux (some issues)

```bash
$ nanosb doctor

Nanosandbox Doctor
==================

[ok] Platform: Linux
[ok] Architecture: x86_64
[ok] Kernel: 6.5.0-generic
[FAIL] Hypervisor: /dev/kvm not accessible
  -> Run: sudo usermod -aG kvm $USER
  -> Then log out and back in
[ok] libkrun: v1.9.0
[ok] libkrunfw: v4.2.0
[WARN] gvproxy: not found
  -> Bridge networking will not work
  -> Install: sudo apt install gvproxy
[ok] Cache: /home/you/.nanosandbox/cache (830 MB, 31 blobs)

1 check failed, 1 warning. Fix the issues above and run 'nanosb doctor' again.
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
  "checks": [
    { "name": "platform", "status": "ok", "detail": "macOS (Apple Silicon)" },
    { "name": "hypervisor", "status": "ok", "detail": "HVF available" },
    { "name": "libkrun", "status": "ok", "detail": "v1.9.2" },
    { "name": "libkrunfw", "status": "ok", "detail": "v4.2.0" },
    { "name": "codesigning", "status": "ok", "detail": "valid entitlements" },
    { "name": "gvproxy", "status": "ok", "detail": "/opt/homebrew/bin/gvproxy (v0.7.3)" },
    { "name": "cache", "status": "ok", "detail": "1.2 GB, 47 blobs" }
  ],
  "passed": 7,
  "failed": 0,
  "warnings": 0
}
```
