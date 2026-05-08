---
title: "Secrets Management"
description: "Encrypted secrets pipeline for AI agent sandboxes"
order: 1
---

# Secrets Management

## Overview

Nanosandbox encrypts **all** environment variables and files before they enter the VM. Every value — whether declared via `env:`, `secrets:`, `--env`, or `env_file` — is encrypted on the host and decrypted only inside the guest. Credentials are never exposed in plaintext outside the agent process.

## Configuration

The `secrets:` section in `sandbox.yml` provides additional secret sources beyond plain `env:` — host env var lookup by name, SOPS-encrypted files, and file interception.

```yaml
sandboxes:
  claude:
    image: claude
    env:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      CUSTOM_FLAG: "true"
    secrets:
      keys:
        - DATABASE_URL
        - STRIPE_SECRET_KEY
      file: secrets.enc.yaml
      intercept_patterns:
        - ".env"
        - "credentials.json"
```

All values from both `env:` and `secrets:` are encrypted before transmission.

### keys

List host environment variable names to inject. The host reads each value from its own environment and encrypts it. Unlike `env:`, you don't need to embed `${VAR}` references — just the variable name.

```yaml
secrets:
  keys:
    - DATABASE_URL
    - STRIPE_SECRET_KEY
```

### file

Path to a [Mozilla SOPS](https://github.com/getsops/sops)-encrypted YAML file. Nanosandbox decrypts it on the host using your configured SOPS backend (age, AWS KMS, GCP KMS, etc.), then encrypts each value before sending it to the VM.

```yaml
secrets:
  file: secrets.enc.yaml
```

### intercept_patterns

File glob patterns to intercept from the project mount. Matched files are read on the host, encrypted, and written inside the VM to tmpfs with `0400` permissions. The original files are removed from the workspace mount so the agent never sees them.

```yaml
secrets:
  intercept_patterns:
    - ".env"
    - "credentials.json"
    - "*.pem"
```

## Security Guarantees

- **All env vars encrypted in transit** — both `env:` and `secrets:` values are encrypted before entering the VM.
- **Ephemeral keys per session** — a fresh keypair is generated for each sandbox and destroyed after use.
- **Process-level injection** — secrets are injected via `execve`, not shell export or `.env` files.
- **Intercepted files on tmpfs** — sensitive files live on tmpfs with `0400` permissions, never on persistent storage.
- **Key zeroing** — private key material is zeroed in memory immediately after decryption.

## env: vs secrets:

| | `env:` | `secrets:` |
|---|---|---|
| Encrypted in transit | Yes | Yes |
| Requires value in sandbox.yml | Yes (`${VAR}`) | No (name-only lookup) |
| SOPS file support | No | Yes |
| File interception | No | Yes |

Use `env:` when you have explicit values or `${VAR}` references. Use `secrets:` for SOPS integration, file interception, or referencing host env vars by name without embedding values in `sandbox.yml`.
