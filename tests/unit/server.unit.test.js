import { describe, expect, it } from "vitest";

import { clampTimeout, normalizeCategories, normalizeUrl, resolveServerVersion, summarizeReport } from "../../src/server.js";
import { getInstalledPackageInfo } from "../../src/core/version-check.js";
import { makePsiPayload } from "../helpers/psi-fixtures.js";

describe("normalizeUrl", () => {
  it("adds https when protocol is missing", () => {
    expect(normalizeUrl("ikinokta360.com")).toBe("https://ikinokta360.com");
  });

  it("keeps url as-is when protocol exists", () => {
    expect(normalizeUrl("https://ikinokta360.com")).toBe("https://ikinokta360.com");
  });

  it("rejects non-http and non-https schemes", () => {
    expect(() => normalizeUrl("file:///etc/passwd")).toThrow("Only HTTP and HTTPS URLs are allowed.");
    expect(() => normalizeUrl("javascript:alert(1)")).toThrow("Only HTTP and HTTPS URLs are allowed.");
  });
});

describe("clampTimeout", () => {
  it("clamps values to [5, 180] and defaults invalid input to 60", () => {
    expect(clampTimeout(2)).toBe(5);
    expect(clampTimeout(240)).toBe(180);
    expect(clampTimeout("x")).toBe(60);
    expect(clampTimeout(45.9)).toBe(45);
  });
});

describe("normalizeCategories", () => {
  it("normalizes and falls back to defaults", () => {
    expect(normalizeCategories([" Performance ", "SEO"])).toEqual(["performance", "seo"]);
    expect(normalizeCategories([])).toEqual(["performance"]);
  });
});

describe("summarizeReport", () => {
  it("returns category scores, key metrics and sorted opportunities", () => {
    const payload = makePsiPayload({ performanceScore: 0.82, lcp: 2100 });
    const summary = summarizeReport(payload, "mobile", ["performance", "seo"]);

    expect(summary.requested_strategy).toBe("mobile");
    expect(summary.categories.performance).toBe(82);
    expect(summary.categories.seo).toBe(88);
    expect(summary.key_metrics.lcp_ms).toBe(2100);
    expect(summary.top_opportunities.length).toBeGreaterThan(0);
    expect(summary.top_opportunities[0].audit_id).toBe("modern-image-formats");
    expect(summary.top_opportunities[0].estimated_savings_ms).toBe(600);
  });
});

describe("resolveServerVersion", () => {
  it("matches package version", () => {
    expect(resolveServerVersion()).toBe(getInstalledPackageInfo().version);
  });
});
