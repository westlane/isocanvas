import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@westlane/isocanvas": path.join(rootDir, "src/index.ts"),
    },
  },
  test: {
    include: [process.env.IC_GENERATE ? "scripts/**/*.gen.ts" : "test/**/*.test.ts"],
    environment: "happy-dom",
  },
});
