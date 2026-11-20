// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";
import { renderDiagramScene } from "../src/diagram/render-scene.js";
import {
  IC_ARTBOARD_COLLECTION_LABEL_BADGE_SIDE_CLASS,
} from "../src/isometric/stage/stage-shell.js";
import { DEFAULT_ISO_CANVAS_COLORS } from "../src/theme/defaults.js";

describe("artboard collection label", () => {
  it("mounts iso floating badge below bottom-left of the artboard panel", () => {
    const host = document.createElement("div");
    host.style.setProperty("--ic-artboard-collection-badge-bg", "#3b0764");
    host.style.setProperty("--ic-artboard-collection-badge-fg", "#ffffff");
    renderDiagramScene(
      host,
      { nodes: [], viewBox: { x: 0, y: 0, w: 400, h: 300 } },
      DEFAULT_ISO_CANVAS_COLORS,
      {
        artboardCollection: {
          collectionLabel: "Organization",
        },
      },
    );
    expect(host.querySelectorAll("path.ic-artboard-collection-label-badge[d]").length).toBeGreaterThan(
      0,
    );
    expect(
      host.querySelectorAll(`path.${IC_ARTBOARD_COLLECTION_LABEL_BADGE_SIDE_CLASS}[d]`).length,
    ).toBe(2);
    const labelGroup = host.querySelector("g.ic-artboard-collection-label");
    expect(labelGroup?.textContent?.toUpperCase()).toContain("ORGANIZATION");
  });
});
