---
title: "Kotlin SDK"
description: "Install the Kotlin SDK and run a microVM sandbox"
order: 9
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

## Errors

The JVM `NanosbError` is shared with the Java SDK; use `code()` and
`isNotFound()`.

## Runtime and API reference

- [Runtime provisioning and environment variables](./runtime.md)
- [Full Kotlin API reference](https://github.com/nanosandboxai/nanosandbox/blob/main/sdk/kotlin/README.md)
- Speaks `nanosb-protocol` v1.0.0; covered by the 40-scenario conformance suite.
