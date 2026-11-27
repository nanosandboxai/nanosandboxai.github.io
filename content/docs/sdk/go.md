---
title: "Go SDK"
description: "Install the Go SDK and run a microVM sandbox"
order: 6
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
		nanosandbox.NewSandboxBuilder("library/alpine:latest").WithName("demo"),
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

## Errors

Protocol errors are `*nanosandbox.NanosbError`; use `errors.As` and
`err.IsNotFound()`.

```go
var ne *nanosandbox.NanosbError
if errors.As(err, &ne) && ne.IsNotFound() {
    fmt.Println("no such sandbox")
}
```

## Runtime and API reference

- [Runtime provisioning and environment variables](./runtime.md)
- [Full Go API reference](https://github.com/nanosandboxai/nanosandbox/blob/main/sdk/go/README.md)
- Speaks `nanosb-protocol` v1.0.0; covered by the 40-scenario conformance suite.
