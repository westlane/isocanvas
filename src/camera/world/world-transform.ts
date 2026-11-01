// Copyright (C) 2026 West Lane - All Rights Reserved

import type { ViewBox } from "../../types/core.js";
import type { WorldViewBoxAlign } from "../../types/camera.js";

/** CSS transform that maps a logical viewBox camera onto a fixed-size viewport (grid + content). */
export function worldTransformFromViewBox(
  vb: ViewBox,
  viewportWidthPx: number,
  viewportHeightPx: number,
  align: WorldViewBoxAlign = "mid",
): { tx: number; ty: number; sx: number; sy: number; scale: number } {
  if (viewportWidthPx <= 0 || viewportHeightPx <= 0) {
    return { tx: 0, ty: 0, sx: 1, sy: 1, scale: 1 };
  }
  const scaleX = viewportWidthPx / vb.w;
  const scaleY = viewportHeightPx / vb.h;
  const scale = Math.min(scaleX, scaleY);
  const contentW = vb.w * scale;
  const contentH = vb.h * scale;
  const tx =
    align === "min"
      ? -vb.x * scale
      : (viewportWidthPx - contentW) / 2 - vb.x * scale;
  const ty =
    align === "min"
      ? -vb.y * scale
      : (viewportHeightPx - contentH) / 2 - vb.y * scale;
  return {
    tx,
    ty,
    sx: scale,
    sy: scale,
    scale,
  };
}

/** Letterbox offset only — pair with SVG `viewBox` zoom for sharp vector scaling. */
export function worldTranslateStyleFromViewBox(
  vb: ViewBox,
  viewportWidthPx: number,
  viewportHeightPx: number,
): string {
  const { tx, ty } = worldTransformFromViewBox(vb, viewportWidthPx, viewportHeightPx);
  return `translate(${tx}px, ${ty}px)`;
}

