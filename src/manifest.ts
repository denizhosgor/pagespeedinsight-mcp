import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const runPagespeedParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["url"],
  properties: {
    url: { type: "string", minLength: 1 },
    strategy: { type: "string", enum: ["mobile", "desktop"], default: "desktop" },
    categories: { type: "array", items: { type: "string" } },
    locale: { type: "string", default: "en-US" },
    timeout_seconds: { type: "integer", minimum: 5, maximum: 180, default: 60 },
    include_raw: { type: "boolean", default: false },
    utm_campaign: { type: "string" },
    utm_source: { type: "string" },
    captcha_token: { type: "string" }
  }
};

const comparePagespeedParametersSchema = {
  type: "object",
  additionalProperties: false,
  required: ["url"],
  properties: {
    url: { type: "string", minLength: 1 },
    categories: { type: "array", items: { type: "string" } },
    locale: { type: "string", default: "en-US" },
    timeout_seconds: { type: "integer", minimum: 5, maximum: 180, default: 60 },
    utm_campaign: { type: "string" },
    utm_source: { type: "string" },
    captcha_token: { type: "string" }
  }
};

const checkPluginVersionParametersSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    force_refresh: { type: "boolean", default: false },
    timeout_ms: { type: "integer", minimum: 1000, maximum: 20000, default: 5000 }
  }
};

function resolvePackageVersion() {
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const packageJsonPath = path.resolve(path.dirname(currentFile), "..", "package.json");
    const raw = fs.readFileSync(packageJsonPath, "utf8");
    const pkg = JSON.parse(raw);
    const version = String(pkg?.version || "").trim();
    if (version) return version;
  } catch {
    // noop
  }
  return "0.0.0";
}

const manifest: PaperclipPluginManifestV1 = {
  id: "pagespeedinsight-mcp",
  apiVersion: 1,
  version: resolvePackageVersion(),
  displayName: "PageSpeed Insights MCP",
  description: "Run PageSpeed Insights analysis and comparisons as agent tools.",
  author: "Deniz HOSGOR",
  categories: ["connector"],
  capabilities: ["agent.tools.register", "http.outbound"],
  entrypoints: {
    worker: "./dist/worker.js"
  },
  tools: [
    {
      name: "run_pagespeed",
      displayName: "Run PageSpeed Insights",
      description: "Generate full PageSpeed reports for a page.",
      parametersSchema: runPagespeedParametersSchema
    },
    {
      name: "compare_pagespeed",
      displayName: "Compare PageSpeed Insights",
      description: "Compare mobile and desktop PageSpeed reports for the same URL.",
      parametersSchema: comparePagespeedParametersSchema
    },
    {
      name: "check_plugin_version",
      displayName: "Check Plugin Version",
      description: "Checks installed plugin version against the latest npm version.",
      parametersSchema: checkPluginVersionParametersSchema
    }
  ]
};

export default manifest;
