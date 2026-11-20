// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane
/** GitHub git installs pack only `files` (no `dist/` in git). Build from public tag when needed. */

import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(scriptRoot, "..");

const PINO_BLANC_GIT_REF = process.env.PINO_BLANC_GIT_REF ?? "v0.1.5";
const PINO_BLANC_GIT_URL = "https://github.com/westlane/pino-blanc.git";

function run(cwd, cmd, args) {
  const result = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status) {
    process.exit(result.status ?? 1);
  }
}

const pkgJson = path.join(repoRoot, "node_modules/@westlane/pino-blanc/package.json");
if (!existsSync(pkgJson)) {
  console.log("ensure-pino-blanc: @westlane/pino-blanc not installed");
  process.exit(0);
}
const pkgDir = path.dirname(pkgJson);

const distMarker = path.join(pkgDir, "dist/themes/index.js");
if (existsSync(distMarker)) {
  console.log("ensure-pino-blanc: dist present");
  process.exit(0);
}

const tmp = mkdtempSync(path.join(os.tmpdir(), "pino-blanc-src-"));
try {
  console.log(`ensure-pino-blanc: cloning ${PINO_BLANC_GIT_REF} (public, no registry auth)`);
  run(repoRoot, "git", ["clone", "--depth", "1", "--branch", PINO_BLANC_GIT_REF, PINO_BLANC_GIT_URL, tmp]);
  run(tmp, "corepack", ["enable"]);
  run(tmp, "corepack", ["prepare", "yarn@4.9.2", "--activate"]);
  run(tmp, "yarn", ["install", "--immutable"]);
  run(tmp, "yarn", ["build"]);
  cpSync(path.join(tmp, "dist"), path.join(pkgDir, "dist"), { recursive: true });
  console.log("ensure-pino-blanc: dist synced");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}