// Copyright (C) 2026 West Lane - All Rights Reserved
// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { viewBoxFitArtboardUserBox, viewBoxFitSvgContent } from "@westlane/isocanvas";

describe("viewBoxFitSvgContent", () => {
  it("centers padded artboard user box on baseline aspect", () => {
    const vb = viewBoxFitArtboardUserBox(
      { x: 0, y: 0, width: 520, height: 320 },
      { baseW: 640, baseH: 360 },
      { paddingRatio: 0.2, minWidthRatio: 1 },
    );
    expect(vb.w / vb.h).toBeCloseTo(640 / 360, 5);
    expect(vb.x + vb.w / 2).toBeCloseTo(260, 5);
    expect(vb.y + vb.h / 2).toBeCloseTo(160, 5);
  });

  it("centers padded content with baseline aspect", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 640 360");
    const content = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "220");
    rect.setAttribute("y", "110");
    rect.setAttribute("width", "200");
    rect.setAttribute("height", "80");
    content.appendChild(rect);
    svg.appendChild(content);
    document.body.appendChild(svg);

    const vb = viewBoxFitSvgContent(svg, { baseW: 640, baseH: 360 }, { paddingRatio: 0.2, minWidthRatio: 1 });
    expect(vb.w / vb.h).toBeCloseTo(640 / 360, 5);
    expect(vb.w).toBeLessThanOrEqual(640);
    expect(vb.w).toBeGreaterThanOrEqual(640 * 0.99);
  });
});
