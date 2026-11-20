// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  createIsoCanvasStage,
  normalizeRowArtboardUserHeights,
  syncIsoCanvasStageArtboardRegistry,
  syncDiagramArtboardSizesOnStage,
} from "@westlane/isocanvas";

describe("IsoCanvasStage multi-artboard sync", () => {
  it("syncIsoCanvasStageArtboardRegistry adds, removes, and preserves order", () => {
    const stage = createIsoCanvasStage({ layout: "row" });
    document.body.appendChild(stage.container);

    syncIsoCanvasStageArtboardRegistry(
      stage,
      [
        { id: "a", label: "A", embedDotGrid: false, userSize: { width: 100, height: 80 } },
        { id: "b", label: "B", embedDotGrid: false, userSize: { width: 100, height: 120 } },
      ],
      { createDefaults: { embedDotGrid: false } },
    );
    expect(stage.artboardIds()).toEqual(["a", "b"]);

    syncIsoCanvasStageArtboardRegistry(stage, [
      { id: "b", label: "Beta", embedDotGrid: false },
      { id: "c", label: "C", embedDotGrid: false },
    ]);
    expect(stage.artboardIds()).toEqual(["b", "c"]);

    stage.destroy();
  });

  it("syncIsoCanvasStageArtboardRegistry reorders existing artboards to match specs", () => {
    const stage = createIsoCanvasStage({ layout: "row" });
    document.body.appendChild(stage.container);

    syncIsoCanvasStageArtboardRegistry(stage, [
      { id: "worker", embedDotGrid: false },
      { id: "organization", embedDotGrid: false },
      { id: "project", embedDotGrid: false },
      { id: "agent", embedDotGrid: false },
    ]);
    expect(stage.artboardIds()).toEqual(["worker", "organization", "project", "agent"]);

    syncIsoCanvasStageArtboardRegistry(stage, [
      { id: "worker", embedDotGrid: false },
      { id: "agent", embedDotGrid: false },
      { id: "organization", embedDotGrid: false },
      { id: "project", embedDotGrid: false },
    ]);
    expect(stage.artboardIds()).toEqual(["worker", "agent", "organization", "project"]);

    stage.destroy();
  });

  it("normalizeRowArtboardUserHeights equalizes row artboard logical height", () => {
    const stage = createIsoCanvasStage({
      layout: "row",
      artboards: [
        { id: "short", embedDotGrid: false, userSize: { width: 400, height: 200 } },
        { id: "tall", embedDotGrid: false, userSize: { width: 400, height: 360 } },
      ],
    });
    document.body.appendChild(stage.container);

    const maxH = normalizeRowArtboardUserHeights(stage.getArtboards());
    expect(maxH).toBe(360);
    expect(stage.getArtboard("short")!.artboard.root.dataset.artboardHeight).toBe("360");
    expect(stage.getArtboard("tall")!.artboard.root.dataset.artboardHeight).toBe("360");

    stage.destroy();
  });

  it("syncDiagramArtboardSizesOnStage applies scene viewBox and normalizes row", () => {
    const stage = createIsoCanvasStage({
      layout: "row",
      artboards: [
        { id: "x", embedDotGrid: false },
        { id: "y", embedDotGrid: false },
      ],
    });
    document.body.appendChild(stage.container);

    syncDiagramArtboardSizesOnStage(stage, [
      { id: "x", scene: { nodes: [], viewBox: { x: 0, y: 0, w: 500, h: 180 } } },
      { id: "y", scene: { nodes: [], viewBox: { x: 0, y: 0, w: 500, h: 260 } } },
    ]);
    expect(stage.getArtboard("x")!.artboard.root.dataset.artboardHeight).toBe("260");
    expect(stage.getArtboard("y")!.artboard.root.dataset.artboardHeight).toBe("260");

    stage.destroy();
  });
});
