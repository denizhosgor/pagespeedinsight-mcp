#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export function parseArgs(argv) {
  const args = {
    auto: false,
    force: false,
    skillsDir: "",
    openclawDir: "",
    chown: ""
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--auto") {
      args.auto = true;
      continue;
    }
    if (token === "--force") {
      args.force = true;
      continue;
    }
    if (token === "--skills-dir" && argv[i + 1]) {
      args.skillsDir = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--openclaw-dir" && argv[i + 1]) {
      args.openclawDir = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--chown" && argv[i + 1]) {
      args.chown = argv[i + 1];
      i += 1;
    }
  }

  return args;
}

export function resolveSkillsDir(args) {
  if (args.skillsDir) {
    return path.resolve(args.skillsDir);
  }
  if (args.openclawDir) {
    return path.resolve(args.openclawDir, "app", "skills");
  }
  if (process.env.OPENCLAW_SKILLS_DIR) {
    return path.resolve(process.env.OPENCLAW_SKILLS_DIR);
  }
  if (process.env.OPENCLAW_DIR) {
    return path.resolve(process.env.OPENCLAW_DIR, "app", "skills");
  }
  const cwd = path.resolve(process.cwd());
  if (cwd === "/app" || path.basename(cwd) === "app") {
    return path.resolve(cwd, "skills");
  }
  return path.resolve(cwd, "app", "skills");
}

export function resolveOwner(args) {
  if (args.chown) {
    return args.chown.trim();
  }
  if (process.env.OPENCLAW_SKILL_OWNER) {
    return process.env.OPENCLAW_SKILL_OWNER.trim();
  }
  return "";
}

export function applyOwnership(targetPath, ownerSpec) {
  if (!ownerSpec) {
    return;
  }
  if (process.platform === "win32") {
    throw new Error("Ownership change is not supported on Windows.");
  }
  const result = spawnSync("chown", ["-R", ownerSpec, targetPath], { encoding: "utf8" });
  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    throw new Error(`chown failed for ${targetPath} -> ${ownerSpec}. ${stderr}`);
  }
}

export function runInstallSkill(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const skillsDir = resolveSkillsDir(args);
  const ownerSpec = resolveOwner(args);
  const hasTargetInArgsOrEnv =
    Boolean(args.skillsDir) ||
    Boolean(args.openclawDir) ||
    Boolean(process.env.OPENCLAW_SKILLS_DIR) ||
    Boolean(process.env.OPENCLAW_DIR);
  const cwd = path.resolve(process.cwd());
  const isLikelyOpenClawRoot = cwd === "/app" || path.basename(cwd) === "app";

  if (args.auto && !hasTargetInArgsOrEnv && !isLikelyOpenClawRoot) {
    process.stdout.write(
      "[pagespeedinsight-mcp] auto mode skipped. Set OPENCLAW_DIR or OPENCLAW_SKILLS_DIR, or run install inside /app.\n"
    );
    return;
  }

  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const sourceSkillCandidates = [
    path.join(packageRoot, "openclaw", "skills", "pagespeed_insights", "SKILL.md"),
    path.join(packageRoot, "skills", "SKILL.md"),
    path.join(packageRoot, "docs", "tr", "PAGESPEEDINSIGHT_TOOL_GUIDE.md"),
    path.join(packageRoot, "docs", "en", "PAGESPEEDINSIGHT_TOOL_GUIDE.md")
  ];
  const sourceSkill = sourceSkillCandidates.find((candidate) => fs.existsSync(candidate)) || "";
  const targetDir = path.join(skillsDir, "pagespeedinsight-mcp");
  const targetSkill = path.join(targetDir, "SKILL.md");

  if (!fs.existsSync(sourceSkill)) {
    throw new Error(`Skill template not found: ${sourceSkill}`);
  }

  fs.mkdirSync(targetDir, { recursive: true });

  if (fs.existsSync(targetSkill) && !args.force) {
    process.stdout.write(`[pagespeedinsight-mcp] Skill already exists: ${targetSkill}\n`);
    process.stdout.write("[pagespeedinsight-mcp] Use --force to overwrite.\n");
    return;
  }

  fs.copyFileSync(sourceSkill, targetSkill);
  applyOwnership(targetDir, ownerSpec);
  process.stdout.write(`[pagespeedinsight-mcp] Skill installed: ${targetSkill}\n`);
  if (ownerSpec) {
    process.stdout.write(`[pagespeedinsight-mcp] Ownership applied: ${ownerSpec}\n`);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    runInstallSkill();
  } catch (err) {
    const message = err instanceof Error ? err.stack || err.message : String(err);
    process.stderr.write(`[pagespeedinsight-mcp] install-skill failed: ${message}\n`);
    process.exit(1);
  }
}
