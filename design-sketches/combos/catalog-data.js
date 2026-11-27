// Real content from the nanosandbox-ai repo (docs manifest, skills catalog, curated MCP list).
window.CAT = {
  counts: { docs: 18, skills: 80, skillsRaw: 89, mcp: 8232 },
  docs: [
    { s: 'Getting Started', p: ['Installation', 'Quick Start', 'System Requirements'] },
    { s: 'CLI Reference', p: ['Commands', 'Configuration', 'Global Flags', 'TUI Mode', 'Project Mounting'] },
    { s: 'Security', p: ['Security Overview', 'Syscall Filtering', 'Package Installation', 'Secrets Management'] },
    { s: 'Agents', p: ['Agents Overview', 'MCP Servers', 'Skills'] },
    { s: 'Troubleshooting', p: ['Common Errors', 'Doctor Command'] },
    { s: 'Architecture', p: ['Architecture Overview'] }
  ],
  skills: [
    { n: 'brainstorming', c: 'Productivity', d: 'Structured ideation and collaborative brainstorming sessions' },
    { n: 'changelog-generator', c: 'Development', d: 'Changelogs from commit history and pull requests' },
    { n: 'frontend-design', c: 'Development', d: 'Design and build modern frontend interfaces' },
    { n: 'mcp-builder', c: 'Development', d: 'Build Model Context Protocol integrations' },
    { n: 'webapp-testing', c: 'Development', d: 'Automated testing and QA for web applications' },
    { n: 'skill-creator', c: 'Development', d: 'Create new agent skills with proper structure' },
    { n: 'pdf', c: 'Productivity', d: 'Generate, process and manipulate PDF documents' },
    { n: 'xlsx', c: 'Productivity', d: 'Process and manipulate Excel spreadsheets' },
    { n: 'docx', c: 'Productivity', d: 'Process Word documents with advanced formatting' },
    { n: 'pptx', c: 'Productivity', d: 'Create and edit PowerPoint presentations' },
    { n: 'advanced-evaluation', c: 'AI Engineering', d: 'Evaluate AI agent performance and quality' },
    { n: 'aws-skills', c: 'Cloud', d: 'AWS infrastructure management and deployment' },
    { n: 'canvas-design', c: 'Design', d: 'Visual designs and layouts for web and mobile' },
    { n: 'brand-guidelines', c: 'Design', d: 'Brand identity guidelines: colors, type, voice' },
    { n: 'algorithmic-art', c: 'Creative', d: 'Artistic patterns through creative coding' },
    { n: 'artifacts-builder', c: 'Development', d: 'Build and version development artifacts' }
  ],
  skillCats: [['Development', 36], ['Productivity', 18], ['AI Engineering', 10], ['Design', 7], ['Communication', 4], ['Creative', 3], ['Business', 3], ['Utility', 2], ['Cloud', 1], ['Research', 1]],
  mcp: [
    { id: 'github', n: 'GitHub', d: 'Issues, PRs and repos for your agent', cmd: 'npx -y @modelcontextprotocol/server-github', env: 'GITHUB_PERSONAL_ACCESS_TOKEN' },
    { id: 'filesystem', n: 'Filesystem', d: 'Read and write files in the sandbox', cmd: 'npx -y @modelcontextprotocol/server-filesystem' },
    { id: 'memory', n: 'Memory', d: 'Persistent knowledge graph memory', cmd: 'npx -y @modelcontextprotocol/server-memory' },
    { id: 'fetch', n: 'Fetch', d: 'Fetch web pages as markdown', cmd: 'uvx mcp-server-fetch' },
    { id: 'git', n: 'Git', d: 'Read and search git history', cmd: 'uvx mcp-server-git' },
    { id: 'puppeteer', n: 'Puppeteer', d: 'Drive a headless browser', cmd: 'npx -y @modelcontextprotocol/server-puppeteer' },
    { id: 'sequential-thinking', n: 'Sequential Thinking', d: 'Step-by-step reasoning tool', cmd: 'npx -y @modelcontextprotocol/server-sequential-thinking' },
    { id: 'time', n: 'Time', d: 'Time and timezone conversion', cmd: 'uvx mcp-server-time' },
    { id: 'everything', n: 'Everything', d: 'Reference server for testing clients', cmd: 'npx -y @modelcontextprotocol/server-everything' }
  ],
  mcpRegistry: [
    { n: 'ac.inference.sh/mcp', d: 'Run 150+ AI apps: image, video, audio, LLMs, 3D' },
    { n: 'ac.tandem/docs-mcp', d: 'Tandem docs, install guides and SDKs' },
    { n: 'ai.abmeter/abmeter', d: 'Feature flags and A/B testing with AI workflows' },
    { n: 'ai.adeu/adeu', d: 'Automated DOCX redlining engine' }
  ],
  agents: ['Claude Code', 'Codex', 'Goose', 'Cursor', 'OpenCode', 'Aider', 'Gemini CLI', 'Crush']
};
