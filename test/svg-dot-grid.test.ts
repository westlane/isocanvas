// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  IC_SVG_DOT_GRID_PATTERN_ID,
  IC_SVG_DOT_GRID_RECT_CLASS,
  syncSvgDotGridFromViewBox,
} from "@westlane/isocanvas";

describe("syncSvgDotGridFromViewBox", () => {
  it("inserts a user-space pattern and background rect tied to the viewBox", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    syncSvgDotGridFromViewBox(svg, { x: 10, y: 20, w: 100, h: 50 }, { cellSize: 20, phase: 10 });

    const defs = svg.querySelector(":scope > defs");
    expect(defs).not.toBeNull();
    const pattern = defs?.querySelector("pattern");
    expect(pattern?.id).toBe(IC_SVG_DOT_GRID_PATTERN_ID);
    expect(pattern?.getAttribute("width")).toBe("20");

    const rect = svg.querySelector(`rect.${IC_SVG_DOT_GRID_RECT_CLASS}`);
    expect(rect?.getAttribute("fill")).toBe(`url(#${IC_SVG_DOT_GRID_PATTERN_ID})`);
    expect(Number(rect?.getAttribute("x"))).toBeLessThan(10);
    expect(Number(rect?.getAttribute("width"))).toBeGreaterThan(100);
  });

  it("works when Mermaid keeps defs nested under a group", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const root = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const nestedDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    root.appendChild(nestedDefs);
    svg.appendChild(root);

    syncSvgDotGridFromViewBox(svg, { x: 0, y: 0, w: 200, h: 120 });

    const rect = svg.querySelector(`rect.${IC_SVG_DOT_GRID_RECT_CLASS}`);
    expect(rect?.parentNode).toBe(svg);
    expect(svg.querySelector(":scope > defs")).not.toBeNull();
  });
});
