---
title: "Secrets Management"
description: "Encrypted secrets pipeline for AI agent sandboxes"
order: 1
---

# Secrets Management

## Overview

Nanosandbox encrypts **all** environment variables before they enter the VM. Every value — whether declared via `env:`, `--env`, or `env_file` — is encrypted on the host and decrypted only inside the guest. Credentials are never exposed in plaintext outside the agent process.

## Configuration

Environment variables are configured in the `env:` section of `sandbox.yml`. Values support `${VAR}` syntax to reference host environment variables.

```yaml
sandboxes:
  claude:
    image: claude
    env:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      DATABASE_URL: ${DATABASE_URL}
      CUSTOM_FLAG: "true"
```

All values are encrypted before transmission to the VM.

If a referenced host variable is not set, sandbox creation fails with an error.

Environment variables can also be injected at runtime via the `-e` flag or `--env-file` flag, which take precedence over values defined in `sandbox.yml`.

## Security Guarantees

- **All env vars encrypted in transit** — values are encrypted before entering the VM.
- **Ephemeral keys per session** — a fresh keypair is generated for each sandbox and destroyed after use.
- **Process-level injection** — secrets are injected via `execve`, not shell export or `.env` files.
- **Key zeroing** — private key material is zeroed in memory immediately after decryption.
