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
  measureIsoCanvasLabelBlockHeightPx,
  measureIsoCanvasLabelTextWidthPx,
  readIsoCubeLabelTheme,
  splitIsoCanvasLabelLines,
  truncateIsoCanvasLabelText,
  type IsoCubeLabelTheme,
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

type IsoCanvasTextGraphic = {
  getElement(): SVGElement;
  text: string;
  update(): unknown;
};

const multilineLabelHook = new WeakSet<object>();

/**
 * SVG `<text>` defaults to collapsing whitespace, so embedded `\n` becomes a space.
 * `@elchininet/isometric` writes one `tspan` and calls `update()` on mount, which would
 * wipe extra tspans. Hook `update` so each line is its own `tspan`.
 */
export function preserveSvgTextWhitespace(textGraphic: IsoCanvasTextGraphic): void {
  const root = textGraphic.getElement();
  const text =
    root instanceof SVGTextElement
      ? root
      : (root.querySelector("text") ?? null);
  if (text) {
    text.setAttribute("xml:space", "preserve");
  }
  if (!multilineLabelHook.has(textGraphic)) {
    multilineLabelHook.add(textGraphic);
    const originalUpdate = textGraphic.update.bind(textGraphic);
    textGraphic.update = () => {
      const result = originalUpdate();
      applyIsoCubeLabelMultilineTspans(textGraphic);
      return result;
    };
  }
}

const TSPAN_POSITION_ATTRS = new Set(["x", "y", "dx", "dy"]);

/**
 * Browsers do not reliably render `\n` as a line break when there is only one
 * {@link SVGTextElement} child {@link SVGTSpanElement}. Split into one `tspan` per line
 * with `dy` in `em` (theme {@link IsoCubeLabelTheme.lineHeightEm}).
 */
export function applyIsoCubeLabelMultilineTspans(
  label: { getElement(): SVGElement; text: string },
  themeScope?: Element | null,
): void {
  const root = label.getElement();
  const textEl =
    root instanceof SVGTextElement
      ? root
      : (root.querySelector("text") ?? null);
  if (!textEl) {
    return;
  }
  const lines = splitIsoCanvasLabelLines(label.text);
  if (lines.length < 2) {
    return;
  }
  const theme = readIsoCubeLabelTheme(
    themeScope ?? (typeof document !== "undefined" ? document.documentElement : null),
  );
  const template = textEl.querySelector("tspan");
  if (!template) {
    return;
  }
  while (textEl.firstChild) {
    textEl.removeChild(textEl.firstChild);
  }
  const ns = "http://www.w3.org/2000/svg";
  const leadEm = -((lines.length - 1) / 2) * theme.lineHeightEm;
  for (let i = 0; i < lines.length; i += 1) {
    const ts = document.createElementNS(ns, "tspan");
    ts.textContent = lines[i]!;
    ts.setAttribute("x", "0");
    ts.setAttribute("dy", i === 0 ? `${leadEm}em` : `${theme.lineHeightEm}em`);
    for (const attr of Array.from(template.attributes)) {
      if (TSPAN_POSITION_ATTRS.has(attr.name)) {
        continue;
      }
      ts.setAttribute(attr.name, attr.value);
    }
    textEl.appendChild(ts);
  }
}

export {
  formatIsoCanvasLabelText,
  IC_ISO_CUBE_LABEL_THEME_VARS,
  ISO_CANVAS_LABEL_FONT_FAMILY,
  ISO_CANVAS_LABEL_FONT_WEIGHT,
  ISO_CANVAS_LABEL_LETTER_SPACING_EM,
  ISO_CUBE_LABEL_FONT_SIZE_MIN_PX,
  ISO_CUBE_LABEL_FONT_SIZE_PX,
  ISO_CUBE_LABEL_THEME_DEFAULTS,
  ISO_CUBE_LABEL_TRUNCATE_AFTER_CHARS,
  ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS,
  ISO_CUBE_TOP_LABEL_CROSS_AXIS_INSET,
  ISO_CUBE_TOP_LABEL_EDGE_INSET,
  isoCanvasLabelLineHeightPx,
  measureIsoCanvasLabelBlockHeightPx,
  measureIsoCanvasLabelTextWidthPx,
  readIsoCubeLabelTheme,
  splitIsoCanvasLabelLines,
  truncateIsoCanvasLabelText,
  type IsoCubeLabelTheme,
} from "./label-text.js";

/** Matches `theme/tokens.css` + `theme/diagram-surfaces.css` (SVG `letter-spacing` on cube-canvas text). */
export const ISO_CANVAS_LABEL_LETTER_SPACING = `${ISO_CANVAS_LABEL_LETTER_SPACING_EM}em`;

/** Top-face span available to the label baseline (iso units). */
export function isoCubeTopFaceLabelAlongEdgeIsoUnits(
  widthIso: number,
  depthIso: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): number {
  return isIsometricOrientationRotated(orientation) ? depthIso : widthIso;
}

/** Cross-axis span on the TOP plane (depth of the visible top face along the tilt). */
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
  theme?: IsoCubeLabelTheme,
): number {
  const t = theme ?? readIsoCubeLabelTheme(typeof document !== "undefined" ? document.documentElement : null);
  const alongIso = isoCubeTopFaceLabelAlongEdgeIsoUnits(widthIso, depthIso, orientation);
  return alongIso * canvasScale * t.edgeInset;
}

export function isoCubeTopFaceLabelMaxHeightPx(
  widthIso: number,
  depthIso: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
  canvasScale: number = DEFAULT_CUBE_CANVAS_SCALE,
  theme?: IsoCubeLabelTheme,
  options?: { lineCount?: number },
): number {
  const t = theme ?? readIsoCubeLabelTheme(typeof document !== "undefined" ? document.documentElement : null);
  const crossIso = isoCubeTopFaceLabelCrossEdgeIsoUnits(widthIso, depthIso, orientation);
  const rawMax = crossIso * canvasScale * t.edgeInset * t.crossAxisInset;
  const lines = Math.max(1, options?.lineCount ?? 1);
  return rawMax / (lines * t.lineHeightEm);
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
  /** Host element for `--ic-iso-cube-label-*` (defaults to `documentElement`). */
  themeScope?: Element | null;
}): number {
  const theme = readIsoCubeLabelTheme(options.themeScope ?? (typeof document !== "undefined" ? document.documentElement : null));
  const baseFontSizePx = options.baseFontSizePx ?? theme.fontSizePx;
  const canvasScale = options.canvasScale ?? DEFAULT_CUBE_CANVAS_SCALE;
  const orientation = options.orientation ?? DEFAULT_ISOMETRIC_ORIENTATION;

  const formatted = formatIsoCanvasLabelText(options.label);
  const lineCount = Math.max(1, splitIsoCanvasLabelLines(formatted).length);

  const maxWidthPx = isoCubeTopFaceLabelMaxWidthPx(
    options.widthIso,
    options.depthIso,
    orientation,
    canvasScale,
    theme,
  );

  const crossIso = isoCubeTopFaceLabelCrossEdgeIsoUnits(options.widthIso, options.depthIso, orientation);
  const rawCrossPx = crossIso * canvasScale * theme.edgeInset * theme.crossAxisInset;
  /** Extra vertical budget for line gaps and SVG tspan metrics (only when `\n` splits lines). */
  const crossBudgetPx =
    rawCrossPx * (lineCount > 1 ? 1 + (lineCount - 1) * 0.18 : 1);
  const maxHeightPx = crossBudgetPx / (lineCount * theme.lineHeightEm);

  let fit = baseFontSizePx;
  if (lineCount === 1) {
    if (fit > rawCrossPx) {
      fit = rawCrossPx;
    }
  } else if (fit > maxHeightPx) {
    fit = maxHeightPx;
  }
  while (
    fit > theme.fontSizeMinPx &&
    (measureIsoCanvasLabelTextWidthPx(formatted, fit, theme) > maxWidthPx ||
      measureIsoCanvasLabelBlockHeightPx(formatted, fit, theme) > crossBudgetPx)
  ) {
    fit -= 1;
  }
  return Math.max(theme.fontSizeMinPx, Math.min(baseFontSizePx, fit));
}

/** One font size for every cube label in a mount so titles stay on-face and match each other. */
export function uniformIsoCubeTopLabelFontSizePx(
  specs: readonly Pick<IsoBoxSpec, "label" | "width" | "depth" | "omitCubeLabel">[],
  options?: {
    orientation?: IsometricOrientation;
    baseFontSizePx?: number;
    canvasScale?: number;
    themeScope?: Element | null;
  },
): number {
  const theme = readIsoCubeLabelTheme(
    options?.themeScope ?? (typeof document !== "undefined" ? document.documentElement : null),
  );
  const baseFontSizePx = options?.baseFontSizePx ?? theme.fontSizePx;
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
      ...(options?.themeScope !== undefined ? { themeScope: options.themeScope } : {}),
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
