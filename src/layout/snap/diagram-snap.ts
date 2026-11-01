// Copyright (C) 2026 West Lane - All Rights Reserved

import { clientPointToSvgUser } from "../../svg/svg-bbox.js";
import { snapAxisToGrid } from "./snap-axis.js";
import type { DotGridMetrics, GridAxisPolicy } from "../../types/grid.js";
import type { ViewBox } from "../../types/core.js";
import { svgPixelsPerUserUnit } from "./snap-point.js";
import { DEFAULT_DOT_GRID_SIZE_PX, defaultDotGridPhase } from "../../grid/surface.js";

export type SnapUserRectToDotGridOptions = {
  minWidth?: number;
  minHeight?: number;
};

export function baselineDotGridPolicyInUserSpace(
  cellSize = DEFAULT_DOT_GRID_SIZE_PX,
  overrides?: Partial<GridAxisPolicy>,
): GridAxisPolicy {
  return {
    origin: 0,
    phase: defaultDotGridPhase(cellSize),
    size: cellSize,
    ...overrides,
  };
}

/** Snap rect edges to cell boundaries (dot draw phase stays on `--ic-dot-grid-phase`). */
export function gridSnapPolicyForBoxEdges(
  cellSize = DEFAULT_DOT_GRID_SIZE_PX,
  overrides?: Partial<GridAxisPolicy>,
): GridAxisPolicy {
  return baselineDotGridPolicyInUserSpace(cellSize, { phase: 0, ...overrides });
}

export function gridAxisPoliciesInSvgUserSpace(
  svg: SVGSVGElement,
  grid: DotGridMetrics,
  overrides?: Partial<GridAxisPolicy>,
): { x: GridAxisPolicy; y: GridAxisPolicy } {
  const pxPerUnit = svgPixelsPerUserUnit(svg);
  const originUser = clientPointToSvgUser(svg, grid.originLeft, grid.originTop);
  const phaseUser = grid.phase / pxPerUnit;
  const sizeUser = grid.size / pxPerUnit;

  const x: GridAxisPolicy = {
    origin: originUser.x,
    phase: phaseUser,
    size: sizeUser,
    ...overrides,
  };
  const y: GridAxisPolicy = {
    origin: originUser.y,
    phase: phaseUser,
    size: sizeUser,
    ...overrides,
  };
  return { x, y };
}

export function snapUserRectToDotGrid(
  box: ViewBox,
  xPolicy: GridAxisPolicy,
  yPolicy: GridAxisPolicy = xPolicy,
  options: SnapUserRectToDotGridOptions = {},
): ViewBox {
  const minW = options.minWidth ?? xPolicy.size;
  const minH = options.minHeight ?? yPolicy.size;
  const x = snapAxisToGrid(box.x, xPolicy);
  const y = snapAxisToGrid(box.y, yPolicy);
  const x2 = snapAxisToGrid(box.x + box.w, xPolicy);
  const y2 = snapAxisToGrid(box.y + box.h, yPolicy);
  return {
    x,
    y,
    w: Math.max(minW, x2 - x),
    h: Math.max(minH, y2 - y),
  };
}
