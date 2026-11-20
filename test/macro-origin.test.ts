// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  DEFAULT_DOT_GRID_SIZE_PX,
  DEFAULT_ARTBOARD_USER_SIZE,
  diagramAbsoluteToUser,
  diagramUserToAbsolute,
  dotGridMacroCellSizeUser,
  dotGridMacroHomeArtboardUser,
  dotGridMacroHomeOriginUser,
  viewBoxForDiagramUserRect,
} from "@westlane/isocanvas";

describe("dot grid macro home origin", () => {
  it("places default home at the south vertex of the center 3×3 macro tile", () => {
    expect(dotGridMacroCellSizeUser()).toBe(54);
    expect(dotGridMacroHomeOriginUser()).toEqual({ x: 54, y: 108 });
  });

  it("converts between artboard user and plane pixels", () => {
    const h = DEFAULT_ARTBOARD_USER_SIZE.height;
    expect(diagramUserToAbsolute(0, 0, h)).toEqual({ x: 0, y: h });
    expect(diagramAbsoluteToUser(0, h, h)).toEqual({ x: 0, y: 0 });
    const planeHome = dotGridMacroHomeOriginUser();
    const userHome = dotGridMacroHomeArtboardUser(h);
    expect(diagramUserToAbsolute(userHome.x, userHome.y, h)).toEqual(planeHome);
  });

  it("maps user content bounds to a plane viewBox", () => {
    const h = 228;
    const viewBox = viewBoxForDiagramUserRect({ x: 0, y: 0, w: 540, h: 228 }, h, 0);
    expect(viewBox).toEqual({ x: 0, y: 0, w: 540, h: 228 });
  });

  it("scales home with custom cell size", () => {
    const cell = 20;
    expect(dotGridMacroHomeOriginUser(cell, 3)).toEqual({ x: 60, y: 120 });
    expect(cell).toBe(20);
    expect(DEFAULT_DOT_GRID_SIZE_PX).toBe(18);
  });
});
