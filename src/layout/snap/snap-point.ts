// Copyright (C) 2026 West Lane - All Rights Reserved

import { clientPointToSvgUser } from "../../svg/svg-bbox.js";
import { gridAxisPolicyFromMetrics, snapAxisToGrid } from "./snap-axis.js";
import type { DotGridMetrics, GridAxisPolicy } from "../../types/grid.js";

export type SnapPoint2d = {
  x: number;
  y: number;
};

export type SnapClientPointOptions = {
  clientX: number;
  clientY: number;
  grid: DotGridMetrics;
  axis?: Partial<GridAxisPolicy>;
};

/** Snap a screen pointer to the phased dot grid. */
export function snapClientPointToDotGrid(options: SnapClientPointOptions): SnapPoint2d {
  const { clientX, clientY, grid, axis: overrides } = options;
  const xPolicy = gridAxisPolicyFromMetrics(grid, "x", overrides);
  const yPolicy = gridAxisPolicyFromMetrics(grid, "y", overrides);
  return {
    x: snapAxisToGrid(clientX, xPolicy),
    y: snapAxisToGrid(clientY, yPolicy),
  };
}

/** Pixels per SVG user unit (uniform scale from the root CTM). */
export function svgPixelsPerUserUnit(svg: SVGSVGElement): number {
  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return 1;
  }
  return Math.hypot(ctm.a, ctm.b) || 1;
}

export type SnapSvgUserPointOptions = {
  svg: SVGSVGElement;
  userX: number;
  userY: number;
  grid: DotGridMetrics;
  axis?: Partial<GridAxisPolicy>;
};

/** Snap a diagram-space point; cell size derives from screen grid ÷ SVG scale. */
export function snapSvgUserPointToDotGrid(options: SnapSvgUserPointOptions): SnapPoint2d {
  const { svg, userX, userY, grid, axis: overrides } = options;
  const pxPerUnit = svgPixelsPerUserUnit(svg);
  const originUser = clientPointToSvgUser(svg, grid.originLeft, grid.originTop);
  const phaseUser = grid.phase / pxPerUnit;
  const sizeUser = grid.size / pxPerUnit;

  const xPolicy: GridAxisPolicy = {
    origin: originUser.x,
    phase: phaseUser,
    size: sizeUser,
    ...overrides,
  };
  const yPolicy: GridAxisPolicy = {
    origin: originUser.y,
    phase: phaseUser,
    size: sizeUser,
    ...overrides,
  };

  return {
    x: snapAxisToGrid(userX, xPolicy),
    y: snapAxisToGrid(userY, yPolicy),
  };
}
