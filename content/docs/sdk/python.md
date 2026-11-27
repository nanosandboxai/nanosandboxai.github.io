---
title: "Python SDK"
description: "Install the Python SDK and run a microVM sandbox"
order: 4
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
        SandboxBuilder("library/alpine:latest").with_name("demo")
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

## Errors

Calls raise `NanosbError`; use `err.code` and `err.is_not_found()` to branch on
protocol errors.

```python
from nanosandbox import NanosbError

try:
    client.get("missing")
except NanosbError as err:
    if err.is_not_found():
        print("no such sandbox")
```

## Runtime and API reference

- [Runtime provisioning and environment variables](./runtime.md)
- [Full Python API reference](https://github.com/nanosandboxai/nanosandbox/blob/main/sdk/python/README.md)
- Speaks `nanosb-protocol` v1.0.0; covered by the 40-scenario conformance suite.
