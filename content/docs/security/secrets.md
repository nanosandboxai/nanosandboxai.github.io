---
title: "Secrets Management"
description: "Encrypted secrets pipeline for AI agent sandboxes"
order: 1
---

# Secrets Management

## Overview

AI coding agents need access to API keys, database credentials, and other sensitive values. Passing these as plain environment variables means they travel in cleartext between the host and the guest VM, where they can be read from `/proc`, shell history, or `.env` files on disk.

Nanosandbox provides an encrypted secrets pipeline that ensures credentials are never exposed in plaintext outside the agent process itself. This is especially important when agents have broad filesystem and network access inside the sandbox.

## How It Works

1. **Ephemeral key generation** -- The host generates a fresh X25519 keypair for each sandbox session. The public key is sent to the agent-gateway inside the VM.
2. **Encryption** -- Each secret is encrypted using ECDH (X25519) + AES-256-GCM before it leaves the host. A one-shot ephemeral key is used per session, so there is no long-lived key material.
3. **Ciphertext transmission** -- Only ciphertext travels between the host and the guest. No plaintext secrets appear on the wire or in any IPC channel.
4. **Decryption inside the VM** -- The agent-gateway decrypts secrets using the session private key, then immediately zeroes the key material.
5. **Process-level injection** -- Decrypted secrets are injected into the agent process via `execve` environment variables. There is no shell `export`, no `.env` file written to disk, and no `/proc` leakage to other processes.

## Configuration

Declare secrets in the `secrets:` section of your `sandbox.yml`:

```yaml
sandboxes:
  claude:
    image: claude
    secrets:
      env:
        - ANTHROPIC_API_KEY
        - DATABASE_URL
      sops_file: secrets.enc.yaml
      intercept:
        - ".env"
        - "credentials.json"
    env:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
```

## Secret Sources

### Host Environment Variables

List variable names under `secrets.env`. The host reads each value from its own environment, encrypts it, and transmits the ciphertext to the VM.

```yaml
secrets:
  env:
    - ANTHROPIC_API_KEY
    - DATABASE_URL
```

### SOPS-Encrypted Files

Point `secrets.sops_file` at a [Mozilla SOPS](https://github.com/getsops/sops)-encrypted YAML file. Nanosandbox decrypts the file on the host (using your configured SOPS backend -- age, AWS KMS, GCP KMS, etc.), then re-encrypts each value through the secrets pipeline before sending it to the VM.

```yaml
secrets:
  sops_file: secrets.enc.yaml
```

### File Interception

Patterns listed under `secrets.intercept` cause Nanosandbox to intercept matching files from the project mount. Instead of exposing the original file inside the VM, the content is:

1. Read and encrypted on the host.
2. Transmitted as ciphertext.
3. Decrypted inside the VM and written to a tmpfs-backed file with `0400` permissions (owner-read only).

This prevents secrets in files like `.env` or `credentials.json` from being readable by other processes or persisted to the VM filesystem.

```yaml
secrets:
  intercept:
    - ".env"
    - "credentials.json"
```

## Security Guarantees

- **No plaintext on the wire**: All secrets are encrypted with AES-256-GCM before transmission between host and guest.
- **One-shot ephemeral keys**: A fresh X25519 keypair is generated per sandbox session and destroyed after use.
- **No `.env` files in the VM**: Secrets are injected via `execve`, not written to disk.
- **No `/proc` leakage**: Environment variables set via `execve` are only visible to the target process, not to other processes in the VM.
- **tmpfs-backed intercepted files**: Intercepted files live on tmpfs with `0400` permissions and are never written to persistent storage.
- **Key zeroing**: Private key material is zeroed in memory immediately after decryption.

## Comparison with Plain `env:`

The existing `env:` configuration still works and is fine for non-sensitive values like feature flags or configuration URLs. For sensitive credentials, `secrets:` is recommended because it adds the encryption layer.

| | `env:` | `secrets:` |
|---|---|---|
| Encryption in transit | No | Yes (AES-256-GCM) |
| Ephemeral keys | No | Yes (X25519 per session) |
| Injection method | Shell environment | `execve` environment |
| File interception | No | Yes (tmpfs, 0400) |
| SOPS support | No | Yes |

You can use both in the same sandbox definition. Use `env:` for non-sensitive configuration and `secrets:` for credentials.
