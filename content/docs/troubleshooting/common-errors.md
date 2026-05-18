---
title: "Common Errors"
description: "Solutions for common issues"
order: 1
---

## Image Not Found

**Error:**
```
Error: image not found: ghcr.io/nanosandboxai/agents-registry/claude:latest
  Caused by: manifest unknown
```

**Causes and fixes:**

1. **Typo in image name.** Verify the image reference is correct:
   ```bash
   nanosb pull ghcr.io/nanosandboxai/agents-registry/claude:latest
   ```

2. **Authentication required.** The registry may require login:
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   nanosb pull ghcr.io/nanosandboxai/agents-registry/claude:latest
   ```

3. **Platform mismatch.** The image may not support your architecture. Try pulling with the short name which auto-resolves to the correct platform:
   ```bash
   nanosb pull claude
   ```

## Sandbox Creation Failed

**Error:**
```
Error: failed to create sandbox
  Caused by: krun_create_ctx returned -1
```

**Causes and fixes:**

1. **Hypervisor not available.** Run the doctor command:
   ```bash
   nanosb doctor
   ```

2. **Missing libkrun.** Ensure libkrun is installed:
   ```bash
   # macOS
   brew install libkrun

   # Linux
   sudo apt install libkrun-dev
   ```

3. **Too many open VMs.** The OS limits the number of concurrent VMs. Stop unused sandboxes:
   ```bash
   nanosb ps
   nanosb stop <sandbox-name>
   ```

4. **Insufficient memory.** Reduce memory allocation or free system memory:
   ```bash
   nanosb run --memory 2048 claude
   ```

## Windows Hypervisor Errors

**Error:**
```
Error: failed to create sandbox
  Caused by: WHPX not available
```

**Causes and fixes:**

1. **Hypervisor launch is disabled.** Enable it and reboot:
   ```powershell
   bcdedit /set hypervisorlaunchtype auto
   ```

2. **Windows virtualization features are disabled.** Enable Hyper-V and WHPX in "Turn Windows features on or off", then reboot.

3. **Missing runtime files.** Ensure these four files exist (they have no `.exe` extension because they run inside the Linux guest):
   - `%USERPROFILE%\.nanosandbox\libs\libkrunfw.dll`
   - `%USERPROFILE%\.nanosandbox\libs\busybox`
   - `%USERPROFILE%\.nanosandbox\libs\vsock_proxy`
   - `%USERPROFILE%\.nanosandbox\libs\fuse_mount`

   Re-run the installer if any of them is missing:
   ```powershell
   irm https://github.com/nanosandboxai/cli/releases/latest/download/install.ps1 | iex
   ```

4. **Quick check with the doctor command.**
   ```powershell
   nanosb doctor
   ```
   It reports each runtime file individually and prints the exact command to reinstall.

## Timeout Errors

**Error:**
```
Error: sandbox execution timed out after 60s
```

**Causes and fixes:**

1. **Default timeout too short.** Increase the timeout:
   ```yaml
   # sandbox.yml
   defaults:
     timeout: 300
   ```
   ```bash
   nanosb run --timeout 300 claude
   ```

2. **Sandbox boot is slow.** First boot after pulling an image may be slow due to filesystem setup. Subsequent boots use cached layers and are faster.

3. **Command hanging.** The executed command may be waiting for input. Ensure commands run non-interactively:
   ```bash
   # Bad: may prompt for input
   nanosb exec my-sandbox "apt install package"

   # Good: non-interactive
   nanosb exec my-sandbox "apt install -y package"
   ```

## Permission Errors

**Error:**
```
Error: permission denied
  Caused by: /dev/kvm: Permission denied
```

**Fix (Linux):** Add your user to the `kvm` group:
```bash
sudo usermod -aG kvm $USER
# Log out and back in
```

**Error:**
```
Error: permission denied writing to /workspace
```

**Fix:** The mount point permissions must allow the guest user (typically UID 0 or 1000) to write. Check host directory permissions:
```bash
ls -la ./project
# Ensure the directory is writable
chmod 755 ./project
```

## Network Errors

**Error:**
```
Error: network configuration failed
  Caused by: gvproxy not found in PATH
```

**Fix:** Install gvproxy for bridge networking:
```bash
# macOS
brew install gvproxy

# Linux (Debian/Ubuntu)
sudo apt install gvproxy
```

Alternatively, use TSI mode (default) which does not require gvproxy.

## Codesigning Errors (macOS)

**Error:**
```
Error: failed to create VM
  Caused by: hv_vm_create: HV_ERROR
```

**Fix:** The binary is missing the hypervisor entitlement. Re-sign it:
```bash
codesign --entitlements entitlements.plist --force -s - $(which nanosb)
```

If you installed via Homebrew, the binary should already be signed. Try reinstalling:
```bash
brew reinstall nanosandbox
```

**Error:**
```
Error: EXC_BAD_ACCESS when creating VM
```

**Fix:** This typically occurs when running an unsigned binary. Verify the signature:
```bash
codesign -d --entitlements - $(which nanosb)
```

The output must include `com.apple.security.hypervisor` set to `true`.

## Image Layer Corruption

**Error:**
```
Error: layer verification failed
  Caused by: sha256 digest mismatch for blob abc123...
```

**Fix:** Clear the cache and re-pull:
```bash
nanosb cache prune --all
nanosb pull <image>
```

## Virtio-fs Mount Failures

**Error:**
```
Error: failed to mount /workspace
  Caused by: virtio-fs device not ready
```

**Causes and fixes:**

1. **Host directory does not exist.** Ensure the source path exists:
   ```bash
   ls -la ./project
   ```

2. **Symlink in path.** Resolve symlinks before mounting:
   ```bash
   nanosb run --project "$(realpath ./project)" claude
   ```

3. **Symlink issues.** If paths aren't resolving, check for symlinks in the project path.

4. **Windows path edge cases.** On Windows, very long paths and mixed case can still cause confusing behavior in older tools. Use a shorter workspace path when possible and keep path casing consistent.

   The previous "directory not empty" cleanup issue in common package-manager workflows is fixed in current builds.
