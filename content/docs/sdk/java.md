---
title: "Java SDK"
description: "Install the Java SDK and run a microVM sandbox"
order: 8
---

# Java SDK

## Prerequisites

- JDK 21 or newer.
- macOS Apple Silicon or Linux (x86_64 or aarch64).

## Install

The SDK is published to Maven Central; no extra repository is needed.

Maven:

```xml
<dependency>
  <groupId>ai.nanosandbox</groupId>
  <artifactId>nanosandbox-sdk</artifactId>
  <version>0.3.0</version>
</dependency>
```

Gradle:

```kotlin
implementation("ai.nanosandbox:nanosandbox-sdk:0.3.0")
```

## Quickstart

The first run downloads the per-platform runtime bundle. Save as `Demo.java`
and run it with the SDK on the classpath:

```java
import nanosandbox.ManagedRuntime;
import nanosandbox.Sandbox;
import nanosandbox.SandboxBuilder;
import nanosandbox.SandboxClient;

public class Demo {
  public static void main(String[] args) throws Exception {
    try (ManagedRuntime rt = ManagedRuntime.start()) {
      SandboxClient client = SandboxClient.connect(rt.socket.toString());
      Sandbox sandbox = client.createWith(
          new SandboxBuilder("library/alpine:latest").withName("demo"));
      sandbox.start();

      System.out.print(sandbox.exec("echo", new String[]{"hello from a microVM"}).getStr("stdout"));

      sandbox.remove(true);
    }
  }
}
```

Expected output:

```text
hello from a microVM
```

`ManagedRuntime` is `AutoCloseable`, so try-with-resources stops the helper;
`sandbox.remove(true)` stops and deletes the sandbox.

## Errors

Calls throw `NanosbError`; use `code()` and `isNotFound()`.

```java
try {
  client.get("missing");
} catch (NanosbError err) {
  if (err.isNotFound()) {
    System.out.println("no such sandbox");
  }
}
```

## Runtime and API reference

- [Runtime provisioning and environment variables](./runtime.md)
- [Full Java API reference](https://github.com/nanosandboxai/nanosandbox/blob/main/sdk/java/README.md)
- Speaks `nanosb-protocol` v1.0.0; covered by the 40-scenario conformance suite.
