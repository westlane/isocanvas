// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  planeRectsSpaceBetweenInRow,
  defaultLatticeStage,
  DEFAULT_ARTBOARD_LAYOUT_DOT_INSET,
  DEFAULT_ARTBOARD_LAYOUT_DOT_INSET_TRAILING,
} from "../src/diagram/scene-lattice-layout.js";
import { DIAGRAM_NODE_FOOTPRINT } from "../src/layout/diagram-node-footprint.js";
import {
  artboardPlaneGridLineStep,
  enforcePlaneBoxOnArtboardLattice,
} from "../src/layout/lattice-plane.js";
import { DEFAULT_ARTBOARD_GRID_DIVISIONS } from "../src/layout/artboard.js";

/** Class-diagram footprint (domainspec NODE_FOOTPRINT). */
const NODE = DIAGRAM_NODE_FOOTPRINT;

describe("artboard row space-between", () => {
  it("uses equal fine-line gaps between three neighbors in a row band", () => {
    const stage = { ...defaultLatticeStage(), divisions: 3 };
    const renderStage = { ...stage, divisions: DEFAULT_ARTBOARD_GRID_DIVISIONS };
    const step = artboardPlaneGridLineStep(renderStage).xPx;
    const rects = planeRectsSpaceBetweenInRow(0, 3, NODE, {
      stage,
      dotInset: DEFAULT_ARTBOARD_LAYOUT_DOT_INSET,
      rowCount: 1,
    });
    expect(rects).toHaveLength(3);
    const [r0, r1, r2] = rects;
    expect(r0).toBeDefined();
    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
    const boxes = [r0!, r1!, r2!].map((rect, i) =>
      enforcePlaneBoxOnArtboardLattice(
        {
          id: String(i),
          label: String(i),
          x: rect.x,
          y: rect.y,
          width: rect.w,
          depth: rect.h,
          footprintAnchor: "back-left",
        },
        renderStage,
      ),
    );
    const [b0, b1, b2] = boxes;
    expect(b0).toBeDefined();
    expect(b1).toBeDefined();
    expect(b2).toBeDefined();
    const gap01 = (b1!.x - (b0!.x + b0!.width)) / step;
    const gap12 = (b2!.x - (b1!.x + b1!.width)) / step;
    expect(gap01).toBeCloseTo(gap12, 4);
    expect(gap01).toBeGreaterThanOrEqual(5);
  });

  it("packs variable label footprints left-to-right without horizontal overlap", () => {
    const stage = { ...defaultLatticeStage(), divisions: 5 };
    const step = artboardPlaneGridLineStep(stage).xPx;
    const minGapLines = 3;
    const wide = { widthPx: NODE.widthPx * 2.2, depthPx: NODE.depthPx };
    const rects = planeRectsSpaceBetweenInRow(0, 3, NODE, {
      stage,
      dotInset: DEFAULT_ARTBOARD_LAYOUT_DOT_INSET,
      dotInsetTrailing: DEFAULT_ARTBOARD_LAYOUT_DOT_INSET_TRAILING,
      rowCount: 1,
      rowSpan: 5,
      gridCols: 3,
      minInterColumnGapLines: minGapLines,
      itemFootprints: [wide, NODE, NODE],
    });
    expect(rects).toHaveLength(3);
    for (let i = 0; i < rects.length - 1; i += 1) {
      const left = rects[i]!;
      const right = rects[i + 1]!;
      expect(right.x).toBeGreaterThanOrEqual(left.x + left.w - 1e-6);
      const gapLines = (right.x - (left.x + left.w)) / step;
      expect(gapLines).toBeGreaterThanOrEqual(1 - 1e-6);
    }
  });

  it("pins a full row to the inner band edges (space-between)", () => {
    const stage = { ...defaultLatticeStage(), divisions: 3 };
    const rects = planeRectsSpaceBetweenInRow(0, 3, NODE, {
      stage,
      dotInset: DEFAULT_ARTBOARD_LAYOUT_DOT_INSET,
      rowCount: 1,
      gridCols: 3,
    });
    const pitch = stage.width / (stage.divisions ?? 3);
    const step = artboardPlaneGridLineStep(stage).xPx;
    const rowMinX = DEFAULT_ARTBOARD_LAYOUT_DOT_INSET * step;
    const rowMaxInner = 3 * pitch - DEFAULT_ARTBOARD_LAYOUT_DOT_INSET * step;
    expect(rects[0]!.x).toBeCloseTo(rowMinX, 4);
    expect(rects[2]!.x + rects[2]!.w).toBeCloseTo(rowMaxInner, 4);
  });

  it("uses equal vertical gaps between rows in the layout band", () => {
    const stage = { ...defaultLatticeStage(), divisions: 4 };
    const rowCount = 4;
    const step = artboardPlaneGridLineStep(stage).yPx;
    const rowRects = Array.from({ length: rowCount }, (_, row) =>
      planeRectsSpaceBetweenInRow(row, 3, NODE, {
        stage,
        dotInset: DEFAULT_ARTBOARD_LAYOUT_DOT_INSET,
        rowCount,
        rowSpan: rowCount,
      }),
    );
    const gaps: number[] = [];
    for (let row = 0; row < rowCount - 1; row += 1) {
      const top = rowRects[row]?.[0];
      const bottom = rowRects[row + 1]?.[0];
      if (!top || !bottom) {
        continue;
      }
      gaps.push((bottom.y - (top.y + top.h)) / step);
    }
    expect(gaps.length).toBe(3);
    const maxGap = Math.max(...gaps);
    const minGap = Math.min(...gaps);
    expect(maxGap - minGap).toBeLessThanOrEqual(1.01);
  });

  it("leaves the same dotInset margin above the top row and below the bottom row", () => {
    const stage = { ...defaultLatticeStage(), divisions: 4 };
    const rowCount = 4;
    const dotInset = DEFAULT_ARTBOARD_LAYOUT_DOT_INSET;
    const dotInsetTrailing = DEFAULT_ARTBOARD_LAYOUT_DOT_INSET_TRAILING;
    const step = artboardPlaneGridLineStep(stage).yPx;
    const topRow = planeRectsSpaceBetweenInRow(0, 3, NODE, {
      stage,
      dotInset,
      dotInsetTrailing: DEFAULT_ARTBOARD_LAYOUT_DOT_INSET_TRAILING,
      rowCount,
      rowSpan: stage.divisions,
    })[0];
    const bottomRow = planeRectsSpaceBetweenInRow(3, 3, NODE, {
      stage,
      dotInset,
      dotInsetTrailing: DEFAULT_ARTBOARD_LAYOUT_DOT_INSET_TRAILING,
      rowCount,
      rowSpan: stage.divisions,
    })[0];
    expect(topRow).toBeDefined();
    expect(bottomRow).toBeDefined();
    const marginAbove = topRow!.y / step;
    const marginBelow = (stage.height - (bottomRow!.y + bottomRow!.h)) / step;
    expect(marginAbove).toBeCloseTo(dotInset, 4);
    expect(marginBelow).toBeCloseTo(dotInsetTrailing, 4);
  });

  it("uses trailing rim inset so the last column matches leading stud margin", () => {
    const stage = { ...defaultLatticeStage(), divisions: 4 };
    const rowCount = 4;
    const dotInset = DEFAULT_ARTBOARD_LAYOUT_DOT_INSET;
    const step = artboardPlaneGridLineStep(stage).xPx;
    const row = planeRectsSpaceBetweenInRow(0, 4, NODE, {
      stage,
      dotInset,
      dotInsetTrailing: DEFAULT_ARTBOARD_LAYOUT_DOT_INSET_TRAILING,
      rowCount,
      rowSpan: stage.divisions,
      gridCols: 4,
    });
    const left = row[0]!;
    const right = row[row.length - 1]!;
    const marginLeft = left.x / step;
    const marginRight = (stage.width - (right.x + right.w)) / step;
    expect(marginLeft).toBeCloseTo(dotInset, 4);
    expect(marginRight).toBeCloseTo(dotInset, 4);
  });

  it("uses equal fine-line gaps between four columns in a row band", () => {
    const stage = { ...defaultLatticeStage(), divisions: 4 };
    const step = artboardPlaneGridLineStep(stage).xPx;
    const rects = planeRectsSpaceBetweenInRow(0, 4, NODE, {
      stage,
      dotInset: DEFAULT_ARTBOARD_LAYOUT_DOT_INSET,
      dotInsetTrailing: DEFAULT_ARTBOARD_LAYOUT_DOT_INSET_TRAILING,
      rowCount: 4,
      rowSpan: 4,
      gridCols: 4,
    });
    expect(rects).toHaveLength(4);
    const gaps: number[] = [];
    for (let i = 0; i < 3; i += 1) {
      gaps.push((rects[i + 1]!.x - (rects[i]!.x + rects[i]!.w)) / step);
    }
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(0.001);
    for (const gap of gaps) {
      expect(gap).toBeCloseTo(gaps[0]!, 4);
      expect(gap).toBeGreaterThanOrEqual(5);
    }
  });

  it("aligns partial rows to the same column slots as full rows", () => {
    const stage = { ...defaultLatticeStage(), divisions: 4 };
    const gridCols = 4;
    const rowCount = 3;
    const layoutOpts = {
      stage,
      dotInset: DEFAULT_ARTBOARD_LAYOUT_DOT_INSET,
      rowCount,
      rowSpan: stage.divisions,
      gridCols,
    };
    const row0 = planeRectsSpaceBetweenInRow(0, 4, NODE, layoutOpts);
    const row2 = planeRectsSpaceBetweenInRow(2, 3, NODE, layoutOpts);
    expect(row2[0]?.x).toBeCloseTo(row0[0]!.x, 4);
    expect(row2[1]?.x).toBeCloseTo(row0[1]!.x, 4);
    expect(row2[2]?.x).toBeCloseTo(row0[2]!.x, 4);
  });
});
