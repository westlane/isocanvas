// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it, beforeEach } from "vitest";
import {
  defaultIsoArtboardStage,
  ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS,
  ISO_CUBE_LABEL_FONT_SIZE_PX,
  mountIsometricCanvasOnHost,
  mountPlaneBoxesOnCanvas,
  paintIsometricOrientation,
  uniformIsoCubeTopLabelFontSizePx,
  userPxToIsoUnits,
  type PlaneBoxSpec,
} from "@westlane/isocanvas";
import {
  formatIsoCanvasLabelText,
  measureIsoCanvasLabelBlockHeightPx,
  measureIsoCanvasLabelTextWidthPx,
  splitIsoCanvasLabelLines,
} from "../src/isometric/cube/canvas-text-style.js";
import { initDemoTheme, demoThemeManager } from "../demo/scripts/theme.js";
import { mountCardGrid } from "./fixtures/card-grid.js";

function labelBBoxContainedInTopFace(host: HTMLElement, objectId: string): boolean {
  const node = host.querySelector(`g.node[data-object-id="${objectId}"]`);
  const topFace = node?.parentElement?.querySelector("path.ic-iso-cube-face--top");
  const text = node?.querySelector("text");
  if (!(topFace instanceof SVGGraphicsElement) || !(text instanceof SVGGraphicsElement)) {
    return false;
  }
  const face = topFace.getBBox();
  const label = text.getBBox();
  const pad = 1.5;
  return (
    label.x >= face.x - pad &&
    label.y >= face.y - pad &&
    label.x + label.width <= face.x + face.width + pad &&
    label.y + label.height <= face.y + face.height + pad
  );
}

function labelFontSizePx(host: HTMLElement, objectId: string): number {
  const tspan = host.querySelector(
    `g.node[data-object-id="${objectId}"] g.ic-iso-cube-label tspan`,
  );
  return Number.parseFloat(tspan?.getAttribute("font-size") ?? "0");
}

function labelTextContent(host: HTMLElement, objectId: string): string {
  const tspan = host.querySelector(
    `g.node[data-object-id="${objectId}"] g.ic-iso-cube-label tspan`,
  );
  return tspan?.textContent ?? "";
}

/** `tspan` text may include literal `\n` between lines. */
function labelNormalizedText(host: HTMLElement, objectId: string): string {
  return labelTextContent(host, objectId).replace(/\r?\n/g, " ").trim();
}

describe("iso cube top label fit", () => {
  beforeEach(() => {
    initDemoTheme(document.documentElement);
  });

  it("lowers uniform font size when a title would overflow the top face width", () => {
    const specs = [
      { label: "A", width: 2, depth: 1.25 },
      { label: "Internationalization", width: 2, depth: 1.25 },
    ];
    expect(uniformIsoCubeTopLabelFontSizePx(specs)).toBeLessThan(ISO_CUBE_LABEL_FONT_SIZE_PX);
  });

  it("keeps mounted labels inside the top face (default and rotated)", () => {
    const colors = demoThemeManager().getTheme().colors;
    const boxes: PlaneBoxSpec[] = [
      {
        id: "wide-title",
        label: "Extraordinarily Long Cube Title",
        x: 40,
        y: 40,
        width: 84,
        depth: 84,
        height: userPxToIsoUnits(56),
      },
    ];
    const stage = defaultIsoArtboardStage();
    for (const orientation of ["default", "rotated"] as const) {
      const host = document.createElement("div");
      if (orientation === "rotated") {
        paintIsometricOrientation(host, "rotated");
      }
      document.body.appendChild(host);
      const canvas = mountIsometricCanvasOnHost(host, stage);
      mountPlaneBoxesOnCanvas(canvas, boxes, colors, { stage, artboardShellChrome: "full" });
      expect(labelBBoxContainedInTopFace(host, "wide-title")).toBe(true);
      host.remove();
    }
  });

  it("uses one font size for short and long titles on the same mount", () => {
    const colors = demoThemeManager().getTheme().colors;
    const footprint = {
      x: 40,
      y: 40,
      width: 84,
      depth: 84,
      height: userPxToIsoUnits(56),
    };
    const boxes: PlaneBoxSpec[] = [
      { id: "short", label: "A", ...footprint },
      {
        id: "long",
        label: "Extraordinarily Long Cube Title",
        ...footprint,
        x: 200,
      },
    ];
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stage = defaultIsoArtboardStage();
    const canvas = mountIsometricCanvasOnHost(host, stage);
    mountPlaneBoxesOnCanvas(canvas, boxes, colors, { stage, artboardShellChrome: "full" });
    const shortSize = labelFontSizePx(host, "short");
    const longSize = labelFontSizePx(host, "long");
    expect(shortSize).toBeGreaterThan(0);
    expect(longSize).toBe(shortSize);
    expect(labelBBoxContainedInTopFace(host, "short")).toBe(true);
    expect(labelBBoxContainedInTopFace(host, "long")).toBe(true);
    expect(labelNormalizedText(host, "long")).toContain(ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS);
    host.remove();
  });

  it("measures multi-line labels by max line width and stacked line height", () => {
    const fontPx = 40;
    const lineA = "AAAA";
    const lineB = "AAAAAAAAAAAA";
    const block = `${lineA}\n${lineB}`;
    expect(splitIsoCanvasLabelLines(formatIsoCanvasLabelText(block)).length).toBe(2);
    expect(measureIsoCanvasLabelTextWidthPx(formatIsoCanvasLabelText(block), fontPx)).toBe(
      measureIsoCanvasLabelTextWidthPx(formatIsoCanvasLabelText(lineB), fontPx),
    );
    expect(measureIsoCanvasLabelBlockHeightPx(formatIsoCanvasLabelText(block), fontPx)).toBeGreaterThan(
      measureIsoCanvasLabelBlockHeightPx(formatIsoCanvasLabelText(lineA), fontPx),
    );
  });

  it("preserves newline characters in mounted SVG text (xml:space)", () => {
    const colors = demoThemeManager().getTheme().colors;
    const boxes: PlaneBoxSpec[] = [
      {
        id: "twoline",
        label: "TECHNOLOGY\nCONSULTING",
        x: 40,
        y: 40,
        width: 84,
        depth: 84,
        height: userPxToIsoUnits(56),
      },
    ];
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stage = defaultIsoArtboardStage();
    const canvas = mountIsometricCanvasOnHost(host, stage);
    mountPlaneBoxesOnCanvas(canvas, boxes, colors, { stage, artboardShellChrome: "full" });
    const labelText = host.querySelector(
      'g.node[data-object-id="twoline"] g.ic-iso-cube-label text',
    );
    expect(labelText?.getAttribute("xml:space")).toBe("preserve");
    const tspans = [
      ...host.querySelectorAll('g.node[data-object-id="twoline"] g.ic-iso-cube-label tspan'),
    ].map((node) => node.textContent);
    expect(tspans).toEqual(["TECHNOLOGY", "CONSULTING"]);
    host.remove();
  });

  it("uses one font size across the demo card grid", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    mountCardGrid(host, demoThemeManager().getTheme().colors);
    const sizes = new Set(
      [...host.querySelectorAll('g.node[data-object-id] g.ic-iso-cube-label tspan')].map((tspan) =>
        Number.parseFloat(tspan.getAttribute("font-size") ?? "0"),
      ),
    );
    expect(sizes.size).toBe(1);
    host.remove();
  });

  it("keeps stacked layer labels inside the top face", () => {
    const colors = demoThemeManager().getTheme().colors;
    const footprint: Pick<PlaneBoxSpec, "x" | "y" | "width" | "depth" | "height"> = {
      x: 120,
      y: 120,
      width: 84,
      depth: 84,
      height: userPxToIsoUnits(48),
    };
    const boxes: PlaneBoxSpec[] = [
      { id: "stack-a", label: "Bottom", ...footprint, elevation: 0 },
      { id: "stack-b", label: "Middle Layer Name", ...footprint, elevation: 0.02 },
      { id: "stack-c", label: "Top Of Stack Title", ...footprint, elevation: 0.04 },
    ];
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stage = defaultIsoArtboardStage();
    const canvas = mountIsometricCanvasOnHost(host, stage);
    mountPlaneBoxesOnCanvas(canvas, boxes, colors, { stage, artboardShellChrome: "full" });
    const sizes = new Set(["stack-a", "stack-b", "stack-c"].map((id) => labelFontSizePx(host, id)));
    expect(sizes.size).toBe(1);
    for (const id of ["stack-a", "stack-b", "stack-c"]) {
      expect(labelBBoxContainedInTopFace(host, id)).toBe(true);
    }
    host.remove();
  });
});
