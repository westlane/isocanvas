// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import { inflateBox, unionBox } from "@westlane/isocanvas";

describe("box2d", () => {
  it("unionBox merges disjoint boxes into one hull", () => {
    const merged = unionBox(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 20, y: 5, width: 10, height: 10 },
    );
    expect(merged).toEqual({ x: 0, y: 0, width: 30, height: 15 });
  });

  it("unionBox adopts box when target has no area", () => {
    const merged = unionBox(
      { x: 0, y: 0, width: 0, height: 0 },
      { x: 3, y: 4, width: 6, height: 8 },
    );
    expect(merged).toEqual({ x: 3, y: 4, width: 6, height: 8 });
  });

  it("inflateBox scales about the center", () => {
    const inflated = inflateBox({ x: 0, y: 0, width: 10, height: 20 }, 2);
    expect(inflated).toEqual({ x: -5, y: -10, width: 20, height: 40 });
  });
});
