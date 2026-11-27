---
title: "Go SDK"
description: "Install the Go SDK and run a microVM sandbox"
order: 8
---

# Go SDK

## Prerequisites

- Go 1.27 or newer.
- macOS Apple Silicon or Linux (x86_64 or aarch64).

## Install

```bash
go get github.com/nanosandboxai/nanosandbox/sdk/go
```

## Quickstart

The first run downloads the per-platform runtime bundle. Save as `main.go` and
run `go run main.go`:

```go
package main

import (
	"fmt"
	"log"
	"time"

	"github.com/nanosandboxai/nanosandbox/sdk/go/nanosandbox"
)

func main() {
	rt, err := nanosandbox.StartRuntime(15 * time.Second)
	if err != nil {
		log.Fatal(err)
	}
	defer rt.Close()

	client, err := nanosandbox.Connect(rt.Socket)
	if err != nil {
		log.Fatal(err)
	}

	box, err := client.CreateWith(
		nanosandbox.NewSandboxBuilder("library/alpine:latest").
			WithName("demo").
			WithResources(1, 512),
	)
	if err != nil {
		log.Fatal(err)
	}
	if err := box.Start(); err != nil {
		log.Fatal(err)
	}

	out, err := box.Exec("echo", []string{"hello from a microVM"})
	if err != nil {
		log.Fatal(err)
	}
	stdout, _ := out.Str("stdout")
	fmt.Print(stdout)

	if err := box.Remove(true); err != nil {
		log.Fatal(err)
	}
}
```

Expected output:

```text
hello from a microVM
```

`StartRuntime` starts the helper, `defer rt.Close()` stops it, and
`box.Remove(true)` stops and deletes the sandbox.

## Headless code agent

Use a coding-agent image and its headless command instead of Alpine. Full table
and a verified Codex example: [Headless Code Agents](./agents.md). With the
`client` from the quickstart:

```go
box, err := client.CreateWith(
    nanosandbox.NewSandboxBuilder("ghcr.io/nanosandboxai/nanosandbox/claude:latest").
        WithName("claude-agent").
        WithEnv("ANTHROPIC_API_KEY", os.Getenv("ANTHROPIC_API_KEY")).
        WithResources(2, 2048),
)
if err != nil {
    log.Fatal(err)
}
if err := box.Start(); err != nil {
    log.Fatal(err)
}
out, err := box.Exec("claude", []string{"--print", "Reply with exactly: ok"})
if err != nil {
    log.Fatal(err)
}
stdout, _ := out.Str("stdout")
fmt.Print(stdout)
if err := box.Remove(true); err != nil {
    log.Fatal(err)
}
```

Add `os` to the import block for `os.Getenv`.

## Errors

Protocol errors are `*nanosandbox.NanosbError`; use `errors.As` and re-throw
unknown errors. See [Error Codes](./errors.md) for the full table and retry
policy.

```go
out, err := box.Exec("echo", []string{"hi"})
if err != nil {
    var ne *nanosandbox.NanosbError
    if errors.As(err, &ne) {
        switch ne.Code {
        case "not_found":
            fmt.Println("sandbox was removed")
        case "invalid_state":
            fmt.Println("sandbox is stopped or paused")
        case "timeout", "transport":
            fmt.Printf("retryable: %v\n", err)
        default:
            log.Fatal(err)
        }
    } else {
        log.Fatal(err)
    }
} else if code, _ := out.Int("exit_code"); code != 0 {
    stderr, _ := out.Str("stderr")
    fmt.Println(stderr)
}
```

## Runtime and API reference

- [Runtime provisioning and environment variables](./runtime.md)
- [Full Go API reference](https://github.com/nanosandboxai/nanosandbox/blob/main/sdk/go/README.md)
- Speaks `nanosb-protocol` v1.0.0; covered by the 40-scenario conformance suite.
