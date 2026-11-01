// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { worldTransformFromViewBox } from "../camera/world/world-transform.js";
import { DEFAULT_DOT_GRID_MARK_PX, DEFAULT_DOT_GRID_SIZE_PX } from "./surface.js";
import type { ViewBox } from "../types/core.js";

export type DotGridWorldStyle = {
  cellPx: number;
  phasePx: number;
  backgroundSize: string;
  /** Phase-only offset for `.ic-dot-grid` when pan lives on `.ic-dot-grid-plane`. */
  phaseBackgroundPosition: string;
  planePanXPx: number;
  planePanYPx: number;
};

export type DotGridWorldStyleOptions = {
  insetAnchorPx?: number;
  contentOffsetXPx?: number;
  contentOffsetYPx?: number;
  /** Match SVG `preserveAspectRatio` (default `mid` = meet centered). */
  contentAlign?: "mid" | "min";
};

export function phasedScreenOffset(originPx: number, phasePx: number, cellPx: number): number {
  if (cellPx <= 0) {
    return phasePx;
  }
  return ((phasePx - originPx) % cellPx + cellPx) % cellPx;
}

/** Dot pattern on the plane before {@link composeDotGridLayerTransform} zoom scale. */
export function dotGridPatternOnPlane(
  gridSizePx: number,
  phasePx: number,
): { backgroundSize: string; phaseBackgroundPosition: string; localCellPx: number; localPhasePx: number } {
  const phaseX = phasedScreenOffset(0, phasePx, gridSizePx);
  const phaseY = phasedScreenOffset(0, phasePx, gridSizePx);
  return {
    localCellPx: gridSizePx,
    localPhasePx: phasePx,
    backgroundSize: `${gridSizePx}px ${gridSizePx}px`,
    phaseBackgroundPosition: `${phaseX}px ${phaseY}px`,
  };
}

const DOT_GRID_MASK_VIEW_BOX = 100;

/** Square mark with constant screen size when mask tile is `screenCellPx` (after plane scale). */
export function dotGridSquareMaskDataUri(markPx: number, screenCellPx: number): string {
  const safeCell = screenCellPx > 0 ? screenCellPx : DEFAULT_DOT_GRID_SIZE_PX;
  const safeMark = markPx > 0 ? markPx : DEFAULT_DOT_GRID_MARK_PX;
  const markUnits = Math.min(
    DOT_GRID_MASK_VIEW_BOX,
    Math.max(1, (safeMark / safeCell) * DOT_GRID_MASK_VIEW_BOX),
  );
  const origin = (DOT_GRID_MASK_VIEW_BOX - markUnits) / 2;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${DOT_GRID_MASK_VIEW_BOX} ${DOT_GRID_MASK_VIEW_BOX}'>` +
    `<rect x='${origin}' y='${origin}' width='${markUnits}' height='${markUnits}' fill='#000'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function dotGridWorldStyleFromViewBox(
  vb: ViewBox,
  viewportWidthPx: number,
  viewportHeightPx: number,
  gridSizePx: number,
  phasePx: number,
  options: DotGridWorldStyleOptions = {},
): DotGridWorldStyle {
  const insetAnchor = options.insetAnchorPx ?? 0;
  const offsetX = options.contentOffsetXPx ?? 0;
  const offsetY = options.contentOffsetYPx ?? 0;
  const align = options.contentAlign ?? "mid";
  const { tx, ty, scale } = worldTransformFromViewBox(
    vb,
    viewportWidthPx,
    viewportHeightPx,
    align,
  );
  const cellPx = gridSizePx * scale;
  const phaseScaled = phasePx * scale;
  /** Half-cell phase only; viewBox pan lives in {@link planePanXPx} / `tx`, not here (avoids 2× pan on dots). */
  const phaseX = phasedScreenOffset(0, phaseScaled, cellPx);
  const phaseY = phasedScreenOffset(0, phaseScaled, cellPx);
  const planePanX = insetAnchor + offsetX + tx;
  const planePanY = insetAnchor + offsetY + ty;
  return {
    cellPx,
    phasePx: phaseScaled,
    backgroundSize: `${cellPx}px ${cellPx}px`,
    phaseBackgroundPosition: `${phaseX}px ${phaseY}px`,
    planePanXPx: planePanX,
    planePanYPx: planePanY,
  };
}
