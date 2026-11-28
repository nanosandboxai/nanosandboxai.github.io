---
title: "Error Codes"
description: "Stable protocol error codes and how to handle them in each SDK"
order: 3
---

## Three kinds of failure

| Kind | What you see | Retry? |
|---|---|---|
| **Protocol error** | SDK error type with a stable `code` | depends on the code |
| **Transport failure** | native I/O exception, or `transport` / `internal` | after reconnecting, for idempotent calls |
| **Guest/agent failure** | `exec` returns `exit_code != 0` (no exception) | not a protocol error |

Wire form: `{"type":"error","code":"not_found","message":"sandbox 'x' not found"}`.

## Codes

Defined in `crates/protocol/src/error.rs`; these strings are stable.

| Code | Meaning | Typical handling | Retry |
|---|---|---|---|
| `bad_request` | Malformed request or unknown verb. | Fix the request; log the message. | no |
| `incompatible_version` | SDK/helper protocol version mismatch. | Upgrade the SDK or helper. | no |
| `not_found` | The named sandbox does not exist. | Create it, or treat delete as idempotent. | no |
| `invalid_state` | The sandbox is not in a state for this verb. | Re-read `status`, wait for the transition. | after reconcile |
| `unsupported` | The verb is not in this helper build. | Check `supports()`, fall back or upgrade. | no |
| `unauthorized` | Helper authentication failed. | Fix helper auth. Not a provider API key. | no |
| `timeout` | An operation deadline elapsed. | Retry idempotent calls with backoff. | yes |
| `transport` | The socket/transport failed. | Reconnect, retry idempotent calls. | yes |
| `io` | Guest filesystem or I/O error. | Fix the path/permissions; inspect the message. | no |
| `internal` | Unexpected failure (often a broken pipe). | Retry once, then report the message. | maybe |

`unauthorized` is about the helper connection. A **provider** key failure (for
example an invalid `ANTHROPIC_API_KEY`) is not a protocol error: the agent
process exits non-zero and writes the reason to `stderr`.

## Accessors

| SDK | Error type | Code | Message | Helpers |
|---|---|---|---|---|
| Rust | `nanosandbox_sdk::Error` | `err.code() -> Option<ErrorCode>` | `Display` | `is_not_found()`, `is_missing_endpoint()` |
| Python | `NanosbError` | `err.code` | `err.message` | `is_not_found()` |
| TypeScript | `NanosbError` | `err.code` | `err.message` | `isNotFound()` |
| Go | `*nanosandbox.NanosbError` | `err.Code` | `err.Message` | `IsNotFound()` |
| Ruby | `Nanosandbox::NanosbError` | `err.code` | `err.message` | `is_not_found?` |
| Java | `NanosbError` | `err.code()` | `err.message()` | `isNotFound()` |
| Kotlin | `NanosbError` (Java class) | `err.code()` | `err.message()` | `isNotFound()` |
| C#/.NET | `NanosbError` | `err.errorCode` | `err.message` | `isNotFound()` |

Connection failures can surface as native exceptions before any protocol error:
for example Python raises `FileNotFoundError` when the socket path is missing,
and Java raises `IOException`. Handle those separately from `NanosbError`.

## Handling policy

- Retry **only** `timeout` and `transport`, and only for idempotent operations;
  use exponential backoff.
- Treat `not_found` as “missing”: create the sandbox if that was the intent, or
  treat a delete as already done.
- On `invalid_state`, read `status` and wait for the sandbox to reach the state
  the verb needs; do not spin on the same call.
- Check `client.supports("pause")` (or the relevant capability) **before**
  calling an optional verb; `unsupported` means this helper build lacks it.
- Never swallow unknown errors: re-raise them so the message is visible.
- A non-zero `exec` exit code is a result, not an exception:

```python
result = box.exec("sh", ["-c", "exit 3"])
if result["exit_code"] != 0:
    print(result["stderr"], file=sys.stderr)
```

## Robust handler (Python)

```python
import sys
import time
from nanosandbox import NanosbError

RETRYABLE = {"timeout", "transport"}

def retry(fn, attempts=3):
    for attempt in range(attempts):
        try:
            return fn()
        except NanosbError as err:
            if err.code in RETRYABLE and attempt + 1 < attempts:
                time.sleep(0.2 * 2 ** attempt)
                continue
            raise

def ensure_demo(client, builder):
    try:
        client.get("demo")
        return client.sandbox("demo")
    except NanosbError as err:
        if not err.is_not_found():
            raise
        return retry(lambda: client.create_with(builder))

box = ensure_demo(
    client,
    SandboxBuilder("library/alpine:latest").with_name("demo"),
)

if client.supports("pause"):
    retry(box.pause)
else:
    print("pause is not supported by this helper", file=sys.stderr)

result = box.exec("sh", ["-c", "exit 3"])
if result["exit_code"] != 0:
    print(f"agent exited {result['exit_code']}: {result['stderr']}", file=sys.stderr)
```

Every language page has the equivalent branch for its error type. Full protocol
detail: [Protocol §7 — Error codes](https://github.com/nanosandboxai/nanosandbox/blob/main/docs/protocol/protocol.md#7-error-codes).
