// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  mergeDiagramScenesOnPlaneGrid,
  planeGridStripUserSize,
  planeGridLayoutFromSlots,
} from "../src/stage/stage-plane-grid-scene.js";

describe("mergeDiagramScenesOnPlaneGrid", () => {
  it("places second row below first on +plane y", () => {
    const cellUserSize = { width: 200, height: 100 };
    const gapPx = 8;
    const merged = mergeDiagramScenesOnPlaneGrid(
      [
        {
          slot: { col: 0, row: 0, colSpan: 2 },
          scene: { nodes: [{ id: "r", label: "R", x: 10, y: 5, w: 40, h: 30 }] },
        },
        {
          slot: { col: 0, row: 1 },
          scene: { nodes: [{ id: "o", label: "O", x: 0, y: 0, w: 40, h: 30 }] },
        },
        {
          slot: { col: 1, row: 1 },
          scene: { nodes: [{ id: "p", label: "P", x: 0, y: 0, w: 40, h: 30 }] },
        },
      ],
      { cellUserSize, gapPx },
    );
  const layout = planeGridLayoutFromSlots(
    [
      { col: 0, row: 0, colSpan: 2 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
    ],
    cellUserSize,
    gapPx,
  );
    expect(planeGridStripUserSize(layout)).toEqual({ width: 408, height: 580 });
    expect(merged.nodes.find((node) => node.id === "r")!.y).toBe(5);
    expect(merged.nodes.find((node) => node.id === "o")!.y).toBe(294);
    expect(merged.nodes.find((node) => node.id === "p")!.x).toBe(208);
  });
});
