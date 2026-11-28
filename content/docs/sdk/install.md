---
title: "Language SDKs"
description: "Install the nanosandbox SDKs for Rust, Python, TypeScript, Go, Ruby, Java, C#/.NET, and Kotlin"
order: 1
---

Eight protocol clients speak the versioned `nanosb-protocol` (v1.0.0) over a
Unix socket to the `nanosb-runtime` helper — Rust, Python, TypeScript/Node, Go,
Ruby, Java, C#/.NET, and Kotlin. All eight share one wire contract and one
conformance corpus (40 scenarios).

## Prerequisites

- macOS Apple Silicon or Linux (x86_64 or aarch64).
- One toolchain: Rust 1.94+, Python 3.9+, Node.js 24+, Go 1.27+, Ruby 2.6+,
  JDK 21+, or .NET SDK 8+.

## Install

| Language | Install | Step-by-step guide |
|---|---|---|
| Rust | `cargo add nanosandbox-sdk` | [Rust SDK](./rust.md) |
| Python | `pip install nanosandbox-sdk` | [Python SDK](./python.md) |
| TypeScript / Node | `npm install nanosandbox-sdk` | [TypeScript SDK](./typescript.md) |
| Go | `go get github.com/nanosandboxai/nanosandbox/sdk/go` | [Go SDK](./go.md) |
| Ruby | `gem install nanosandbox-sdk` | [Ruby SDK](./ruby.md) |
| C# / .NET | `dotnet add package Nanosandbox.Sdk` | [C#/.NET SDK](./dotnet.md) |
| Java | `ai.nanosandbox:nanosandbox-sdk` (Maven Central) | [Java SDK](./java.md) |
| Kotlin | `ai.nanosandbox:nanosandbox-sdk-kotlin` (Maven Central) | [Kotlin SDK](./kotlin.md) |

### Java / Kotlin

The JVM SDKs are published to Maven Central, so no extra repository is needed.

Gradle:

```kotlin
implementation("ai.nanosandbox:nanosandbox-sdk:0.3.0")        // Java
implementation("ai.nanosandbox:nanosandbox-sdk-kotlin:0.3.0") // Kotlin facade
```

Maven:

```xml
<dependency>
  <groupId>ai.nanosandbox</groupId>
  <artifactId>nanosandbox-sdk</artifactId>
  <version>0.3.0</version>
</dependency>
```

## The runtime installs automatically

Installing the SDK is the only step. Each SDK's `ManagedRuntime` locates the
`nanosb-runtime` helper and, if it is missing, downloads and installs a
per-platform bundle on first use. When `NANOSB_RUNTIME_SHA256` is set, the
download is verified against it. There is no separate runtime install — see
[Runtime](./runtime.md) for version pinning, environment variables, and offline
use.

## Quickstarts

Every language page below contains a complete, runnable program that starts the
helper, boots an Alpine microVM, runs a command, and cleans up:

- [Rust](./rust.md) · [Python](./python.md) · [TypeScript](./typescript.md) · [Go](./go.md)
- [Ruby](./ruby.md) · [Java](./java.md) · [Kotlin](./kotlin.md) · [C#/.NET](./dotnet.md)

The common shape is: start `ManagedRuntime` → connect `SandboxClient` → create
and start a sandbox → exec → remove the sandbox → close the runtime. Full API
reference lives in each SDK's README under `sdk/<lang>/` in the repository.

To run a real coding agent instead of Alpine — Claude, Codex, Gemini, and
others — see [Headless Code Agents](./agents.md). Stable error codes and retry
guidance live in [Error Codes](./errors.md).
