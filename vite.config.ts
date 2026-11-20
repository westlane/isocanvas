// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(rootDir, "demo"),
  build: {
    outDir: path.join(rootDir, "demo/dist"),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    strictPort: true,
  },
  resolve: {
    alias: [
      {
        find: "@westlane/isocanvas/canvas-chrome.css",
        replacement: path.join(rootDir, "theme/canvas-chrome.css"),
      },
      {
        find: "@westlane/isocanvas/camera.css",
        replacement: path.join(rootDir, "theme/camera/camera.css"),
      },
      {
        find: "@westlane/isocanvas/layout.css",
        replacement: path.join(rootDir, "theme/layout/layout.css"),
      },
      {
        find: "@westlane/isocanvas/dot-grid.css",
        replacement: path.join(rootDir, "theme/layout/dot-grid.css"),
      },
      {
        find: "@westlane/isocanvas/theme/schemes.css",
        replacement: path.join(rootDir, "theme/schemes.css"),
      },
      {
        find: "@westlane/isocanvas/theme/diagram-surfaces.css",
        replacement: path.join(rootDir, "theme/diagram-surfaces.css"),
      },
      {
        find: "@westlane/isocanvas/theme/wireframe.css",
        replacement: path.join(rootDir, "theme/wireframe.css"),
      },
      {
        find: "@westlane/isocanvas/theme/tokens.css",
        replacement: path.join(rootDir, "theme/tokens.css"),
      },
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
  optimizeDeps: {
    exclude: ["@westlane/pino-blanc", "@westlane/pino-blanc/themes", "@westlane/pino-blanc/browser"],
  },
});
