#!/usr/bin/env node

import { runStdioServer } from "../src/server.js";

runStdioServer().catch((err) => {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
