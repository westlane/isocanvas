// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it } from "vitest";
import { createExtensionHost } from "@westlane/isocanvas";

describe("createExtensionHost", () => {
  it("runs mount hooks and cleanups in order", async () => {
    const events: string[] = [];
    const host = createExtensionHost([
      {
        id: "a",
        onDiagramMounted() {
          events.push("mount-a");
          return () => {
            events.push("cleanup-a");
          };
        },
      },
      {
        id: "b",
        onDiagramMounted() {
          events.push("mount-b");
        },
      },
    ]);

    await host.runDiagramMount(
      {
        host: {} as HTMLElement,
        svg: {} as SVGSVGElement,
        viewport: null,
      },
      async () => {
        events.push("run");
      },
    );

    expect(events).toEqual(["mount-a", "mount-b", "run", "cleanup-a"]);
  });
});
