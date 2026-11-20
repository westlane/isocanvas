// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(scriptRoot, "..");
const config = JSON.parse(
  readFileSync(path.join(repoRoot, "config/neutral.json"), "utf8"),
);

const deny = new Set(config.denyWordHashes);

function tokenize(text) {
  return text.toLowerCase().match(/[a-z][a-z0-9_-]*/g) ?? [];
}

function checkTokens(label, text) {
  for (const token of tokenize(text)) {
    const hash = createHash("sha256").update(token, "utf8").digest("hex");
    if (deny.has(hash)) {
      throw new Error(`${label} contains neutral-policy token hash match (${token})`);
    }
  }
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (
      entry === "node_modules" ||
      entry === "dist" ||
      entry === ".git" ||
      entry === "pino-blanc"
    ) {
      continue;
    }
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

function checkSpdxHeaders() {
  const spdx = "SPDX-License-Identifier: MIT";
  const relRoots = ["src", "test", "demo", "theme", "scripts"];
  const rootFiles = ["vite.config.ts", "vitest.config.ts"];
  for (const rel of rootFiles) {
    const full = path.join(repoRoot, rel);
    const head = readFileSync(full, "utf8").split("\n", 8).join("\n");
    if (!head.includes(spdx)) {
      throw new Error(`${rel} missing ${spdx} in header`);
    }
  }
  for (const relRoot of relRoots) {
    const dir = path.join(repoRoot, relRoot);
    if (!statSync(dir).isDirectory()) continue;
    for (const file of walk(dir)) {
      if (!/\.(ts|mjs)$/.test(file)) continue;
      if (relRoot === "src" && /\.d\.ts$/.test(file)) continue;
      const head = readFileSync(file, "utf8").split("\n", 8).join("\n");
      if (!head.includes(spdx)) {
        throw new Error(`${path.relative(repoRoot, file)} missing ${spdx} in header`);
      }
    }
  }
}

function checkWorkingTree() {
  for (const file of walk(repoRoot)) {
    if (file.endsWith(".png") || file.endsWith(".lock")) {
      continue;
    }
    const rel = path.relative(repoRoot, file);
    if (/^src\/.*\.(js|d\.ts)(\.map)?$/.test(rel)) {
      continue;
    }
    checkTokens(file, file);
    if (/\.(ts|md|json|yml|yaml|mjs|js|css|html)$/.test(file)) {
      checkTokens(file, readFileSync(file, "utf8"));
    }
  }
}

const patchExclude = [
  ":(exclude)yarn.lock",
  ":(exclude).pnp.cjs",
  ":(exclude).pnp.loader.mjs",
];

function checkGitHistory() {
  const commits = execFileSync(
    "git",
    ["-C", repoRoot, "log", "--all", "--format=%H"],
    { encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);

  for (const commit of commits) {
    const message = execFileSync(
      "git",
      ["-C", repoRoot, "log", "-1", "--format=%B", commit],
      { encoding: "utf8" },
    );
    checkTokens(`commit ${commit.slice(0, 7)} message`, message);

    const patch = execFileSync(
      "git",
      [
        "-C",
        repoRoot,
        "show",
        "--format=",
        "-p",
        "--",
        ".",
        ...patchExclude,
        commit,
      ],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    checkTokens(`commit ${commit.slice(0, 7)} patch`, patch);
  }
}

checkSpdxHeaders();
checkWorkingTree();
checkGitHistory();
console.log("check:neutral ok");
