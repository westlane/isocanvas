// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  composeDotGridLayerTransform,
  isometricDotGridPlaneMatrix,
  ISO_GRID_AXIS_Y,
  readDotGridProjection,
} from "@westlane/isocanvas";

describe("dot grid projection", () => {
  it("readDotGridProjection defaults to orthogonal", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    expect(readDotGridProjection(el)).toBe("orthogonal");
    el.remove();
  });

  it("composeDotGridLayerTransform uses isometric ground matrix and zoom scale", () => {
    const transform = composeDotGridLayerTransform("isometric", 1.2);
    expect(transform).toContain("matrix(");
    expect(transform).toContain(String(ISO_GRID_AXIS_Y));
    expect(transform).toContain("scale(1.2)");
  });

  it("isometricDotGridPlaneMatrix is a valid SVG matrix", () => {
    expect(isometricDotGridPlaneMatrix()).toMatch(/^matrix\(/);
  });
});
