// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@westlane/isocanvas/persistence",
        replacement: path.join(rootDir, "src/persistence/index.ts"),
      },
      {
        find: "@westlane/isocanvas",
        replacement: path.join(rootDir, "src/index.ts"),
      },
    ],
  },
  test: {
    include: [process.env.IC_GENERATE ? "scripts/**/*.gen.ts" : "test/**/*.test.ts"],
    environment: "happy-dom",
    setupFiles: ["./test/vitest-setup.ts"],
  },
});
