import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getInstalledPackageInfo } from "./core/version-check.js";

export {
  PSI_ENDPOINT,
  DEFAULT_TIMEOUT_SECONDS,
  DEFAULT_CATEGORIES,
  DEFAULT_REPORT_DIR_NAME,
  DEFAULT_ALLOWED_OUTBOUND_HOSTS,
  normalizeUrl,
  clampTimeout,
  getAllowedOutboundHosts,
  assertAllowedOutboundHost,
  normalizeCategories,
  getReportDir,
  formatTimestampForFile,
  sanitizeUrlForFilename,
  saveReportToFile,
  summarizeReport,
  fetchPsi,
  runPagespeedTool,
  comparePagespeedTool
} from "./core/pagespeed.js";

import { DEFAULT_TIMEOUT_SECONDS, comparePagespeedTool, runPagespeedTool } from "./core/pagespeed.js";

function asToolResponse(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data
  };
}

export function resolveServerVersion() {
  try {
    const pkg = getInstalledPackageInfo();
    const version = String(pkg?.version || "").trim();
    if (version) return version;
  } catch {
    // noop
  }
  return "0.0.0";
}

export function createServer() {
  const server = new McpServer({
    name: "pagespeedinsight",
    version: resolveServerVersion()
  });

  server.tool(
    "run_pagespeed",
    "Analyze one HTTP/HTTPS URL with Google PageSpeed Insights and return score summaries, Core Web Vitals, opportunities, and saved report path.",
    {
      url: z.string().min(1),
      strategy: z.enum(["mobile", "desktop"]).default("desktop"),
      categories: z.array(z.string()).optional(),
      locale: z.string().default("en-US"),
      timeout_seconds: z.number().int().min(5).max(180).default(DEFAULT_TIMEOUT_SECONDS),
      include_raw: z.boolean().default(false),
      utm_campaign: z.string().optional(),
      utm_source: z.string().optional(),
      captcha_token: z.string().optional()
    },
    async (args) => asToolResponse(await runPagespeedTool(args))
  );

  server.tool(
    "compare_pagespeed",
    "Run both mobile and desktop PageSpeed Insights analyses for the same URL and return comparable summaries plus performance delta.",
    {
      url: z.string().min(1),
      categories: z.array(z.string()).optional(),
      locale: z.string().default("en-US"),
      timeout_seconds: z.number().int().min(5).max(180).default(DEFAULT_TIMEOUT_SECONDS),
      utm_campaign: z.string().optional(),
      utm_source: z.string().optional(),
      captcha_token: z.string().optional()
    },
    async (args) => asToolResponse(await comparePagespeedTool(args))
  );

  return server;
}

export async function runStdioServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
