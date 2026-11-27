---
title: "Runtime"
description: "The nanosb runtime is bundled with the SDKs and auto-provisions itself on first use"
order: 2
---

The nanosandbox SDKs **auto-provision the runtime**. Installing the SDK is the
only step — there is no separate runtime install.

## Bundled and auto-installed

Each SDK ships a `ManagedRuntime` that locates the `nanosb-runtime` helper. If
the helper is missing, it downloads and installs a per-platform runtime bundle
from the GitHub release into `$NANOSB_HOME`, pinned to the SDK's release
version. When `NANOSB_RUNTIME_SHA256` is set, the download is verified against
it.

The bundle installs five components:

| Component           | Description                                                     |
| ------------------- | --------------------------------------------------------------- |
| **nanosb-runtime**  | The runtime helper your code talks to over a socket             |
| **libkrunfw**       | Guest kernel firmware used by the microVM                       |
| **gvproxy**         | User-space networking proxy for bridge networking               |
| **exec-agent**      | In-guest exec agent for running commands inside the VM          |
| **entitlements.plist** | macOS hypervisor entitlement used when re-signing the helper |

## Version pinning

The runtime version is pinned to the SDK's release version — the runtime that
gets installed is the one shipped alongside the SDK version you installed. This
keeps the wire contract between your SDK and the runtime in lockstep.

## Configuration

The runtime is controlled by environment variables:

| Variable                | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `NANOSB_HOME`           | Install root for the runtime bundle (default `~/.nanosandbox`)               |
| `NANOSB_VERSION`        | Override the runtime version to install (defaults to the SDK's pinned version) |
| `NANOSB_RUNTIME_URL`    | Override the release base URL used to download the bundle                    |
| `NANOSB_RUNTIME_SHA256` | Expected sha256 of the bundle; when set, the download is verified and rejected on mismatch |
| `NANOSB_OFFLINE`        | Set to `1` to disable download/install; fail if the runtime is not already present |
| `NANOSB_PROVISIONER`    | Path to an explicit `ensure-runtime.sh` provisioner                         |
| `NANOSB_RUNTIME_BIN`    | Path to an existing `nanosb-runtime` helper (skips discovery)               |

## Offline / air-gapped usage

In air-gapped environments the SDK cannot download the runtime on first use.
Pre-place the bundle under `$NANOSB_HOME` before running:

```bash
mkdir -p ~/.nanosandbox
tar xzf nanosandbox-runtime-darwin-arm64.tar.gz -C ~/.nanosandbox

NANOSB_OFFLINE=1 python demo.py
```

Set `NANOSB_OFFLINE=1` to disable all download behavior — `ManagedRuntime` then
fails with a clear error unless `nanosb-runtime` is already installed in
`$NANOSB_HOME`. To use an internal mirror instead, point `NANOSB_RUNTIME_URL` at
it.

## Platform support

The runtime bundle is available for:

- macOS `arm64`
- Linux `x86_64` and `aarch64`

See [Language SDKs](./install.md) for how to install each SDK.
