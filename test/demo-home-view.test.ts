// Copyright (C) 2026 West Lane - All Rights Reserved
// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import {
  applyWorldCameraToHost,
  centeredArtboardHomeView,
  createArtboard,
  DEFAULT_ARTBOARD_USER_SIZE,
  readViewBoxBaselineFromSvg,
  readWorldCameraFromHost,
} from "@westlane/isocanvas";
import { applyDemoHomeView } from "../demo/scripts/viewport.js";
import { demoThemeManager, initDemoTheme } from "../demo/scripts/theme.js";
import { mountCardGrid } from "./fixtures/card-grid.js";

describe("demo snap home", () => {
  it("clears pan offset after URL-style camera and applyDemoHomeView", () => {
    initDemoTheme(document.documentElement);
    const artboard = createArtboard({
      embedDotGrid: false,
      userSize: DEFAULT_ARTBOARD_USER_SIZE,
    });
    document.body.appendChild(artboard.root);
    artboard.root.style.width = "800px";
    artboard.root.style.height = "600px";
    const host = artboard.content;
    mountCardGrid(host, demoThemeManager().getTheme().colors);
    const svg = host.querySelector("svg")!;
    const layout = { x: 0, y: 0, width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600 };
    for (const el of [artboard.root, host, svg]) {
      el.getBoundingClientRect = () => layout as DOMRect;
    }

    const baseline = readViewBoxBaselineFromSvg(svg);
    const home = centeredArtboardHomeView(host, baseline);
    expect(home).not.toBeNull();
    expect(applyWorldCameraToHost(host, home!)).toBe(true);

    const panned = { ...home!, x: home!.x - 520, y: home!.y - 460 };
    expect(applyWorldCameraToHost(host, panned)).toBe(true);

    window.location.hash = "#demo/card-grid&view=1/500/500";
    expect(applyDemoHomeView(host)).toBe(true);

    const camera = readWorldCameraFromHost(host)!;
    expect(camera.w).toBeCloseTo(home!.w, 0);
    expect(camera.h).toBeCloseTo(home!.h, 0);
    expect(camera.x).toBeCloseTo(home!.x, 0);
    expect(camera.y).toBeCloseTo(home!.y, 0);
    expect(window.location.hash).not.toContain("&view=1/500/500");
  });
});
