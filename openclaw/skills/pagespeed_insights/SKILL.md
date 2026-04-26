---
name: pagespeed_insights
description: Use the configured PageSpeed Insights MCP server to analyze web performance, compare mobile and desktop results, and return prioritized optimization actions.
metadata: {"openclaw":{"emoji":"🚦","homepage":"https://github.com/denizhosgor/pagespeedinsight-mcp","requires":{"bins":["node"],"anyBins":["npx","npm","pnpm","bun"],"config":["mcp.servers.pagespeed-insights"]},"primaryEnv":"GOOGLE_API_KEY","install":[{"id":"npm","kind":"node","package":"@denizhosgor/pagespeedinsight-mcp","bins":["pagespeedinsight-mcp"],"label":"Install PageSpeed Insight MCP via npm"}]}}
---
# PageSpeed Insights Workflow

Use the configured `pagespeed-insights` MCP server.

## Available MCP tools

- `run_pagespeed`
- `compare_pagespeed`

## Default behavior

1. Validate and normalize the user URL (HTTP/HTTPS only).
2. If strategy is not specified, run both mobile and desktop (`compare_pagespeed`).
3. Return:
   - Performance, accessibility, best-practices, SEO scores
   - Core Web Vitals (LCP, CLS, INP when available)
   - Top 3 highest-impact opportunities
4. Provide a short, prioritized fix plan and suggest re-test after changes.

## Full-audit behavior

- Include mobile vs desktop differences.
- Separate field data (CrUX) and lab metrics.
- Call out render-blocking, JS execution, image optimization, and third-party impact.

## Output order

1. Executive summary
2. Score table
3. Core Web Vitals
4. Top issues by impact
5. Action plan
6. Verification steps

## Safety and reliability

- Never ask user to paste API keys into chat.
- Use `GOOGLE_API_KEY` or `PAGESPEEDINSIGHT_API_KEY` from environment only.
- Reject non-http/https URLs.
- Mention quota/timeouts/blocked-page limits when results are partial.
