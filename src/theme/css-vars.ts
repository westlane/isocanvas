// Copyright (C) 2026 West Lane - All Rights Reserved

import type { IsoCanvasTheme } from "../types/theme.js";
import {
  artboardSurfaceFillOnCanvas,
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

/** Watch / domainspec token names on `.diagram-host`. */
export const ZUI_THEME_CSS_VARS = {
  accent: "--zui-accent",
  accentDeep: "--zui-accent-deep",
  accentDark: "--zui-accent-dark",
  surface: "--zui-surface",
  ink: "--zui-ink",
  inkMuted: "--zui-ink-muted",
  edgeLine: "--zui-edge-line",
  edgeLabel: "--zui-edge-label",
  isoTopFill: "--zui-iso-top-fill",
  isoRightFill: "--zui-iso-right-fill",
  isoBottomFill: "--zui-iso-bottom-fill",
  isoLeftFill: "--zui-iso-left-fill",
  isoFrontFill: "--zui-iso-front-fill",
  isoEdgeStroke: "--zui-iso-edge-stroke",
  isoFaceStrokeTop: "--ic-iso-face-stroke-top",
  isoFaceStrokeFront: "--ic-iso-face-stroke-front",
  isoFaceStrokeSide: "--ic-iso-face-stroke-side",
  isoFaceStrokeBottom: "--ic-iso-face-stroke-bottom",
  isoFaceStrokeRecess: "--ic-iso-face-stroke-recess",
  isoLabelFill: "--zui-iso-label-fill",
  isoSelectedRightFill: "--zui-iso-selected-right-fill",
  isoSelectedBottomFill: "--zui-iso-selected-bottom-fill",
  isoSelectedLeftFill: "--zui-iso-selected-left-fill",
  isoShadowFill: "--zui-iso-shadow-fill",
  isoShadowOpacity: "--zui-iso-shadow-opacity",
  selectedBorder: "--zui-selected-border",
  onAccent: "--zui-on-accent",
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
  artboardSideFill: "--ic-artboard-side-fill",
} as const;

export function themeToCssCustomProperties(theme: IsoCanvasTheme): Record<string, string> {
  const { colors, radius } = theme;
  const appearance = isLightHex(colors.surface) ? "light" : "dark";
  const artboardTop = artboardSurfaceFillOnCanvas(colors.surface, appearance);
  const artboardSlab = isoSlabVisibleFacesFromTop(artboardTop, appearance);
  const gridLineInk = wireframeGridStrokeOnCanvas(colors.surface);
  return {
    [ZUI_THEME_CSS_VARS.accent]: colors.accent,
    [ZUI_THEME_CSS_VARS.accentDeep]: colors.accentDeep,
    [ZUI_THEME_CSS_VARS.accentDark]: colors.accentDark,
    [ZUI_THEME_CSS_VARS.surface]: colors.surface,
    [ZUI_THEME_CSS_VARS.ink]: colors.ink,
    [ZUI_THEME_CSS_VARS.inkMuted]: colors.inkMuted,
    [ZUI_THEME_CSS_VARS.edgeLine]: colors.edgeLine,
    [ZUI_THEME_CSS_VARS.edgeLabel]: colors.edgeLabel,
    [ZUI_THEME_CSS_VARS.isoTopFill]: colors.isoTopFill,
    [ZUI_THEME_CSS_VARS.isoRightFill]: colors.isoRightFill,
    [ZUI_THEME_CSS_VARS.isoBottomFill]: colors.isoBottomFill,
    [ZUI_THEME_CSS_VARS.isoLeftFill]: colors.isoLeftFill,
    [ZUI_THEME_CSS_VARS.isoFrontFill]: colors.isoFrontFill,
    [ZUI_THEME_CSS_VARS.isoEdgeStroke]: colors.isoEdgeStroke,
    [ZUI_THEME_CSS_VARS.isoFaceStrokeTop]: isoSolidFaceStrokeCssFromFill(colors.isoTopFill),
    [ZUI_THEME_CSS_VARS.isoFaceStrokeFront]: isoSolidFaceStrokeCssFromFill(colors.isoFrontFill),
    [ZUI_THEME_CSS_VARS.isoFaceStrokeSide]: isoSolidFaceStrokeCssFromFill(colors.isoRightFill),
    [ZUI_THEME_CSS_VARS.isoFaceStrokeBottom]: isoSolidFaceStrokeCssFromFill(colors.isoBottomFill),
    [ZUI_THEME_CSS_VARS.isoFaceStrokeRecess]: isoSolidFaceStrokeCssFromFill(colors.isoLeftFill),
    [ZUI_THEME_CSS_VARS.isoLabelFill]: colors.isoLabelFill,
    [ZUI_THEME_CSS_VARS.isoSelectedRightFill]: colors.isoSelectedRightFill,
    [ZUI_THEME_CSS_VARS.isoSelectedBottomFill]: colors.isoSelectedBottomFill,
    [ZUI_THEME_CSS_VARS.isoSelectedLeftFill]: colors.isoSelectedLeftFill,
    [ZUI_THEME_CSS_VARS.isoShadowFill]: colors.isoShadowFill,
    [ZUI_THEME_CSS_VARS.isoShadowOpacity]: String(colors.isoShadowOpacity),
    [ZUI_THEME_CSS_VARS.selectedBorder]: colors.selectedBorder,
    [ZUI_THEME_CSS_VARS.onAccent]: colors.onAccent,
    [ZUI_THEME_CSS_VARS.dotGridBorder]: colors.dotGridBorder,
    [ZUI_THEME_CSS_VARS.clusterRx]: `${radius.clusterRx}px`,
    [ZUI_THEME_CSS_VARS.isoFaceStrokeWidth]: `${radius.isoFaceStrokeWidth}px`,
    [ZUI_THEME_CSS_VARS.isoFrontStrokeWidth]: `${radius.isoFrontStrokeWidth}px`,
    [ZUI_THEME_CSS_VARS.selectedStrokeWidth]: `${radius.selectedStrokeWidth}px`,
    [ZUI_THEME_CSS_VARS.edgeLabelStrokeWidth]: `${radius.edgeLabelStrokeWidth}px`,
    [ZUI_THEME_CSS_VARS.wireframeStroke]: wireframeStrokeOnSurface(
      colors.surface,
      colors.isoEdgeStroke,
    ),
    [ZUI_THEME_CSS_VARS.wireframeGridStroke]: gridLineInk,
    [ZUI_THEME_CSS_VARS.wireframeIsoStroke]: wireframeIsoNodeStroke(
      colors.surface,
      colors.ink,
    ),
    [ZUI_THEME_CSS_VARS.wireframeFrontSurface]: wireframeFrontSurfaceOnCanvas(
      colors.surface,
      colors.isoFrontFill,
      colors.isoFrontFill,
    ),
    [ZUI_THEME_CSS_VARS.wireframeTopSurfaceFill]: wireframeTopFaceFillOnCanvas(
      colors.surface,
      colors.ink,
      colors.isoTopFill,
    ),
    [ZUI_THEME_CSS_VARS.wireframeFrontFaceFill]: wireframeFrontFaceFillOnCanvas(
      colors.surface,
      colors.ink,
      colors.isoFrontFill,
    ),
    [ZUI_THEME_CSS_VARS.wireframeSideFaceFill]: wireframeSideFaceFillOnCanvas(
      colors.surface,
      colors.ink,
      colors.isoRightFill,
    ),
    [ZUI_THEME_CSS_VARS.wireframeBackFaceStroke]: wireframeBackFaceStrokeOnCanvas(
      colors.surface,
      colors.ink,
      colors.isoLeftFill,
    ),
    [ZUI_THEME_CSS_VARS.wireframeLabelFill]: wireframeLabelFillOnCanvas(
      colors.surface,
      colors.ink,
      colors.isoTopFill,
    ),
    [ZUI_THEME_CSS_VARS.artboardSurfaceFill]: artboardTop,
    [ZUI_THEME_CSS_VARS.artboardFrontFill]: artboardSlab.front,
    [ZUI_THEME_CSS_VARS.artboardSideFill]: artboardSlab.side,
  };
}

export function applyThemeToElement(target: HTMLElement, theme: IsoCanvasTheme): void {
  const props = themeToCssCustomProperties(theme);
  for (const [name, value] of Object.entries(props)) {
    target.style.setProperty(name, value);
  }
}
