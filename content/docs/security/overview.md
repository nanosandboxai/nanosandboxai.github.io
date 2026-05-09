---
title: "Security Overview"
description: "Defense-in-depth security architecture for AI agent sandboxes"
order: 1
---

# Security Overview

Nanosandbox isolates AI code agents inside lightweight microVMs with hardware-enforced boundaries. Every sandbox is a disposable, single-tenant virtual machine. Agents cannot access the host system, other sandboxes, or each other.

## Security Layers

Nanosandbox applies defense-in-depth with multiple independent security layers. Even if one layer is bypassed, the remaining layers contain the threat.

The hardware VM boundary is the primary security control. Everything else provides additional protection.

```
Layer 1: Hardware VM        Hypervisor-enforced isolation with a dedicated kernel per sandbox
Layer 2: Kernel hardening   No module loading, no kexec, seccomp syscall filtering
Layer 3: Seccomp profile    34 dangerous syscalls blocked including ptrace, bpf, and io_uring
Layer 4: Capabilities       Reduced Linux capability set with no ambient inheritance
Layer 5: Process isolation  No sudo, no suid binaries, noNewPrivileges enforced
Layer 6: Resource limits    Memory, CPU, PID, file size, and address space limits
Layer 7: Secrets encryption All env vars encrypted in transit using X25519 and AES-256-GCM
```

## Isolation Model

Each sandbox runs in its own microVM with a dedicated kernel. There is no shared kernel between the host and the sandbox, or between sandboxes. The filesystem is isolated so agents see only their own rootfs and workspace. Each VM has its own network namespace, and CPU, memory, and PIDs are cgroup-limited per sandbox.

Agents run as a non-root user inside the VM. System package installation is handled through a controlled gateway endpoint that runs with elevated privileges within the VM. The agent itself never has root access.

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| Agent escapes to host | Hypervisor hardware boundary |
| Agent accesses other sandboxes | Each sandbox is a separate VM |
| Kernel exploit via syscall | Seccomp blocks dangerous syscalls, dedicated kernel |
| Privilege escalation | No sudo, no suid, reduced capabilities, noNewPrivileges |
| Fork bomb or resource exhaustion | PID limit, memory limit, CPU quota, file size limit |
| Secret exfiltration from process env | Process visibility restricted on /proc, encrypted delivery |
| Network-based attacks | Isolated network namespace per VM |
| Persistent compromise | VMs are ephemeral and destroyed after use |

## Agent Permissions

Code agents operate under the principle of least privilege. They can read and write workspace files, install development tools through the gateway, run builds and tests, and access the network. They cannot gain root access, modify system files, see other processes' environment variables, load kernel modules, use ptrace, or escape the VM.

For details on each security layer, see [Syscall Filtering](./syscall-filtering), [Package Installation](./package-installation), and [Secrets Management](./secrets).
