# PageSpeedInsight MCP Skill

Use this skill when you need to analyze a web page with Google PageSpeed Insights through MCP tools.

## Available tools

- `run_pagespeed`
- `compare_pagespeed`

## Usage flow

1. Call `run_pagespeed` first with `strategy=mobile`.
2. If device comparison is needed, call `compare_pagespeed`.
3. Report:
   - Performance score
   - Core Web Vitals (LCP, CLS, INP)
   - Top 3 opportunities by estimated savings
4. Provide 2-3 actionable fixes and re-run analysis after changes.

## Example tool call

```json
{
  "tool": "run_pagespeed",
  "arguments": {
    "url": "https://example.com",
    "strategy": "mobile",
    "categories": ["performance", "accessibility", "best-practices", "seo"],
    "locale": "tr-TR"
  }
}
```

## Important

- This skill does not register tools by itself.
- MCP server must be configured in OpenClaw `mcpServers` so the agent can discover tools.
