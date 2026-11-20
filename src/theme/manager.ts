// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { applyThemeToElement } from "./css-vars.js";
import { DEFAULT_ISO_CANVAS_THEME } from "./defaults.js";
import { mergeTheme, resolveTheme } from "./merge.js";
import type { IsoCanvasTheme, IsoCanvasThemePatch } from "../types/theme.js";

export type ThemeManagerOptions = {
  /** Element that hosts diagram SVG (tokens inherit to descendants). */
  target: HTMLElement;
  theme?: IsoCanvasTheme;
};

export type ThemeManager = {
  readonly target: HTMLElement;
  getTheme(): IsoCanvasTheme;
  setTheme(theme: IsoCanvasTheme): void;
  patchTheme(patch: IsoCanvasThemePatch): IsoCanvasTheme;
  apply(): void;
};

export function createThemeManager(options: ThemeManagerOptions): ThemeManager {
  const target = options.target;
  let theme = resolveTheme(options.theme);

  return {
    target,
    getTheme() {
      return theme;
    },
    setTheme(next) {
      theme = resolveTheme(next);
    },
    patchTheme(patch) {
      theme = mergeTheme(theme, patch);
      return theme;
    },
    apply() {
      applyThemeToElement(target, theme);
    },
  };
}

export function createDefaultThemeManager(target: HTMLElement): ThemeManager {
  return createThemeManager({ target, theme: DEFAULT_ISO_CANVAS_THEME });
}
