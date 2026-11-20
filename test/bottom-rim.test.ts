// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it, beforeEach } from "vitest";
import { mountCardGrid } from "./fixtures/card-grid.js";
import { initDemoTheme, demoThemeManager } from "../demo/scripts/theme.js";

describe("iso cube bottom rim overlays", () => {
  beforeEach(() => {
    initDemoTheme(document.documentElement);
  });

  function activeShowcaseColors() {
    return demoThemeManager().getTheme().colors;
  }

  it("mounts bottom and left ground contact strokes only", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    mountCardGrid(host, activeShowcaseColors());
    expect(host.querySelector("path.ic-iso-cube-bottom-rim--bottom")).toBeTruthy();
    expect(host.querySelector("path.ic-iso-cube-bottom-rim--left")).toBeTruthy();
    expect(host.querySelector("path.ic-iso-cube-footprint-contact")).toBeFalsy();
    host.remove();
  });
});
