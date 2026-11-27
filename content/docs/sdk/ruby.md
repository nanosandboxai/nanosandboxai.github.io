---
title: "Ruby SDK"
description: "Install the Ruby SDK and run a microVM sandbox"
order: 9
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
    Nanosandbox::SandboxBuilder.new("library/alpine:latest").with_name("demo").with_resources(1, 512).build
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

## Headless code agent

Use a coding-agent image and its headless command instead of Alpine. Full table
and a verified Codex example: [Headless Code Agents](./agents.md). With the
`client` from the quickstart:

```ruby
box = client.create(
  Nanosandbox::SandboxBuilder.new("ghcr.io/nanosandboxai/nanosandbox/claude:latest")
    .with_name("claude-agent")
    .with_env("ANTHROPIC_API_KEY", ENV.fetch("ANTHROPIC_API_KEY"))
    .with_resources(2, 2048).build
)
box.start
print box.exec("claude", ["--print", "Reply with exactly: ok"])["stdout"]
box.remove(true)
```

## Errors

Calls raise `Nanosandbox::NanosbError`; branch on `code` and re-raise unknown
errors. See [Error Codes](./errors.md) for the full table and retry policy.

```ruby
begin
  out = box.exec("echo", ["hi"])
rescue Nanosandbox::NanosbError => err
  case err.code
  when "not_found"    then puts "sandbox was removed"
  when "invalid_state" then puts "sandbox is stopped or paused"
  when "timeout", "transport" then raise # retry the idempotent call
  else raise
  end
else
  puts out["stderr"] if out["exit_code"] != 0
end
```

## Runtime and API reference

- [Runtime provisioning and environment variables](./runtime.md)
- [Full Ruby API reference](https://github.com/nanosandboxai/nanosandbox/blob/main/sdk/ruby/README.md)
- Speaks `nanosb-protocol` v1.0.0; covered by the 40-scenario conformance suite.
