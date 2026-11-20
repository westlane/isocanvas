// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import { renderDiagramScene } from "../src/diagram/render-scene.js";
import { DIAGRAM_NODE_FOOTPRINT } from "../src/layout/diagram-node-footprint.js";
import { DEFAULT_ISO_CANVAS_COLORS } from "../src/theme/defaults.js";

describe("renderDiagramScene foundation slab", () => {
  it("mounts a colored slab under the domain cube", () => {
    const host = document.createElement("div");
    renderDiagramScene(
      host,
      {
        nodes: [
          {
            id: "map",
            label: "Map",
            x: 0,
            y: 0,
            w: DIAGRAM_NODE_FOOTPRINT.widthPx,
            h: DIAGRAM_NODE_FOOTPRINT.depthPx,
            foundationSlab: {
              label: "Map",
              fill: "#d1fae5",
              stroke: "#059669",
            },
          },
        ],
      },
      DEFAULT_ISO_CANVAS_COLORS,
      { omitArtboardShell: true },
    );
    const slab = host.querySelector('[data-object-id="map__foundationSlab"]');
    const domain = host.querySelector('[data-object-id="map"]');
    expect(slab).toBeTruthy();
    expect(domain).toBeTruthy();
    expect(slab?.getAttribute("data-diagram-selectable")).toBe("false");
    expect(host.querySelector(".ic-foundation-slab-caption")?.textContent).toContain("MAP");
  });
});
