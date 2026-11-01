// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { ISO_GRID_AXIS_X } from "../../grid/projection.js";
import type { IsoBoxSpec, IsoFaceId } from "../../types/diagram.js";
import type { IsoCanvasColors } from "../../types/theme.js";

/** Diagram/user pixels per cube-canvas ground unit. */
export const ISO_DIAGRAM_PX_PER_UNIT = 84;

export function userPxToIsoUnits(px: number): number {
  return px / ISO_DIAGRAM_PX_PER_UNIT;
}

/** Scale so a box `widthIso` units wide projects to `userWidthPx` on the FRONT/TOP edge (library `k()` axis). */
export function scaleForFootprintWidth(userWidthPx: number, widthIsoUnits: number): number {
  return userWidthPx / (widthIsoUnits * ISO_GRID_AXIS_X);
}

export const DEFAULT_CUBE_CANVAS_SCALE = scaleForFootprintWidth(ISO_DIAGRAM_PX_PER_UNIT, 1);

/** Ground anchor sort key: screen depth is `l + r` (+plane x → −l recedes, +plane y → +r advances). */
export function isoAnchorPaintDepth(spec: Pick<IsoBoxSpec, "left" | "right">): number {
  return spec.left + spec.right;
}

/** Back-to-front paint key for one face (obscured faces before top). */
export function isoFacePaintOrder(
  spec: Pick<IsoBoxSpec, "left" | "right" | "width" | "depth">,
  face: IsoFaceId,
): number {
  const base = isoAnchorPaintDepth(spec);
  switch (face) {
    case "bottom":
      return base - 0.01;
    case "back":
    case "left":
    case "side":
      return base;
    case "front":
      return base + spec.depth;
    case "top":
      return base + spec.width + spec.depth;
    default: {
      const _exhaustive: never = face;
      return _exhaustive;
    }
  }
}

/** Six faces mapped to theme tokens (right vertical = `side`, left vertical = `left`). */
export function themedCubeFaceColors(colors: IsoCanvasColors): {
  top: string;
  front: string;
  side: string;
  bottom: string;
  back: string;
  left: string;
} {
  return {
    top: colors.isoTopFill,
    front: colors.isoFrontFill,
    side: colors.isoRightFill,
    bottom: colors.isoBottomFill,
    back: colors.isoLeftFill,
    left: colors.isoLeftFill,
  };
}

export function extrusionHeightForFootprint(width: number, depth: number, ratio = 0.72): number {
  return Math.min(width, depth) * ratio;
}
