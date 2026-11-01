// Copyright (C) 2026 West Lane - All Rights Reserved

import { gridAxisPolicyFromMetrics, snapAxisToGrid } from "./snap-axis.js";
import type {
  DotGridMetrics,
  DragOffset,
  GridAxisPolicy,
  SnapDragOffsetOptions,
} from "../../types/grid.js";
import { IC_DOT_GRID_CSS_VARS, readLengthPx } from "../../grid/surface.js";

export function snapDragOffsetToDotGrid(
  shellRect: DOMRectReadOnly,
  current: DragOffset,
  next: DragOffset,
  grid: DotGridMetrics,
  axisOverrides?: Partial<GridAxisPolicy>,
): DragOffset {
  const baseLeft = shellRect.left - current.x;
  const baseTop = shellRect.top - current.y;
  const visualLeft = baseLeft + next.x;
  const visualTop = baseTop + next.y;

  const xPolicy = gridAxisPolicyFromMetrics(grid, "x", axisOverrides);
  const yPolicy = gridAxisPolicyFromMetrics(grid, "y", axisOverrides);

  const snappedLeft = snapAxisToGrid(visualLeft, xPolicy);
  const snappedTop = snapAxisToGrid(visualTop, yPolicy);

  return {
    x: next.x + (snappedLeft - visualLeft),
    y: next.y + (snappedTop - visualTop),
  };
}

export function snapDragOffsetToUniformGrid(
  shellRect: DOMRectReadOnly,
  current: DragOffset,
  next: DragOffset,
  size: number,
  axisOverrides?: Partial<GridAxisPolicy>,
): DragOffset {
  if (size <= 0) {
    return next;
  }

  const baseLeft = shellRect.left - current.x;
  const baseTop = shellRect.top - current.y;
  const visualLeft = baseLeft + next.x;
  const visualTop = baseTop + next.y;

  const xPolicy: GridAxisPolicy = { origin: 0, phase: 0, size, ...axisOverrides };
  const yPolicy: GridAxisPolicy = { origin: 0, phase: 0, size, ...axisOverrides };

  const snappedLeft = snapAxisToGrid(visualLeft, xPolicy);
  const snappedTop = snapAxisToGrid(visualTop, yPolicy);

  return {
    x: next.x + (snappedLeft - visualLeft),
    y: next.y + (snappedTop - visualTop),
  };
}

export function snapDragOffset(options: SnapDragOffsetOptions): DragOffset {
  const {
    shellRect,
    current,
    next,
    grid,
    styleSource,
    cssVars = IC_DOT_GRID_CSS_VARS,
    sizeFallback = 20,
    axis,
  } = options;

  if (grid) {
    return snapDragOffsetToDotGrid(shellRect, current, next, grid, axis);
  }

  const size = readLengthPx(styleSource, cssVars.sizeVar, sizeFallback);
  return snapDragOffsetToUniformGrid(shellRect, current, next, size, axis);
}
