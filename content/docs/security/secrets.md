---
title: "Secrets Management"
description: "Encrypted secrets pipeline for AI agent sandboxes"
order: 4
---

# Secrets Management

Nanosandbox encrypts all environment variables before they enter the VM. Every value, whether declared in `env:`, passed via `--env`, or loaded from an `env_file`, is encrypted on the host and decrypted only inside the guest. Credentials are never exposed in plaintext outside the agent process.

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

All values are encrypted before transmission to the VM. If a referenced host variable is not set, sandbox creation fails with an error.

Environment variables can also be injected at runtime via the `-e` flag or `--env-file` flag. These take precedence over values defined in `sandbox.yml`.

## Encryption Pipeline

The encryption pipeline uses modern cryptographic primitives to protect secrets in transit between the host and the VM.

A fresh X25519 keypair is generated for each sandbox session. The host encrypts environment variables using the gateway's public key with AES-256-GCM authenticated encryption. The encrypted payload is transmitted to the gateway inside the VM, which decrypts it using the corresponding private key. Decrypted values are injected into agent processes via the operating system's process environment mechanism, never through shell export or `.env` files on disk.

After decryption, key material is zeroed in memory immediately. The keypair is ephemeral and is destroyed when the sandbox shuts down.

## Security Guarantees

All environment variables are encrypted in transit between the host and the VM. A fresh keypair is generated for each sandbox session, so compromising one session does not affect others. Secrets are injected at the process level via `execve`, which means they never appear in shell history, `.env` files, or process command lines. Private key material is zeroed in memory immediately after decryption to minimize the window of exposure.

Inside the VM, the `/proc` filesystem is mounted with `hidepid=2`, which prevents processes from reading other processes' environment variables. This ensures that even within the VM, secrets are only visible to the agent process that owns them.

## Best Practices

Store API keys and credentials in a `.env` file and reference them in `sandbox.yml` using the `${VAR}` syntax. Never hardcode secrets directly in configuration files that may be committed to version control. Use separate API keys for sandbox environments when possible, so they can be revoked independently of production credentials.
