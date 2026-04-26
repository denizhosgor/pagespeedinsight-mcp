import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function projectRoot() {
  const thisFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(thisFile), "..", "..");
}

describe("openclaw plugin manifest", () => {
  it("defines skills directory and points to an existing SKILL.md", () => {
    const root = projectRoot();
    const manifestPath = path.join(root, "openclaw.plugin.json");
    const packageJsonPath = path.join(root, "package.json");
    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(fs.existsSync(packageJsonPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    expect(manifest.name).toBe("pagespeedinsight-mcp");
    expect(manifest.version).toBe(pkg.version);
    expect(Array.isArray(manifest.skills)).toBe(true);
    expect(manifest.skills).toContain("openclaw/skills/pagespeed_insights");

    const skillPath = path.join(root, "openclaw", "skills", "pagespeed_insights", "SKILL.md");
    expect(fs.existsSync(skillPath)).toBe(true);
    const skillText = fs.readFileSync(skillPath, "utf8");
    expect(skillText).toContain("name: pagespeed_insights");
    expect(skillText).toContain("description:");
  });
});
