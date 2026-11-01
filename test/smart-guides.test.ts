// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it } from "vitest";
import { snapBoxWithAlignmentGuides } from "@westlane/isocanvas";

describe("snapBoxWithAlignmentGuides", () => {
  it("snaps moving left edge to target left edge", () => {
    const result = snapBoxWithAlignmentGuides({
      moving: { x: 48, y: 0, width: 40, height: 20 },
      others: [{ x: 50, y: 0, width: 30, height: 20 }],
      threshold: 5,
    });
    expect(result.dx).toBe(2);
    expect(result.guides.length).toBeGreaterThan(0);
  });

  it("returns zero delta when outside threshold", () => {
    const result = snapBoxWithAlignmentGuides({
      moving: { x: 0, y: 0, width: 10, height: 10 },
      others: [{ x: 100, y: 80, width: 10, height: 10 }],
      threshold: 4,
    });
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(0);
    expect(result.guides).toEqual([]);
  });
});
