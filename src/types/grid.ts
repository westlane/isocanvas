// Copyright (C) 2026 West Lane - All Rights Reserved

export type DotGridProjection = "orthogonal" | "isometric";

export type CreateDotGridSurfaceOptions = {
  sizePx?: number;
  phasePx?: number;
  /** Overlay a span×span tinted lattice (e.g. 3) to verify isometric plane alignment. */
  macroSpan?: number;
};

/** 2D drag translation (screen-space px). */
export type DragOffset = {
  x: number;
  y: number;
};

/** Dot grid origin and spacing for snap math (screen-space px). */
export type DotGridMetrics = {
  originLeft: number;
  originTop: number;
  size: number;
  phase: number;
};

export type DotGridCssVars = {
  sizeVar: string;
  phaseVar: string;
};

/** One axis of a phased dot / line grid (screen px or SVG user units). */
export type GridAxisPolicy = {
  origin: number;
  phase: number;
  size: number;
  /** Skip snap when farther than this from the nearest grid point (0 = always snap). */
  magnetPx?: number;
  /** Divisor for cell size (2 = half-grid snap). */
  subdivision?: number;
};

/** Screen-space alignment guide (Figma-style smart guides). */
export type AlignmentGuide = {
  axis: "x" | "y";
  value: number;
  kind: "min" | "mid" | "max";
  targetIndex: number;
};

export type SnapDragOffsetOptions = {
  shellRect: DOMRectReadOnly;
  current: DragOffset;
  next: DragOffset;
  grid: DotGridMetrics | null;
  styleSource: HTMLElement;
  cssVars?: DotGridCssVars;
  sizeFallback?: number;
  axis?: Partial<GridAxisPolicy>;
};
