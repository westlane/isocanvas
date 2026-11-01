// Copyright (C) 2026 West Lane - All Rights Reserved
// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import {
  centeredArtboardHomeView,
  createArtboard,
  DEFAULT_ARTBOARD_USER_SIZE,
  readViewBoxBaselineFromSvg,
  viewBoxBaselineHome,
  viewBoxCenterArtboardInCamera,
  viewBoxOffsetFromHome,
  VIEWPORT_CENTERED_MEET,
  zoomFromViewBox,
} from "@westlane/isocanvas";
import { demoThemeManager, initDemoTheme } from "../demo/scripts/theme.js";
import { mountCardGrid } from "./fixtures/card-grid.js";

describe("centered artboard home view", () => {
  it("centers artboard user box at baseline aspect when using padding fit", () => {
    const artboard = createArtboard({
      embedDotGrid: false,
      userSize: { width: 520, height: 320 },
    });
    document.body.appendChild(artboard.root);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.dataset.debugBaseW = "640";
    svg.dataset.debugBaseH = "360";
    svg.dataset.debugHomeX = "0";
    svg.dataset.debugHomeY = "0";
    artboard.content.appendChild(svg);

    const vb = viewBoxCenterArtboardInCamera(artboard.content, { baseW: 640, baseH: 360 }, {
      artboardPaddingPx: 24,
      minWidthRatio: 1,
    });
    expect(vb).not.toBeNull();
    expect(vb!.w / vb!.h).toBeCloseTo(520 / 320, 5);
    expect(vb!.x + vb!.w / 2).toBeCloseTo(260, 5);
    expect(vb!.y + vb!.h / 2).toBeCloseTo(160, 5);
  });

  it("home view restores baseline origin at 1× zoom", () => {
    const artboard = createArtboard({
      embedDotGrid: false,
      userSize: { width: 520, height: 320 },
    });
    document.body.appendChild(artboard.root);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.dataset.debugBaseW = "640";
    svg.dataset.debugBaseH = "360";
    svg.dataset.debugHomeX = "0";
    svg.dataset.debugHomeY = "0";
    artboard.content.appendChild(svg);

    const baseline = readViewBoxBaselineFromSvg(svg);
    const vb = centeredArtboardHomeView(artboard.content, baseline);
    expect(vb).toEqual(viewBoxBaselineHome(baseline));
    expect(viewBoxOffsetFromHome(vb!, baseline)).toEqual({ x: 0, y: 0 });
    expect(zoomFromViewBox(vb!, baseline.baseW)).toBeCloseTo(1, 5);
  });

  it("sets centered meet on artboard hosts", () => {
    const artboard = createArtboard({ embedDotGrid: false });
    document.body.appendChild(artboard.root);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
    svg.dataset.debugBaseW = "1000";
    svg.dataset.debugBaseH = "1000";
    artboard.content.appendChild(svg);

    centeredArtboardHomeView(artboard.content, { baseW: 1000, baseH: 1000 });
    expect(svg.getAttribute("preserveAspectRatio")).toBe(VIEWPORT_CENTERED_MEET);
  });

  it("iso card grid home restores svg baseline at origin", () => {
    initDemoTheme(document.documentElement);
    const artboard = createArtboard({
      embedDotGrid: false,
      userSize: DEFAULT_ARTBOARD_USER_SIZE,
    });
    document.body.appendChild(artboard.root);
    mountCardGrid(artboard.content, demoThemeManager().getTheme().colors);
    const svg = artboard.content.querySelector("svg");
    expect(svg).toBeTruthy();
    const baseline = readViewBoxBaselineFromSvg(svg!);
    const vb = centeredArtboardHomeView(artboard.content, baseline);
    expect(vb).toEqual(viewBoxBaselineHome(baseline));
    expect(viewBoxOffsetFromHome(vb!, baseline)).toEqual({ x: 0, y: 0 });
    expect(zoomFromViewBox(vb!, baseline.baseW)).toBeCloseTo(1, 5);
    expect(baseline.homeY!).toBeLessThan(0);
  });
});
