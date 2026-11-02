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

export function isoCanvasLabelLetterSpacingPx(
  fontSizePx: number,
  theme: IsoCubeLabelTheme = ISO_CUBE_LABEL_THEME_DEFAULTS,
): number {
  return fontSizePx * theme.letterSpacingEm;
}

function isoCanvasLabelFontCss(fontSizePx: number, theme: IsoCubeLabelTheme): string {
  return `${theme.fontWeight} ${fontSizePx}px ${theme.fontFamily}`;
}

export function measureIsoCanvasLabelTextWidthPx(
  text: string,
  fontSizePx: number,
  theme?: IsoCubeLabelTheme,
): number {
  const resolved = theme ?? readIsoCubeLabelTheme(typeof document !== "undefined" ? document.documentElement : null);
  if (!text) {
    return 0;
  }
  const letterSpacingPx = isoCanvasLabelLetterSpacingPx(fontSizePx, resolved);
  const charCount = [...text].length;
  const spacingExtra = charCount > 1 ? (charCount - 1) * letterSpacingPx : 0;
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = isoCanvasLabelFontCss(fontSizePx, resolved);
      return ctx.measureText(text).width + spacingExtra;
    }
  }
  return charCount * fontSizePx * 0.7 + spacingExtra;
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
  if (measureIsoCanvasLabelTextWidthPx(text, fontSizePx, resolved) <= maxWidthPx) {
    return text;
  }
  if ([...text].length <= resolved.truncateAfterChars) {
    return text;
  }
  const ellipsis = ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS;
  const ellipsisWidth = measureIsoCanvasLabelTextWidthPx(ellipsis, fontSizePx, resolved);
  if (ellipsisWidth > maxWidthPx) {
    return ellipsis;
  }
  const chars = [...text];
  let lo = 0;
  let hi = chars.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = chars.slice(0, mid).join("") + ellipsis;
    if (measureIsoCanvasLabelTextWidthPx(candidate, fontSizePx, resolved) <= maxWidthPx) {
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
