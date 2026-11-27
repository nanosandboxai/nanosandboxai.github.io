---
title: "Headless Code Agents"
description: "Run Claude, Codex, and other coding agents headlessly from an SDK"
order: 4
---

The Alpine quickstarts show the SDK lifecycle. To run a real coding agent, use
an agent image, inject its provider key, and execute its headless command in the
sandbox.

## Agent commands

| Agent | Image | Headless command | Environment |
|---|---|---|---|
| Claude Code | `ghcr.io/nanosandboxai/nanosandbox/claude:latest` | `claude --print "<prompt>"` | `ANTHROPIC_API_KEY` |
| Codex | `ghcr.io/nanosandboxai/nanosandbox/codex:latest` | `codex exec --skip-git-repo-check --json "<prompt>" < /dev/null` | `OPENAI_API_KEY` and `CODEX_API_KEY` (API-key auth) |
| Gemini CLI | `ghcr.io/nanosandboxai/nanosandbox/gemini:latest` | `gemini -p "<prompt>"` | `GEMINI_API_KEY` |
| Goose | `ghcr.io/nanosandboxai/nanosandbox/goose:latest` | `goose run --text "<prompt>"` | `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` |
| Aider | `ghcr.io/nanosandboxai/nanosandbox/aider:latest` | `aider --message "<prompt>" --yes --no-auto-commits` | provider key |
| OpenCode | `ghcr.io/nanosandboxai/nanosandbox/opencode:latest` | `opencode run "<prompt>"` | provider key |
| Crush | `ghcr.io/nanosandboxai/nanosandbox/crush:latest` | `crush run "<prompt>"` | provider key |
| Cursor | `ghcr.io/nanosandboxai/nanosandbox/cursor:latest` | `cursor-agent --message "<prompt>"` | browser sign-in (no key declared) |
| Oh-My-OpenAgent | `ghcr.io/nanosandboxai/nanosandbox/oh-my-openagent:latest` | `omo -p --no-session "<prompt>"` | one of the provider keys (see the provider catalog) |
| Oh-My-Codex | `ghcr.io/nanosandboxai/nanosandbox/oh-my-codex:latest` | `omx exec --skip-git-repo-check --json "<prompt>"` | `OPENAI_API_KEY` or `CODEX_API_KEY` |
| Oh-My-Claude | `ghcr.io/nanosandboxai/nanosandbox/oh-my-claude:latest` | `omc ask claude "<prompt>"` | `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` |

All images are published under `ghcr.io/nanosandboxai/nanosandbox/`. The built-in
sandbox adds Claude's `--verbose --output-format stream-json
--include-partial-messages` flags for structured events; `claude --print` alone
returns plain text. Codex waits for stdin when it is not a TTY, so redirect it
from `/dev/null`.

## Codex (verified)

This program was run against `v0.3.0-rc2`; the final JSON event contains the
agent message `ok`.

```python
import os
from nanosandbox import ManagedRuntime, SandboxBuilder, SandboxClient

with ManagedRuntime() as rt:
    client = SandboxClient.connect(str(rt.socket))
    box = client.create_with(
        SandboxBuilder("ghcr.io/nanosandboxai/nanosandbox/codex:latest")
        .with_name("codex-agent")
        .with_env("OPENAI_API_KEY", os.environ["OPENAI_API_KEY"])
        .with_env("CODEX_API_KEY", os.environ["OPENAI_API_KEY"])
        .with_resources(2, 2048)
    )
    box.start()
    out = box.exec(
        "sh",
        ["-c", "codex exec --skip-git-repo-check --json 'Reply with exactly: ok' < /dev/null"],
    )
    print(out["stdout"])
    box.remove(force=True)
```

Expected tail:

```json
{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"ok"}}
```

Codex waits for stdin when it is not a TTY, so redirect it from `/dev/null`.
This image uses `CODEX_API_KEY` for API-key auth; set both key variables.

## Claude

```python
import os
from nanosandbox import ManagedRuntime, SandboxBuilder, SandboxClient

with ManagedRuntime() as rt:
    client = SandboxClient.connect(str(rt.socket))
    box = client.create_with(
        SandboxBuilder("ghcr.io/nanosandboxai/nanosandbox/claude:latest")
        .with_name("claude-agent")
        .with_env("ANTHROPIC_API_KEY", os.environ["ANTHROPIC_API_KEY"])
        .with_resources(2, 2048)
    )
    box.start()
    out = box.exec("claude", ["--print", "Reply with exactly: ok"])
    print(out["stdout"])
    box.remove(force=True)
```

Requires a valid `ANTHROPIC_API_KEY`. `--print` needs no extra permission flag.
If you add `--dangerously-skip-permissions`, the CLI refuses it while the guest
runs as root; use the non-root `developer` user in that case.

## Notes

- The first run pulls the agent image; later runs reuse the local cache.
- Keys are injected as environment variables and are never printed.
- The sandbox is disposable; use a restricted permission level for untrusted
  agents.
- Per-language adapters: [Rust](./rust.md) · [Python](./python.md) ·
  [TypeScript](./typescript.md) · [Go](./go.md) · [Ruby](./ruby.md) ·
  [Java](./java.md) · [Kotlin](./kotlin.md) · [C#/.NET](./dotnet.md)
