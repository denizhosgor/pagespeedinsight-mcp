import { afterEach, describe, expect, it, vi } from "vitest";

import { buildVersionComparison, checkPackageVersion, compareSemver, parseSemver } from "../../src/core/version-check.js";

const originalFetch = global.fetch;

function mockOkJson(payload) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  };
}

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("parseSemver", () => {
  it("parses semver with and without prefix", () => {
    expect(parseSemver("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3, prerelease: [] });
    expect(parseSemver("v2.0.1-beta.1")).toEqual({
      major: 2,
      minor: 0,
      patch: 1,
      prerelease: ["beta", "1"]
    });
  });
});

describe("compareSemver", () => {
  it("compares numeric and prerelease versions", () => {
    expect(compareSemver("1.2.4", "1.2.3")).toBe(1);
    expect(compareSemver("1.2.3", "1.2.3")).toBe(0);
    expect(compareSemver("1.2.3-beta.1", "1.2.3")).toBe(-1);
  });
});

describe("buildVersionComparison", () => {
  it("classifies outdated and up_to_date states", () => {
    expect(buildVersionComparison("0.1.0", "0.2.0")).toEqual({
      update_available: true,
      comparison: "outdated"
    });
    expect(buildVersionComparison("0.2.0", "0.2.0")).toEqual({
      update_available: false,
      comparison: "up_to_date"
    });
  });
});

describe("checkPackageVersion", () => {
  it("returns installed/latest versions from npm response", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockOkJson({ version: "9.9.9" }));

    const result = await checkPackageVersion({ force_refresh: true, timeout_ms: 2000 });

    expect(result.package_name).toBe("@denizhosgor/pagespeedinsight-mcp");
    expect(result.latest_version).toBe("9.9.9");
    expect(typeof result.installed_version).toBe("string");
    expect(["outdated", "up_to_date", "ahead", "unknown"]).toContain(result.comparison);
  });
});

