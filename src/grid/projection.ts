// Copyright (C) 2026 West Lane - All Rights Reserved

import type { DotGridProjection } from "../types/grid.js";

export const IC_DOT_GRID_PROJECTION_VAR = "--ic-dot-grid-projection";

/** `plane` = macro fills overscanned plane (infinite canvas). `world` = span×span patch locked to user grid (debug). */
export const IC_DOT_GRID_MACRO_ALIGN_VAR = "--ic-dot-grid-macro-align";

export type DotGridMacroAlign = "plane" | "world";

export function readDotGridMacroAlign(element: HTMLElement): DotGridMacroAlign {
  const raw = getComputedStyle(element).getPropertyValue(IC_DOT_GRID_MACRO_ALIGN_VAR).trim();
  return raw === "world" ? "world" : "plane";
}

/** Matches cube-canvas ground-plane map (see library `k()` at scale 1). */
export const ISO_GRID_AXIS_X = Math.sqrt(3) / 2;
export const ISO_GRID_AXIS_Y = 0.5;

export function readDotGridProjection(element: HTMLElement): DotGridProjection {
  const raw = getComputedStyle(element).getPropertyValue(IC_DOT_GRID_PROJECTION_VAR).trim();
  return raw === "isometric" ? "isometric" : "orthogonal";
}

export function isometricDotGridPlaneMatrix(): string {
  const sx = ISO_GRID_AXIS_X;
  const sy = ISO_GRID_AXIS_Y;
  return `matrix(${sx}, ${sy}, ${-sx}, ${sy}, 0, 0)`;
}

export function composeDotGridLayerTransform(
  projection: DotGridProjection,
  uniformScale: number,
): string {
  const parts: string[] = [];
  if (projection === "isometric") {
    parts.push(isometricDotGridPlaneMatrix());
  }
  if (uniformScale > 0 && Math.abs(uniformScale - 1) > 0.0001) {
    parts.push(`scale(${uniformScale})`);
  }
  return parts.join(" ");
}
