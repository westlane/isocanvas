// Copyright (C) 2026 West Lane - All Rights Reserved

import type { ArtboardUserSize } from "../types/artboard.js";
import type { Box2d, ViewBox } from "../types/core.js";

/**
 * Artboard user space: origin at the bottom-left of the logical frame, +x right, +y up.
 * Plane / viewBox space matches the dot grid: origin top-left, +y down (SVG user units).
 */
export function artboardUserToPlane(
  userX: number,
  userY: number,
  artboardHeight: number,
): { x: number; y: number } {
  return { x: userX, y: artboardHeight - userY };
}

export function planeToArtboardUser(
  planeX: number,
  planeY: number,
  artboardHeight: number,
): { x: number; y: number } {
  return { x: planeX, y: artboardHeight - planeY };
}

/** Camera viewBox covering the full artboard in plane space (viewBox top-left). */
export function viewBoxForArtboardUserPlane(
  userSize: ArtboardUserSize,
  paddingPx = 0,
): ViewBox {
  return {
    x: -paddingPx,
    y: -paddingPx,
    w: userSize.width + paddingPx * 2,
    h: userSize.height + paddingPx * 2,
  };
}

/**
 * ViewBox for ic-cube-canvas after {@link applyArtboardOriginToCubeSvg}: plane (0,0) sits at
 * the south-west corner of the iso footprint; +plane x runs east, +plane y runs north on screen.
 */
export function viewBoxForArtboardPlaneIsoCanvas(
  userSize: ArtboardUserSize,
  paddingPx = 0,
): ViewBox {
  const { width: w, height: h } = userSize;
  const isoHeight = h / Math.sqrt(3);
  const corners = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: 0, y: h },
    { x: w, y: h },
  ] as const;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const { x: px, y: py } of corners) {
    const x = px + w * (1 - py / h);
    const y = (px / w + py / h - 1) * isoHeight;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return {
    x: minX - paddingPx,
    y: minY - paddingPx,
    w: maxX - minX + paddingPx * 2,
    h: maxY - minY + paddingPx * 2,
  };
}

/** Axis-aligned iso artboard footprint in SVG user space (after ic-cube-canvas origin shift). */
export function artboardPlaneIsoContentBox(
  userSize: ArtboardUserSize,
  paddingPx = 0,
): Box2d {
  const frame = viewBoxForArtboardPlaneIsoCanvas(userSize, paddingPx);
  return { x: frame.x, y: frame.y, width: frame.w, height: frame.h };
}
