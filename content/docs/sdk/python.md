---
title: "Python SDK"
description: "Install the Python SDK and run a microVM sandbox"
order: 6
---

# Python SDK

## Prerequisites

- Python 3.9 or newer.
- macOS Apple Silicon or Linux (x86_64 or aarch64).

## Install

```bash
pip install nanosandbox-sdk
```

## Quickstart

The first run downloads the per-platform runtime bundle. Save as `demo.py` and
run `python demo.py`:

```python
from nanosandbox import ManagedRuntime, SandboxBuilder, SandboxClient

with ManagedRuntime() as rt:
    client = SandboxClient.connect(str(rt.socket))
    box = client.create_with(
        SandboxBuilder("library/alpine:latest").with_name("demo").with_resources(1, 512)
    )
    box.start()

    print(box.exec("echo", ["hello from a microVM"])["stdout"], end="")

    box.remove(force=True)
```

Expected output:

```text
hello from a microVM
```

`ManagedRuntime()` starts the helper and the context manager closes it;
`box.remove(force=True)` stops and deletes the sandbox.

## Headless code agent

Use a coding-agent image and its headless command instead of Alpine. Full table
and a verified Codex example: [Headless Code Agents](./agents.md). With the
`client` from the quickstart:

```python
import os

box = client.create_with(
    SandboxBuilder("ghcr.io/nanosandboxai/nanosandbox/claude:latest")
    .with_name("claude-agent")
    .with_env("ANTHROPIC_API_KEY", os.environ["ANTHROPIC_API_KEY"])
    .with_resources(2, 2048)
)
box.start()
print(box.exec("claude", ["--print", "Reply with exactly: ok"])["stdout"], end="")
box.remove(force=True)
```

## Errors

Calls raise `NanosbError` with a stable `code`; never swallow an unknown one.
See [Error Codes](./errors.md) for the full table and retry policy.

```python
from nanosandbox import NanosbError

try:
    out = box.exec("echo", ["hi"])
except NanosbError as err:
    if err.code == "not_found":
        print("sandbox was removed")
    elif err.code == "invalid_state":
        print("sandbox is stopped or paused")
    elif err.code in ("timeout", "transport"):
        raise  # retry the idempotent call with backoff
    else:
        raise
else:
    if out["exit_code"] != 0:
        print(out["stderr"])
```

## Runtime and API reference

- [Runtime provisioning and environment variables](./runtime.md)
- [Full Python API reference](https://github.com/nanosandboxai/nanosandbox/blob/main/sdk/python/README.md)
- Speaks `nanosb-protocol` v1.0.0; covered by the 40-scenario conformance suite.
