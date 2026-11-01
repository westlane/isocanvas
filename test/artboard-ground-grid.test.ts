// @vitest-environment happy-dom
// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it, beforeEach } from "vitest";
import { IsometricCanvas } from "ic-canvas";
import {
  DEFAULT_CUBE_CANVAS_SCALE,
  decorateCubeCanvas,
  mountArtboardGroundOnCanvas,
  DEFAULT_ARTBOARD_DOTS_PER_CELL,
  IC_ARTBOARD_DOT_GRID_CLASS,
  IC_ARTBOARD_OUTLINE_LAYER_CLASS,
} from "@westlane/isocanvas";
import { initDemoTheme } from "../demo/scripts/theme.js";

function pathPoints(d: string): { x: number; y: number }[] {
  const re = /[ML]\s*(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g;
  const points: { x: number; y: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    points.push({ x: Number(m[1]), y: Number(m[2]) });
  }
  return points;
}

describe("artboard iso ground grid", () => {
  beforeEach(() => {
    initDemoTheme(document.documentElement);
  });

  it("extrudes front and side slab faces under the top ground", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const size = 900;
    const canvas = new IsometricCanvas({
      container: host,
      backgroundColor: "transparent",
      scale: DEFAULT_CUBE_CANVAS_SCALE,
      width: size,
      height: size,
    });
    mountArtboardGroundOnCanvas(canvas, { width: size, height: size }, { divisions: 3 });
    expect(host.querySelectorAll("path.ic-artboard-face--front[d]")).toHaveLength(1);
    expect(host.querySelectorAll("path.ic-artboard-face--side[d]")).toHaveLength(1);
    host.remove();
  });

  it("draws four single-stroke skewed guide paths for a 3×3 split", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const size = 900;
    const canvas = new IsometricCanvas({
      container: host,
      backgroundColor: "transparent",
      scale: DEFAULT_CUBE_CANVAS_SCALE,
      width: size,
      height: size,
    });
    mountArtboardGroundOnCanvas(canvas, { width: size, height: size }, {
      divisions: 3,
    });
    decorateCubeCanvas(canvas);
    const guides = [...host.querySelectorAll("path.ic-artboard-guide[d]")];
    expect(guides).toHaveLength(4);
    for (const guide of guides) {
      const pts = pathPoints(guide.getAttribute("d") ?? "");
      expect(pts).toHaveLength(2);
      expect(Math.abs(pts[1]!.x - pts[0]!.x)).toBeGreaterThan(1);
      expect(Math.abs(pts[1]!.y - pts[0]!.y)).toBeGreaterThan(1);
    }
    host.remove();
  });

  it("lays a dot grid on the ground between the surface fill and the guides", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const size = 900;
    const canvas = new IsometricCanvas({
      container: host,
      backgroundColor: "transparent",
      scale: DEFAULT_CUBE_CANVAS_SCALE,
      width: size,
      height: size,
    });
    mountArtboardGroundOnCanvas(canvas, { width: size, height: size }, {
      divisions: 3,
    });
    const outline = host.querySelector("path.ic-artboard-outline")!;
    const layer = host.querySelector(`path.${IC_ARTBOARD_OUTLINE_LAYER_CLASS}`)!;
    const dots = host.querySelector(`g.${IC_ARTBOARD_DOT_GRID_CLASS}`)!;
    expect(dots).toBeTruthy();
    expect(layer).toBeTruthy();
    expect(outline.nextElementSibling).toBe(layer);
    expect(layer.nextElementSibling).toBe(dots);
    expect(dots.nextElementSibling?.classList.contains("ic-artboard-subguide")).toBe(true);
    const subguides = host.querySelectorAll("path.ic-artboard-subguide[d]");
    const guides = host.querySelectorAll("path.ic-artboard-guide[d]");
    expect(subguides).toHaveLength(12);
    expect(guides).toHaveLength(4);
    const lines = [...host.querySelectorAll("path.ic-artboard-subguide, path.ic-artboard-guide")];
    expect(lines.indexOf(guides[0]!)).toBeGreaterThan(lines.indexOf(subguides[11]!));

    const [a, b, c, d, e, f] = /matrix\(([^)]+)\)/
      .exec(dots.getAttribute("transform") ?? "")![1]!
      .split(",")
      .map(Number) as [number, number, number, number, number, number];
    const project = (x: number, y: number) => ({ x: a * x + c * y + e, y: b * x + d * y + f });
    const corners = pathPoints(outline.getAttribute("d") ?? "");
    const mapped = [project(size, 0), project(size, size), project(0, size), project(0, 0)];
    mapped.forEach((pt, i) => {
      expect(pt.x).toBeCloseTo(corners[i]!.x, 3);
      expect(pt.y).toBeCloseTo(corners[i]!.y, 3);
    });

    host.remove();
  });

  it("places 9×9 centered dots in each macro cell (none on guide lines)", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const size = 900;
    const canvas = new IsometricCanvas({
      container: host,
      backgroundColor: "transparent",
      scale: DEFAULT_CUBE_CANVAS_SCALE,
      width: size,
      height: size,
    });
    mountArtboardGroundOnCanvas(canvas, { width: size, height: size }, {
      divisions: 3,
    });
    const pattern = host.querySelector(`g.${IC_ARTBOARD_DOT_GRID_CLASS} pattern`)!;
    const step = Number(pattern.getAttribute("width"));
    expect(size / 3 / step).toBeCloseTo(DEFAULT_ARTBOARD_DOTS_PER_CELL, 9);
    const dot = pattern.querySelector("circle")!;
    expect(Number(dot.getAttribute("cx"))).toBeCloseTo(step / 2, 9);
    expect(Number(dot.getAttribute("cy"))).toBeCloseTo(step / 2, 9);
    host.remove();
  });
});
