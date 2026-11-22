// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane
/** Build this package after install when `dist/` is missing (local git checkout). */

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const shell = process.platform === "win32";

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", shell });
  if (result.status) process.exit(result.status ?? 1);
}

if (!existsSync("dist/index.js")) {
  run("yarn", ["build"]);
}