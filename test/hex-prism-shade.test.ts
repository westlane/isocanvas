// @vitest-environment node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import { blendHexPair, isoHexIdleVerticalShades } from "../src/isometric/hexagon/hex-prism-shade.js";

const ORG = {
  top: "#e0f2fe",
  front: "#bfdbfe",
  side: "#93c5fd",
  left: "#60a5fa",
  bottom: "#1d4ed8",
  back: "#60a5fa",
} as const;

describe("hex prism shade ladder", () => {
  it("ramps recess edges dark→mid and puts lightest ink on the side ridge", () => {
    const shades = isoHexIdleVerticalShades(ORG);
    expect(shades.front).toBe(ORG.front);
    expect(shades.side).toBe(ORG.top);
    expect(shades.recessEdgeFills[0]).toBe(ORG.left);
    expect(shades.recessEdgeFills.at(-1)).toBe(ORG.front);
  });

  it("blendHexPair endpoints match inputs", () => {
    expect(blendHexPair("#000000", "#ffffff", 0)).toBe("#000000");
    expect(blendHexPair("#000000", "#ffffff", 1)).toBe("#ffffff");
  });
});
