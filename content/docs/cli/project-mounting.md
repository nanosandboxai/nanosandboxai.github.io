---
title: "Project Mounting"
description: "How nanosb mounts your project directory into sandboxes, with and without git"
order: 5
---

# Project Mounting

When you pass a project directory to nanosb, it mounts your code into the sandbox at `/workspace`. Each sandbox gets an isolated copy — changes made inside the sandbox stay on a separate branch and never touch your working directory until you decide to merge them.

## How It Works

When you launch nanosb with a project directory:

```bash
nanosb --project /path/to/myapp
```

nanosb creates a local clone of your project for each sandbox and mounts it at `/workspace`. Agent changes accumulate in that clone on a dedicated branch named `nanosb/<short-id>`. When the session ends, that branch is fetched back into your source directory.

```
your project/
├── main branch      ← your work, untouched
└── nanosb/abc12345  ← agent's branch, fetched back on teardown
```

You can then inspect, merge, or discard the agent's work using standard git commands.

## Git Projects

For directories that already contain a `.git` repository, nanosb clones the repo locally and creates a new branch for each sandbox:

```bash
cd ~/myapp          # has .git
nanosb              # auto-detects project from CWD
```

Each sandbox gets its own `nanosb/<short-id>` branch. Multiple sandboxes on the same repo work independently — their branches never conflict.

## Non-Git Projects

Directories without a `.git` repository are fully supported. On first use, nanosb initialises a git repository in your project directory automatically:

1. Writes a `.gitignore` covering common build artifacts and secrets (see below)
2. Runs `git init` and commits all tracked files as `"initial snapshot"`
3. Proceeds with the normal clone-and-branch flow

```bash
cd ~/my-python-script   # no .git
nanosb                  # initialises git, then mounts as usual
```

After the first run your directory will contain a `.git` folder and the standard `nanosb/<short-id>` branches — identical to any other git-backed project.

This is idempotent: if the directory already has a `.git` (from a previous nanosb run or otherwise), nanosb skips initialisation and proceeds directly to cloning.

### Generated `.gitignore`

When nanosb creates the `.gitignore` it covers the most common artifact and secret paths across languages and toolchains:

| Category | Excluded paths |
|---|---|
| Node.js | `node_modules/`, `dist/`, `.next/`, `.nuxt/` |
| Python | `__pycache__/`, `*.pyc`, `.venv/`, `venv/` |
| Rust | `target/` |
| Java / Gradle / Maven | `*.class`, `*.jar`, `build/`, `.gradle/`, `.m2/` |
| Go | `vendor/`, `bin/` |
| .NET / C# | `bin/`, `obj/`, `.vs/` |
| Frontend | `.svelte-kit/`, `.astro/`, `.vite/`, `.cache/` |
| Terraform | `.terraform/`, `*.tfstate`, `*.tfvars` |
| Secrets | `.env`, `.env.local`, `*.pem`, `*.key`, `credentials.json` |
| OS / IDE | `.DS_Store`, `.idea/`, `.vscode/` |

If you already have a `.gitignore`, nanosb leaves it untouched.

## Reviewing Agent Changes

After a session ends, the agent's branch is available in your project directory:

```bash
# List agent branches
git branch -a

# See what changed
git diff main...nanosb/<short-id>

# Merge the changes
git merge nanosb/<short-id>

# Or discard them
git branch -d nanosb/<short-id>
```

## Multiple Sandboxes on the Same Project

Running several agents on the same directory works out of the box. Each gets an independent branch:

```
nanosb/aabb1122  ← sandbox A
nanosb/ccdd3344  ← sandbox B
```

You can compare them, cherry-pick specific commits, or merge selectively:

```bash
git log nanosb/aabb1122
git diff nanosb/aabb1122 nanosb/ccdd3344
```

## Auto-Detection

When you run `nanosb` without `--project`, it uses the current working directory as the project path automatically — whether or not it contains a `.git` repository.

```bash
cd ~/any-directory
nanosb              # mounts this directory
```

To point at a different directory:

```bash
nanosb --project /path/to/project
```
