// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import { Artboard } from "../src/stage/artboard-handle.js";
import { Stage } from "../src/stage/stage-handle.js";
import { IC_STAGE_ROW_GRID_ATTR } from "../src/stage/stage-row-layout.js";
import { DEFAULT_ISO_CANVAS_COLORS } from "../src/theme/defaults.js";

describe("Stage and Artboard", () => {
  it("Stage owns Artboard instances with scene objects", () => {
    const stage = Stage.create({ layout: "single" });
    const board = stage.addArtboard({
      id: "main",
      label: "Main",
      scene: { nodes: [{ id: "a", label: "A", x: 0, y: 0, w: 10, h: 10 }] },
    });
    expect(board).toBeInstanceOf(Artboard);
    expect(board.nodes).toHaveLength(1);
    expect(stage.getArtboard("main")).toBe(board);
    stage.destroy();
  });

  it("enables stage grid mode on the container", () => {
    const stage = Stage.create({
      layout: "row",
      row: { continuous: true, grid: true },
    });
    expect(stage.handle.container.getAttribute(IC_STAGE_ROW_GRID_ATTR)).toBe("true");
    stage.destroy();
  });

  it("mount(specs) registers artboards on the stage handle", () => {
    const stage = Stage.create({ layout: "row", row: { continuous: true } });
    stage.mount(
      [
        {
          id: "a",
          label: "A",
          scene: { nodes: [{ id: "n1", label: "N", x: 0, y: 0, w: 10, h: 10 }] },
          embedDotGrid: false,
        },
      ],
      { colors: DEFAULT_ISO_CANVAS_COLORS },
    );
    expect(stage.handle.artboardIds()).toEqual(["a"]);
    expect(stage.handle.getArtboard("a")?.host.querySelector("svg")).toBeTruthy();
    stage.destroy();
  });
});
