// Copyright (C) 2026 West Lane - All Rights Reserved

/** Diagram + iso face colors (applied as CSS custom properties on `.diagram-host`). */
export type IsoCanvasColors = {
  accent: string;
  accentDeep: string;
  accentDark: string;
  surface: string;
  /** Theme-tinted body ink on `surface` (not neutral black). */
  ink: string;
  /** Softer tinted gray derived from `ink`. */
  inkMuted: string;
  edgeLine: string;
  edgeLabel: string;
  isoTopFill: string;
  isoRightFill: string;
  isoBottomFill: string;
  isoLeftFill: string;
  isoFrontFill: string;
  /** Card/box outline — darker tint of `isoFrontFill`, not accent. */
  isoEdgeStroke: string;
  /** Node/box label — contrast-safe against `isoFrontFill`. */
  isoLabelFill: string;
  isoSelectedRightFill: string;
  isoSelectedBottomFill: string;
  isoSelectedLeftFill: string;
  isoShadowFill: string;
  isoShadowOpacity: number;
  selectedBorder: string;
  onAccent: string;
  dotGridBorder: string;
};

/** SVG / Mermaid corner and stroke radii (px). */
export type IsoCanvasRadius = {
  clusterRx: number;
  isoFaceStrokeWidth: number;
  isoFrontStrokeWidth: number;
  selectedStrokeWidth: number;
  edgeLabelStrokeWidth: number;
};

export type IsoCanvasTheme = {
  id: string;
  colors: IsoCanvasColors;
  radius: IsoCanvasRadius;
};

export type IsoCanvasThemePatch = {
  id?: string;
  colors?: Partial<IsoCanvasColors>;
  radius?: Partial<IsoCanvasRadius>;
};

