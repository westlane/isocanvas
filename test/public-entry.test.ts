// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("public entry (dist/index.js)", () => {
  it("does not re-export Loro persistence (use @westlane/isocanvas/persistence)", () => {
    const indexSource = readFileSync(path.join(repoRoot, "src/index.ts"), "utf8");
    expect(indexSource).not.toContain("./persistence/");
    expect(indexSource).not.toContain("loro-types");
    const distIndex = readFileSync(path.join(repoRoot, "dist/index.js"), "utf8");
    expect(distIndex).not.toContain("./persistence/");
    expect(distIndex).not.toMatch(/from \"loro\.js\"/);
    const persistenceTs = readFileSync(
      path.join(repoRoot, "src/persistence/index.ts"),
      "utf8",
    );
    expect(persistenceTs).toContain("./loro/adapter.js");
  });
});
