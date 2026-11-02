// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

/** Node-safe label measure/format (no isometric canvas / cube-face layout). */

export const ISO_CUBE_LABEL_FONT_SIZE_PX = 36;

export const ISO_CUBE_LABEL_FONT_SIZE_MIN_PX = 12;

export const ISO_CUBE_TOP_LABEL_EDGE_INSET = 0.72;

export const ISO_CUBE_TOP_LABEL_CROSS_AXIS_INSET = 0.88;

export const ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS = "…";

export const ISO_CUBE_LABEL_TRUNCATE_AFTER_CHARS = 20;

export const ISO_CANVAS_LABEL_LETTER_SPACING_EM = 0.12;

export const ISO_CANVAS_LABEL_FONT_FAMILY =
  '"Segoe UI", "Helvetica Neue", Arial, system-ui, sans-serif';

export const ISO_CANVAS_LABEL_FONT_WEIGHT = 900;

export function formatIsoCanvasLabelText(text: string): string {
  return text.toLocaleUpperCase("en-US");
}

export function isoCanvasLabelLetterSpacingPx(fontSizePx: number): number {
  return fontSizePx * ISO_CANVAS_LABEL_LETTER_SPACING_EM;
}

function isoCanvasLabelFontCss(fontSizePx: number): string {
  return `${ISO_CANVAS_LABEL_FONT_WEIGHT} ${fontSizePx}px ${ISO_CANVAS_LABEL_FONT_FAMILY}`;
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
  return charCount * fontSizePx * 0.7 + spacingExtra;
}

export function truncateIsoCanvasLabelText(
  text: string,
  maxWidthPx: number,
  fontSizePx: number,
): string {
  if (!text || maxWidthPx <= 0) {
    return text;
  }
  if (measureIsoCanvasLabelTextWidthPx(text, fontSizePx) <= maxWidthPx) {
    return text;
  }
  if ([...text].length <= ISO_CUBE_LABEL_TRUNCATE_AFTER_CHARS) {
    return text;
  }
  const ellipsis = ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS;
  const ellipsisWidth = measureIsoCanvasLabelTextWidthPx(ellipsis, fontSizePx);
  if (ellipsisWidth > maxWidthPx) {
    return ellipsis;
  }
  const chars = [...text];
  let lo = 0;
  let hi = chars.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = chars.slice(0, mid).join("") + ellipsis;
    if (measureIsoCanvasLabelTextWidthPx(candidate, fontSizePx) <= maxWidthPx) {
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
