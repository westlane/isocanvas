// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it, beforeEach } from "vitest";
import {
  applyArtboardHomeCamera,
  artboardDivisionPitch,
  artboardDotStep,
  artboardPlaneCellCenteredFootprint,
  artboardSnapFootprintToDots,
  createArtboard,
  DEFAULT_ARTBOARD_DOTS_PER_CELL,
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
  DEFAULT_ARTBOARD_USER_SIZE,
  elementUserBBox,
  isoBoxSpecFromPlaneBox,
  isoSizeFromDiagramUser,
  artboardPlaneToIsoGround,
  paintIsometricOrientation,
} from "@westlane/isocanvas";
import {
  DEMO_CARD_GRID_DOT_INSET,
  DEMO_CARD_GRID,
  mountCardGrid,
  DEMO_CARD_USER_DEPTH_PX,
  DEMO_CARD_USER_WIDTH_PX,
} from "./fixtures/card-grid.js";
import { demoThemeManager, initDemoTheme } from "../demo/scripts/theme.js";

describe("card grid plane placement", () => {
  beforeEach(() => {
    initDemoTheme(document.documentElement);
  });

  it("keeps the artboard outline inside the viewBox", () => {
    const artboard = createArtboard({
      embedDotGrid: false,
      userSize: DEFAULT_ARTBOARD_USER_SIZE,
    });
    document.body.appendChild(artboard.root);
    mountCardGrid(artboard.content, demoThemeManager().getTheme().colors);
    applyArtboardHomeCamera(artboard.content);
    const svg = artboard.content.querySelector("svg");
    expect(svg).toBeTruthy();
    const vb = svg!.viewBox.baseVal;
    const outline = artboard.content.querySelector("path.ic-artboard-outline")!;
    const outlineBox = elementUserBBox(outline as SVGGraphicsElement, svg);
    expect(outlineBox.x).toBeGreaterThanOrEqual(vb.x - 1);
    expect(outlineBox.x + outlineBox.width).toBeLessThanOrEqual(vb.x + vb.width + 1);
    expect(outlineBox.y).toBeGreaterThanOrEqual(vb.y - 1);
    expect(outlineBox.y + outlineBox.height).toBeLessThanOrEqual(vb.y + vb.height + 1);
    artboard.root.remove();
  });

  it("fits each card footprint inside exactly one guide cell (max one card per cell)", () => {
    const n = DEFAULT_ARTBOARD_GRID_DIVISIONS;
    const pitch = artboardDivisionPitch(DEFAULT_ARTBOARD_USER_SIZE, n);
    const stageFootprint = DEFAULT_ARTBOARD_USER_SIZE;
    const stage = isoSizeFromDiagramUser(
      DEFAULT_ARTBOARD_USER_SIZE.width,
      DEFAULT_ARTBOARD_USER_SIZE.height,
    );
    const cellL = stage.width / n;
    const cellR = stage.depth / n;
    expect(DEMO_CARD_GRID).toHaveLength(n * n);
    const footprint = artboardSnapFootprintToDots(
      { widthPx: DEMO_CARD_USER_WIDTH_PX, depthPx: DEMO_CARD_USER_DEPTH_PX },
      pitch,
    );
    const step = artboardDotStep(pitch);
    const dotSpan = DEFAULT_ARTBOARD_DOTS_PER_CELL - 2 * DEMO_CARD_GRID_DOT_INSET;
    const innerWidthPx = dotSpan * step.xPx;
    const innerDepthPx = dotSpan * step.yPx;
    const scale = Math.min(
      1,
      innerWidthPx / footprint.widthPx,
      innerDepthPx / footprint.depthPx,
    );
    const gridFootprint = artboardSnapFootprintToDots(
      { widthPx: footprint.widthPx * scale, depthPx: footprint.depthPx * scale },
      pitch,
    );
    expect(Math.round(gridFootprint.widthPx / step.xPx) * step.xPx).toBeCloseTo(
      gridFootprint.widthPx,
      9,
    );
    expect(Math.round(gridFootprint.depthPx / step.yPx) * step.yPx).toBeCloseTo(
      gridFootprint.depthPx,
      9,
    );
    const occupied = new Set<string>();
    for (const orientation of ["default", "rotated"] as const) {
      occupied.clear();
      for (const cell of DEMO_CARD_GRID) {
        const cornerX = cell.col * pitch.xPx;
        const cornerY = cell.row * pitch.yPx;
        const { x, y } = artboardPlaneCellCenteredFootprint(
          cell.col,
          cell.row,
          pitch,
          gridFootprint,
        );
        expect(x).toBeCloseTo(cornerX + (pitch.xPx - gridFootprint.widthPx) / 2, 5);
        expect(y).toBeCloseTo(cornerY + (pitch.yPx - gridFootprint.depthPx) / 2, 5);
        const spec = isoBoxSpecFromPlaneBox(
          {
            id: cell.id,
            label: cell.label,
            x,
            y,
            footprintAnchor: "back-left",
            width: gridFootprint.widthPx,
            depth: gridFootprint.depthPx,
          },
          orientation,
          stageFootprint,
        );
        let col: number;
        let row: number;
        expect(x).toBeGreaterThanOrEqual(cornerX - 1e-9);
        expect(x + gridFootprint.widthPx).toBeLessThanOrEqual(cornerX + pitch.xPx + 1e-9);
        expect(y).toBeGreaterThanOrEqual(cornerY - 1e-9);
        expect(y + gridFootprint.depthPx).toBeLessThanOrEqual(cornerY + pitch.yPx + 1e-9);
        if (orientation === "rotated") {
          const origin = artboardPlaneToIsoGround(0, 0, "rotated", stageFootprint);
          const relL = spec.left - origin.left;
          const relR = spec.right - origin.right;
          col = Math.floor(relR / cellR + 1e-9);
          row = Math.floor(relL / cellL + 1e-9);
        } else {
          col = cell.col;
          row = cell.row;
        }
        expect({ col, row }).toEqual({ col: cell.col, row: cell.row });
        const key = `${col},${row}`;
        expect(occupied.has(key)).toBe(false);
        occupied.add(key);
      }
    }
  });

  it("keeps the artboard outline inside the viewBox when rotated 90°", () => {
    const artboard = createArtboard({
      embedDotGrid: false,
      userSize: DEFAULT_ARTBOARD_USER_SIZE,
    });
    paintIsometricOrientation(artboard.root, "rotated");
    document.body.appendChild(artboard.root);
    mountCardGrid(artboard.content, demoThemeManager().getTheme().colors);
    applyArtboardHomeCamera(artboard.content);
    const svg = artboard.content.querySelector("svg");
    expect(svg).toBeTruthy();
    const vb = svg!.viewBox.baseVal;
    const outline = artboard.content.querySelector("path.ic-artboard-outline")!;
    const outlineBox = elementUserBBox(outline as SVGGraphicsElement, svg);
    expect(outlineBox.x).toBeGreaterThanOrEqual(vb.x - 1);
    expect(outlineBox.x + outlineBox.width).toBeLessThanOrEqual(vb.x + vb.width + 1);
    expect(outlineBox.y).toBeGreaterThanOrEqual(vb.y - 1);
    expect(outlineBox.y + outlineBox.height).toBeLessThanOrEqual(vb.y + vb.height + 1);
    artboard.root.remove();
  });
});
