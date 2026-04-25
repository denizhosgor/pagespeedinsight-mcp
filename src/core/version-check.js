import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const VERSION_CHECK_CACHE_TTL_MS = 10 * 60 * 1000;
export const DEFAULT_VERSION_CHECK_TIMEOUT_MS = 5000;

let cachedStatus = null;

function nowIso() {
  return new Date().toISOString();
}

function readPackageJson() {
  const currentFile = fileURLToPath(import.meta.url);
  const packageJsonPath = path.resolve(path.dirname(currentFile), "..", "..", "package.json");
  const raw = fs.readFileSync(packageJsonPath, "utf8");
  return JSON.parse(raw);
}

export function getInstalledPackageInfo() {
  const pkg = readPackageJson();
  return {
    name: typeof pkg?.name === "string" ? pkg.name : "",
    version: typeof pkg?.version === "string" ? pkg.version : ""
  };
}

export function parseSemver(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  const normalized = raw.startsWith("v") ? raw.slice(1) : raw;
  const match = normalized.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/);
  if (!match) return null;

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  const prerelease = match[4] ? match[4].split(".") : [];

  return { major, minor, patch, prerelease };
}

function comparePrerelease(a, b) {
  const aLen = a.length;
  const bLen = b.length;
  const max = Math.max(aLen, bLen);

  for (let i = 0; i < max; i += 1) {
    const aPart = a[i];
    const bPart = b[i];

    if (aPart === undefined) return -1;
    if (bPart === undefined) return 1;

    const aNum = /^\d+$/.test(aPart) ? Number(aPart) : null;
    const bNum = /^\d+$/.test(bPart) ? Number(bPart) : null;

    if (aNum !== null && bNum !== null) {
      if (aNum > bNum) return 1;
      if (aNum < bNum) return -1;
      continue;
    }

    if (aNum !== null && bNum === null) return -1;
    if (aNum === null && bNum !== null) return 1;

    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }

  return 0;
}

export function compareSemver(a, b) {
  const left = parseSemver(a);
  const right = parseSemver(b);
  if (!left || !right) return null;

  if (left.major !== right.major) return left.major > right.major ? 1 : -1;
  if (left.minor !== right.minor) return left.minor > right.minor ? 1 : -1;
  if (left.patch !== right.patch) return left.patch > right.patch ? 1 : -1;

  const leftPre = left.prerelease;
  const rightPre = right.prerelease;
  if (leftPre.length === 0 && rightPre.length === 0) return 0;
  if (leftPre.length === 0) return 1;
  if (rightPre.length === 0) return -1;
  return comparePrerelease(leftPre, rightPre);
}

export function buildVersionComparison(installedVersion, latestVersion) {
  const cmp = compareSemver(installedVersion, latestVersion);
  if (cmp === null) {
    return {
      update_available: null,
      comparison: "unknown"
    };
  }
  if (cmp < 0) {
    return {
      update_available: true,
      comparison: "outdated"
    };
  }
  if (cmp > 0) {
    return {
      update_available: false,
      comparison: "ahead"
    };
  }
  return {
    update_available: false,
    comparison: "up_to_date"
  };
}

export async function fetchLatestVersion(packageName, timeoutMs = DEFAULT_VERSION_CHECK_TIMEOUT_MS) {
  const encoded = encodeURIComponent(packageName);
  const endpoint = `https://registry.npmjs.org/${encoded}/latest`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs) || DEFAULT_VERSION_CHECK_TIMEOUT_MS));

  let response;
  try {
    response = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`npm registry request failed: HTTP ${response.status} ${body}`);
  }

  const payload = await response.json();
  const version = typeof payload?.version === "string" ? payload.version.trim() : "";
  if (!version) {
    throw new Error("npm registry response does not include a valid version.");
  }
  return version;
}

export async function checkPackageVersion(options = {}) {
  const { force_refresh: forceRefresh = false, timeout_ms: timeoutMs = DEFAULT_VERSION_CHECK_TIMEOUT_MS } = options;
  const now = Date.now();

  if (
    !forceRefresh &&
    cachedStatus &&
    typeof cachedStatus === "object" &&
    typeof cachedStatus.cached_at_ms === "number" &&
    now - cachedStatus.cached_at_ms < VERSION_CHECK_CACHE_TTL_MS
  ) {
    return {
      ...cachedStatus,
      from_cache: true
    };
  }

  const pkg = getInstalledPackageInfo();
  if (!pkg.name || !pkg.version) {
    throw new Error("Cannot determine installed package name/version.");
  }

  const latestVersion = await fetchLatestVersion(pkg.name, timeoutMs);
  const comparison = buildVersionComparison(pkg.version, latestVersion);
  const checkedAt = nowIso();
  const status = {
    package_name: pkg.name,
    installed_version: pkg.version,
    latest_version: latestVersion,
    update_available: comparison.update_available,
    comparison: comparison.comparison,
    checked_at: checkedAt,
    cached_at_ms: Date.now(),
    from_cache: false
  };
  cachedStatus = status;
  return status;
}

