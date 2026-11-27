---
title: "C#/.NET SDK"
description: "Install the C#/.NET SDK and run a microVM sandbox"
order: 12
---

## Prerequisites

- .NET SDK 8.0 or newer.
- macOS Apple Silicon or Linux (x86_64 or aarch64).

## Install

```bash
dotnet add package Nanosandbox.Sdk
```

## Quickstart

The first run downloads the per-platform runtime bundle. In a console project
with the package installed, replace `Program.cs` with:

```csharp
using System;
using System.Collections.Generic;

using var rt = ManagedRuntime.start();
var client = SandboxClient.connect(rt.Socket);
var box = client.createWith(new SandboxBuilder("library/alpine:latest").withName("demo").withResources(1, 512));

box.start();
Console.Write(box.exec("echo", new List<string> { "hello from a microVM" }).str("stdout"));
box.remove(true);
```

Expected output:

```text
hello from a microVM
```

`ManagedRuntime` is `IDisposable`, so `using var` stops the helper at the end of
the program; `box.remove(true)` stops and deletes the sandbox.

## Headless code agent

Use a coding-agent image and its headless command instead of Alpine. Full table
and a verified Codex example: [Headless Code Agents](./agents.md). With the
`client` from the quickstart:

```csharp
var box = client.createWith(
    new SandboxBuilder("ghcr.io/nanosandboxai/nanosandbox/claude:latest")
        .withName("claude-agent")
        .withEnv("ANTHROPIC_API_KEY", Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY"))
        .withResources(2, 2048));
box.start();
Console.Write(box.exec("claude", new List<string> { "--print", "Reply with exactly: ok" }).str("stdout"));
box.remove(true);
```

## Errors

Calls throw `NanosbError`; branch on `errorCode` and re-throw unknown errors.
See [Error Codes](./errors.md) for the full table and retry policy.

```csharp
try
{
    var outv = box.exec("echo", new List<string> { "hi" });
    if (outv.intVal("exit_code") != 0)
    {
        Console.Error.WriteLine(outv.str("stderr"));
    }
}
catch (NanosbError err)
{
    switch (err.errorCode)
    {
        case "not_found":
            Console.WriteLine("sandbox was removed");
            break;
        case "invalid_state":
            Console.WriteLine("sandbox is stopped or paused");
            break;
        case "timeout":
        case "transport":
            throw; // retry with backoff
        default:
            throw;
    }
}
```

## Runtime and API reference

- [Runtime provisioning and environment variables](./runtime.md)
- [Full C#/.NET API reference](https://github.com/nanosandboxai/nanosandbox/blob/main/sdk/dotnet/README.md)
- Speaks `nanosb-protocol` v1.0.0; covered by the 40-scenario conformance suite.
