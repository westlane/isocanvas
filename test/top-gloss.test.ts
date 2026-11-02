// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it, beforeEach } from "vitest";
import { mountCardGrid } from "./fixtures/card-grid.js";
import { initDemoTheme, demoThemeManager } from "../demo/scripts/theme.js";
import {
  isoCubeTopFaceCornerAnchors,
  ISO_CUBE_TOP_GLOSS_INSET_RATIO,
} from "../src/isometric/cube/cube-faces.js";
import { lerpIsoTopPlaneAnchor } from "../src/isometric/cube/top-face-curve.js";

describe("iso cube top gloss overlay", () => {
  beforeEach(() => {
    initDemoTheme(document.documentElement);
  });

  it("uses inset curved triangle geometry", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    mountCardGrid(host, demoThemeManager().getTheme().colors);
    const gloss = host.querySelector("path.ic-iso-cube-top-gloss");
    expect(gloss).toBeTruthy();
    const d = gloss!.getAttribute("d") ?? "";
    expect(d).toMatch(/[CA]/);

    const [a] = isoCubeTopFaceCornerAnchors(2, 1.25, 0.9);
    const center = { right: 1, left: -1.125 };
    const insetA = lerpIsoTopPlaneAnchor(a, center, ISO_CUBE_TOP_GLOSS_INSET_RATIO);
    expect(Math.hypot(insetA.right - a.right, insetA.left - a.left)).toBeGreaterThan(0.01);
    host.remove();
  });
});
