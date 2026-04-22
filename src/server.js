import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
export const DEFAULT_TIMEOUT_SECONDS = 60;
export const DEFAULT_CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

export function normalizeUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) {
    throw new Error("URL cannot be empty.");
  }
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function clampTimeout(timeoutSeconds) {
  const n = Number(timeoutSeconds);
  if (!Number.isFinite(n)) return DEFAULT_TIMEOUT_SECONDS;
  if (n < 5) return 5;
  if (n > 180) return 180;
  return Math.trunc(n);
}

export function normalizeCategories(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return DEFAULT_CATEGORIES;
  }

  const normalized = categories
    .map((c) => String(c || "").trim().toLowerCase())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : DEFAULT_CATEGORIES;
}

function scorePercent(score) {
  if (typeof score !== "number") return null;
  return Number((score * 100).toFixed(2));
}

function getNum(input) {
  return typeof input === "number" ? input : null;
}

export function summarizeReport(report, strategy, categories) {
  const lighthouse = report?.lighthouseResult || {};
  const audits = lighthouse?.audits || {};
  const categoryScores = lighthouse?.categories || {};
  const loadingExperience = report?.loadingExperience || {};
  const originLoadingExperience = report?.originLoadingExperience || {};

  const categoriesOut = {};
  for (const c of categories) {
    categoriesOut[c] = scorePercent(categoryScores?.[c]?.score);
  }

  const keyMetrics = {
    fcp_ms: getNum(audits?.["first-contentful-paint"]?.numericValue),
    lcp_ms: getNum(audits?.["largest-contentful-paint"]?.numericValue),
    speed_index_ms: getNum(audits?.["speed-index"]?.numericValue),
    tbt_ms: getNum(audits?.["total-blocking-time"]?.numericValue),
    cls: getNum(audits?.["cumulative-layout-shift"]?.numericValue),
    inp_ms: getNum(audits?.["interaction-to-next-paint"]?.numericValue)
  };

  const opportunities = [];
  for (const [auditId, audit] of Object.entries(audits)) {
    const details = audit?.details || {};
    const numericValue = getNum(audit?.numericValue);

    if (details?.type === "opportunity" && numericValue !== null && numericValue > 0) {
      opportunities.push({
        audit_id: auditId,
        title: audit?.title || null,
        description: audit?.description || null,
        estimated_savings_ms: Number(numericValue.toFixed(2))
      });
      continue;
    }

    if (
      ["render-blocking-resources", "unused-javascript", "unused-css-rules"].includes(auditId) &&
      numericValue !== null &&
      numericValue > 0
    ) {
      opportunities.push({
        audit_id: auditId,
        title: audit?.title || null,
        description: audit?.description || null,
        estimated_savings_ms: Number(numericValue.toFixed(2))
      });
    }
  }

  opportunities.sort((a, b) => (b.estimated_savings_ms || 0) - (a.estimated_savings_ms || 0));

  return {
    requested_strategy: strategy,
    final_url: report?.id || null,
    analysis_timestamp: lighthouse?.fetchTime || null,
    lighthouse_version: lighthouse?.lighthouseVersion || null,
    categories: categoriesOut,
    key_metrics: keyMetrics,
    loading_experience: {
      overall_category: loadingExperience?.overall_category || null,
      initial_url: loadingExperience?.initial_url || null
    },
    origin_loading_experience: {
      overall_category: originLoadingExperience?.overall_category || null,
      origin_fallback: originLoadingExperience?.origin_fallback || null
    },
    top_opportunities: opportunities.slice(0, 5)
  };
}

export async function fetchPsi(targetUrl, strategy, categories, locale, timeoutSeconds) {
  const normalizedUrl = normalizeUrl(targetUrl);
  const normalizedStrategy = String(strategy || "mobile").trim().toLowerCase();
  if (!["mobile", "desktop"].includes(normalizedStrategy)) {
    throw new Error("strategy must be 'mobile' or 'desktop'.");
  }

  const normalizedCategories = normalizeCategories(categories);
  const normalizedTimeout = clampTimeout(timeoutSeconds);

  const searchParams = new URLSearchParams();
  searchParams.set("url", normalizedUrl);
  searchParams.set("strategy", normalizedStrategy);
  searchParams.set("timeout", String(normalizedTimeout));
  for (const category of normalizedCategories) {
    searchParams.append("category", category);
  }

  if (locale) {
    searchParams.set("locale", String(locale));
  }

  const apiKey = String(process.env.PAGESPEEDINSIGHT_API_KEY || "").trim();
  if (apiKey) {
    searchParams.set("key", apiKey);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), normalizedTimeout * 1000);

  let response;
  try {
    response = await fetch(`${PSI_ENDPOINT}?${searchParams.toString()}`, {
      method: "GET",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PageSpeed API request failed: HTTP ${response.status} ${body}`);
  }

  const payload = await response.json();
  if (payload?.error) {
    throw new Error(`PageSpeed API error: ${JSON.stringify(payload.error)}`);
  }

  return payload;
}

function asToolResponse(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data
  };
}

export async function runPagespeedTool({
  url,
  strategy = "mobile",
  categories,
  locale = "en-US",
  timeout_seconds: timeoutSeconds = DEFAULT_TIMEOUT_SECONDS,
  include_raw: includeRaw = false
}) {
  const normalizedStrategy = String(strategy || "mobile").trim().toLowerCase();
  const normalizedCategories = normalizeCategories(categories);
  const report = await fetchPsi(url, normalizedStrategy, normalizedCategories, locale, timeoutSeconds);
  const summary = summarizeReport(report, normalizedStrategy, normalizedCategories);
  if (includeRaw) {
    return { summary, raw: report };
  }
  return { summary };
}

export async function comparePagespeedTool({
  url,
  categories,
  locale = "en-US",
  timeout_seconds: timeoutSeconds = DEFAULT_TIMEOUT_SECONDS
}) {
  const normalizedCategories = normalizeCategories(categories);
  const mobile = await fetchPsi(url, "mobile", normalizedCategories, locale, timeoutSeconds);
  const desktop = await fetchPsi(url, "desktop", normalizedCategories, locale, timeoutSeconds);

  const mobileSummary = summarizeReport(mobile, "mobile", normalizedCategories);
  const desktopSummary = summarizeReport(desktop, "desktop", normalizedCategories);

  const perfMobile = mobileSummary?.categories?.performance;
  const perfDesktop = desktopSummary?.categories?.performance;
  const perfDelta =
    typeof perfMobile === "number" && typeof perfDesktop === "number"
      ? Number((perfDesktop - perfMobile).toFixed(2))
      : null;

  return {
    url: normalizeUrl(url),
    performance_delta_desktop_minus_mobile: perfDelta,
    mobile: mobileSummary,
    desktop: desktopSummary
  };
}

export function createServer() {
  const server = new McpServer({
    name: "pagespeedinsight",
    version: "0.1.0"
  });

  server.tool(
    "run_pagespeed",
    "Analyze a URL with Google PageSpeed Insights.",
    {
      url: z.string().min(1),
      strategy: z.enum(["mobile", "desktop"]).default("mobile"),
      categories: z.array(z.string()).optional(),
      locale: z.string().default("en-US"),
      timeout_seconds: z.number().int().min(5).max(180).default(DEFAULT_TIMEOUT_SECONDS),
      include_raw: z.boolean().default(false)
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
      timeout_seconds: z.number().int().min(5).max(180).default(DEFAULT_TIMEOUT_SECONDS)
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
