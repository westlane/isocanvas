// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane
/** Git checkouts ship without `dist/` (gitignored). Build so package exports resolve after install. */

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const shell = process.platform === "win32";

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", shell });
  if (result.status) process.exit(result.status ?? 1);
}

run("node", ["scripts/ensure-pino-blanc-dist.mjs"]);

if (!existsSync("dist/index.js")) {
  run("yarn", ["build"]);
}