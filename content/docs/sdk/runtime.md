---
title: "Runtime"
description: "The nanosb runtime is bundled with the SDKs and auto-provisions itself on first use"
order: 2
---

# Runtime

The nanosandbox SDKs now **auto-provision the runtime**. Installing the SDK is
the only step — there is no separate runtime install.

## Bundled and auto-installed

Each SDK ships a `ManagedRuntime` that locates the `nanosb-runtime` helper. If
the helper is missing, it downloads, verifies, and installs a per-platform
runtime bundle from the GitHub release into `$NANOSB_HOME`, pinned to the SDK's
release version.

The bundle installs four components:

| Component         | Description                                            |
| ----------------- | ------------------------------------------------------ |
| **nanosb-runtime** | The runtime helper your code talks to over a socket    |
| **libkrunfw**     | Guest kernel firmware used by the microVM               |
| **gvproxy**       | User-space networking proxy for bridge networking       |
| **exec-agent**    | In-guest exec agent for running commands inside the VM  |

## Version pinning

The runtime version is pinned to the SDK's release version — the runtime that
gets installed is the one shipped alongside the SDK version you installed. This
keeps the wire contract between your SDK and the runtime in lockstep.

## Configuration

The runtime is controlled by environment variables:

| Variable             | Description                                                           |
| -------------------- | --------------------------------------------------------------------- |
| `NANOSB_HOME`        | Directory where the runtime bundle is installed (defaults to a per-user location) |
| `NANOSB_VERSION`     | Override the runtime version to install (defaults to the SDK's pinned version) |
| `NANOSB_RUNTIME_URL` | Override the GitHub release URL used to download the bundle            |
| `NANOSB_OFFLINE`     | Disable download/install; fail if the runtime is not already present   |

## Offline / air-gapped usage

In air-gapped environments the SDK cannot download the runtime on first use.
Set `NANOSB_OFFLINE` to disable all download behavior — `ManagedRuntime` then
fails with a clear error unless `nanosb-runtime` is already installed in
`$NANOSB_HOME`. Pre-place the bundle there (or point `NANOSB_RUNTIME_URL` at an
internal mirror) before running offline.

## Platform support

The runtime bundle is available for:

- macOS `arm64`
- Linux `x86_64` and `aarch64`

See [Language SDKs](./install.md) for how to install each SDK.
