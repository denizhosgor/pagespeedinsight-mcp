# @denizhosgor/pagespeedinsight-mcp

## Supported Platforms

<p>
  <a href="https://openclaw.ai">
    <img src="https://avatars.githubusercontent.com/u/252820863?s=64&v=4" alt="OpenClaw Logo" height="34" />
  </a>
  <a href="https://paperclip.ing">
    <img src="https://avatars.githubusercontent.com/u/264498616?s=64&v=4" alt="Paperclip Logo" height="34" />
  </a>
</p>

![OpenClaw](https://img.shields.io/badge/OPENCLAW-SUPPORTED-2563EB?style=for-the-badge&labelColor=4B5563)
![Paperclip](https://img.shields.io/badge/PAPERCLIP-SUPPORTED-1D4ED8?style=for-the-badge&labelColor=4B5563)
![Build](https://img.shields.io/badge/BUILD-PASSING-44CC11?style=for-the-badge&labelColor=4B5563)
![Tests](https://img.shields.io/badge/TESTS-PASSING-44CC11?style=for-the-badge&labelColor=4B5563)
![Vulnerabilities](https://img.shields.io/badge/VULNERABILITIES-0%20HIGH%2FCRITICAL-44CC11?style=for-the-badge&labelColor=4B5563)
![Release](https://img.shields.io/npm/v/%40denizhosgor%2Fpagespeedinsight-mcp?style=for-the-badge&label=RELEASE&labelColor=4B5563)
![License](https://img.shields.io/badge/LICENSE-MIT-007EC6?style=for-the-badge&labelColor=4B5563)

Node.js package that exposes Google PageSpeed Insights as MCP tools.

Turkish documentation: `README.tr.md`

## Node.js Compatibility

- Supported Node.js versions: `20`, `22`, `24`
- Local development default: latest Node.js `24` (`.nvmrc` = `24`)

## Install

Global:

```bash
npm install -g @denizhosgor/pagespeedinsight-mcp
```

Run:

```bash
pagespeedinsight-mcp
```

NPX:

```bash
npx -y @denizhosgor/pagespeedinsight-mcp
```

## API Key

Use environment variables (never paste keys into chat/output):

```bash
export GOOGLE_API_KEY="YOUR_KEY"
# Optional alias supported by this package:
export PAGESPEEDINSIGHT_API_KEY="YOUR_KEY"
```

`PAGESPEEDINSIGHT_API_KEY` takes precedence when both are set.

## OpenClaw Setup

1. Install as an OpenClaw plugin (UI or API) using npm spec:

```text
@denizhosgor/pagespeedinsight-mcp@0.1.21
```

This package ships `openclaw.plugin.json` and auto-exposes:
- `openclaw/skills/pagespeed_insights`

2. Register MCP server:

```bash
openclaw mcp set pagespeed-insights '{"command":"npx","args":["-y","@denizhosgor/pagespeedinsight-mcp"]}'
```

3. Verify skill is loaded:

```bash
openclaw skills list
```

4. Start a new session and verify runtime tools:

```text
/new
/tools verbose
```

If you are not using OpenClaw plugin install flow, fallback manual skill install is still available:

```bash
pagespeedinsight-mcp install-skill --openclaw-dir /absolute/path/to/openclaw --chown node:node
```

### Allowlist Note

If your OpenClaw config uses skill allowlists, add `pagespeed_insights`:

```json
{
  "agents": {
    "defaults": {
      "skills": ["pagespeed_insights"]
    }
  }
}
```

## Available Tools

MCP (OpenClaw and MCP clients):

- `run_pagespeed`
- `compare_pagespeed`

Paperclip-only:

- `check_plugin_version`

## Reporting

- Each tool call writes a JSON report and returns `saved_report_path`.
- Default report directory: `<cwd>/report`
- File format: `<url>-<timestamp>.json`
- Override directory with `PAGESPEEDINSIGHT_REPORT_DIR=/custom/path`

`run_pagespeed` returns `request_context`, `summary`, optional `raw`, and `saved_report_path`.

`compare_pagespeed` returns `request_context`, `mobile`, `desktop`, `performance_delta_desktop_minus_mobile`, and `saved_report_path`.

## Paperclip Plugin Support

This package includes Paperclip manifest + worker (`src/manifest.ts`, `src/worker.ts`).

- `package.json > paperclipPlugin`
- Worker entrypoint: `dist/worker.js`
- Manifest entrypoint: `dist/manifest.js`
- Capabilities:
  - `agent.tools.register`
  - `http.outbound`
- Registered Paperclip tools:
  - `pagespeedinsight-mcp:run_pagespeed`
  - `pagespeedinsight-mcp:compare_pagespeed`
  - `pagespeedinsight-mcp:check_plugin_version`

By default, background registry version checks are disabled in health responses.
Enable only when needed:

```bash
export PAGESPEEDINSIGHT_HEALTH_VERSION_CHECK=true
```

## Security Notes

- No npm lifecycle install script (`postinstall`) is used.
- Outbound host allowlist defaults to `www.googleapis.com`.
- Override allowlist if needed:

```bash
export PAGESPEEDINSIGHT_ALLOWED_OUTBOUND_HOSTS=www.googleapis.com
```

- HTTP error responses are sanitized before returning to tools.

## OpenClaw Skill File

- Repo path: `openclaw/skills/pagespeed_insights/SKILL.md`

## Dev and Tests

```bash
npm install
npm run build
npm run typecheck
npm run check
npm test
```

## Security and Release Checks

```bash
npm run security:prod
npm run security:full
npm run release:check
```
