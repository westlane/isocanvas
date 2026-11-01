// Copyright (C) 2026 West Lane - All Rights Reserved

import type { IsoCanvasColors, IsoCanvasRadius, IsoCanvasTheme } from "../types/theme.js";
import {
  darkerSurfaceBorderStroke,
  isoFaceFillsFromSchemeAccent,
  isoCubeLabelFillOnFace,
  readableTextOnSurface,
  themeInkShades,
} from "./color-math.js";

export const DEFAULT_ISO_CANVAS_RADIUS: IsoCanvasRadius = {
  clusterRx: 0,
  isoFaceStrokeWidth: 1,
  isoFrontStrokeWidth: 0,
  selectedStrokeWidth: 0,
  edgeLabelStrokeWidth: 0,
};

const DEFAULT_ACCENT = "#9333ea";
const DEFAULT_SURFACE = "#faf5ff";
const DEFAULT_INK_IDENTITY = "#581c87";
const defaultFaces = isoFaceFillsFromSchemeAccent(DEFAULT_ACCENT, "light");
const { ink: defaultInk, inkMuted: defaultInkMuted } = themeInkShades(
  DEFAULT_SURFACE,
  DEFAULT_INK_IDENTITY,
);

export const DEFAULT_ISO_CANVAS_COLORS: IsoCanvasColors = {
  accent: DEFAULT_ACCENT,
  accentDeep: "#581c87",
  accentDark: "#3b0764",
  surface: DEFAULT_SURFACE,
  ink: defaultInk,
  inkMuted: defaultInkMuted,
  edgeLine: "#c084fc",
  edgeLabel: "#a855f7",
  isoTopFill: defaultFaces.top,
  isoRightFill: defaultFaces.side,
  isoBottomFill: defaultFaces.bottom,
  isoLeftFill: defaultFaces.left,
  isoFrontFill: defaultFaces.front,
  isoEdgeStroke: darkerSurfaceBorderStroke(defaultFaces.front, "light"),
  isoLabelFill: isoCubeLabelFillOnFace(defaultFaces.top),
  isoSelectedRightFill: "#4c1d95",
  isoSelectedBottomFill: "#5b21b6",
  isoSelectedLeftFill: "#3b0764",
  isoShadowFill: "rgba(203, 213, 225, 0.55)",
  isoShadowOpacity: 0.42,
  selectedBorder: "#ffffff",
  onAccent: readableTextOnSurface("#3b0764", "#ffffff"),
  dotGridBorder: "#e2e8f0",
};

export const DEFAULT_ISO_CANVAS_THEME: IsoCanvasTheme = {
  id: "default-purple",
  colors: DEFAULT_ISO_CANVAS_COLORS,
  radius: DEFAULT_ISO_CANVAS_RADIUS,
};
