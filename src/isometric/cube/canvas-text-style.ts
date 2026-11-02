// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { IsoBoxSpec, IsometricOrientation } from "../../types/diagram.js";
import { DEFAULT_CUBE_CANVAS_SCALE } from "./cube.js";
import { isoCubeFaceRectLayoutForPlaneTopLeft } from "./cube-faces.js";
import {
  DEFAULT_ISOMETRIC_ORIENTATION,
  isIsometricOrientationRotated,
  ISO_BOX_LABEL_ROTATION_DEG,
} from "../orientation.js";
import {
  formatIsoCanvasLabelText,
  ISO_CANVAS_LABEL_LETTER_SPACING_EM,
  ISO_CUBE_LABEL_FONT_SIZE_MIN_PX,
  ISO_CUBE_LABEL_FONT_SIZE_PX,
  ISO_CUBE_TOP_LABEL_CROSS_AXIS_INSET,
  ISO_CUBE_TOP_LABEL_EDGE_INSET,
  measureIsoCanvasLabelTextWidthPx,
  truncateIsoCanvasLabelText,
} from "./label-text.js";

/** Cube canvas library defaults text/shapes to black stroke — solid iso uses fills only. */
export const CANVAS_TEXT_NO_STROKE = {
  strokeColor: "transparent",
  strokeWidth: 0,
} as const;

/** Same mount contract as diagram labels. */
export const ISO_CUBE_FACE_NO_STROKE = CANVAS_TEXT_NO_STROKE;

export const IC_ISO_CUBE_LABEL_CLASS = "ic-iso-cube-label";

/** Type token under the domain cube (foundation slab caption). */
export const IC_FOUNDATION_SLAB_CAPTION_CLASS = "ic-foundation-slab-caption";

export const FOUNDATION_SLAB_CAPTION_FONT_SIZE_PX = 20;

/** Edge midpoint labels in diagram scenes. */
export const ISO_EDGE_LABEL_FONT_SIZE_PX = 22;

export {
  formatIsoCanvasLabelText,
  ISO_CANVAS_LABEL_FONT_FAMILY,
  ISO_CANVAS_LABEL_FONT_WEIGHT,
  ISO_CANVAS_LABEL_LETTER_SPACING_EM,
  ISO_CUBE_LABEL_FONT_SIZE_MIN_PX,
  ISO_CUBE_LABEL_FONT_SIZE_PX,
  ISO_CUBE_LABEL_TRUNCATE_AFTER_CHARS,
  ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS,
  ISO_CUBE_TOP_LABEL_CROSS_AXIS_INSET,
  ISO_CUBE_TOP_LABEL_EDGE_INSET,
  measureIsoCanvasLabelTextWidthPx,
  truncateIsoCanvasLabelText,
} from "./label-text.js";

/** Matches `theme/diagram-surfaces.css` (SVG `letter-spacing` on cube-canvas text). */
export const ISO_CANVAS_LABEL_LETTER_SPACING = `${ISO_CANVAS_LABEL_LETTER_SPACING_EM}em`;

/** Top-face span available to the label baseline (iso units). */
export function isoCubeTopFaceLabelAlongEdgeIsoUnits(
  widthIso: number,
  depthIso: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): number {
  return isIsometricOrientationRotated(orientation) ? depthIso : widthIso;
}

/** Cross-axis span on the TOP plane (caps font size for one-line titles). */
export function isoCubeTopFaceLabelCrossEdgeIsoUnits(
  widthIso: number,
  depthIso: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): number {
  return isIsometricOrientationRotated(orientation) ? widthIso : depthIso;
}

export function isoCubeTopFaceLabelMaxWidthPx(
  widthIso: number,
  depthIso: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
  canvasScale: number = DEFAULT_CUBE_CANVAS_SCALE,
): number {
  const alongIso = isoCubeTopFaceLabelAlongEdgeIsoUnits(widthIso, depthIso, orientation);
  return alongIso * canvasScale * ISO_CUBE_TOP_LABEL_EDGE_INSET;
}

export function isoCubeTopFaceLabelMaxHeightPx(
  widthIso: number,
  depthIso: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
  canvasScale: number = DEFAULT_CUBE_CANVAS_SCALE,
): number {
  const crossIso = isoCubeTopFaceLabelCrossEdgeIsoUnits(widthIso, depthIso, orientation);
  return crossIso * canvasScale * ISO_CUBE_TOP_LABEL_EDGE_INSET * ISO_CUBE_TOP_LABEL_CROSS_AXIS_INSET;
}

export function displayIsoCubeTopLabelText(options: {
  label: string;
  widthIso: number;
  depthIso: number;
  fontSizePx: number;
  orientation?: IsometricOrientation;
  canvasScale?: number;
}): string {
  const orientation = options.orientation ?? DEFAULT_ISOMETRIC_ORIENTATION;
  const canvasScale = options.canvasScale ?? DEFAULT_CUBE_CANVAS_SCALE;
  const formatted = formatIsoCanvasLabelText(options.label);
  const maxWidthPx = isoCubeTopFaceLabelMaxWidthPx(
    options.widthIso,
    options.depthIso,
    orientation,
    canvasScale,
  );
  return truncateIsoCanvasLabelText(formatted, maxWidthPx, options.fontSizePx);
}

export function fitIsoCubeTopLabelFontSizePx(options: {
  label: string;
  widthIso: number;
  depthIso: number;
  orientation?: IsometricOrientation;
  baseFontSizePx?: number;
  canvasScale?: number;
}): number {
  const baseFontSizePx = options.baseFontSizePx ?? ISO_CUBE_LABEL_FONT_SIZE_PX;
  const canvasScale = options.canvasScale ?? DEFAULT_CUBE_CANVAS_SCALE;
  const orientation = options.orientation ?? DEFAULT_ISOMETRIC_ORIENTATION;

  const maxHeightPx = isoCubeTopFaceLabelMaxHeightPx(
    options.widthIso,
    options.depthIso,
    orientation,
    canvasScale,
  );

  const formatted = formatIsoCanvasLabelText(options.label);
  const maxWidthPx = isoCubeTopFaceLabelMaxWidthPx(
    options.widthIso,
    options.depthIso,
    orientation,
    canvasScale,
  );

  let fit = baseFontSizePx;
  if (fit > maxHeightPx) {
    fit = maxHeightPx;
  }
  while (
    fit > ISO_CUBE_LABEL_FONT_SIZE_MIN_PX &&
    measureIsoCanvasLabelTextWidthPx(formatted, fit) > maxWidthPx
  ) {
    fit -= 1;
  }
  return Math.max(ISO_CUBE_LABEL_FONT_SIZE_MIN_PX, Math.min(baseFontSizePx, fit));
}

/** One font size for every cube label in a mount so titles stay on-face and match each other. */
export function uniformIsoCubeTopLabelFontSizePx(
  specs: readonly Pick<IsoBoxSpec, "label" | "width" | "depth" | "omitCubeLabel">[],
  options?: {
    orientation?: IsometricOrientation;
    baseFontSizePx?: number;
    canvasScale?: number;
  },
): number {
  const baseFontSizePx = options?.baseFontSizePx ?? ISO_CUBE_LABEL_FONT_SIZE_PX;
  if (specs.length === 0) {
    return baseFontSizePx;
  }
  let uniform = baseFontSizePx;
  for (const spec of specs) {
    if (!spec.label.trim() || spec.omitCubeLabel) {
      continue;
    }
    const fit = fitIsoCubeTopLabelFontSizePx({
      label: spec.label,
      widthIso: spec.width,
      depthIso: spec.depth,
      ...(options?.orientation !== undefined ? { orientation: options.orientation } : {}),
      baseFontSizePx,
      ...(options?.canvasScale !== undefined ? { canvasScale: options.canvasScale } : {}),
    });
    uniform = Math.min(uniform, fit);
  }
  return uniform;
}

/** Anchor on the TOP plane at the footprint center (local l ∈ [−width, 0], r ∈ [0, depth]). */
export function isoBoxTopFaceLabelLayout(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): { left: number; right: number; top: number; rotation: number } {
  const face = isoCubeFaceRectLayoutForPlaneTopLeft("top", width, depth, height, orientation);
  return {
    left: face.left! + face.height / 2,
    right: face.right! + face.width / 2,
    top: face.top!,
    rotation: ISO_BOX_LABEL_ROTATION_DEG[orientation],
  };
}
