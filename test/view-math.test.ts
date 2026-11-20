// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  clamp,
  isValidViewBox,
  normalizedWheelDelta,
  viewBoxPanByWorldViewport,
  viewBoxZoomAtPoint,
  viewBoxUserFromClientInWorldViewport,
  wheelZoomFactor,
  worldTransformFromViewBox,
  worldTranslateStyleFromViewBox,
  dotGridWorldStyleFromViewBox,
} from "@westlane/isocanvas";

describe("view-math", () => {
  it("clamp keeps values inside bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it("normalizedWheelDelta scales line and page modes", () => {
    expect(normalizedWheelDelta(3, 0, 800)).toBe(3);
    expect(normalizedWheelDelta(2, 1, 800)).toBe(32);
    expect(normalizedWheelDelta(1, 2, 500)).toBe(500);
  });

  it("wheelZoomFactor zooms in for positive wheel delta", () => {
    expect(wheelZoomFactor(0)).toBeCloseTo(1);
    expect(wheelZoomFactor(10)).toBeGreaterThan(1);
    expect(wheelZoomFactor(-10)).toBeLessThan(1);
  });

  it("viewBoxZoomAtPoint keeps the anchor fixed", () => {
    const next = viewBoxZoomAtPoint({ x: 0, y: 0, w: 100, h: 50 }, 25, 10, 0.5);
    expect(next).toEqual({ x: 12.5, y: 5, w: 50, h: 25 });
    expect(isValidViewBox(next)).toBe(true);
  });

  it("viewBoxZoomAtPoint keeps the wheel anchor under the same client point", () => {
    const vb = { x: 10, y: 20, w: 100, h: 100 };
    const anchor = { x: 40, y: 60 };
    const factor = wheelZoomFactor(-40);
    const next = viewBoxZoomAtPoint(vb, anchor.x, anchor.y, factor);
    const { tx, ty, scale } = worldTransformFromViewBox(vb, 200, 200, "mid");
    const clientX = tx + (anchor.x - vb.x) * scale;
    const clientY = ty + (anchor.y - vb.y) * scale;
    const { tx: ntx, ty: nty, scale: nscale } = worldTransformFromViewBox(next, 200, 200, "mid");
    const clientXAfter = ntx + (anchor.x - next.x) * nscale;
    const clientYAfter = nty + (anchor.y - next.y) * nscale;
    expect(clientXAfter).toBeCloseTo(clientX, 5);
    expect(clientYAfter).toBeCloseTo(clientY, 5);
  });

  it("viewBoxPanByWorldViewport moves the frame opposite drag", () => {
    const next = viewBoxPanByWorldViewport({ x: 10, y: 20, w: 100, h: 50 }, 10, 0, 200, 100);
    expect(next.x).toBe(5);
    expect(next.y).toBe(20);
    expect(next.w).toBe(100);
  });

  it("worldTransformFromViewBox uses uniform scale and letterboxing", () => {
    const { tx, ty, sx, sy, scale } = worldTransformFromViewBox(
      { x: 10, y: 20, w: 100, h: 100 },
      200,
      100,
    );
    expect(scale).toBe(1);
    expect(sx).toBe(sy);
    expect(tx).toBe(50);
    expect(ty).toBe(0);
  });

  it("worldTranslateStyleFromViewBox omits scale for sharp SVG viewBox zoom", () => {
    const style = worldTranslateStyleFromViewBox({ x: 0, y: 0, w: 50, h: 50 }, 200, 200);
    expect(style).toContain("translate(");
    expect(style).not.toContain("scale(");
  });

  it("dotGridWorldStyleFromViewBox grows cell size when zoomed in", () => {
    const at1 = dotGridWorldStyleFromViewBox({ x: 0, y: 0, w: 100, h: 100 }, 200, 200, 18, 9);
    const zoomed = dotGridWorldStyleFromViewBox({ x: 0, y: 0, w: 50, h: 50 }, 200, 200, 18, 9);
    expect(at1.cellPx).toBe(36);
    expect(zoomed.cellPx).toBe(72);
  });

  it("viewBoxUserFromClientInWorldViewport matches SVG meet (no double vb.x)", () => {
    const vb = { x: 10, y: 20, w: 100, h: 100 };
    const anchor = { left: 0, top: 0, width: 200, height: 200 } as DOMRect;
    const targetX = 30;
    const targetY = 40;
    const { tx, ty, scale } = worldTransformFromViewBox(vb, 200, 200, "mid");
    const clientX = anchor.left + tx + (targetX - vb.x) * scale;
    const clientY = anchor.top + ty + (targetY - vb.y) * scale;
    const user = viewBoxUserFromClientInWorldViewport(
      clientX,
      clientY,
      anchor,
      vb,
      200,
      200,
      0,
      0,
      "mid",
    );
    expect(user.x).toBeCloseTo(targetX, 5);
    expect(user.y).toBeCloseTo(targetY, 5);
  });

  it("viewBoxUserFromClientInWorldViewport respects xMinYMin meet alignment", () => {
    const vb = { x: 10, y: 20, w: 100, h: 100 };
    const anchor = { left: 0, top: 0, width: 200, height: 200 } as DOMRect;
    const targetX = 30;
    const targetY = 40;
    const { tx, ty, scale } = worldTransformFromViewBox(vb, 200, 200, "min");
    const clientX = anchor.left + tx + (targetX - vb.x) * scale;
    const clientY = anchor.top + ty + (targetY - vb.y) * scale;
    const user = viewBoxUserFromClientInWorldViewport(
      clientX,
      clientY,
      anchor,
      vb,
      200,
      200,
      0,
      0,
      "min",
    );
    expect(user.x).toBeCloseTo(targetX, 5);
    expect(user.y).toBeCloseTo(targetY, 5);
  });

  it("dotGridWorldStyleFromViewBox shifts with SVG offset in anchor space", () => {
    const base = dotGridWorldStyleFromViewBox({ x: 0, y: 0, w: 100, h: 100 }, 200, 200, 20, 10);
    const shifted = dotGridWorldStyleFromViewBox(
      { x: 0, y: 0, w: 100, h: 100 },
      200,
      200,
      20,
      10,
      { insetAnchorPx: 0, contentOffsetXPx: 24, contentOffsetYPx: 0 },
    );
    expect(shifted.planePanXPx - base.planePanXPx).toBeCloseTo(24, 5);
    expect(shifted.phaseBackgroundPosition).toBe(base.phaseBackgroundPosition);
  });

  it("dotGridWorldStyleFromViewBox uses SVG meet box scale when anchor is larger", () => {
    const anchorWide = dotGridWorldStyleFromViewBox(
      { x: 0, y: 0, w: 100, h: 100 },
      800,
      600,
      20,
      10,
      { insetAnchorPx: 0, contentOffsetXPx: 0, contentOffsetYPx: 0 },
    );
    const svgSized = dotGridWorldStyleFromViewBox(
      { x: 0, y: 0, w: 100, h: 100 },
      400,
      300,
      20,
      10,
    );
    expect(anchorWide.cellPx).toBeGreaterThan(svgSized.cellPx);
  });

  it("dotGridWorldStyleFromViewBox pan moves plane once; phase layer stays fixed", () => {
    const origin = dotGridWorldStyleFromViewBox({ x: 0, y: 0, w: 400, h: 300 }, 400, 300, 20, 10);
    const panned = dotGridWorldStyleFromViewBox({ x: 40, y: 0, w: 400, h: 300 }, 400, 300, 20, 10);
    expect(panned.planePanXPx - origin.planePanXPx).toBeCloseTo(-40, 5);
    expect(panned.phaseBackgroundPosition).toBe(origin.phaseBackgroundPosition);
  });

  it("isValidViewBox rejects non-finite or empty boxes", () => {
    expect(isValidViewBox({ x: 0, y: 0, w: 1, h: 1 })).toBe(true);
    expect(isValidViewBox({ x: 0, y: 0, w: 0, h: 1 })).toBe(false);
    expect(isValidViewBox({ x: NaN, y: 0, w: 1, h: 1 })).toBe(false);
  });
});
