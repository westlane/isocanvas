// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import { effectiveGridCellSize, snapAxisToGrid } from "@westlane/isocanvas";

describe("snapAxisToGrid", () => {
  it("snaps to phased origin", () => {
    const policy = { origin: 100, phase: 10, size: 20 };
    expect(snapAxisToGrid(115, policy)).toBe(110);
    expect(snapAxisToGrid(124, policy)).toBe(130);
  });

  it("supports half-cell subdivision", () => {
    const policy = { origin: 0, phase: 0, size: 20, subdivision: 2 };
    expect(snapAxisToGrid(7, policy)).toBe(10);
    expect(effectiveGridCellSize(policy)).toBe(10);
  });

  it("magnetPx skips snap when too far", () => {
    const policy = { origin: 0, phase: 0, size: 20, magnetPx: 3 };
    expect(snapAxisToGrid(15, policy)).toBe(15);
    expect(snapAxisToGrid(18, policy)).toBe(20);
  });
});
