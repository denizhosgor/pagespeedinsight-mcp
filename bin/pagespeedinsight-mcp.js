#!/usr/bin/env node

import { runStdioServer } from "../src/server.js";
import { runInstallSkill } from "../scripts/install-skill.js";

const args = process.argv.slice(2);
const command = args[0];

if (command === "install-skill") {
  try {
    runInstallSkill(args.slice(1));
  } catch (err) {
    const message = err instanceof Error ? err.stack || err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
} else {
  runStdioServer().catch((err) => {
    const message = err instanceof Error ? err.stack || err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
