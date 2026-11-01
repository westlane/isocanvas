// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { readLengthPx } from "../grid/surface.js";

/** CSS custom properties for canvas chrome spacing (see `theme/tokens.css`). */
export type SpacingCssVars = {
  space1Var: string;
  space2Var: string;
  space3Var: string;
  space4Var: string;
  gapVar: string;
  padVar: string;
};

export type SpacingScalePx = {
  space1: number;
  space2: number;
  space3: number;
  space4: number;
  gap: number;
  pad: number;
};

export const IC_SPACING_CSS_VARS: SpacingCssVars = {
  space1Var: "--ic-space-1",
  space2Var: "--ic-space-2",
  space3Var: "--ic-space-3",
  space4Var: "--ic-space-4",
  gapVar: "--ic-gap",
  padVar: "--ic-pad",
};

export type ReadSpacingScaleOptions = {
  element: HTMLElement;
  cssVars?: SpacingCssVars;
  /** Used when a custom property is missing or invalid. */
  fallbacks?: Partial<SpacingScalePx>;
};

const DEFAULT_FALLBACKS: SpacingScalePx = {
  space1: 4,
  space2: 8,
  space3: 16,
  space4: 24,
  gap: 16,
  pad: 12,
};

/** Read spacing tokens from CSS (pairs with `theme/layout/layout.css` / `canvas-chrome.css`). */
export function readSpacingScalePx(options: ReadSpacingScaleOptions): SpacingScalePx {
  const { element, cssVars = IC_SPACING_CSS_VARS, fallbacks = {} } = options;
  const base = { ...DEFAULT_FALLBACKS, ...fallbacks };

  return {
    space1: readLengthPx(element, cssVars.space1Var, base.space1),
    space2: readLengthPx(element, cssVars.space2Var, base.space2),
    space3: readLengthPx(element, cssVars.space3Var, base.space3),
    space4: readLengthPx(element, cssVars.space4Var, base.space4),
    gap: readLengthPx(element, cssVars.gapVar, base.gap),
    pad: readLengthPx(element, cssVars.padVar, base.pad),
  };
}
