// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  elevateStackLayersAboveArtboardGround,
  ISO_STACK_ARTBOARD_CLEARANCE_ISO,
  stackFaceOpacity,
  stackLabelFontSizePx,
  stackLabelOpacity,
  stackLayerPresentationByBoxId,
} from "../src/isometric/cube/stack-opacity.js";
import { ISO_CUBE_LABEL_FONT_SIZE_PX } from "../src/isometric/cube/canvas-text-style.js";

describe("stack layer opacity", () => {
  it("ramps opacity from bottom to top of a shared footprint", () => {
    const boxes = [
      { id: "a", label: "1", x: 0, y: 0, width: 10, depth: 10, elevation: 0 },
      { id: "b", label: "2", x: 0, y: 0, width: 10, depth: 10, elevation: 1 },
      { id: "c", label: "3", x: 0, y: 0, width: 10, depth: 10, elevation: 2 },
    ];
    const map = stackLayerPresentationByBoxId(boxes);
    expect(map.get("a")).toEqual({ rank: 0, size: 3 });
    expect(map.get("c")).toEqual({ rank: 2, size: 3 });
    expect(stackFaceOpacity(map.get("a")!)).toBeLessThan(stackFaceOpacity(map.get("c")!));
    expect(stackLabelOpacity(map.get("a")!)).toBeLessThan(stackLabelOpacity(map.get("c")!));
    expect(stackLabelOpacity(map.get("c")!)).toBe(1);
    expect(stackFaceOpacity(map.get("c")!)).toBe(1);
  });

  it("fades card faces toward the bottom of a stack", () => {
    const top = { rank: 6, size: 7 };
    const second = { rank: 5, size: 7 };
    const bottom = { rank: 0, size: 7 };
    expect(stackFaceOpacity(top)).toBe(1);
    expect(stackFaceOpacity(second)).toBeLessThan(0.9);
    expect(stackFaceOpacity(bottom)).toBeCloseTo(0.32, 2);
    expect(stackLabelOpacity(top)).toBe(1);
    expect(stackLabelOpacity(second)).toBeLessThan(0.5);
    expect(stackLabelOpacity(top) - stackLabelOpacity(second)).toBeGreaterThan(0.45);
  });

  it("ramps label font size from bottom to top of a shared footprint", () => {
    const bottom = { rank: 0, size: 7 };
    const top = { rank: 6, size: 7 };
    expect(stackLabelFontSizePx(ISO_CUBE_LABEL_FONT_SIZE_PX, top)).toBe(ISO_CUBE_LABEL_FONT_SIZE_PX);
    expect(stackLabelFontSizePx(ISO_CUBE_LABEL_FONT_SIZE_PX, bottom)).toBeLessThan(
      stackLabelFontSizePx(ISO_CUBE_LABEL_FONT_SIZE_PX, top),
    );
  });

  it("ignores single boxes on a footprint", () => {
    const map = stackLayerPresentationByBoxId([
      { id: "solo", label: "1", x: 1, y: 1, width: 10, depth: 10 },
    ]);
    expect(map.size).toBe(0);
  });

  it("lifts stacked layers so the bottom clears the artboard ground", () => {
    const boxes = [
      { id: "a", label: "1", x: 0, y: 0, width: 10, depth: 10, elevation: 0 },
      { id: "b", label: "2", x: 0, y: 0, width: 10, depth: 10, elevation: 1 },
    ];
    const lifted = elevateStackLayersAboveArtboardGround(boxes);
    expect(lifted[0]!.elevation).toBe(ISO_STACK_ARTBOARD_CLEARANCE_ISO);
    expect(lifted[1]!.elevation).toBe(1 + ISO_STACK_ARTBOARD_CLEARANCE_ISO);
    const solo = elevateStackLayersAboveArtboardGround([
      { id: "solo", label: "1", x: 1, y: 1, width: 10, depth: 10, elevation: 0 },
    ]);
    expect(solo[0]!.elevation).toBe(0);
  });
});
