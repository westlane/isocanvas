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

export const FOUNDATION_SLAB_CAPTION_FONT_SIZE_PX = 15;

/** TOP face labels on mounted iso boxes (default and rotated orientation). */
export const ISO_CUBE_LABEL_FONT_SIZE_PX = 28;

/** Never shrink cube titles below this (px). */
export const ISO_CUBE_LABEL_FONT_SIZE_MIN_PX = 9;

/** Inset from the top-face edge along the label baseline (iso plane units × canvas scale). */
export const ISO_CUBE_TOP_LABEL_EDGE_INSET = 0.86;

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

/** Top-face span available to the label baseline (iso units). */
export function isoCubeTopFaceLabelAlongEdgeIsoUnits(
  widthIso: number,
  depthIso: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): number {
  return isIsometricOrientationRotated(orientation) ? widthIso : depthIso;
}

/** Cross-axis span on the TOP plane (caps font size for one-line titles). */
export function isoCubeTopFaceLabelCrossEdgeIsoUnits(
  widthIso: number,
  depthIso: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): number {
  return isIsometricOrientationRotated(orientation) ? depthIso : widthIso;
}

function isoCanvasLabelFontCss(fontSizePx: number): string {
  return `${ISO_CANVAS_LABEL_FONT_WEIGHT} ${fontSizePx}px ${ISO_CANVAS_LABEL_FONT_FAMILY}`;
}

/** SVG `letter-spacing: 0.08em` width at `fontSizePx`. */
export function isoCanvasLabelLetterSpacingPx(fontSizePx: number): number {
  return fontSizePx * 0.08;
}

export function measureIsoCanvasLabelTextWidthPx(text: string, fontSizePx: number): number {
  if (!text) {
    return 0;
  }
  const letterSpacingPx = isoCanvasLabelLetterSpacingPx(fontSizePx);
  const charCount = [...text].length;
  const spacingExtra = charCount > 1 ? (charCount - 1) * letterSpacingPx : 0;
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = isoCanvasLabelFontCss(fontSizePx);
      return ctx.measureText(text).width + spacingExtra;
    }
  }
  return charCount * fontSizePx * 0.58 + spacingExtra;
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
  const text = formatIsoCanvasLabelText(options.label);
  if (!text) {
    return baseFontSizePx;
  }

  const alongIso = isoCubeTopFaceLabelAlongEdgeIsoUnits(
    options.widthIso,
    options.depthIso,
    orientation,
  );
  const crossIso = isoCubeTopFaceLabelCrossEdgeIsoUnits(
    options.widthIso,
    options.depthIso,
    orientation,
  );
  const inset = ISO_CUBE_TOP_LABEL_EDGE_INSET;
  const maxWidthPx = alongIso * canvasScale * inset;
  const maxHeightPx = crossIso * canvasScale * inset * 0.92;

  const measuredAtBase = measureIsoCanvasLabelTextWidthPx(text, baseFontSizePx);
  let fit = baseFontSizePx;
  if (measuredAtBase > maxWidthPx && measuredAtBase > 0) {
    fit = baseFontSizePx * (maxWidthPx / measuredAtBase);
  }
  if (fit > maxHeightPx) {
    fit = maxHeightPx;
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
