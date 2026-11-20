// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { DiagramMountContext, IsoCanvasExtension } from "../types/plugins.js";

export type ExtensionHost = {
  readonly extensions: readonly IsoCanvasExtension[];
  runDiagramMount: <T>(ctx: DiagramMountContext, run: () => T | Promise<T>) => Promise<T>;
};

export function createExtensionHost(
  extensions: readonly IsoCanvasExtension[] = [],
): ExtensionHost {
  return {
    extensions,
    async runDiagramMount(ctx, run) {
      const cleanups: (() => void)[] = [];
      for (const extension of extensions) {
        const cleanup = extension.onDiagramMounted?.(ctx);
        if (cleanup) {
          cleanups.push(cleanup);
        }
      }
      try {
        return await run();
      } finally {
        for (const cleanup of cleanups.reverse()) {
          cleanup();
        }
      }
    },
  };
}
