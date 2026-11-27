# nanosandboxai.github.io: agent rules

This repo is the public site (nanosandbox.ai on GitHub Pages): docs in `content/docs/`,
pages in `src/`, diagrams in `public/diagrams/`. Workspace-wide rules (issue routing,
catalog freshness) live in `../AGENTS.md` and still apply.

## Where content lives

| Content | Repo | Path |
|---|---|---|
| Docs pages | this repo | `content/docs/<section>/<page>.md` |
| Articles, coming-soon | nanosandboxai/articles (checked out as `../articles`) | `articles/`, `coming-soon/` |
| Article plans and drafts | nanosandboxai/articles | `drafts/` (never built) |
| Social posts | nanosandboxai/articles | `posts/`: treat a push there as posted to LinkedIn and X |
| Diagrams | this repo | `public/diagrams/<name>.html` |
| Agent and skill catalogs | nanosandboxai/agents-registry (`../agents-registry`) | generated into `.generated/` at build time |

The deploy (`.github/workflows/deploy.yml`) runs on push to `main` only. It builds this repo
with the `main` branches of `articles` and `agents-registry`, so anything merged to those
`main` branches goes live on the next deploy.

## Skills

Skills live in `.agents/skills/<name>/SKILL.md` (the open Agent Skills format: YAML
`name` + `description`, then instructions). Claude Code reads them through symlinks in
`.claude/skills/`. Any other agent: when a task matches a skill's "Use when" line, read
that `SKILL.md` and follow it. Scripts are stdlib Python or Node; run them through their
interpreter (`python3 path/to/script.py`), from this repo's root.

| Skill | Use when |
|---|---|
| `writing-nanosandbox-articles` | Writing, planning, updating or publishing any article or release post. **Start here**; it routes to the others |
| `researching-release-facts` | An article needs facts about a release, feature, SDK, agent or platform; a claim is marked [verify] |
| `writing-plain-language` | Drafting or editing article prose for non-experts; checking reading ease |
| `embedding-archify-diagrams` | An article or doc needs a diagram; working in `public/diagrams/` |
| `reviewing-articles-before-publishing` | Before moving a draft to `../articles/articles/`, committing or publishing |
| `writing-launch-posts` | Announcing an article or release on LinkedIn or X (`../articles/posts/`) |
| `writing-nanosandbox-docs` | Adding, editing or reviewing a page in `content/docs/` (reader layout: title, outline, prev/next, callouts) |
| `archify` | Generating Archify diagrams (vendored tool; used by `embedding-archify-diagrams`) |

To add a skill: create `.agents/skills/<name>/SKILL.md`, then
`ln -s ../../.agents/skills/<name> .claude/skills/<name>`, then add a row above.

## Archify (interactive diagrams)

[archify explainer: on-demand]

- Archify is vendored as a project skill in `.agents/skills/archify` (v3.3.2, see
  `VENDORED.txt`). Do not upgrade it with `npx skills@latest` or the remote `llms.txt`
  installer; upgrade by copying a pinned, reviewed tag.
- Make an Archify page or explainer only when someone asks for one. The line above turns
  off Archify's default of producing pages unasked.
- Final diagrams go to `public/diagrams/<name>.html` and are embedded in docs or articles
  with an `archify` block (`src` must be under `/diagrams/`; `title` is the accessible
  label; `height` is the fallback height until the diagram reports its size):

  ````markdown
  ```archify
  src: /diagrams/<name>.html
  title: What the diagram shows
  height: 560
  ```
  ````

  Archify's working folders (`.archify/`) are gitignored.
- Update checks are disabled in `.claude/settings.json` (`ARCHIFY_UPDATE_CHECK_DISABLED=1`).
  Other agents: export `ARCHIFY_UPDATE_CHECK_DISABLED=1 ARCHIFY_UPDATE_NOTICE_DISABLED=1`
  before running Archify.
