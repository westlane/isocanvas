// Copyright (C) 2026 West Lane - All Rights Reserved

import type { ArtboardUserSize } from "../types/artboard.js";
import type { ViewBox } from "../types/core.js";
import { userPxToIsoUnits } from "../isometric/cube/cube.js";
import { viewBoxForArtboardPlaneIsoCanvas } from "./artboard-coords.js";

/** Class on the isometric ground path for the logical artboard footprint. */
export const IC_ARTBOARD_OUTLINE_CLASS = "ic-artboard-outline";

/** Stroke-only ground perimeter — mounted last so the canvas frame reads above content. */
export const IC_ARTBOARD_OUTLINE_LAYER_CLASS = "ic-artboard-outline-layer";

/** Internal lattice lines on the iso artboard ground (plane-aligned). */
export const IC_ARTBOARD_GUIDE_CLASS = "ic-artboard-guide";

/** Fainter lines subdividing each macro cell. */
export const IC_ARTBOARD_SUBGUIDE_CLASS = "ic-artboard-subguide";

/** Visible vertical faces on the iso artboard slab. */
export const IC_ARTBOARD_FACE_CLASS = "ic-artboard-face";

export function artboardFaceClassName(face: "front" | "side"): string {
  return `${IC_ARTBOARD_FACE_CLASS} ic-artboard-face--${face}`;
}

/** User pixels of visible artboard thickness (extruded ground platform). */
export const ARTBOARD_SLAB_HEIGHT_USER_PX = 14;

/** ic-canvas `top` for the artboard ground face (dot grid + outline). */
export function artboardGroundElevationIso(): number {
  return userPxToIsoUnits(ARTBOARD_SLAB_HEIGHT_USER_PX);
}

/** Frame a mounted ic-cube-canvas SVG using rendered geometry (post-origin shift). */
export function viewBoxForMountedCubeCanvas(
  svg: SVGSVGElement,
  fallbackUserSize: ArtboardUserSize,
  paddingPx = 0,
): ViewBox {
  const framed = svg.querySelector(":scope > g.ic-cube-canvas-origin");
  const target =
    framed instanceof SVGGraphicsElement
      ? framed
      : svg.querySelector(`path.${IC_ARTBOARD_OUTLINE_CLASS}`);
  if (target instanceof SVGGraphicsElement) {
    const box = target.getBBox();
    if (box.width > 0 && box.height > 0) {
      return {
        x: box.x - paddingPx,
        y: box.y - paddingPx,
        w: box.width + paddingPx * 2,
        h: box.height + paddingPx * 2,
      };
    }
  }
  return viewBoxForArtboardPlaneIsoCanvas(fallbackUserSize, paddingPx);
}
