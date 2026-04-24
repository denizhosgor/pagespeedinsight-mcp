# PageSpeedInsight MCP Tool Guide (For Agents)

This document is prepared to guide agents in correctly calling tools within the `pagespeedinsight` MCP server.

## Tool List

### 1) `run_pagespeed`
Runs an analysis for a single strategy (mobile/desktop).

**Input**
- `url` (required, string): Target URL. (`https://...` is recommended)
- `strategy` (optional, string): `mobile` or `desktop` (default: `mobile`)
- `categories` (optional, string[]): e.g., `["performance","seo"]`
- `locale` (optional, string): e.g., `tr-TR`, `en-US` (default: `en-US`)
- `timeout_seconds` (optional, int): Between 5-180 (default: 60)
- `include_raw` (optional, bool): If `true`, the raw PSI response is also returned.

**Output**
- `summary`:
  - `categories` scores (0-100)
  - `key_metrics` (FCP/LCP/CLS/TBT/INP etc.)
  - `top_opportunities` (highest estimated savings)
- `saved_report_path`: Full path of the saved raw JSON report file (`report/<url>-<timestamp>.json`)

### 2) `compare_pagespeed`
Compares mobile + desktop results for the same URL.

**Input**
- `url` (required, string)
- `categories` (optional, string[])
- `locale` (optional, string)
- `timeout_seconds` (optional, int)

**Output**
- `mobile` summary
- `desktop` summary
- `performance_delta_desktop_minus_mobile`
- `saved_report_path`: Full path of saved combined raw JSON report (mobile + desktop)

## Reporting Behavior

1. Every call writes a JSON report file to disk.
2. By default files are written under `report/` in current working directory.
3. You can override directory via `PAGESPEEDINSIGHT_REPORT_DIR`.
4. For `compare_pagespeed`, saved file includes both raw payloads:
   - `mobile`
   - `desktop`
   - plus `url` and `saved_at`

## Agent Usage Rules

1. First, perform a `mobile` analysis using `run_pagespeed`.
2. If necessary, call `compare_pagespeed` to report the device difference.
3. Maintain the following order when reporting results:
   - Overall performance score
   - Core Web Vitals metrics (LCP, CLS, INP)
   - Top 3 high-impact improvement items
4. If `url` is provided without a protocol (`example.com`), you can still send it; the server automatically adds `https://`.
5. In case of an error, return the API error message to the user in a simple sentence.

## Sample Tool Calls

### Example 1: Single analysis
```json
{
  "tool": "run_pagespeed",
  "arguments": {
    "url": "https://example.com",
    "strategy": "mobile",
    "categories": ["performance", "seo"],
    "locale": "tr-TR"
  }
}
```

### Example 2: Mobile/Desktop comparison
```json
{
  "tool": "compare_pagespeed",
  "arguments": {
    "url": "https://example.com",
    "categories": ["performance", "accessibility"],
    "locale": "en-US"
  }
}
```

## Example Result Fields

- `summary.categories.performance`
- `summary.key_metrics.lcp_ms`
- `summary.top_opportunities`
- `saved_report_path`

## Suggested Agent Response Format

- `Performance`: `<score>/100`
- `CWV`: `LCP <x>ms, CLS <y>, INP <z>ms`
- `Top Opportunities`:
  1. `<title> (<estimated_savings_ms>ms)`
  2. `<title> (...)`
  3. `<title> (...)`
- `Recommendation`: Write the first 2 actions in a brief and actionable manner.
