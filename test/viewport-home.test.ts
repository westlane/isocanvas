// Copyright (C) 2026 West Lane - All Rights Reserved
// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import {
  viewBoxFitArtboardUserBox,
  viewBoxFitPointsAroundCenter,
  viewBoxFitSvgContent,
} from "@westlane/isocanvas";

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

  it("viewBoxFitPointsAroundCenter keeps even margins for a skewed quad", () => {
    const points = [
      { x: 0, y: 40 },
      { x: 200, y: 0 },
      { x: 260, y: 120 },
      { x: 40, y: 160 },
    ];
    const center = { x: 130, y: 80 };
    const vb = viewBoxFitPointsAroundCenter(points, center, { baseW: 640, baseH: 360 }, { paddingPx: 10 });
    expect(vb.x + vb.w / 2).toBeCloseTo(center.x, 5);
    expect(vb.y + vb.h / 2).toBeCloseTo(center.y, 5);
    const marginLeft = Math.min(...points.map((p) => p.x - vb.x));
    const marginRight = Math.min(...points.map((p) => vb.x + vb.w - p.x));
    expect(marginLeft).toBeCloseTo(marginRight, 5);
    expect(marginLeft).toBeGreaterThanOrEqual(9.5);
  });
});
