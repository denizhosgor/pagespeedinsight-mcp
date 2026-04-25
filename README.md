# @denizhosgor/pagespeedinsight-mcp

Node.js MCP server package that exposes Google PageSpeed Insights as tools.

Agents in OpenClaw and other MCP-compatible systems can use this server to:
1. Generate page performance reports.
2. Analyze issues and opportunities from the report.
3. Re-run after fixes and iterate in an optimization loop.

Turkish documentation: `README.tr.md`

## Node.js compatibility

- Supported runtime versions: Node.js `20`, `22`, `24`
- Default local development target: latest Node.js `24` (`.nvmrc` = `24`)

## Install

Global:
```bash
npm install -g @denizhosgor/pagespeedinsight-mcp
```

Run directly:
```bash
pagespeedinsight-mcp
```

NPX:
```bash
npx -y @denizhosgor/pagespeedinsight-mcp
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

## Paperclip plugin support

This package also contains a Paperclip plugin manifest and worker entrypoint.

- Plugin manifest location: `package.json > paperclip`
- Plugin id: `pagespeedinsight-mcp`
- Worker entrypoint: `src/paperclip-worker.js`
- Capabilities:
  - `agent.tools.register`
  - `http.outbound`
- Registered Paperclip tools:
  - `pagespeedinsight-mcp:run_pagespeed`
  - `pagespeedinsight-mcp:compare_pagespeed`

Dual entrypoint behavior:
- OpenClaw (MCP clients) use package `bin` (`pagespeedinsight-mcp`) and stdio MCP protocol.
- Paperclip runtime ignores MCP `bin` and loads `paperclip.entrypoints.worker`.

## Install OpenClaw skill file

This package can create:
`app/skills/pagespeedinsight-mcp/SKILL.md`
and copies the content from `PAGESPEEDINSIGHT_TOOL_GUIDE.md` into `SKILL.md`.

Option A: auto-install during npm install (recommended)
```bash
OPENCLAW_DIR=/absolute/path/to/openclaw OPENCLAW_SKILL_OWNER=node:node npm install -g @denizhosgor/pagespeedinsight-mcp
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
- Raw report JSON is automatically saved under `report/<url>-<timestamp>.json`
- You can override output directory with `PAGESPEEDINSIGHT_REPORT_DIR=/custom/path`

## Reporting and results

- Every tool call writes a report file to disk and returns `saved_report_path`.
- Default directory: `<current-working-directory>/report`
- File name format: `<sanitized-url>-<timestamp>.json`
- Timestamp format: ISO-like UTC string with safe filename characters.
- Default strategy for `run_pagespeed`: `desktop`
- If `categories` is omitted, only `performance` category is requested by default.
- Optional tracking/query fields supported by both tools:
  - `utm_campaign`
  - `utm_source`
  - `captcha_token` (sent as `captchaToken` to PSI API)

`run_pagespeed` response includes:
- `request_context`
- `summary`: normalized scores and key metrics
- `summary.api_metadata` (`kind`, `analysis_utc_timestamp`, `pagespeed_version`, etc.)
- `summary.lighthouse_context` (`requested_url`, `final_url`, `run_warnings`, `runtime_error`, `config_settings`)
- `summary.loading_experience.metrics` / `summary.origin_loading_experience.metrics`
- `saved_report_path`: raw PSI JSON file path
- `raw`: only when `include_raw=true`

`compare_pagespeed` response includes:
- `request_context`
- `mobile`: mobile summary
- `desktop`: desktop summary
- `performance_delta_desktop_minus_mobile`
- `saved_report_path`: combined raw JSON path

Saved report file structure:
- `run_pagespeed`: `request_context`, `response_summary`, `raw_response`
- `compare_pagespeed`: `request_context`, `comparison_summary`, `raw_response.mobile`, `raw_response.desktop`

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
