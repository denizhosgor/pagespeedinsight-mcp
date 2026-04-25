import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import { comparePagespeedTool, runPagespeedTool } from "../src/core/pagespeed.js";
import { checkPackageVersion } from "../src/core/version-check.js";
const runPagespeedDeclaration = {
    displayName: "Run PageSpeed Insights",
    description: "Generate full PageSpeed reports for a page.",
    parametersSchema: {
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
    }
};
const comparePagespeedDeclaration = {
    displayName: "Compare PageSpeed Insights",
    description: "Compare mobile and desktop PageSpeed reports for the same URL.",
    parametersSchema: {
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
    }
};
const checkPluginVersionDeclaration = {
    displayName: "Check Plugin Version",
    description: "Checks installed plugin version against the latest npm version.",
    parametersSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            force_refresh: { type: "boolean", default: false },
            timeout_ms: { type: "integer", minimum: 1000, maximum: 20000, default: 5000 }
        }
    }
};
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function asToolResult(payload) {
    return {
        content: JSON.stringify(payload, null, 2),
        data: payload
    };
}
function asObject(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        return {};
    }
    return input;
}
function parseUrl(params) {
    const url = params.url;
    if (typeof url !== "string" || !url.trim()) {
        throw new Error("url is required and must be a non-empty string.");
    }
    return url;
}
function parseStringArray(value) {
    if (!Array.isArray(value))
        return undefined;
    return value.map((item) => String(item));
}
function toRunPagespeedInput(input) {
    const params = asObject(input);
    return {
        url: parseUrl(params),
        strategy: params.strategy === "mobile" || params.strategy === "desktop" ? params.strategy : undefined,
        categories: parseStringArray(params.categories),
        locale: typeof params.locale === "string" ? params.locale : undefined,
        timeout_seconds: typeof params.timeout_seconds === "number" ? params.timeout_seconds : undefined,
        include_raw: typeof params.include_raw === "boolean" ? params.include_raw : undefined,
        utm_campaign: typeof params.utm_campaign === "string" ? params.utm_campaign : undefined,
        utm_source: typeof params.utm_source === "string" ? params.utm_source : undefined,
        captcha_token: typeof params.captcha_token === "string" ? params.captcha_token : undefined
    };
}
function toComparePagespeedInput(input) {
    const params = asObject(input);
    return {
        url: parseUrl(params),
        categories: parseStringArray(params.categories),
        locale: typeof params.locale === "string" ? params.locale : undefined,
        timeout_seconds: typeof params.timeout_seconds === "number" ? params.timeout_seconds : undefined,
        utm_campaign: typeof params.utm_campaign === "string" ? params.utm_campaign : undefined,
        utm_source: typeof params.utm_source === "string" ? params.utm_source : undefined,
        captcha_token: typeof params.captcha_token === "string" ? params.captcha_token : undefined
    };
}
function toVersionCheckInput(input) {
    const params = asObject(input);
    return {
        force_refresh: typeof params.force_refresh === "boolean" ? params.force_refresh : undefined,
        timeout_ms: typeof params.timeout_ms === "number" ? params.timeout_ms : undefined
    };
}
const plugin = definePlugin({
    async setup(ctx) {
        ctx.tools.register("run_pagespeed", runPagespeedDeclaration, async (params) => {
            try {
                const result = await runPagespeedTool(toRunPagespeedInput(params));
                return asToolResult(result);
            }
            catch (error) {
                ctx.logger.error("run_pagespeed failed", { error: getErrorMessage(error) });
                return { error: getErrorMessage(error) };
            }
        });
        ctx.tools.register("compare_pagespeed", comparePagespeedDeclaration, async (params) => {
            try {
                const result = await comparePagespeedTool(toComparePagespeedInput(params));
                return asToolResult(result);
            }
            catch (error) {
                ctx.logger.error("compare_pagespeed failed", { error: getErrorMessage(error) });
                return { error: getErrorMessage(error) };
            }
        });
        ctx.tools.register("check_plugin_version", checkPluginVersionDeclaration, async (params) => {
            try {
                const result = await checkPackageVersion(toVersionCheckInput(params));
                return asToolResult(result);
            }
            catch (error) {
                ctx.logger.error("check_plugin_version failed", { error: getErrorMessage(error) });
                return { error: getErrorMessage(error) };
            }
        });
    },
    async onHealth() {
        try {
            const versionStatus = await checkPackageVersion({ timeout_ms: 3000 });
            return {
                status: "ok",
                message: "pagespeedinsight-mcp worker is running",
                version_check: versionStatus
            };
        }
        catch (error) {
            return {
                status: "ok",
                message: "pagespeedinsight-mcp worker is running",
                version_check: {
                    error: getErrorMessage(error)
                }
            };
        }
    }
});
export default plugin;
runWorker(plugin, import.meta.url);
