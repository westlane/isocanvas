// Copyright (C) 2026 West Lane - All Rights Reserved

import type { IsometricOrientation } from "../../types/diagram.js";
import { isoCubeFaceRectLayoutForPlaneTopLeft } from "./cube-faces.js";
import { DEFAULT_ISOMETRIC_ORIENTATION, ISO_BOX_LABEL_ROTATION_DEG } from "../orientation.js";

/** Cube canvas library defaults text/shapes to black stroke — solid iso uses fills only. */
export const CANVAS_TEXT_NO_STROKE = {
  strokeColor: "transparent",
  strokeWidth: 0,
} as const;

/** Same mount contract as diagram labels. */
export const ISO_CUBE_FACE_NO_STROKE = CANVAS_TEXT_NO_STROKE;

export const IC_ISO_CUBE_LABEL_CLASS = "ic-iso-cube-label";

/** TOP face labels on mounted iso boxes (default and rotated orientation). */
export const ISO_CUBE_LABEL_FONT_SIZE_PX = 28;

/** Edge midpoint labels in diagram scenes. */
export const ISO_EDGE_LABEL_FONT_SIZE_PX = 17;

/** Matches `theme/diagram-surfaces.css` (SVG `letter-spacing` on cube-canvas text). */
export const ISO_CANVAS_LABEL_LETTER_SPACING = "0.08em";

export const ISO_CANVAS_LABEL_FONT_FAMILY =
  '"Segoe UI", "Helvetica Neue", Arial, system-ui, sans-serif';

export const ISO_CANVAS_LABEL_FONT_WEIGHT = 900;

export function formatIsoCanvasLabelText(text: string): string {
  return text.toLocaleUpperCase("en-US");
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
