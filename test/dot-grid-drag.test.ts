// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it } from "vitest";
import {
  clampDragOffset,
  defaultDotGridPhase,
  snapAndClampDragOffset,
  snapAxisToGrid,
  snapDragOffsetToDotGrid,
} from "@westlane/isocanvas";

describe("dot grid snap", () => {
  it("defaultDotGridPhase is half cell size", () => {
    expect(defaultDotGridPhase(20)).toBe(10);
    expect(defaultDotGridPhase(18)).toBe(9);
  });

  it("snapAxisToGrid aligns to phased origin", () => {
    const policy = { origin: 100, phase: 10, size: 20 };
    expect(snapAxisToGrid(115, policy)).toBe(110);
    expect(snapAxisToGrid(124, policy)).toBe(130);
  });

  it("snapDragOffsetToDotGrid adjusts offset from shell rect", () => {
    const shellRect = {
      left: 50,
      top: 40,
      right: 150,
      bottom: 140,
      width: 100,
      height: 100,
      x: 50,
      y: 40,
      toJSON: () => ({}),
    } as DOMRect;

    const current = { x: 0, y: 0 };
    const next = { x: 7, y: 3 };
    const grid = {
      originLeft: 0,
      originTop: 0,
      size: 18,
      phase: 9,
    };

    const snapped = snapDragOffsetToDotGrid(shellRect, current, next, grid);
    expect(snapped.x).toBe(13);
    expect(snapped.y).toBe(5);
  });
});

describe("drag bounds", () => {
  it("clampDragOffset keeps the shell inside padded viewport", () => {
    const shellRect = {
      left: 10,
      top: 10,
      right: 110,
      bottom: 60,
      width: 100,
      height: 50,
      x: 10,
      y: 10,
      toJSON: () => ({}),
    } as DOMRect;

    const current = { x: 0, y: 0 };
    const next = { x: 999, y: -999 };

    const clamped = clampDragOffset({
      shellRect,
      current,
      next,
      edgePadding: 16,
      viewportWidth: 200,
      viewportHeight: 100,
    });

    expect(clamped.x).toBe(200 - 16 - 110);
    expect(clamped.y).toBe(16 - 10);
  });

  it("snapAndClampDragOffset snaps then clamps", () => {
    const shellRect = {
      left: 0,
      top: 0,
      right: 100,
      bottom: 50,
      width: 100,
      height: 50,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;

    const result = snapAndClampDragOffset({
      shellRect,
      current: { x: 0, y: 0 },
      next: { x: 13, y: 8 },
      grid: { originLeft: 0, originTop: 0, size: 18, phase: 9 },
      styleSource: { style: {} } as unknown as HTMLElement,
      edgePadding: 0,
      viewportWidth: 500,
      viewportHeight: 500,
    });

    expect(result.x).toBe(9);
    expect(result.y).toBe(9);
    expect(result.guides).toEqual([]);
  });
});
