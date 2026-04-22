# pagespeedinsight-mcp

Node.js MCP server package that exposes Google PageSpeed Insights as tools.

Agents in OpenClaw and other MCP-compatible systems can use this server to:
1. Generate page performance reports.
2. Analyze issues and opportunities from the report.
3. Re-run after fixes and iterate in an optimization loop.

Turkish documentation: `README.tr.md`

## Install

Global:
```bash
npm install -g pagespeedinsight-mcp
```

Run directly:
```bash
pagespeedinsight-mcp
```

NPX:
```bash
npx -y pagespeedinsight-mcp
```

Optional API key:
```bash
export PAGESPEEDINSIGHT_API_KEY=YOUR_API_KEY
```

## OpenClaw MCP config

```json
{
  "mcpServers": {
    "pagespeedinsight": {
      "command": "pagespeedinsight-mcp",
      "env": {
        "PAGESPEEDINSIGHT_API_KEY": "YOUR_KEY_OPTIONAL"
      }
    }
  }
}
```

## Install OpenClaw skill file

This package can create:
`app/skills/pagespeedinsight-mcp/SKILL.md`
and copies the content from `PAGESPEEDINSIGHT_TOOL_GUIDE.md` into `SKILL.md`.

Option A: auto-install during npm install (recommended)
```bash
OPENCLAW_DIR=/absolute/path/to/openclaw OPENCLAW_SKILL_OWNER=node:node npm install -g pagespeedinsight-mcp
```

Option B: manual install
```bash
pagespeedinsight-mcp install-skill --openclaw-dir /absolute/path/to/openclaw --chown node:node
```

Or provide skills directory directly:
```bash
pagespeedinsight-mcp install-skill --skills-dir /absolute/path/to/openclaw/app/skills
```

Overwrite existing file:
```bash
pagespeedinsight-mcp install-skill --openclaw-dir /absolute/path/to/openclaw --force --chown node:node
```

If your environment requires `node:node` ownership, run install with a user that can execute `chown` (root/sudo).

## Important: skill vs tool discovery

- `SKILL.md` only explains how the agent should use tools.
- Tool discovery happens through OpenClaw `mcpServers` config.
- If the agent says tool is unknown, usually the MCP server is not connected/reloaded.

## Available tools

- `run_pagespeed`
- `compare_pagespeed`

Agent usage guide:
- `docs/en/PAGESPEEDINSIGHT_TOOL_GUIDE.md`

## Dev and tests

```bash
npm install
npm run check
npm test
```

## Security and release checks

```bash
npm run security:prod
npm run security:full
npm run release:check
```
