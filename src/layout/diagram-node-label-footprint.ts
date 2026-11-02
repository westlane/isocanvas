// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { IsometricOrientation } from "../types/diagram.js";
import { DEFAULT_ISOMETRIC_ORIENTATION } from "../isometric/orientation.js";
import {
  formatIsoCanvasLabelText,
  ISO_CUBE_TOP_LABEL_CROSS_AXIS_INSET,
  ISO_CUBE_TOP_LABEL_EDGE_INSET,
  ISO_CUBE_LABEL_TRUNCATE_AFTER_CHARS,
  ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS,
  measureIsoCanvasLabelTextWidthPx,
} from "../isometric/cube/label-text.js";
import { DEFAULT_CUBE_CANVAS_SCALE, ISO_DIAGRAM_PX_PER_UNIT } from "../isometric/cube/cube.js";

function labelTextForFootprintSizing(label: string): string {
  const formatted = formatIsoCanvasLabelText(label.trim());
  if (!formatted) {
    return "";
  }
  if ([...formatted].length <= ISO_CUBE_LABEL_TRUNCATE_AFTER_CHARS) {
    return formatted;
  }
  const chars = [...formatted];
  return (
    chars.slice(0, ISO_CUBE_LABEL_TRUNCATE_AFTER_CHARS).join("") + ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS
  );
}

/** Min iso span along the label baseline so `label` fits at `fontSizePx`. */
export function isoCubeMinAlongEdgeIsoForLabelText(
  label: string,
  fontSizePx: number,
  options?: {
    orientation?: IsometricOrientation;
    canvasScale?: number;
  },
): number {
  const text = labelTextForFootprintSizing(label);
  if (!text) {
    return 0;
  }
  const canvasScale = options?.canvasScale ?? DEFAULT_CUBE_CANVAS_SCALE;
  const measuredPx = measureIsoCanvasLabelTextWidthPx(text, fontSizePx);
  return (measuredPx / (canvasScale * ISO_CUBE_TOP_LABEL_EDGE_INSET)) * 1.14;
}

/** Min iso span on the cross axis so `fontSizePx` fits on the top face. */
export function isoCubeMinCrossEdgeIsoForLabelFontSizePx(
  fontSizePx: number,
  options?: {
    canvasScale?: number;
  },
): number {
  const canvasScale = options?.canvasScale ?? DEFAULT_CUBE_CANVAS_SCALE;
  const crossInset = ISO_CUBE_TOP_LABEL_EDGE_INSET * ISO_CUBE_TOP_LABEL_CROSS_AXIS_INSET;
  return (fontSizePx / (canvasScale * crossInset)) * 1.06;
}

/** Diagram user px footprint (`w` / `h`) large enough for the cube top label. */
export function diagramUserFootprintPxForCubeLabel(options: {
  label: string;
  fontSizePx: number;
  minWidthPx: number;
  minDepthPx: number;
  orientation?: IsometricOrientation;
  canvasScale?: number;
}): { widthPx: number; depthPx: number } {
  const orientation = options.orientation ?? DEFAULT_ISOMETRIC_ORIENTATION;
  const scaleOpts =
    options.canvasScale !== undefined ? { canvasScale: options.canvasScale } : {};
  const alongIso = isoCubeMinAlongEdgeIsoForLabelText(
    options.label,
    options.fontSizePx,
    { ...scaleOpts, orientation },
  );
  const crossIso = isoCubeMinCrossEdgeIsoForLabelFontSizePx(options.fontSizePx, scaleOpts);

  const alongPx = alongIso * ISO_DIAGRAM_PX_PER_UNIT;
  const crossPx = crossIso * ISO_DIAGRAM_PX_PER_UNIT;

  if (orientation === "rotated") {
    return {
      widthPx: Math.max(options.minWidthPx, crossPx),
      depthPx: Math.max(options.minDepthPx, alongPx),
    };
  }
  return {
    widthPx: Math.max(options.minWidthPx, alongPx),
    depthPx: Math.max(options.minDepthPx, crossPx),
  };
}
