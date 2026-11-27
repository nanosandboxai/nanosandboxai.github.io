---
title: "Ruby SDK"
description: "Install the Ruby SDK and run a microVM sandbox"
order: 7
---

# Ruby SDK

## Prerequisites

- Ruby 2.6 or newer.
- macOS Apple Silicon or Linux (x86_64 or aarch64).

## Install

```bash
gem install nanosandbox-sdk
```

## Quickstart

The first run downloads the per-platform runtime bundle. Save as `demo.rb` and
run `ruby demo.rb`:

```ruby
require "nanosandbox"
require "nanosandbox/runtime"

Nanosandbox::ManagedRuntime.open do |rt|
  client = Nanosandbox::SandboxClient.connect(rt.socket)
  box = client.create(
    Nanosandbox::SandboxBuilder.new("library/alpine:latest").with_name("demo").build
  )
  box.start

  print box.exec("echo", ["hello from a microVM"])["stdout"]

  box.remove(true)
end
```

Expected output:

```text
hello from a microVM
```

`ManagedRuntime.open` starts the helper and closes it when the block exits;
`box.remove(true)` stops and deletes the sandbox.

## Errors

Calls raise `Nanosandbox::NanosbError`; branch on `err.code` and
`err.is_not_found?`.

```ruby
begin
  client.get("missing")
rescue Nanosandbox::NanosbError => err
  puts "no such sandbox" if err.is_not_found?
end
```

## Runtime and API reference

- [Runtime provisioning and environment variables](./runtime.md)
- [Full Ruby API reference](https://github.com/nanosandboxai/nanosandbox/blob/main/sdk/ruby/README.md)
- Speaks `nanosb-protocol` v1.0.0; covered by the 40-scenario conformance suite.
