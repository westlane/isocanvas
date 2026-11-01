// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

/** Pixel box where SVG `viewBox` maps (meet); offsets are relative to the anchor rect. */
export type WorldCameraViewport = {
  widthPx: number;
  heightPx: number;
  offsetXPx: number;
  offsetYPx: number;
};

export function worldCameraViewportFromRects(
  anchorRect: DOMRectReadOnly,
  svgRect: DOMRectReadOnly,
): WorldCameraViewport {
  return {
    widthPx: svgRect.width,
    heightPx: svgRect.height,
    offsetXPx: svgRect.left - anchorRect.left,
    offsetYPx: svgRect.top - anchorRect.top,
  };
}
