// Copyright (C) 2026 West Lane - All Rights Reserved

import { DEFAULT_ISO_CANVAS_THEME } from "./defaults.js";
import type { IsoCanvasTheme, IsoCanvasThemePatch } from "../types/theme.js";

export function mergeTheme(base: IsoCanvasTheme, patch: IsoCanvasThemePatch): IsoCanvasTheme {
  return {
    id: patch.id ?? base.id,
    colors: { ...base.colors, ...patch.colors },
    radius: { ...base.radius, ...patch.radius },
  };
}

export function resolveTheme(theme?: IsoCanvasTheme): IsoCanvasTheme {
  return theme ?? DEFAULT_ISO_CANVAS_THEME;
}
