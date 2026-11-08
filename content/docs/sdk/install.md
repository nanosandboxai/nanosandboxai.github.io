---
title: "Language SDKs"
description: "Install the nanosandbox SDKs for Rust, Python, TypeScript, Go, Ruby, Java, C#/.NET, and Kotlin"
order: 1
---

Eight protocol clients speak the versioned `nanosb-protocol` over a Unix socket
to the `nanosb-runtime` helper — Rust, Python, TypeScript/Node, Go, Ruby, Java,
C#/.NET, and Kotlin. All eight share one wire contract and one conformance
corpus (35 scenarios).

## Install

| Language | Install |
|---|---|
| Rust | `cargo add nanosandbox-sdk` |
| Python | `pip install nanosandbox-sdk` |
| TypeScript / Node | `npm install nanosandbox-sdk` |
| Go | `go get github.com/nanosandboxai/nanosandbox/sdk/go` |
| Ruby | `gem install nanosandbox` |
| C# / .NET | `dotnet add package Nanosandbox` |
| Java | `ai.nanosandbox:nanosandbox-java` (see below) |
| Kotlin | `ai.nanosandbox:nanosandbox-kotlin` (see below) |

### Java / Kotlin

The JVM SDKs publish a Maven repository to GitHub Pages. Add it and depend on
the artifact:

```xml
<repository>
  <id>nanosandbox</id>
  <url>https://nanosandboxai.github.io/maven/</url>
</repository>
```

```kotlin
implementation("ai.nanosandbox:nanosandbox-java:0.2.0")   // or nanosandbox-kotlin
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
