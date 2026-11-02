// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it, beforeEach } from "vitest";
import { applyDiagramNodeSelection } from "../src/camera/node-selection.js";
import {
  applyIsoCubeExtrusionPressToShell,
  ISO_CUBE_EXTRUSION_PRESS_RATIO,
} from "../src/isometric/cube/extrusion-press.js";
import { getIsoCubeShellLiveParts } from "../src/isometric/cube/iso-cube-live-parts.js";
import { mountCardGrid } from "./fixtures/card-grid.js";
import { demoThemeManager, initDemoTheme } from "../demo/scripts/theme.js";

describe("iso cube extrusion press", () => {
  beforeEach(() => {
    initDemoTheme(document.documentElement);
  });

  it("shortens live front face extrusion when ratio drops", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    mountCardGrid(host, demoThemeManager().getTheme().colors);
    const shell = host.querySelector("g.ic-iso-cube-shell");
    const parts = getIsoCubeShellLiveParts(shell!);
    expect(parts).toBeTruthy();
    const restFrontHeight = parts!.faces.front.height;
    expect(restFrontHeight).toBeCloseTo(parts!.height);
    applyIsoCubeExtrusionPressToShell(shell!, ISO_CUBE_EXTRUSION_PRESS_RATIO);
    expect(parts!.faces.front.height).toBeCloseTo(parts!.height * ISO_CUBE_EXTRUSION_PRESS_RATIO);
    applyIsoCubeExtrusionPressToShell(shell!, 1);
    expect(parts!.faces.front.height).toBeCloseTo(restFrontHeight);
    applyDiagramNodeSelection(host, "card-1");
    expect(host.querySelector("g.ic-iso-cube-shell.ic-node--selected")).toBeTruthy();
    host.remove();
  });
});
