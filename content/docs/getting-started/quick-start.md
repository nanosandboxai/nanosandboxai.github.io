---
title: "Quick Start"
description: "Get up and running with nanosandbox in minutes"
order: 2
---

## Step 1: Verify Your Environment

After [installing](./installation.md) the CLI, run the built-in diagnostics command to confirm everything is set up correctly:

```bash
nanosb doctor
```

This checks for the presence of required dependencies (libkrun, gvproxy), verifies codesigning entitlements, and confirms that the Hypervisor.framework is accessible on your Mac.

## Step 2: Pull an Image

Download a sandbox image to your local machine. For example, pull the official Python slim image:

```bash
nanosb pull python:3.12-slim
```

You can also pull the Claude sandbox image:

```bash
nanosb pull claude
```

Images are stored locally and cached for subsequent runs.

## Step 3: Run a Command in a Sandbox

Execute a one-off command inside a microVM sandbox:

```bash
nanosb run python:3.12-slim python -c "print('Hello from a microVM')"
```

Expected output:

```
Hello from a microVM
```

The sandbox boots, runs the command, and exits -- typically in under a second.

## Step 4: Launch the TUI

For interactive sandbox management, launch the terminal UI:

```bash
nanosb
```

The TUI lets you browse pulled images, start and stop sandboxes, and inspect running instances from a single interface.

## Summary

The core workflow is:

```bash
# 1. Check your system
nanosb doctor

# 2. Pull an image
nanosb pull python:3.12-slim

# 3. Run a command
nanosb run python:3.12-slim python -c "print('Hello from a microVM')"

# 4. Or launch the TUI for interactive use
nanosb
```

See the [System Requirements](./system-requirements.md) page for supported platforms and dependency details.
