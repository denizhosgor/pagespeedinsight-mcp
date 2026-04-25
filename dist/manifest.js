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
const manifest = {
    id: "pagespeedinsight-mcp",
    apiVersion: 1,
    version: "0.1.9",
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
        }
    ]
};
export default manifest;
