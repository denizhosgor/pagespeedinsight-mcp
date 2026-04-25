import fs from "node:fs";
import path from "node:path";

export const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
export const DEFAULT_TIMEOUT_SECONDS = 60;
export const DEFAULT_CATEGORIES = ["performance"];
export const DEFAULT_REPORT_DIR_NAME = "report";

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

export function getReportDir() {
  const envDir = String(process.env.PAGESPEEDINSIGHT_REPORT_DIR || "").trim();
  if (envDir) {
    return path.resolve(envDir);
  }
  return path.resolve(process.cwd(), DEFAULT_REPORT_DIR_NAME);
}

export function formatTimestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

export function sanitizeUrlForFilename(url) {
  const normalized = normalizeUrl(url);
  const withoutProtocol = normalized.replace(/^https?:\/\//i, "");
  const safe = withoutProtocol.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
  if (!safe) return "url";
  return safe.slice(0, 180);
}

export function saveReportToFile(url, payload) {
  const reportDir = getReportDir();
  fs.mkdirSync(reportDir, { recursive: true });
  const filename = `${sanitizeUrlForFilename(url)}-${formatTimestampForFile()}.json`;
  const reportPath = path.join(reportDir, filename);
  fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return reportPath;
}

function scorePercent(score) {
  if (typeof score !== "number") return null;
  return Number((score * 100).toFixed(2));
}

function getNum(input) {
  return typeof input === "number" ? input : null;
}

function extractCruxMetrics(metrics) {
  const output = {};
  const source = metrics && typeof metrics === "object" ? metrics : {};
  for (const [metricName, metricData] of Object.entries(source)) {
    output[metricName] = {
      percentile: getNum(metricData?.percentile),
      category: metricData?.category || null,
      distributions: Array.isArray(metricData?.distributions) ? metricData.distributions : []
    };
  }
  return output;
}

function extractLoadingExperienceSummary(experience) {
  const source = experience && typeof experience === "object" ? experience : {};
  return {
    id: source.id || null,
    overall_category: source.overall_category || null,
    initial_url: source.initial_url || null,
    origin_fallback: typeof source.origin_fallback === "boolean" ? source.origin_fallback : null,
    metrics: extractCruxMetrics(source.metrics)
  };
}

function extractLighthouseContext(lighthouse) {
  const source = lighthouse && typeof lighthouse === "object" ? lighthouse : {};
  const configSettings = source.configSettings || {};
  const runtimeError = source.runtimeError || null;
  return {
    fetch_time: source.fetchTime || null,
    requested_url: source.requestedUrl || null,
    final_url: source.finalUrl || null,
    lighthouse_version: source.lighthouseVersion || null,
    user_agent: source.userAgent || null,
    run_warnings: Array.isArray(source.runWarnings) ? source.runWarnings : [],
    runtime_error: runtimeError
      ? {
          code: runtimeError.code || null,
          message: runtimeError.message || null
        }
      : null,
    timing: {
      total_ms: getNum(source?.timing?.total)
    },
    config_settings: {
      locale: configSettings.locale || null,
      form_factor: configSettings.formFactor || null,
      channel: configSettings.channel || null
    }
  };
}

function extractCategoryDetails(categoryScores) {
  const source = categoryScores && typeof categoryScores === "object" ? categoryScores : {};
  const out = {};
  for (const [categoryKey, categoryValue] of Object.entries(source)) {
    out[categoryKey] = {
      id: categoryValue?.id || null,
      title: categoryValue?.title || null,
      score: scorePercent(categoryValue?.score)
    };
  }
  return out;
}

function extractApiMetadata(report) {
  const source = report && typeof report === "object" ? report : {};
  const version = source.version || {};
  return {
    kind: source.kind || null,
    captcha_result: source.captchaResult || null,
    page_id: source.id || null,
    analysis_utc_timestamp: source.analysisUTCTimestamp || null,
    pagespeed_version: {
      major: version.major || null,
      minor: version.minor || null
    }
  };
}

function buildRunReportFilePayload({ requestContext, summary, rawReport }) {
  return {
    schema_version: "1.0",
    report_type: "run_pagespeed",
    generated_at: new Date().toISOString(),
    request_context: requestContext,
    response_summary: summary,
    raw_response: rawReport
  };
}

function buildCompareReportFilePayload({ requestContext, mobileSummary, desktopSummary, rawMobile, rawDesktop, delta }) {
  return {
    schema_version: "1.0",
    report_type: "compare_pagespeed",
    generated_at: new Date().toISOString(),
    request_context: requestContext,
    comparison_summary: {
      performance_delta_desktop_minus_mobile: delta,
      mobile: mobileSummary,
      desktop: desktopSummary
    },
    raw_response: {
      mobile: rawMobile,
      desktop: rawDesktop
    }
  };
}

export function summarizeReport(report, strategy, categories) {
  const lighthouse = report?.lighthouseResult || {};
  const audits = lighthouse?.audits || {};
  const categoryScores = lighthouse?.categories || {};
  const loadingExperience = extractLoadingExperienceSummary(report?.loadingExperience || {});
  const originLoadingExperience = extractLoadingExperienceSummary(report?.originLoadingExperience || {});
  const apiMetadata = extractApiMetadata(report);
  const lighthouseContext = extractLighthouseContext(lighthouse);

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
    analysis_timestamp: report?.analysisUTCTimestamp || lighthouse?.fetchTime || null,
    lighthouse_version: lighthouse?.lighthouseVersion || null,
    api_metadata: apiMetadata,
    lighthouse_context: lighthouseContext,
    categories: categoriesOut,
    category_details: extractCategoryDetails(categoryScores),
    key_metrics: keyMetrics,
    loading_experience: loadingExperience,
    origin_loading_experience: originLoadingExperience,
    top_opportunities: opportunities.slice(0, 5)
  };
}

export async function fetchPsi(targetUrl, strategy, categories, locale, timeoutSeconds, requestMeta = {}) {
  const normalizedUrl = normalizeUrl(targetUrl);
  const normalizedStrategy = String(strategy || "desktop").trim().toLowerCase();
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
  if (requestMeta?.utm_campaign) {
    searchParams.set("utm_campaign", String(requestMeta.utm_campaign));
  }
  if (requestMeta?.utm_source) {
    searchParams.set("utm_source", String(requestMeta.utm_source));
  }
  if (requestMeta?.captcha_token) {
    searchParams.set("captchaToken", String(requestMeta.captcha_token));
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

export async function runPagespeedTool({
  url,
  strategy = "desktop",
  categories,
  locale = "en-US",
  timeout_seconds: timeoutSeconds = DEFAULT_TIMEOUT_SECONDS,
  include_raw: includeRaw = false,
  utm_campaign,
  utm_source,
  captcha_token
}) {
  const normalizedUrl = normalizeUrl(url);
  const normalizedStrategy = String(strategy || "desktop").trim().toLowerCase();
  const normalizedCategories = normalizeCategories(categories);
  const requestContext = {
    url: normalizedUrl,
    strategy: normalizedStrategy,
    categories: normalizedCategories,
    locale: locale || null,
    timeout_seconds: clampTimeout(timeoutSeconds),
    include_raw: Boolean(includeRaw),
    utm_campaign: utm_campaign || null,
    utm_source: utm_source || null,
    captcha_token_provided: Boolean(captcha_token)
  };

  const report = await fetchPsi(
    normalizedUrl,
    normalizedStrategy,
    normalizedCategories,
    locale,
    timeoutSeconds,
    { utm_campaign, utm_source, captcha_token }
  );
  const summary = summarizeReport(report, normalizedStrategy, normalizedCategories);
  const savedReportPath = saveReportToFile(
    normalizedUrl,
    buildRunReportFilePayload({
      requestContext,
      summary,
      rawReport: report
    })
  );
  if (includeRaw) {
    return { request_context: requestContext, summary, raw: report, saved_report_path: savedReportPath };
  }
  return { request_context: requestContext, summary, saved_report_path: savedReportPath };
}

export async function comparePagespeedTool({
  url,
  categories,
  locale = "en-US",
  timeout_seconds: timeoutSeconds = DEFAULT_TIMEOUT_SECONDS,
  utm_campaign,
  utm_source,
  captcha_token
}) {
  const normalizedUrl = normalizeUrl(url);
  const normalizedCategories = normalizeCategories(categories);
  const requestContext = {
    url: normalizedUrl,
    categories: normalizedCategories,
    locale: locale || null,
    timeout_seconds: clampTimeout(timeoutSeconds),
    utm_campaign: utm_campaign || null,
    utm_source: utm_source || null,
    captcha_token_provided: Boolean(captcha_token)
  };
  const mobile = await fetchPsi(normalizedUrl, "mobile", normalizedCategories, locale, timeoutSeconds, {
    utm_campaign,
    utm_source,
    captcha_token
  });
  const desktop = await fetchPsi(normalizedUrl, "desktop", normalizedCategories, locale, timeoutSeconds, {
    utm_campaign,
    utm_source,
    captcha_token
  });

  const mobileSummary = summarizeReport(mobile, "mobile", normalizedCategories);
  const desktopSummary = summarizeReport(desktop, "desktop", normalizedCategories);

  const perfMobile = mobileSummary?.categories?.performance;
  const perfDesktop = desktopSummary?.categories?.performance;
  const perfDelta =
    typeof perfMobile === "number" && typeof perfDesktop === "number"
      ? Number((perfDesktop - perfMobile).toFixed(2))
      : null;

  const savedReportPath = saveReportToFile(
    normalizedUrl,
    buildCompareReportFilePayload({
      requestContext,
      mobileSummary,
      desktopSummary,
      rawMobile: mobile,
      rawDesktop: desktop,
      delta: perfDelta
    })
  );

  return {
    url: normalizedUrl,
    request_context: requestContext,
    performance_delta_desktop_minus_mobile: perfDelta,
    mobile: mobileSummary,
    desktop: desktopSummary,
    saved_report_path: savedReportPath
  };
}
