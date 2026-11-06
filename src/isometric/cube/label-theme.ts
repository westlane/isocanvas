// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

/** CSS custom properties — defaults in `theme/tokens.css`, paint in `theme/diagram-surfaces.css`. */
export const IC_ISO_CUBE_LABEL_THEME_VARS = {
  fontSizePx: "--ic-iso-cube-label-font-size-px",
  fontSizeMinPx: "--ic-iso-cube-label-font-size-min-px",
  edgeInset: "--ic-iso-cube-label-edge-inset",
  crossAxisInset: "--ic-iso-cube-label-cross-axis-inset",
  letterSpacingEm: "--ic-iso-cube-label-letter-spacing-em",
  lineHeightEm: "--ic-iso-cube-label-line-height-em",
  truncateAfterChars: "--ic-iso-cube-label-truncate-after-chars",
  fontWeight: "--ic-iso-cube-label-font-weight",
  fontFamily: "--ic-iso-cube-label-font-family",
} as const;

export type IsoCubeLabelTheme = {
  fontSizePx: number;
  fontSizeMinPx: number;
  edgeInset: number;
  crossAxisInset: number;
  letterSpacingEm: number;
  /** Line height as a multiple of `fontSizePx` (used for multi-line top-face labels). */
  lineHeightEm: number;
  truncateAfterChars: number;
  fontWeight: number;
  fontFamily: string;
};

/** Fallback when CSS is unavailable (tests, SSR measure). Keep in sync with `theme/tokens.css`. */
export const ISO_CUBE_LABEL_THEME_DEFAULTS: IsoCubeLabelTheme = {
  fontSizePx: 52,
  fontSizeMinPx: 16,
  edgeInset: 0.86,
  crossAxisInset: 0.94,
  letterSpacingEm: 0.12,
  lineHeightEm: 1.12,
  truncateAfterChars: 20,
  fontWeight: 900,
  fontFamily: '"Segoe UI", "Helvetica Neue", Arial, system-ui, sans-serif',
};

function parseCssNumber(raw: string, fallback: number): number {
  const trimmed = raw.trim();
  if (!trimmed) {
    return fallback;
  }
  const value = Number.parseFloat(trimmed);
  return Number.isFinite(value) ? value : fallback;
}

function parseCssInt(raw: string, fallback: number): number {
  const value = Math.round(parseCssNumber(raw, fallback));
  return Number.isFinite(value) ? value : fallback;
}

function parseCssString(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  return trimmed || fallback;
}

/** Read cube label theme from computed styles (`.diagram-host` or `documentElement`). */
export function readIsoCubeLabelTheme(
  scope: Element | null | undefined,
): IsoCubeLabelTheme {
  const defaults = ISO_CUBE_LABEL_THEME_DEFAULTS;
  if (!scope || typeof getComputedStyle !== "function") {
    return defaults;
  }
  const style = getComputedStyle(scope);
  const v = IC_ISO_CUBE_LABEL_THEME_VARS;
  return {
    fontSizePx: parseCssNumber(style.getPropertyValue(v.fontSizePx), defaults.fontSizePx),
    fontSizeMinPx: parseCssNumber(style.getPropertyValue(v.fontSizeMinPx), defaults.fontSizeMinPx),
    edgeInset: parseCssNumber(style.getPropertyValue(v.edgeInset), defaults.edgeInset),
    crossAxisInset: parseCssNumber(
      style.getPropertyValue(v.crossAxisInset),
      defaults.crossAxisInset,
    ),
    letterSpacingEm: parseCssNumber(
      style.getPropertyValue(v.letterSpacingEm),
      defaults.letterSpacingEm,
    ),
    lineHeightEm: parseCssNumber(style.getPropertyValue(v.lineHeightEm), defaults.lineHeightEm),
    truncateAfterChars: parseCssInt(
      style.getPropertyValue(v.truncateAfterChars),
      defaults.truncateAfterChars,
    ),
    fontWeight: parseCssInt(style.getPropertyValue(v.fontWeight), defaults.fontWeight),
    fontFamily: parseCssString(style.getPropertyValue(v.fontFamily), defaults.fontFamily),
  };
}
