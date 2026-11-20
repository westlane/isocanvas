// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { IsometricOrientation } from "../types/diagram.js";
import { DEFAULT_ISOMETRIC_ORIENTATION } from "../isometric/orientation.js";
import {
  formatIsoCanvasLabelText,
  ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS,
  measureIsoCanvasLabelTextWidthPx,
  readIsoCubeLabelTheme,
  splitIsoCanvasLabelLines,
  type IsoCubeLabelTheme,
} from "../isometric/cube/label-text.js";
import { DEFAULT_CUBE_CANVAS_SCALE, ISO_DIAGRAM_PX_PER_UNIT } from "../isometric/cube/cube.js";

function labelTextForFootprintSizing(label: string, theme: IsoCubeLabelTheme): string {
  const formatted = formatIsoCanvasLabelText(label.trim());
  if (!formatted) {
    return "";
  }
  const lines = splitIsoCanvasLabelLines(formatted);
  return lines
    .map((line) => {
      if ([...line].length <= theme.truncateAfterChars) {
        return line;
      }
      const chars = [...line];
      return chars.slice(0, theme.truncateAfterChars).join("") + ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS;
    })
    .join("\n");
}

/** Min iso span along the label baseline so `label` fits at `fontSizePx`. */
export function isoCubeMinAlongEdgeIsoForLabelText(
  label: string,
  fontSizePx: number,
  options?: {
    orientation?: IsometricOrientation;
    canvasScale?: number;
    themeScope?: Element | null;
  },
): number {
  const theme = readIsoCubeLabelTheme(
    options?.themeScope ?? (typeof document !== "undefined" ? document.documentElement : null),
  );
  const text = labelTextForFootprintSizing(label, theme);
  if (!text) {
    return 0;
  }
  const canvasScale = options?.canvasScale ?? DEFAULT_CUBE_CANVAS_SCALE;
  const measuredPx = measureIsoCanvasLabelTextWidthPx(text, fontSizePx, theme);
  return (measuredPx / (canvasScale * theme.edgeInset)) * 1.14;
}

/** Min iso span on the cross axis so a label block fits on the top face (`\n` = extra lines). */
export function isoCubeMinCrossEdgeIsoForLabelFontSizePx(
  fontSizePx: number,
  options?: {
    canvasScale?: number;
    themeScope?: Element | null;
    /** When set, height accounts for multiple lines at `fontSizePx`. */
    label?: string;
  },
): number {
  const theme = readIsoCubeLabelTheme(
    options?.themeScope ?? (typeof document !== "undefined" ? document.documentElement : null),
  );
  const canvasScale = options?.canvasScale ?? DEFAULT_CUBE_CANVAS_SCALE;
  const crossInset = theme.edgeInset * theme.crossAxisInset;
  const lineCount = Math.max(1, splitIsoCanvasLabelLines(options?.label?.trim() ?? "").length);
  const crossSlack = lineCount > 1 ? 1 + (lineCount - 1) * 0.18 : 1;
  const heightPx = lineCount * fontSizePx * theme.lineHeightEm * crossSlack;
  return (heightPx / (canvasScale * crossInset)) * 1.06;
}

/** Diagram user px footprint (`w` / `h`) large enough for the cube top label. */
export function diagramUserFootprintPxForCubeLabel(options: {
  label: string;
  fontSizePx: number;
  minWidthPx: number;
  minDepthPx: number;
  orientation?: IsometricOrientation;
  canvasScale?: number;
  themeScope?: Element | null;
}): { widthPx: number; depthPx: number } {
  const orientation = options.orientation ?? DEFAULT_ISOMETRIC_ORIENTATION;
  const scopeOpts =
    options.themeScope !== undefined ? { themeScope: options.themeScope } : {};
  const scaleOpts =
    options.canvasScale !== undefined ? { canvasScale: options.canvasScale } : {};
  const alongIso = isoCubeMinAlongEdgeIsoForLabelText(
    options.label,
    options.fontSizePx,
    { ...scaleOpts, ...scopeOpts, orientation },
  );
  const crossIso = isoCubeMinCrossEdgeIsoForLabelFontSizePx(options.fontSizePx, {
    ...scaleOpts,
    ...scopeOpts,
    label: options.label,
  });

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
