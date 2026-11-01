// @vitest-environment happy-dom
// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it, vi } from "vitest";
import { clientPointToSvgUser, elementUserBBox } from "@westlane/isocanvas";

const SVG_NS = "http://www.w3.org/2000/svg";

describe("svg-bbox", () => {
  it("clientPointToSvgUser returns origin when screen CTM is unavailable", () => {
    const svg = document.createElementNS(SVG_NS, "svg");
    vi.spyOn(svg, "getScreenCTM").mockReturnValue(null);
    expect(clientPointToSvgUser(svg, 12, 34)).toEqual({ x: 0, y: 0 });
  });

  it("elementUserBBox uses getBBox when transform helpers are unavailable", () => {
    const rect = document.createElementNS(SVG_NS, "rect");
    vi.spyOn(rect, "getBBox").mockReturnValue({
      x: 5,
      y: 7,
      width: 30,
      height: 12,
    } as DOMRect);
    const box = elementUserBBox(rect as unknown as SVGGraphicsElement, null);
    expect(box).toEqual({ x: 5, y: 7, width: 30, height: 12 });
  });

  it("elementUserBBox enforces minimum size of one", () => {
    const rect = document.createElementNS(SVG_NS, "rect");
    vi.spyOn(rect, "getBBox").mockReturnValue({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    } as DOMRect);
    const box = elementUserBBox(rect as unknown as SVGGraphicsElement, null);
    expect(box.width).toBe(1);
    expect(box.height).toBe(1);
  });
});
