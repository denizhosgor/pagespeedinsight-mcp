import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

import { comparePagespeedTool, runPagespeedTool } from "../../src/server.js";
import { makePsiPayload } from "../helpers/psi-fixtures.js";

const originalFetch = global.fetch;
let reportDir = "";

function mockOkJson(payload) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  };
}

describe("tool handlers", () => {
  beforeEach(() => {
    process.env.PAGESPEEDINSIGHT_API_KEY = "";
    process.env.GOOGLE_API_KEY = "";
    reportDir = path.join("/tmp", `psi-test-report-${Date.now()}-${Math.floor(Math.random() * 100000)}`);
    process.env.PAGESPEEDINSIGHT_REPORT_DIR = reportDir;
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.PAGESPEEDINSIGHT_REPORT_DIR;
    delete process.env.GOOGLE_API_KEY;
    fs.rmSync(reportDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("runPagespeedTool returns summary and raw when include_raw is true", async () => {
    const payload = makePsiPayload({ performanceScore: 0.73 });
    global.fetch.mockResolvedValue(mockOkJson(payload));

    const result = await runPagespeedTool({
      url: "ikinokta360.com",
      strategy: "mobile",
      locale: "tr-TR",
      include_raw: true,
      utm_campaign: "agent-check",
      utm_source: "openclaw"
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const requestUrl = new URL(global.fetch.mock.calls[0][0]);
    expect(requestUrl.searchParams.get("url")).toBe("https://ikinokta360.com");
    expect(requestUrl.searchParams.get("strategy")).toBe("mobile");
    expect(requestUrl.searchParams.get("utm_campaign")).toBe("agent-check");
    expect(requestUrl.searchParams.get("utm_source")).toBe("openclaw");
    expect(result.request_context.url).toBe("https://ikinokta360.com");
    expect(result.summary.categories.performance).toBe(73);
    expect(result.raw.id).toBe(payload.id);
    expect(result.saved_report_path.startsWith(reportDir)).toBe(true);
    expect(fs.existsSync(result.saved_report_path)).toBe(true);
    const savedJson = JSON.parse(fs.readFileSync(result.saved_report_path, "utf8"));
    expect(savedJson.report_type).toBe("run_pagespeed");
    expect(savedJson.response_summary.categories.performance).toBe(73);
    expect(savedJson.raw_response.id).toBe(payload.id);
  });

  it("comparePagespeedTool calls PSI twice and returns desktop-minus-mobile delta", async () => {
    const mobilePayload = makePsiPayload({
      id: "https://ikinokta360.com/",
      performanceScore: 0.61
    });
    const desktopPayload = makePsiPayload({
      id: "https://ikinokta360.com/",
      performanceScore: 0.89
    });

    global.fetch
      .mockResolvedValueOnce(mockOkJson(mobilePayload))
      .mockResolvedValueOnce(mockOkJson(desktopPayload));

    const result = await comparePagespeedTool({
      url: "https://ikinokta360.com",
      categories: ["performance", "seo"]
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const firstCall = new URL(global.fetch.mock.calls[0][0]);
    const secondCall = new URL(global.fetch.mock.calls[1][0]);
    expect(firstCall.searchParams.get("strategy")).toBe("mobile");
    expect(secondCall.searchParams.get("strategy")).toBe("desktop");
    expect(result.performance_delta_desktop_minus_mobile).toBe(28);
    expect(result.mobile.categories.performance).toBe(61);
    expect(result.desktop.categories.performance).toBe(89);
    expect(result.saved_report_path.startsWith(reportDir)).toBe(true);
    expect(fs.existsSync(result.saved_report_path)).toBe(true);
    const savedJson = JSON.parse(fs.readFileSync(result.saved_report_path, "utf8"));
    expect(savedJson.report_type).toBe("compare_pagespeed");
    expect(savedJson.raw_response.mobile.id).toBe("https://ikinokta360.com/");
    expect(savedJson.raw_response.desktop.id).toBe("https://ikinokta360.com/");
    expect(savedJson.comparison_summary.performance_delta_desktop_minus_mobile).toBe(28);
  });

  it("uses GOOGLE_API_KEY when PAGESPEEDINSIGHT_API_KEY is not set", async () => {
    const payload = makePsiPayload({ performanceScore: 0.77 });
    process.env.GOOGLE_API_KEY = "google-key-fallback";
    global.fetch.mockResolvedValue(mockOkJson(payload));

    await runPagespeedTool({
      url: "https://ikinokta360.com",
      strategy: "desktop"
    });

    const requestUrl = new URL(global.fetch.mock.calls[0][0]);
    expect(requestUrl.searchParams.get("key")).toBe("google-key-fallback");
  });

  it("redacts HTTP error body details from thrown messages", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({ error: { message: "do-not-leak-secret-token" } }),
      text: async () => "do-not-leak-secret-token"
    });

    await expect(
      runPagespeedTool({
        url: "https://ikinokta360.com",
        strategy: "mobile"
      })
    ).rejects.toThrow(/PageSpeed API request failed: HTTP 400 Bad Request/);

    await expect(
      runPagespeedTool({
        url: "https://ikinokta360.com",
        strategy: "mobile"
      })
    ).rejects.not.toThrow(/do-not-leak-secret-token/);
  });
});
