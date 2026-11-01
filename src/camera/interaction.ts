// Copyright (C) 2026 West Lane - All Rights Reserved

import type { ViewBox } from "../types/core.js";
import { clamp } from "./view-box/clamp.js";
import { worldTransformFromViewBox } from "./world/world-transform.js";
import type { WorldViewBoxAlign } from "../types/camera.js";

export function normalizedWheelDelta(
  deltaY: number,
  deltaMode: number,
  viewportHeight: number,
): number {
  let delta = deltaY;
  if (deltaMode === 1) {
    delta *= 16;
  } else if (deltaMode === 2) {
    delta *= viewportHeight || 1;
  }
  return delta;
}

export function wheelZoomFactor(deltaY: number): number {
  const clamped = clamp(deltaY, -100, 100);
  return Math.exp(clamped * 0.001);
}

export function viewBoxZoomAtPoint(
  vb: ViewBox,
  sx: number,
  sy: number,
  factor: number,
): ViewBox {
  return {
    x: sx - (sx - vb.x) * factor,
    y: sy - (sy - vb.y) * factor,
    w: vb.w * factor,
    h: vb.h * factor,
  };
}

/** Pan logical camera using the same uniform scale as {@link worldTransformFromViewBox}. */
export function viewBoxPanByWorldViewport(
  vb: ViewBox,
  dxScreen: number,
  dyScreen: number,
  viewportWidthPx: number,
  viewportHeightPx: number,
  align: WorldViewBoxAlign = "mid",
): ViewBox {
  const { scale } = worldTransformFromViewBox(vb, viewportWidthPx, viewportHeightPx, align);
  if (scale <= 0) {
    return vb;
  }
  return {
    x: vb.x - dxScreen / scale,
    y: vb.y - dyScreen / scale,
    w: vb.w,
    h: vb.h,
  };
}

/** Map a screen point to viewBox user space (SVG `meet` + optional SVG offset in anchor space). */
export function viewBoxUserFromClientInWorldViewport(
  clientX: number,
  clientY: number,
  anchorRect: DOMRectReadOnly,
  vb: ViewBox,
  viewportWidthPx: number,
  viewportHeightPx: number,
  contentOffsetXPx = 0,
  contentOffsetYPx = 0,
  align: WorldViewBoxAlign = "mid",
): { x: number; y: number } {
  const { tx, ty, scale } = worldTransformFromViewBox(
    vb,
    viewportWidthPx,
    viewportHeightPx,
    align,
  );
  if (scale <= 0) {
    return { x: vb.x, y: vb.y };
  }
  const localX = clientX - anchorRect.left;
  const localY = clientY - anchorRect.top;
  return {
    x: vb.x + (localX - contentOffsetXPx - tx) / scale,
    y: vb.y + (localY - contentOffsetYPx - ty) / scale,
  };
}
