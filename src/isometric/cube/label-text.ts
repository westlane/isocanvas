// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

/** Node-safe label measure/format (no isometric canvas / cube-face layout). */

import {
  ISO_CUBE_LABEL_THEME_DEFAULTS,
  type IsoCubeLabelTheme,
  readIsoCubeLabelTheme,
} from "./label-theme.js";

export {
  IC_ISO_CUBE_LABEL_THEME_VARS,
  ISO_CUBE_LABEL_THEME_DEFAULTS,
  readIsoCubeLabelTheme,
  type IsoCubeLabelTheme,
} from "./label-theme.js";

export const ISO_CUBE_LABEL_FONT_SIZE_PX = ISO_CUBE_LABEL_THEME_DEFAULTS.fontSizePx;

export const ISO_CUBE_LABEL_FONT_SIZE_MIN_PX = ISO_CUBE_LABEL_THEME_DEFAULTS.fontSizeMinPx;

export const ISO_CUBE_TOP_LABEL_EDGE_INSET = ISO_CUBE_LABEL_THEME_DEFAULTS.edgeInset;

export const ISO_CUBE_TOP_LABEL_CROSS_AXIS_INSET = ISO_CUBE_LABEL_THEME_DEFAULTS.crossAxisInset;

export const ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS = "…";

export const ISO_CUBE_LABEL_TRUNCATE_AFTER_CHARS =
  ISO_CUBE_LABEL_THEME_DEFAULTS.truncateAfterChars;

export const ISO_CANVAS_LABEL_LETTER_SPACING_EM = ISO_CUBE_LABEL_THEME_DEFAULTS.letterSpacingEm;

export const ISO_CANVAS_LABEL_FONT_FAMILY = ISO_CUBE_LABEL_THEME_DEFAULTS.fontFamily;

export const ISO_CANVAS_LABEL_FONT_WEIGHT = ISO_CUBE_LABEL_THEME_DEFAULTS.fontWeight;

export function formatIsoCanvasLabelText(text: string): string {
  return text.toLocaleUpperCase("en-US");
}

/** Split user/markup label into lines (`\n` / `\r\n`); empty input yields `[""]`. */
export function splitIsoCanvasLabelLines(text: string): string[] {
  return text.split(/\r?\n/);
}

export function isoCanvasLabelLetterSpacingPx(
  fontSizePx: number,
  theme: IsoCubeLabelTheme = ISO_CUBE_LABEL_THEME_DEFAULTS,
): number {
  return fontSizePx * theme.letterSpacingEm;
}

export function isoCanvasLabelLineHeightPx(
  fontSizePx: number,
  theme: IsoCubeLabelTheme = ISO_CUBE_LABEL_THEME_DEFAULTS,
): number {
  return fontSizePx * theme.lineHeightEm;
}

function isoCanvasLabelFontCss(fontSizePx: number, theme: IsoCubeLabelTheme): string {
  return `${theme.fontWeight} ${fontSizePx}px ${theme.fontFamily}`;
}

/** Width of one line (no newline characters). */
function measureIsoCanvasLabelSingleLineWidthPx(
  line: string,
  fontSizePx: number,
  theme: IsoCubeLabelTheme,
): number {
  if (!line) {
    return 0;
  }
  const letterSpacingPx = isoCanvasLabelLetterSpacingPx(fontSizePx, theme);
  const charCount = [...line].length;
  const spacingExtra = charCount > 1 ? (charCount - 1) * letterSpacingPx : 0;
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = isoCanvasLabelFontCss(fontSizePx, theme);
      return ctx.measureText(line).width + spacingExtra;
    }
  }
  return charCount * fontSizePx * 0.7 + spacingExtra;
}

/**
 * Max horizontal extent of a possibly multi-line block (manual `\n` breaks only).
 * Newlines do not add width; empty lines contribute 0 width.
 */
export function measureIsoCanvasLabelTextWidthPx(
  text: string,
  fontSizePx: number,
  theme?: IsoCubeLabelTheme,
): number {
  const resolved = theme ?? readIsoCubeLabelTheme(typeof document !== "undefined" ? document.documentElement : null);
  if (!text) {
    return 0;
  }
  const lines = splitIsoCanvasLabelLines(text);
  let maxW = 0;
  for (const line of lines) {
    maxW = Math.max(maxW, measureIsoCanvasLabelSingleLineWidthPx(line, fontSizePx, resolved));
  }
  return maxW;
}

export function measureIsoCanvasLabelBlockHeightPx(
  text: string,
  fontSizePx: number,
  theme?: IsoCubeLabelTheme,
): number {
  const resolved = theme ?? readIsoCubeLabelTheme(typeof document !== "undefined" ? document.documentElement : null);
  if (!text.trim()) {
    return 0;
  }
  const lineCount = splitIsoCanvasLabelLines(text).length;
  return lineCount * isoCanvasLabelLineHeightPx(fontSizePx, resolved);
}

function truncateIsoCanvasLabelSingleLine(
  line: string,
  maxWidthPx: number,
  fontSizePx: number,
  resolved: IsoCubeLabelTheme,
): string {
  if (!line || maxWidthPx <= 0) {
    return line;
  }
  if (measureIsoCanvasLabelSingleLineWidthPx(line, fontSizePx, resolved) <= maxWidthPx) {
    return line;
  }
  if ([...line].length <= resolved.truncateAfterChars) {
    return line;
  }
  const ellipsis = ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS;
  const ellipsisWidth = measureIsoCanvasLabelSingleLineWidthPx(ellipsis, fontSizePx, resolved);
  if (ellipsisWidth > maxWidthPx) {
    return ellipsis;
  }
  const chars = [...line];
  let lo = 0;
  let hi = chars.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = chars.slice(0, mid).join("") + ellipsis;
    if (measureIsoCanvasLabelSingleLineWidthPx(candidate, fontSizePx, resolved) <= maxWidthPx) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  if (lo === 0) {
    return ellipsis;
  }
  return chars.slice(0, lo).join("") + ellipsis;
}

export function truncateIsoCanvasLabelText(
  text: string,
  maxWidthPx: number,
  fontSizePx: number,
  theme?: IsoCubeLabelTheme,
): string {
  const resolved = theme ?? readIsoCubeLabelTheme(typeof document !== "undefined" ? document.documentElement : null);
  if (!text || maxWidthPx <= 0) {
    return text;
  }
  const lines = splitIsoCanvasLabelLines(text);
  return lines.map((line) => truncateIsoCanvasLabelSingleLine(line, maxWidthPx, fontSizePx, resolved)).join("\n");
}
