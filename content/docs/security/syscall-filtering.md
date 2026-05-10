---
title: "Syscall Filtering"
description: "Seccomp profile and capability restrictions for sandboxed agents"
order: 2
---

# Syscall Filtering

Nanosandbox applies kernel-level restrictions to limit what system calls agents can make inside the VM. These restrictions are enforced by the kernel itself and cannot be bypassed by the agent process.

## Seccomp Profile

A seccomp-bpf profile blocks 34 dangerous syscalls that code agents never need. The profile uses a blocklist approach where all syscalls are allowed by default, with specific dangerous ones returning a permission error.

### Blocked Syscalls

The following syscalls are blocked and will return `EPERM` if called.

Kernel manipulation syscalls such as `kexec_load`, `kexec_file_load`, `init_module`, `finit_module`, `delete_module`, and `reboot` are blocked to prevent kernel replacement and module loading.

Process debugging via `ptrace` is blocked to prevent process injection and memory inspection.

Several subsystems with frequent security vulnerabilities are blocked entirely. These include `bpf` for eBPF programs, `io_uring_setup`, `io_uring_enter`, and `io_uring_register` for the io_uring subsystem, and `userfaultfd` which is frequently used in kernel exploits.

Privilege escalation vectors such as `pivot_root`, `modify_ldt`, `vm86`, `vm86old`, and `personality` are blocked to prevent root filesystem changes and ASLR bypass. Container escape techniques using `open_by_handle_at` and `name_to_handle_at` are also blocked.

Time manipulation syscalls including `settimeofday`, `clock_settime`, `clock_adjtime`, and `adjtimex` are blocked to prevent log tampering.

Kernel keyring access through `add_key`, `keyctl`, and `request_key` is blocked. Resource manipulation syscalls such as `swapon`, `swapoff`, `acct`, `mbind`, `move_pages`, and `migrate_pages` are blocked to prevent swap and NUMA memory manipulation.

Information leak vectors through `perf_event_open` and `lookup_dcookie` are blocked to prevent kernel profiling data exposure.

### What Remains Available

All standard development syscalls remain available. This includes file I/O, process management, networking, memory allocation, threading, and signal handling. Agents can compile code, run tests, start servers, and use any standard development workflow without restriction.

## Linux Capabilities

The sandbox runs with a reduced set of 8 Linux capabilities, down from the default 14. Only capabilities required for normal development workflows are retained.

The retained capabilities are `CAP_CHOWN` for changing file ownership during package installation, `CAP_FSETID` for tarball extraction, `CAP_SETGID` and `CAP_SETUID` for changing user and group identity, `CAP_SETFCAP` for filesystem operations, `CAP_NET_BIND_SERVICE` for binding development servers to ports below 1024, `CAP_KILL` for sending signals to processes, and `CAP_AUDIT_WRITE` for writing audit log entries.

Six dangerous capabilities are dropped. `CAP_DAC_OVERRIDE` is removed because it bypasses all file permission checks. `CAP_FOWNER` is removed because it bypasses file ownership checks. `CAP_NET_RAW` is removed because it allows raw socket access and packet sniffing. `CAP_MKNOD` is removed because it allows creating device files. `CAP_SYS_CHROOT` and `CAP_SETPCAP` are removed because they are not needed for development workflows.

The ambient and inheritable capability sets are empty. This means child processes do not inherit any capabilities and start with the minimum privilege needed.

## Resource Limits

Each sandbox enforces strict resource limits to prevent denial-of-service conditions.

Memory is configurable with a default of 4 GB and is enforced as a hard cgroup limit with swap disabled. CPU is configurable with a default of 2 cores using quota-based limiting. The PID limit is set to 512 to prevent fork bombs. The open files limit is 65536 to prevent file descriptor exhaustion. Maximum file size is 1 GB to prevent disk exhaustion. Address space is limited to 8 GB to prevent memory exhaustion.

## Additional Kernel Hardening

The VM kernel is configured with several additional hardening measures.

The `noNewPrivileges` flag is set so that processes cannot gain new privileges through setuid or setgid binaries. The `/proc` filesystem is mounted with `hidepid=2` so that processes cannot see other processes' environment variables. Sensitive entries under `/proc` and `/sys` are masked or made read-only, including `/proc/kcore`, `/proc/keys`, `/sys/firmware`, `/proc/sys`, and `/proc/sysrq-trigger`.

The VM kernel itself is hardened at build time. Loadable kernel modules are disabled so that no code can be loaded into the kernel at runtime. The kexec mechanism is disabled so the running kernel cannot be replaced.
