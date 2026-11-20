// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import { createIsoCubeTopGlossTriangle } from "../src/isometric/cube/top-gloss.js";
import { createIsoHexTopGlossHalf } from "../src/isometric/hexagon/hex-top-gloss.js";

describe("hex top gloss", () => {
  it("covers the back-left hex half, not the cube parallelogram triangle", () => {
    const cubeGloss = createIsoCubeTopGlossTriangle(2, 1.25, 1, "default");
    const hexGloss = createIsoHexTopGlossHalf(2, 1.25, 1, "default");
    expect(hexGloss.getElement().classList.contains("ic-iso-cube-top-gloss")).toBe(true);
    expect(cubeGloss.getElement().classList.contains("ic-iso-cube-top-gloss")).toBe(true);
    expect(hexGloss).not.toBe(cubeGloss);
  });
});
