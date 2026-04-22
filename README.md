# pagespeedinsight-mcp

Language versions:
- Turkish: `README.tr.md`

This package exposes Google PageSpeed Insights as MCP tools so agents in OpenClaw and other MCP-compatible systems can:
1. Fetch page performance reports.
2. Analyze detected issues.
3. Feed findings back into an optimization/reprocessing loop.

----

# pagespeedinsight-mcp

Node.js MCP server package that exposes Google PageSpeed Insights as tools.

Agents in OpenClaw and other MCP-compatible systems can use this server to:
1. Generate full PageSpeed reports for a page.
2. Analyze issues and opportunities from the report.
3. Feed the output back into an optimization loop and re-run checks after changes.

## Install and run

Global install:
```bash
npm install -g pagespeedinsight-mcp
pagespeedinsight-mcp
```

Run with npx:
```bash
npx -y pagespeedinsight-mcp
```

Optional API key:
```bash
export PAGESPEEDINSIGHT_API_KEY=YOUR_API_KEY
```

## OpenClaw MCP config

Global package:
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

NPX:
```json
{
  "mcpServers": {
    "pagespeedinsight": {
      "command": "npx",
      "args": ["-y", "pagespeedinsight-mcp"],
      "env": {
        "PAGESPEEDINSIGHT_API_KEY": "YOUR_KEY_OPTIONAL"
      }
    }
  }
}
```

## Available tools

- `run_pagespeed`
- `compare_pagespeed`

Agent tool usage guide:
- `docs/PAGESPEEDINSIGHT_TOOL_GUIDE.md`

## Development

```bash
npm install
npm run check
npm start
```

## Tests

```bash
npm test
npm run test:watch
```

## Security and release checks

Production dependency audit:
```bash
npm run security:prod
```

Full dependency audit (including dev deps):
```bash
npm run security:full
```

Single pre-release check:
```bash
npm run release:check
```

`release:check` runs:
1. `npm run check` (syntax + tests)
2. `npm run security:prod` (audit)
3. `npm run pack:dry-run` (package verification)

## npm publish

1. Ensure `name` in `package.json` is unique.
2. Bump version: `npm version patch` (or `minor`/`major`).
3. Login: `npm login`
4. Publish: `npm publish --access public`
