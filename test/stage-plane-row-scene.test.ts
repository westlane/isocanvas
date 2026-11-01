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
