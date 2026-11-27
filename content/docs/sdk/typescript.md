---
title: "TypeScript SDK"
description: "Install the TypeScript/Node SDK and run a microVM sandbox"
order: 5
---

# TypeScript SDK

## Prerequisites

- Node.js 24 or newer.
- An ESM project (`"type": "module"` or an `.mjs` file).
- macOS Apple Silicon or Linux (x86_64 or aarch64).

## Install

```bash
npm install nanosandbox-sdk
```

## Quickstart

The first run downloads the per-platform runtime bundle. Save as `demo.mjs` and
run `node demo.mjs`:

```javascript
import { ManagedRuntime, SandboxBuilder, SandboxClient } from "nanosandbox-sdk";

const rt = await ManagedRuntime.start();
try {
  const client = SandboxClient.connect(rt.socket);
  const box = client.create(
    new SandboxBuilder("library/alpine:latest").withName("demo").build(),
  );
  await box.start();

  const out = await box.exec("echo", ["hello from a microVM"]);
  process.stdout.write(out.stdout);

  await box.remove(true);
} finally {
  await rt.close();
}
```

Expected output:

```text
hello from a microVM
```

`ManagedRuntime.start()` starts the helper, `await rt.close()` stops it, and
`await box.remove(true)` stops and deletes the sandbox.

## Errors

Calls throw `NanosbError`; branch on `err.code` and `err.isNotFound()`.

```javascript
import { NanosbError } from "nanosandbox-sdk";

try {
  client.get("missing");
} catch (err) {
  if (err instanceof NanosbError && err.isNotFound()) {
    console.log("no such sandbox");
  }
}
```

## Runtime and API reference

- [Runtime provisioning and environment variables](./runtime.md)
- [Full TypeScript API reference](https://github.com/nanosandboxai/nanosandbox/blob/main/sdk/typescript/README.md)
- Speaks `nanosb-protocol` v1.0.0; covered by the 40-scenario conformance suite.
