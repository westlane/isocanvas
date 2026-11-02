// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  mergeDiagramScenesAlongPlaneRow,
  planeRowStripUserSize,
} from "../src/stage/stage-plane-row-scene.js";

describe("mergeDiagramScenesAlongPlaneRow", () => {
  it("offsets each column along plane +x with gap", () => {
    const merged = mergeDiagramScenesAlongPlaneRow(
      [
        {
          nodes: [{ id: "a", label: "A", x: 10, y: 5, w: 40, h: 30 }],
        },
        {
          nodes: [{ id: "b", label: "B", x: 0, y: 0, w: 40, h: 30 }],
        },
      ],
      { columnUserSize: { width: 200, height: 100 }, gapPx: 6 },
    );
    expect(merged.viewBox).toEqual({ x: 0, y: 0, w: 406, h: 100 });
    expect(merged.nodes[0]!.x).toBe(10);
    expect(merged.nodes[1]!.x).toBe(206);
  });

  it("keeps dot inset from viewBox origin instead of tight node bounds", () => {
    const insetX = 24;
    const merged = mergeDiagramScenesAlongPlaneRow(
      [
        {
          viewBox: { x: 0, y: 0, w: 200, h: 100 },
          nodes: [{ id: "a", label: "A", x: insetX, y: 8, w: 40, h: 30 }],
        },
      ],
      { columnUserSize: { width: 200, height: 100 }, gapPx: 6 },
    );
    expect(merged.nodes[0]!.x).toBe(insetX);
  });
});

describe("planeRowStripUserSize", () => {
  it("matches merge strip width", () => {
    expect(planeRowStripUserSize(3, { width: 200, height: 100 }, 6)).toEqual({
      width: 612,
      height: 100,
    });
  });
});

describe("relayoutDiagramSceneNodesInPackedRows plane row", () => {
  it("repacks label-sized nodes inside each plane-row column", async () => {
    const { relayoutDiagramSceneNodesInPackedRows } = await import(
      "../src/diagram/scene-lattice-layout.js"
    );
    const { DIAGRAM_NODE_FOOTPRINT } = await import("../src/layout/diagram-node-footprint.js");
    const cellW = 200;
    const gap = 6;
    const merged = mergeDiagramScenesAlongPlaneRow(
      [
        {
          divisions: 5,
          nodes: [
            { id: "a1", label: "Alpha", x: 24, y: 40, w: 80, h: 40 },
            { id: "a2", label: "Beta", x: 120, y: 40, w: 80, h: 40 },
          ],
        },
        {
          divisions: 5,
          nodes: [{ id: "b1", label: "Gamma", x: 24, y: 40, w: 80, h: 40 }],
        },
      ],
      { columnUserSize: { width: cellW, height: 100 }, gapPx: gap },
    );
    const stripStage = {
      x: 0,
      y: 0,
      width: merged.viewBox!.w,
      height: merged.viewBox!.h,
      divisions: 5,
    };
    const planeRowColumns = {
      cellWidth: cellW,
      cellHeight: 100,
      gapPx: gap,
      columnCount: 2,
    };
    const relaid = relayoutDiagramSceneNodesInPackedRows(merged.nodes, stripStage, {
      footprintUser: DIAGRAM_NODE_FOOTPRINT,
      planeRowColumns,
      rowCount: 1,
      rowSpan: 5,
      gridCols: 3,
    });
    const col0 = relaid.filter((node) => node.x < cellW);
    const col1 = relaid.filter((node) => node.x >= cellW + gap);
    expect(col0.map((node) => node.id).sort()).toEqual(["a1", "a2"]);
    expect(col1.map((node) => node.id)).toEqual(["b1"]);
    for (const node of col0) {
      expect(node.x + node.w).toBeLessThanOrEqual(cellW + 1);
    }
    for (const node of col1) {
      expect(node.x).toBeGreaterThanOrEqual(cellW + gap - 1);
      expect(node.x + node.w).toBeLessThanOrEqual(cellW + gap + cellW + 1);
    }
  });
});
