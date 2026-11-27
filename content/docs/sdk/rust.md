---
title: "Rust SDK"
description: "Install the Rust SDK and run a microVM sandbox"
order: 5
---

# Rust SDK

## Prerequisites

- Rust 1.94 or newer (the release toolchain).
- macOS Apple Silicon or Linux (x86_64 or aarch64).

## Install

```bash
cargo add nanosandbox-sdk
```

## Quickstart

The first run downloads the per-platform runtime bundle. Save this as
`src/main.rs` in a new crate and run `cargo run`:

```rust
use nanosandbox_sdk::{ManagedRuntime, Result, SandboxBuilder, SandboxClient};

fn main() -> Result<()> {
    let rt = ManagedRuntime::start().unwrap();
    let client = SandboxClient::connect(rt.socket())?;
    let sandbox = client
        .create_with(
            SandboxBuilder::new("library/alpine:latest")
                .name("demo")
                .cpus(1)
                .memory_mb(512),
        )?;

    sandbox.start()?;
    let out = sandbox.exec("echo", &["hello from a microVM"])?;
    print!("{}", out.stdout);

    sandbox.remove(true)?;
    drop(rt);
    Ok(())
}
```

Expected output:

```text
hello from a microVM
```

`ManagedRuntime::start()` locates or provisions `nanosb-runtime`,
`sandbox.remove(true)` stops and deletes the sandbox, and dropping `rt` shuts
the helper down.

## Headless code agent

Use a coding-agent image and its headless command instead of Alpine. Full table
and a verified Codex example: [Headless Code Agents](./agents.md). With the
`client` from the quickstart:

```rust
let sandbox = client.create_with(
    SandboxBuilder::new("ghcr.io/nanosandboxai/nanosandbox/claude:latest")
        .name("claude-agent")
        .env("ANTHROPIC_API_KEY", std::env::var("ANTHROPIC_API_KEY").unwrap())
        .cpus(2)
        .memory_mb(2048),
)?;
sandbox.start()?;
let out = sandbox.exec("claude", &["--print", "Reply with exactly: ok"])?;
print!("{}", out.stdout);
sandbox.remove(true)?;
```

## Errors

Client calls return `nanosandbox_sdk::Result<T>`. Branch on the stable code and
return unknown errors. See [Error Codes](./errors.md) for the full table and
retry policy.

```rust
match sandbox.exec("echo", &["hi"]) {
    Ok(out) if out.exit_code != 0 => eprintln!("agent failed: {}", out.stderr),
    Ok(_) => {}
    Err(err) if err.is_not_found() => println!("sandbox was removed"),
    Err(err) => match err.code().map(|c| c.as_str()) {
        Some("invalid_state") => println!("sandbox is stopped or paused"),
        Some("timeout") | Some("transport") => { /* retry with backoff */ }
        _ => return Err(err),
    },
}
```

## Runtime and API reference

- [Runtime provisioning and environment variables](./runtime.md)
- [Full Rust API reference](https://github.com/nanosandboxai/nanosandbox/blob/main/sdk/rust/README.md)
- Speaks `nanosb-protocol` v1.0.0; covered by the 40-scenario conformance suite.
