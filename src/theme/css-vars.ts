// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { IsoCanvasTheme } from "../types/theme.js";
import {
  artboardSurfaceFillOnCanvas,
  artboardFrontEdgeLightCss,
  isoSolidFaceStrokeCssFromFill,
  isoSlabVisibleFacesFromTop,
  isLightHex,
  wireframeFrontFaceFillOnCanvas,
  wireframeFrontSurfaceOnCanvas,
  wireframeBackFaceStrokeOnCanvas,
  wireframeSideFaceFillOnCanvas,
  wireframeLabelFillOnCanvas,
  wireframeTopFaceFillOnCanvas,
  wireframeIsoNodeStroke,
  wireframeGridStrokeOnCanvas,
  wireframeStrokeOnSurface,
} from "./color-math.js";

/** Diagram palette tokens (`--ic-*` custom properties on hosts and cube shells). */
export const IC_THEME_CSS_VARS = {
  accent: "--ic-accent",
  accentDeep: "--ic-accent-deep",
  accentDark: "--ic-accent-dark",
  surface: "--ic-surface",
  ink: "--ic-ink",
  inkMuted: "--ic-ink-muted",
  edgeLine: "--ic-edge-line",
  edgeLabel: "--ic-edge-label",
  isoTopFill: "--ic-iso-top-fill",
  isoRightFill: "--ic-iso-right-fill",
  isoBottomFill: "--ic-iso-bottom-fill",
  isoLeftFill: "--ic-iso-left-fill",
  isoFrontFill: "--ic-iso-front-fill",
  isoEdgeStroke: "--ic-iso-edge-stroke",
  isoFaceStrokeTop: "--ic-iso-face-stroke-top",
  isoFaceStrokeFront: "--ic-iso-face-stroke-front",
  isoFaceStrokeSide: "--ic-iso-face-stroke-side",
  isoFaceStrokeBottom: "--ic-iso-face-stroke-bottom",
  isoFaceStrokeRecess: "--ic-iso-face-stroke-recess",
  isoLabelFill: "--ic-iso-label-fill",
  isoSelectedRightFill: "--ic-iso-selected-right-fill",
  isoSelectedBottomFill: "--ic-iso-selected-bottom-fill",
  isoSelectedLeftFill: "--ic-iso-selected-left-fill",
  isoShadowFill: "--ic-iso-shadow-fill",
  isoShadowOpacity: "--ic-iso-shadow-opacity",
  selectedBorder: "--ic-selected-border",
  onAccent: "--ic-on-accent",
  dotGridBorder: "--ic-dot-grid-border",
  clusterRx: "--ic-theme-cluster-rx",
  isoFaceStrokeWidth: "--ic-theme-iso-face-stroke-width",
  isoFrontStrokeWidth: "--ic-theme-iso-front-stroke-width",
  selectedStrokeWidth: "--ic-theme-selected-stroke-width",
  edgeLabelStrokeWidth: "--ic-theme-edge-label-stroke-width",
  wireframeStroke: "--ic-wireframe-stroke",
  wireframeGridStroke: "--ic-wireframe-grid-stroke",
  wireframeIsoStroke: "--ic-wireframe-iso-stroke",
  wireframeFrontSurface: "--ic-wireframe-front-surface",
  wireframeTopSurfaceFill: "--ic-wireframe-top-surface-fill",
  wireframeFrontFaceFill: "--ic-wireframe-front-face-fill",
  wireframeSideFaceFill: "--ic-wireframe-side-face-fill",
  wireframeBackFaceStroke: "--ic-wireframe-back-face-stroke",
  wireframeLabelFill: "--ic-wireframe-label-fill",
  artboardSurfaceFill: "--ic-artboard-surface-fill",
  artboardFrontFill: "--ic-artboard-front-fill",
  artboardFrontStroke: "--ic-artboard-front-stroke",
  artboardSideFill: "--ic-artboard-side-fill",
} as const;

export function themeToCssCustomProperties(theme: IsoCanvasTheme): Record<string, string> {
  const { colors, radius } = theme;
  const appearance = isLightHex(colors.surface) ? "light" : "dark";
  const artboardTop = artboardSurfaceFillOnCanvas(colors.surface, appearance);
  const artboardSlab = isoSlabVisibleFacesFromTop(artboardTop, appearance);
  const gridLineInk = wireframeGridStrokeOnCanvas(colors.surface);
  return {
    [IC_THEME_CSS_VARS.accent]: colors.accent,
    [IC_THEME_CSS_VARS.accentDeep]: colors.accentDeep,
    [IC_THEME_CSS_VARS.accentDark]: colors.accentDark,
    [IC_THEME_CSS_VARS.surface]: colors.surface,
    [IC_THEME_CSS_VARS.ink]: colors.ink,
    [IC_THEME_CSS_VARS.inkMuted]: colors.inkMuted,
    [IC_THEME_CSS_VARS.edgeLine]: colors.edgeLine,
    [IC_THEME_CSS_VARS.edgeLabel]: colors.edgeLabel,
    [IC_THEME_CSS_VARS.isoTopFill]: colors.isoTopFill,
    [IC_THEME_CSS_VARS.isoRightFill]: colors.isoRightFill,
    [IC_THEME_CSS_VARS.isoBottomFill]: colors.isoBottomFill,
    [IC_THEME_CSS_VARS.isoLeftFill]: colors.isoLeftFill,
    [IC_THEME_CSS_VARS.isoFrontFill]: colors.isoFrontFill,
    [IC_THEME_CSS_VARS.isoEdgeStroke]: colors.isoEdgeStroke,
    [IC_THEME_CSS_VARS.isoFaceStrokeTop]: isoSolidFaceStrokeCssFromFill(colors.isoTopFill),
    [IC_THEME_CSS_VARS.isoFaceStrokeFront]: isoSolidFaceStrokeCssFromFill(colors.isoFrontFill),
    [IC_THEME_CSS_VARS.isoFaceStrokeSide]: isoSolidFaceStrokeCssFromFill(colors.isoRightFill),
    [IC_THEME_CSS_VARS.isoFaceStrokeBottom]: isoSolidFaceStrokeCssFromFill(colors.isoBottomFill),
    [IC_THEME_CSS_VARS.isoFaceStrokeRecess]: isoSolidFaceStrokeCssFromFill(colors.isoLeftFill),
    [IC_THEME_CSS_VARS.isoLabelFill]: colors.isoLabelFill,
    [IC_THEME_CSS_VARS.isoSelectedRightFill]: colors.isoSelectedRightFill,
    [IC_THEME_CSS_VARS.isoSelectedBottomFill]: colors.isoSelectedBottomFill,
    [IC_THEME_CSS_VARS.isoSelectedLeftFill]: colors.isoSelectedLeftFill,
    [IC_THEME_CSS_VARS.isoShadowFill]: colors.isoShadowFill,
    [IC_THEME_CSS_VARS.isoShadowOpacity]: String(colors.isoShadowOpacity),
    [IC_THEME_CSS_VARS.selectedBorder]: colors.selectedBorder,
    [IC_THEME_CSS_VARS.onAccent]: colors.onAccent,
    [IC_THEME_CSS_VARS.dotGridBorder]: colors.dotGridBorder,
    [IC_THEME_CSS_VARS.clusterRx]: `${radius.clusterRx}px`,
    [IC_THEME_CSS_VARS.isoFaceStrokeWidth]: `${radius.isoFaceStrokeWidth}px`,
    [IC_THEME_CSS_VARS.isoFrontStrokeWidth]: `${radius.isoFrontStrokeWidth}px`,
    [IC_THEME_CSS_VARS.selectedStrokeWidth]: `${radius.selectedStrokeWidth}px`,
    [IC_THEME_CSS_VARS.edgeLabelStrokeWidth]: `${radius.edgeLabelStrokeWidth}px`,
    [IC_THEME_CSS_VARS.wireframeStroke]: wireframeStrokeOnSurface(
      colors.surface,
      colors.isoEdgeStroke,
    ),
    [IC_THEME_CSS_VARS.wireframeGridStroke]: gridLineInk,
    [IC_THEME_CSS_VARS.wireframeIsoStroke]: wireframeIsoNodeStroke(
      colors.surface,
      colors.ink,
    ),
    [IC_THEME_CSS_VARS.wireframeFrontSurface]: wireframeFrontSurfaceOnCanvas(
      colors.surface,
      colors.isoFrontFill,
      colors.isoFrontFill,
    ),
    [IC_THEME_CSS_VARS.wireframeTopSurfaceFill]: wireframeTopFaceFillOnCanvas(
      colors.surface,
      colors.ink,
      colors.isoTopFill,
    ),
    [IC_THEME_CSS_VARS.wireframeFrontFaceFill]: wireframeFrontFaceFillOnCanvas(
      colors.surface,
      colors.ink,
      colors.isoFrontFill,
    ),
    [IC_THEME_CSS_VARS.wireframeSideFaceFill]: wireframeSideFaceFillOnCanvas(
      colors.surface,
      colors.ink,
      colors.isoRightFill,
    ),
    [IC_THEME_CSS_VARS.wireframeBackFaceStroke]: wireframeBackFaceStrokeOnCanvas(
      colors.surface,
      colors.ink,
      colors.isoLeftFill,
    ),
    [IC_THEME_CSS_VARS.wireframeLabelFill]: wireframeLabelFillOnCanvas(
      colors.surface,
      colors.ink,
      colors.isoTopFill,
    ),
    [IC_THEME_CSS_VARS.artboardSurfaceFill]: artboardTop,
    [IC_THEME_CSS_VARS.artboardFrontFill]: artboardSlab.front,
    [IC_THEME_CSS_VARS.artboardFrontStroke]: artboardFrontEdgeLightCss(artboardTop),
    [IC_THEME_CSS_VARS.artboardSideFill]: artboardSlab.side,
  };
}

export function applyThemeToElement(target: HTMLElement, theme: IsoCanvasTheme): void {
  const props = themeToCssCustomProperties(theme);
  for (const [name, value] of Object.entries(props)) {
    target.style.setProperty(name, value);
  }
}
