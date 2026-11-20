// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { appendFileSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const soft = process.argv.includes("--soft");

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const local = pkg.version;
const name = pkg.name;
const registry =
  process.env.PUBLISH_REGISTRY?.trim() ||
  pkg.publishConfig?.registry?.trim() ||
  process.env.NPM_CONFIG_REGISTRY?.trim() ||
  "https://registry.npmjs.org";

let published = "0.0.0";
try {
  published = execSync(`npm view ${name} version --registry=${registry}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    env: {
      ...process.env,
      NODE_AUTH_TOKEN: process.env.NODE_AUTH_TOKEN ?? "",
    },
  }).trim();
} catch {
  // not on registry yet
}

function compare(a, b) {
  const pa = a.split(".").map((n) => Number.parseInt(n, 10));
  const pb = b.split(".").map((n) => Number.parseInt(n, 10));
  for (let i = 0; i < 3; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

const ahead = compare(local, published) > 0;

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `ahead=${ahead}\n`);
}

if (!ahead) {
  const msg = `package.json version ${local} is not greater than ${name}@${published} on ${registry}`;
  if (soft) {
    console.log(`skip: ${msg}`);
    process.exit(0);
  }
  console.error(msg);
  process.exit(1);
}

console.log(`ok: ${local} > ${published}`);