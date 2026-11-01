// Copyright (C) 2026 West Lane - All Rights Reserved

import type { IsoCanvasColors, IsoCanvasTheme } from "../types/theme.js";
import { DEFAULT_ISO_CANVAS_THEME } from "./defaults.js";
import {
  blendHexWithBlack,
  blendHexWithWhite,
  darkerSurfaceBorderStroke,
  hexToRgba,
  isoFaceFillsFromSchemeAccent,
  isoCubeLabelFillOnFace,
  normalizeHex,
  readableTextOnSurface,
  themeInkShades,
} from "./color-math.js";

/** Minimal shape of `@westlane/pino-blanc` built-in themes (no runtime dependency). */
export type LogThemeLike = {
  id: string;
  background?: "dark" | "light" | undefined;
  levels: Partial<
    Record<"trace" | "debug" | "info" | "warn" | "error" | "fatal", string>
  >;
  tintRamp: string[];
  roles?:
    | Partial<Record<"module" | "message" | "meta" | "box" | "accent", string>>
    | undefined;
};

/** Editor / terminal surfaces aligned with pino-blanc `themeSurfaceHex`. */
export const PINO_BLANC_THEME_SURFACE: Record<string, string> = {
  "solarized-dark": "#002b36",
  "solarized-light": "#fdf6e3",
  "gruvbox-dark": "#282828",
  "gruvbox-light": "#fbf1c7",
  "tokyo-night-dark": "#1a1b26",
  "tokyo-night-light": "#e6e7ed",
  "dracula-dark": "#282a36",
  "dracula-light": "#fffbeb",
  "catppuccin-dark": "#1e1e2e",
  "catppuccin-light": "#eff1f5",
};

function rampAt(log: LogThemeLike, index: number, fallback: string): string {
  return log.tintRamp[index] ?? fallback;
}

function surfaceForLogTheme(log: LogThemeLike): string {
  return (
    PINO_BLANC_THEME_SURFACE[log.id] ??
    (log.background === "light" ? "#fdf6e3" : "#1e293b")
  );
}

/** Map a pino-blanc palette to isocanvas diagram tokens (colors only; keeps base radius). */
export function isoCanvasThemeFromLogTheme(
  log: LogThemeLike,
  base: IsoCanvasTheme = DEFAULT_ISO_CANVAS_THEME,
): IsoCanvasTheme {
  const accent =
    log.roles?.accent ?? log.levels.info ?? rampAt(log, 0, base.colors.accent);
  const accentNorm = normalizeHex(accent);
  const surface = surfaceForLogTheme(log);
  const isLight = log.background === "light";
  const labelSource = log.roles?.message ?? log.roles?.module ?? accentNorm;
  const faces = isoFaceFillsFromSchemeAccent(accentNorm, isLight ? "light" : "dark");
  const isoFrontFill = faces.front;
  const isoEdgeStroke = darkerSurfaceBorderStroke(
    isoFrontFill,
    isLight ? "light" : "dark",
  );
  const accentDark = blendHexWithBlack(accentNorm, isLight ? 0.55 : 0.45);
  const canvasSurface = isLight
    ? blendHexWithWhite(surface, 0.35)
    : blendHexWithWhite(surface, 0.08);
  const { ink, inkMuted } = themeInkShades(canvasSurface, labelSource);
  const isoLabelFill = isoCubeLabelFillOnFace(faces.top);

  const colors: IsoCanvasColors = {
    accent: accentNorm,
    accentDeep: blendHexWithBlack(accentNorm, isLight ? 0.35 : 0.25),
    accentDark,
    surface: canvasSurface,
    ink,
    inkMuted,
    edgeLine: log.levels.info ?? blendHexWithWhite(accentNorm, 0.4),
    edgeLabel: rampAt(log, 6, accentNorm),
    isoTopFill: faces.top,
    isoRightFill: faces.side,
    isoBottomFill: faces.bottom,
    isoLeftFill: faces.left,
    isoFrontFill,
    isoEdgeStroke,
    isoLabelFill,
    isoSelectedRightFill: blendHexWithBlack(accentNorm, 0.15),
    isoSelectedBottomFill: blendHexWithBlack(accentNorm, 0.25),
    isoSelectedLeftFill: blendHexWithBlack(accentNorm, 0.35),
    isoShadowFill: hexToRgba(log.roles?.meta ?? log.roles?.box ?? "#64748b", 0.55),
    isoShadowOpacity: isLight ? 0.35 : 0.42,
    selectedBorder: "#ffffff",
    onAccent: readableTextOnSurface(accentDark, labelSource),
    dotGridBorder: isLight
      ? blendHexWithWhite(log.roles?.meta ?? "#94a3b8", 0.55)
      : blendHexWithWhite(log.roles?.meta ?? "#64748b", 0.35),
  };

  return {
    ...base,
    id: `pino:${log.id}`,
    colors,
  };
}
