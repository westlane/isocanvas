// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import { renderDiagramScene } from "../src/diagram/render-scene.js";
import { DIAGRAM_NODE_FOOTPRINT } from "../src/layout/diagram-node-footprint.js";
import { DEFAULT_ISO_CANVAS_COLORS } from "../src/theme/defaults.js";

describe("renderDiagramScene label-sized cubes", () => {
  it("keeps the domain cube top face wider than the layout minimum for long labels", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    renderDiagramScene(
      host,
      {
        nodes: [
          {
            id: "org",
            label: "Organization",
            x: 40,
            y: 40,
            w: DIAGRAM_NODE_FOOTPRINT.widthPx,
            h: DIAGRAM_NODE_FOOTPRINT.depthPx,
          },
        ],
      },
      DEFAULT_ISO_CANVAS_COLORS,
      { omitArtboardShell: true },
    );
    const topFace = host.querySelector('[data-object-id="org"]')?.parentElement?.querySelector(
      "path.ic-iso-cube-face--top",
    );
    const text = host.querySelector('[data-object-id="org"] text');
    expect(topFace).toBeInstanceOf(SVGGraphicsElement);
    expect(text).toBeInstanceOf(SVGGraphicsElement);
    const face = (topFace as SVGGraphicsElement).getBBox();
    const label = (text as SVGGraphicsElement).getBBox();
    const pad = 2;
    expect(label.x + label.width).toBeLessThanOrEqual(face.x + face.width + pad);
    expect(label.x).toBeGreaterThanOrEqual(face.x - pad);
    host.remove();
  });

  it("fits MEMBER and SAM ARC labels inside the top face", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    for (const label of ["Member", "SAM Arc"]) {
      host.replaceChildren();
      renderDiagramScene(
        host,
        {
          nodes: [
            {
              id: "n",
              label,
              x: 40,
              y: 40,
              w: DIAGRAM_NODE_FOOTPRINT.widthPx,
              h: DIAGRAM_NODE_FOOTPRINT.depthPx,
            },
          ],
        },
        DEFAULT_ISO_CANVAS_COLORS,
        { omitArtboardShell: true },
      );
      const topFace = host.querySelector('[data-object-id="n"]')?.parentElement?.querySelector(
        "path.ic-iso-cube-face--top",
      );
      const text = host.querySelector('[data-object-id="n"] text');
      expect(topFace).toBeInstanceOf(SVGGraphicsElement);
      expect(text).toBeInstanceOf(SVGGraphicsElement);
      const face = (topFace as SVGGraphicsElement).getBBox();
      const labelBox = (text as SVGGraphicsElement).getBBox();
      const pad = 3;
      expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(face.x + face.width + pad);
      expect(labelBox.x).toBeGreaterThanOrEqual(face.x - pad);
    }
    host.remove();
  });
});
