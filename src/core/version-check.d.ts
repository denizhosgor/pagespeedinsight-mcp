export interface VersionCheckOptions {
  force_refresh?: boolean;
  timeout_ms?: number;
}

export interface VersionCheckResult {
  package_name: string;
  installed_version: string;
  latest_version: string;
  update_available: boolean | null;
  comparison: "outdated" | "up_to_date" | "ahead" | "unknown";
  checked_at: string;
  cached_at_ms: number;
  from_cache: boolean;
}

export function getInstalledPackageInfo(): { name: string; version: string };
export function parseSemver(input: unknown): {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
} | null;
export function compareSemver(a: unknown, b: unknown): number | null;
export function buildVersionComparison(
  installedVersion: unknown,
  latestVersion: unknown
): { update_available: boolean | null; comparison: "outdated" | "up_to_date" | "ahead" | "unknown" };
export function fetchLatestVersion(packageName: string, timeoutMs?: number): Promise<string>;
export function checkPackageVersion(options?: VersionCheckOptions): Promise<VersionCheckResult>;

