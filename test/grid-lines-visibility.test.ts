// @vitest-environment happy-dom
// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it, beforeEach } from "vitest";
import { applyGridLinesMode } from "../src/theme/grid-lines-mode.js";
import { mountCardGrid } from "./fixtures/card-grid.js";
import { initDemoTheme, demoThemeManager } from "../demo/scripts/theme.js";

describe("grid lines visibility", () => {
  beforeEach(() => {
    initDemoTheme(document.documentElement);
    applyGridLinesMode(document.documentElement, true);
  });

  it("mounts macro and sub guides in the card grid", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    mountCardGrid(host, demoThemeManager().getTheme().colors);
    expect(host.querySelectorAll("path.ic-artboard-guide[d]")).toHaveLength(4);
    expect(host.querySelectorAll("path.ic-artboard-subguide[d]")).toHaveLength(12);
    expect(host.querySelectorAll("path.ic-artboard-fineguide[d]")).toHaveLength(36);
    host.remove();
  });
});
