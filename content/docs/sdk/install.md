---
title: "Language SDKs"
description: "Install the nanosandbox SDKs for Rust, Python, TypeScript, Go, Ruby, Java, C#/.NET, and Kotlin"
order: 1
---

Eight protocol clients speak the versioned `nanosb-protocol` over a Unix socket
to the `nanosb-runtime` helper — Rust, Python, TypeScript/Node, Go, Ruby, Java,
C#/.NET, and Kotlin. All eight share one wire contract and one conformance
corpus (35 scenarios).

## The runtime installs automatically

Installing the SDK is the only step. Each SDK's `ManagedRuntime` auto-provisions
the runtime — downloading, verifying, and installing a per-platform bundle on
first use. There is no separate runtime install. See
[Runtime](./runtime.md) for details.

## Install

| Language | Install |
|---|---|
| Rust | `cargo add nanosandbox-sdk` |
| Python | `pip install nanosandbox-sdk` |
| TypeScript / Node | `npm install nanosandbox-sdk` |
| Go | `go get github.com/nanosandboxai/nanosandbox/sdk/go` |
| Ruby | `gem install nanosandbox-sdk` |
| C# / .NET | `dotnet add package Nanosandbox.Sdk` |
| Java | `ai.nanosandbox:nanosandbox-sdk` (Maven Central) |
| Kotlin | `ai.nanosandbox:nanosandbox-sdk-kotlin` (Maven Central) |

### Java / Kotlin

The JVM SDKs are published to Maven Central, so no extra repository is needed:

```kotlin
implementation("ai.nanosandbox:nanosandbox-sdk:0.2.0")        // Java
implementation("ai.nanosandbox:nanosandbox-sdk-kotlin:0.2.0") // Kotlin facade
```

## Use

```python
from nanosandbox import SandboxClient

client = SandboxClient.connect("/path/to/helper.sock")
box = client.create({"image": "library/alpine:latest", "name": "demo"})
print(box.exec("echo", ["hello from a microVM"])["stdout"])
```

Each SDK can also start the helper for you (`ManagedRuntime`). See the per-SDK
README under `sdk/<lang>/` in the repository for the full API.
