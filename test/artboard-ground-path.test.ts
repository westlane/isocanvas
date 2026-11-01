// Copyright (C) 2026 West Lane - All Rights Reserved
// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import {
  artboardOutlineEdgeCentroid,
  artboardOutlineEdgeFitBox,
  createArtboard,
  DEFAULT_ARTBOARD_USER_SIZE,
  parseSvgPathMoveLinePoints,
  readArtboardOutlineEdgePoints,
} from "@westlane/isocanvas";
import { demoThemeManager, initDemoTheme } from "../demo/scripts/theme.js";
import { mountCardGrid } from "./fixtures/card-grid.js";

describe("artboard ground path edge points", () => {
  it("parses M/L vertices from path d", () => {
    const d = "M 100 50 L 200 80 L 50 120 L 0 90 Z";
    expect(parseSvgPathMoveLinePoints(d)).toEqual([
      { x: 100, y: 50 },
      { x: 200, y: 80 },
      { x: 50, y: 120 },
      { x: 0, y: 90 },
    ]);
  });

  it("reads four edge points from mounted iso outline", () => {
    initDemoTheme(document.documentElement);
    const artboard = createArtboard({
      embedDotGrid: false,
      userSize: DEFAULT_ARTBOARD_USER_SIZE,
    });
    document.body.appendChild(artboard.root);
    mountCardGrid(artboard.content, demoThemeManager().getTheme().colors);
    const svg = artboard.content.querySelector("svg");
    expect(svg).toBeTruthy();
    const points = readArtboardOutlineEdgePoints(svg!);
    expect(points).toHaveLength(4);
    const fit = artboardOutlineEdgeFitBox(points);
    expect(fit).not.toBeNull();
    const centroid = artboardOutlineEdgeCentroid(points)!;
    expect(centroid.x).toBeCloseTo(
      points.reduce((s, p) => s + p.x, 0) / points.length,
      5,
    );
    expect(fit!.x).toBeLessThanOrEqual(Math.min(...points.map((p) => p.x)) + 1e-6);
    expect(fit!.y).toBeLessThanOrEqual(Math.min(...points.map((p) => p.y)) + 1e-6);
  });
});
