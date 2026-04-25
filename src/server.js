import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export {
  PSI_ENDPOINT,
  DEFAULT_TIMEOUT_SECONDS,
  DEFAULT_CATEGORIES,
  DEFAULT_REPORT_DIR_NAME,
  normalizeUrl,
  clampTimeout,
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

export function createServer() {
  const server = new McpServer({
    name: "pagespeedinsight",
    version: "0.1.9"
  });

  server.tool(
    "run_pagespeed",
    "Analyze a URL with Google PageSpeed Insights.",
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
    "Compare PageSpeed Insights mobile and desktop analyses for the same URL.",
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
