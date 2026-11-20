// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  artboardUserSizeFromIso216Series,
  iso216ArtboardSizeMm,
} from "../src/layout/iso216-artboard-size.js";

describe("iso216 artboard size", () => {
  it("A0 portrait matches ISO 216 mm", () => {
    const a0 = iso216ArtboardSizeMm(0);
    expect(a0.widthMm).toBeCloseTo(841, 0);
    expect(a0.heightMm).toBeCloseTo(1189, 0);
  });

  it("A17 landscape preserves sqrt(2) aspect at a scaled long edge", () => {
    const size = artboardUserSizeFromIso216Series(17, { landscape: true, longEdgePx: 1900 });
    expect(size.width).toBe(1900);
    expect(size.height / size.width).toBeCloseTo(1 / Math.sqrt(2), 5);
  });
});
