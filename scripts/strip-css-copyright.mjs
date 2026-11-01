// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane
/** Remove SPDX / Copyright comment lines from CSS (working tree or filter-repo tree). */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const headerLine =
  /^\s*\/\*[^*\n]*(?:SPDX-License-Identifier|Copyright)[^*\n]*\*\/\s*\n?/gm;

export function stripCssCopyright(text) {
  let next = text;
  let prev;
  do {
    prev = next;
    next = next.replace(headerLine, "");
  } while (next !== prev);
  return next.replace(/^\n+/, "");
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === ".git" || entry === "node_modules" || entry === "dist") {
      continue;
    }
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (entry.endsWith(".css")) {
      const original = readFileSync(full, "utf8");
      const stripped = stripCssCopyright(original);
      if (stripped !== original) {
        writeFileSync(full, stripped);
      }
    }
  }
}

walk(process.cwd());
