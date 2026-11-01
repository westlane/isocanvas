// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { snapDragOffset } from "./drag-snap.js";
import { snapBoxWithAlignmentGuides } from "./smart-guides.js";
import type { DotGridMetrics, DragOffset, AlignmentGuide } from "../../types/grid.js";
import type { SnapDragOffsetOptions } from "../../types/grid.js";

export function clampAxis(value: number, min: number, max: number): number {
  if (min > max) {
    return (min + max) / 2;
  }
  return Math.min(Math.max(value, min), max);
}

export type ClampDragOffsetOptions = {
  shellRect: DOMRectReadOnly;
  current: DragOffset;
  next: DragOffset;
  edgePadding: number;
  viewportWidth: number;
  viewportHeight: number;
};

export function clampDragOffset(options: ClampDragOffsetOptions): DragOffset {
  const { shellRect, current, next, edgePadding, viewportWidth, viewportHeight } = options;

  const baseLeft = shellRect.left - current.x;
  const baseTop = shellRect.top - current.y;
  const baseRight = shellRect.right - current.x;
  const baseBottom = shellRect.bottom - current.y;

  const minX = edgePadding - baseLeft;
  const maxX = viewportWidth - edgePadding - baseRight;
  const minY = edgePadding - baseTop;
  const maxY = viewportHeight - edgePadding - baseBottom;

  return {
    x: clampAxis(next.x, minX, maxX),
    y: clampAxis(next.y, minY, maxY),
  };
}

export type SnapAndClampDragOffsetOptions = SnapDragOffsetOptions & {
  edgePadding: number;
  viewportWidth: number;
  viewportHeight: number;
  grid: DotGridMetrics | null;
  /** Optional Figma-style guides against sibling boxes (same coordinate space as shellRect + offset). */
  alignment?: {
    others: readonly { x: number; y: number; width: number; height: number }[];
    threshold: number;
  };
};

export type SnapAndClampDragOffsetResult = DragOffset & {
  guides: AlignmentGuide[];
};

export function snapAndClampDragOffset(
  options: SnapAndClampDragOffsetOptions,
): SnapAndClampDragOffsetResult {
  let snapped = snapDragOffset(options);
  let guides: AlignmentGuide[] = [];

  if (options.alignment && options.alignment.others.length > 0) {
    const baseLeft = options.shellRect.left - options.current.x;
    const baseTop = options.shellRect.top - options.current.y;
    const moving = {
      x: baseLeft + snapped.x,
      y: baseTop + snapped.y,
      width: options.shellRect.width,
      height: options.shellRect.height,
    };
    const aligned = snapBoxWithAlignmentGuides({
      moving,
      others: options.alignment.others,
      threshold: options.alignment.threshold,
    });
    if (aligned.dx !== 0 || aligned.dy !== 0) {
      snapped = {
        x: snapped.x + aligned.dx,
        y: snapped.y + aligned.dy,
      };
      guides = aligned.guides;
    }
  }

  const clamped = clampDragOffset({
    shellRect: options.shellRect,
    current: options.current,
    next: snapped,
    edgePadding: options.edgePadding,
    viewportWidth: options.viewportWidth,
    viewportHeight: options.viewportHeight,
  });

  return { ...clamped, guides };
}
