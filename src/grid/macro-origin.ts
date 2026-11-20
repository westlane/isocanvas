// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ViewBox } from "../types/core.js";
import { artboardUserToPlane, planeToArtboardUser } from "../layout/artboard-coords.js";
import { DEFAULT_ARTBOARD_USER_SIZE } from "../layout/artboard.js";
import { DEFAULT_DOT_GRID_SIZE_PX } from "./surface.js";

/** Default span×span macro lattice on the demo canvas stage. */
export const DEFAULT_DOT_GRID_MACRO_SPAN = 3;

export type DiagramHomeOrigin = { x: number; y: number };

export function dotGridMacroCellSizeUser(
  cellSize = DEFAULT_DOT_GRID_SIZE_PX,
  span = DEFAULT_DOT_GRID_MACRO_SPAN,
): number {
  return span * cellSize;
}

/**
 * South vertex of the center macro tile in plane space (viewBox top-left coords).
 */
export function dotGridMacroHomeOriginUser(
  cellSize = DEFAULT_DOT_GRID_SIZE_PX,
  span = DEFAULT_DOT_GRID_MACRO_SPAN,
): DiagramHomeOrigin {
  const macroCell = dotGridMacroCellSizeUser(cellSize, span);
  const center = Math.floor(span / 2);
  return {
    x: center * macroCell,
    y: (center + 1) * macroCell,
  };
}

export const DEFAULT_DOT_GRID_MACRO_HOME_ORIGIN_USER: DiagramHomeOrigin =
  dotGridMacroHomeOriginUser();

/** Macro home in artboard user space (origin bottom-left). */
export function dotGridMacroHomeArtboardUser(
  artboardHeight = DEFAULT_ARTBOARD_USER_SIZE.height,
  cellSize = DEFAULT_DOT_GRID_SIZE_PX,
  span = DEFAULT_DOT_GRID_MACRO_SPAN,
): DiagramHomeOrigin {
  const plane = dotGridMacroHomeOriginUser(cellSize, span);
  return planeToArtboardUser(plane.x, plane.y, artboardHeight);
}

/** Artboard user → plane (viewBox) coordinates. */
export function diagramUserToAbsolute(
  userX: number,
  userY: number,
  artboardHeight = DEFAULT_ARTBOARD_USER_SIZE.height,
): { x: number; y: number } {
  return artboardUserToPlane(userX, userY, artboardHeight);
}

/** Plane (viewBox) → artboard user coordinates. */
export function diagramAbsoluteToUser(
  planeX: number,
  planeY: number,
  artboardHeight = DEFAULT_ARTBOARD_USER_SIZE.height,
): { x: number; y: number } {
  return planeToArtboardUser(planeX, planeY, artboardHeight);
}

/** Map a user-space content rect to a viewBox in plane pixels. */
export function viewBoxForDiagramUserRect(
  userRect: ViewBox,
  artboardHeight = DEFAULT_ARTBOARD_USER_SIZE.height,
  paddingPx = 0,
): ViewBox {
  const planeBottomLeft = artboardUserToPlane(userRect.x, userRect.y, artboardHeight);
  const planeTopRight = artboardUserToPlane(
    userRect.x + userRect.w,
    userRect.y + userRect.h,
    artboardHeight,
  );
  const x = Math.min(planeBottomLeft.x, planeTopRight.x) - paddingPx;
  const y = Math.min(planeBottomLeft.y, planeTopRight.y) - paddingPx;
  const w = Math.abs(planeTopRight.x - planeBottomLeft.x) + paddingPx * 2;
  const h = Math.abs(planeTopRight.y - planeBottomLeft.y) + paddingPx * 2;
  return { x, y, w, h };
}
