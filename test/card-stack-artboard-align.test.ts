// @vitest-environment happy-dom
// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it, beforeEach } from "vitest";
import {
  artboardDivisionPitch,
  artboardDotStep,
  artboardPlaneCellCenteredFootprint,
  DEFAULT_ARTBOARD_DOTS_PER_CELL,
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
  DEFAULT_ARTBOARD_USER_SIZE,
  isoBoxSpecFromPlaneBox,
  isoSizeFromDiagramUser,
} from "@westlane/isocanvas";
import {
  DEMO_STACK_CENTER_LAYER_COUNT,
  DEMO_STACK_FOOTPRINT_DOT_INSET,
  mountCardStack,
} from "./fixtures/card-grid.js";
import { demoThemeManager, initDemoTheme } from "../demo/scripts/theme.js";

describe("card stack plane placement", () => {
  beforeEach(() => {
    initDemoTheme(document.documentElement);
  });

  it("anchors square stacks in the middle row (left, center, right)", () => {
    const n = DEFAULT_ARTBOARD_GRID_DIVISIONS;
    const pitch = artboardDivisionPitch(DEFAULT_ARTBOARD_USER_SIZE, n);
    const step = artboardDotStep(pitch);
    const sidePx =
      (DEFAULT_ARTBOARD_DOTS_PER_CELL - 2 * DEMO_STACK_FOOTPRINT_DOT_INSET) * step.xPx;
    const middleRow = Math.floor(n / 2);
    const center = middleRow;
    const { x, y } = artboardPlaneCellCenteredFootprint(center, middleRow, pitch, {
      widthPx: sidePx,
      depthPx: sidePx,
    });
    expect(sidePx).toBeCloseTo(
      pitch.xPx * (1 - (2 * DEMO_STACK_FOOTPRINT_DOT_INSET) / DEFAULT_ARTBOARD_DOTS_PER_CELL),
      5,
    );
    expect(sidePx).toBeLessThan(DEFAULT_ARTBOARD_USER_SIZE.width);

    const spec = isoBoxSpecFromPlaneBox({
      id: "stack-center-7",
      label: "7",
      x,
      y,
      footprintAnchor: "back-left",
      width: sidePx,
      depth: sidePx,
    });
    const stage = isoSizeFromDiagramUser(
      DEFAULT_ARTBOARD_USER_SIZE.width,
      DEFAULT_ARTBOARD_USER_SIZE.height,
    );
    const cellL = stage.width / n;
    const cellR = stage.depth / n;
    const col = Math.floor(-spec.left / cellL + 1e-9);
    const row = Math.floor(spec.right / cellR + 1e-9);
    expect({ col, row }).toEqual({ col: center, row: middleRow });
    expect(spec.width).toBeCloseTo(spec.depth, 9);

    const half = Math.floor(DEMO_STACK_CENTER_LAYER_COUNT / 2);
    const double = DEMO_STACK_CENTER_LAYER_COUNT * 2;
    const expectedLayers = half + DEMO_STACK_CENTER_LAYER_COUNT + double;

    const host = document.createElement("div");
    document.body.appendChild(host);
    mountCardStack(host, demoThemeManager().getTheme().colors);
    expect(host.querySelector("svg")).toBeTruthy();
    expect(host.querySelectorAll('g.node[data-object-id^="stack-"]')).toHaveLength(expectedLayers);
    host.remove();
  });

  it("fades lower stack cards and keeps the top label opaque", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    mountCardStack(host, demoThemeManager().getTheme().colors);
    const bottomLabel = host.querySelector(
      'g.node[data-object-id="stack-center-7"] g.ic-iso-cube-label',
    );
    const topLabel = host.querySelector(
      'g.node[data-object-id="stack-center-1"] g.ic-iso-cube-label',
    );
    expect(bottomLabel?.getAttribute("opacity")).toBeTruthy();
    expect(topLabel?.getAttribute("opacity")).toBe("1");
    expect(Number(bottomLabel?.getAttribute("opacity"))).toBeLessThan(1);
    host.remove();
  });

  it("renders smaller label type on lower stack cards", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    mountCardStack(host, demoThemeManager().getTheme().colors);
    const labelFontSize = (id: string): number => {
      const tspan = host.querySelector(`g.node[data-object-id="${id}"] g.ic-iso-cube-label tspan`);
      return Number.parseFloat(tspan?.getAttribute("font-size") ?? "0");
    };
    expect(labelFontSize("stack-center-1")).toBeGreaterThan(labelFontSize("stack-center-7"));
    host.remove();
  });
});
