---
title: "Secrets Management"
description: "How secrets are resolved and injected into agent sandboxes"
order: 4
---

Nanosandbox resolves environment variables on the host and injects them into the guest at boot without writing them to the sandbox config or state files. Provider values become process environment variables of the agent inside a disposable VM.

## Configuration

Environment variables are configured in the `env:` section of `sandbox.yml`. Values support the `${VAR}` syntax to reference host environment variables.

```yaml
sandboxes:
  claude:
    image: claude
    env:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      DATABASE_URL: ${DATABASE_URL}
      CUSTOM_FLAG: "true"
```

Resolved values are injected at boot (see [How secrets reach the VM](#how-secrets-reach-the-vm)) and are never written to the sandbox state on disk. If a referenced host variable is not set, sandbox creation fails with an error.

Environment variables can also be injected at runtime via the `-e` flag or `--env-file` flag. These take precedence over values defined in `sandbox.yml`.

In TUI mode, env values loaded from `./.env` and `/add --env-file` follow the same host-side resolution and boot-env injection. See [Global Flags](/docs/cli/global-flags#env-precedence) for env source resolution order.

## How secrets reach the VM

Environment values are resolved on the host at deploy time. `${VAR}` references
read the host environment; values passed with `-e`, a sandbox `env_file`, or a
TUI env source are included too. A referenced host variable that is not set
fails sandbox creation.

Resolved values are passed to the supervisor out-of-band in its boot
environment (`NANOSB_BOOT_ENV`) and injected into the guest at boot with
`krun_set_env`. They are deliberately **not** written into the sandbox's
`config.json`/`deploy.json`, so they never land on disk in the sandbox state
directory. Inside the guest they are ordinary process environment variables of
the agent process.

Legacy gateway images: for images that still ship the in-VM `agent-gateway`,
the SDK can encrypt the payload with an ephemeral X25519 keypair and
AES-256-GCM and let the gateway decrypt it in the guest. Current next-mode agent
images use the boot-env/`krun_set_env` path above.

## Security guarantees

- **No secrets in `sandbox.yml`** — configuration carries `${VAR}` references,
  not values.
- **No secrets in sandbox state** — the resolved boot env is not written to
  `config.json`, `deploy.json`, or logs.
- **Process-level injection** — secrets are environment variables of the agent
  process, not shell exports or `.env` files written inside the guest.
- **`/proc` is mounted with `hidepid=2`**, so other guest processes cannot read
  the agent's environment.
- **Disposable lifetime** — the VM and its secrets exist only for the sandbox
  session.

Prefer `env_file`, a `.env` reference, or the TUI env flow over `-e KEY=VALUE`:
command-line arguments can be captured in shell history or process listings.
Treat the host account as part of the trust boundary.

## Best Practices

Store API keys and credentials in a `.env` file and reference them in `sandbox.yml` using the `${VAR}` syntax. Never hardcode secrets directly in configuration files that may be committed to version control. Use separate API keys for sandbox environments when possible, so they can be revoked independently of production credentials.
