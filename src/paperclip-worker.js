import { comparePagespeedTool, runPagespeedTool } from "./core/pagespeed.js";

export const PAPERCLIP_PLUGIN_ID = "pagespeedinsight-mcp";

export const PAPERCLIP_TOOLS = [
  {
    name: "run_pagespeed",
    description: "Generate a PageSpeed Insights report for a URL.",
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
  },
  {
    name: "compare_pagespeed",
    description: "Compare PageSpeed Insights results for mobile and desktop.",
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
  }
];

function normalizeIncomingToolName(rawName) {
  const normalized = String(rawName || "").trim();
  if (!normalized) return "";
  if (!normalized.includes(":")) return normalized;
  return normalized.split(":").pop() || "";
}

export async function executePaperclipTool({ toolName, parameters }) {
  const normalizedToolName = normalizeIncomingToolName(toolName);
  const args = parameters && typeof parameters === "object" ? parameters : {};

  if (normalizedToolName === "run_pagespeed") {
    return await runPagespeedTool(args);
  }
  if (normalizedToolName === "compare_pagespeed") {
    return await comparePagespeedTool(args);
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

async function registerToolWithFallbacks(ctx, qualifiedToolName, definition, handler) {
  try {
    await ctx.registerTool(qualifiedToolName, definition, handler);
    return;
  } catch {
    // noop, try next signature
  }

  try {
    await ctx.registerTool({
      name: qualifiedToolName,
      description: definition.description,
      parametersSchema: definition.parametersSchema,
      handler
    });
    return;
  } catch {
    // noop, try next signature
  }

  await ctx.registerTool(
    {
      toolName: qualifiedToolName,
      description: definition.description,
      parametersSchema: definition.parametersSchema
    },
    handler
  );
}

async function registerToolsIfSupported(ctx) {
  if (!ctx || typeof ctx.registerTool !== "function") return;

  for (const tool of PAPERCLIP_TOOLS) {
    const qualifiedToolName = `${PAPERCLIP_PLUGIN_ID}:${tool.name}`;
    const handler = async (parameters) =>
      executePaperclipTool({
        toolName: qualifiedToolName,
        parameters
      });

    await registerToolWithFallbacks(
      ctx,
      qualifiedToolName,
      {
        description: tool.description,
        parametersSchema: tool.parametersSchema
      },
      handler
    );
  }
}

export async function setup(ctx) {
  await registerToolsIfSupported(ctx);

  if (ctx && typeof ctx.on === "function") {
    ctx.on("executeTool", async (input) =>
      executePaperclipTool({
        toolName: input?.toolName || input?.name,
        parameters: input?.parameters || input?.args || {}
      })
    );
  }

  return {
    id: PAPERCLIP_PLUGIN_ID,
    tools: PAPERCLIP_TOOLS.map((tool) => `${PAPERCLIP_PLUGIN_ID}:${tool.name}`),
    executeTool: executePaperclipTool
  };
}
