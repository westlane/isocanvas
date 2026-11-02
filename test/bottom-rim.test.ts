// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it, beforeEach } from "vitest";
import { mountCardGrid } from "./fixtures/card-grid.js";
import { initDemoTheme, demoThemeManager } from "../demo/scripts/theme.js";

function pathPoints(d: string): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const re = /([ML])\s*([\d.-]+)\s+([\d.-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    pts.push({ x: Number(m[2]), y: Number(m[3]) });
  }
  return pts;
}

describe("iso cube bottom rim overlays", () => {
  beforeEach(() => {
    initDemoTheme(document.documentElement);
  });

  function activeShowcaseColors() {
    return demoThemeManager().getTheme().colors;
  }

  it("mounts front and side rim paths with curved ground-edge geometry", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    mountCardGrid(host, activeShowcaseColors());
    const frontRim = host.querySelector("path.ic-iso-cube-bottom-rim--front");
    const sideRim = host.querySelector("path.ic-iso-cube-bottom-rim--side");
    expect(frontRim).toBeTruthy();
    expect(sideRim).toBeTruthy();
    for (const el of [frontRim!, sideRim!]) {
      const d = el.getAttribute("d") ?? "";
      expect(d).toMatch(/[CA]/);
      expect(pathPoints(d).length).toBeGreaterThanOrEqual(1);
    }
    host.remove();
  });
});
