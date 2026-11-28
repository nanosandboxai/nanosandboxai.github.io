---
title: "Java SDK"
description: "Install the Java SDK and run a microVM sandbox"
order: 10
---

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
          new SandboxBuilder("library/alpine:latest").withName("demo").withResources(1, 512));
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

## Headless code agent

Use a coding-agent image and its headless command instead of Alpine. Full table
and a verified Codex example: [Headless Code Agents](./agents.md). With the
`client` from the quickstart:

```java
Sandbox box = client.createWith(
    new SandboxBuilder("ghcr.io/nanosandboxai/nanosandbox/claude:latest")
        .withName("claude-agent")
        .withEnv("ANTHROPIC_API_KEY", System.getenv("ANTHROPIC_API_KEY"))
        .withResources(2, 2048));
box.start();
System.out.print(box.exec("claude", new String[]{"--print", "Reply with exactly: ok"}).getStr("stdout"));
box.remove(true);
```

## Errors

Calls throw `NanosbError`; branch on `code()` and re-throw unknown errors.
See [Error Codes](./errors.md) for the full table and retry policy.

```java
import nanosandbox.NanosbError;

try {
  box.exec("echo", new String[]{"hi"});
} catch (NanosbError err) {
  switch (err.code()) {
    case "not_found":
      System.out.println("sandbox was removed");
      break;
    case "invalid_state":
      System.out.println("sandbox is stopped or paused");
      break;
    case "timeout":
    case "transport":
      throw err; // retry with backoff
    default:
      throw err;
  }
}
```

## Runtime and API reference

- [Runtime provisioning and environment variables](./runtime.md)
- [Full Java API reference](https://github.com/nanosandboxai/nanosandbox/blob/main/sdk/java/README.md)
- Speaks `nanosb-protocol` v1.0.0; covered by the 40-scenario conformance suite.
