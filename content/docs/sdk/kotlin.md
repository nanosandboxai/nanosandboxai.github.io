---
title: "Kotlin SDK"
description: "Install the Kotlin SDK and run a microVM sandbox"
order: 11
---

# Kotlin SDK

## Prerequisites

- JDK 21 or newer.
- macOS Apple Silicon or Linux (x86_64 or aarch64).

## Install

The SDK is published to Maven Central; no extra repository is needed.

```kotlin
implementation("ai.nanosandbox:nanosandbox-sdk-kotlin:0.3.0")
```

## Quickstart

The first run downloads the per-platform runtime bundle. In your Kotlin/JVM app
with the SDK on the classpath:

```kotlin
import nanosandbox.ManagedRuntime
import nanosandbox.kt.KotlinClient
import nanosandbox.kt.KtJson

fun main() {
    val rt = ManagedRuntime.start()
    try {
        val client = KotlinClient.connect(rt.socket.toString())
        val spec = KtJson.obj()
        spec.set("image", KtJson.str("library/alpine:latest"))
        spec.set("name", KtJson.str("demo"))
        spec.set("cpus", KtJson.num(1))
        spec.set("memory_mb", KtJson.num(512))

        val box = client.create(spec)
        box.start()

        print(box.exec("echo", arrayOf("hello from a microVM")).getStr("stdout"))

        box.remove(true)
    } finally {
        rt.close()
    }
}
```

Expected output:

```text
hello from a microVM
```

Kotlin reuses the Java SDK's `ManagedRuntime`; `finally { rt.close() }` stops the
helper and `box.remove(true)` stops and deletes the sandbox.

## Headless code agent

Use a coding-agent image and its headless command instead of Alpine. Full table
and a verified Codex example: [Headless Code Agents](./agents.md). With the
`client` from the quickstart:

```kotlin
val spec = KtJson.obj()
spec.set("image", KtJson.str("ghcr.io/nanosandboxai/nanosandbox/claude:latest"))
spec.set("name", KtJson.str("claude-agent"))
spec.set("cpus", KtJson.num(2.0))
spec.set("memory_mb", KtJson.num(2048.0))
val env = KtJson.obj()
env.set("ANTHROPIC_API_KEY", KtJson.str(System.getenv("ANTHROPIC_API_KEY")))
spec.set("env", env)

val box = client.create(spec)
box.start()
print(box.exec("claude", arrayOf("--print", "Reply with exactly: ok")).getStr("stdout"))
box.remove(true)
```

## Errors

The JVM `NanosbError` is shared with the Java SDK; branch on `code()` and
re-throw unknown errors. See [Error Codes](./errors.md) for the full table and
retry policy.

```kotlin
import nanosandbox.NanosbError

try {
    box.exec("echo", arrayOf("hi"))
} catch (e: NanosbError) {
    when (e.code()) {
        "not_found" -> println("sandbox was removed")
        "invalid_state" -> println("sandbox is stopped or paused")
        "timeout", "transport" -> throw e // retry with backoff
        else -> throw e
    }
}
```

## Runtime and API reference

- [Runtime provisioning and environment variables](./runtime.md)
- [Full Kotlin API reference](https://github.com/nanosandboxai/nanosandbox/blob/main/sdk/kotlin/README.md)
- Speaks `nanosb-protocol` v1.0.0; covered by the 40-scenario conformance suite.
