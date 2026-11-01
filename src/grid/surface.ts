// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { DotGridCssVars, DotGridMetrics, CreateDotGridSurfaceOptions } from "../types/grid.js";

export type DotGridMetricsOptions = {
  gridElement: HTMLElement;
  styleSource?: HTMLElement;
  originElement?: HTMLElement;
  cssVars?: DotGridCssVars;
  sizeFallback?: number;
};

export const IC_DOT_GRID_CLASS = "ic-dot-grid";

export const IC_DOT_GRID_SURFACE_CLASS = "ic-dot-grid-surface";

export const IC_DOT_GRID_MACRO_CLASS = "ic-dot-grid-macro";

export const IC_DOT_GRID_MACRO_CELL_CLASS = "ic-dot-grid-macro-cell";

export const IC_DOT_GRID_PLANE_CLASS = "ic-dot-grid-plane";

export const IC_DOT_GRID_CSS_VARS: DotGridCssVars = {
  sizeVar: "--ic-dot-grid-size",
  phaseVar: "--ic-dot-grid-phase",
};

export const DEFAULT_DOT_GRID_SIZE_PX = 18;

export const IC_DOT_GRID_MARK_VAR = "--ic-dot-grid-mark";

export const DEFAULT_DOT_GRID_MARK_PX = 2;

export function defaultDotGridPhase(size: number): number {
  return size / 2;
}

export function readLengthPx(element: HTMLElement, variable: string, fallback: number): number {
  const raw = getComputedStyle(element).getPropertyValue(variable).trim();
  const px = Number.parseFloat(raw);
  return Number.isFinite(px) ? px : fallback;
}

function resolveDotGridOriginElement(
  gridElement: HTMLElement,
  originElement?: HTMLElement,
): HTMLElement {
  if (originElement) {
    return originElement;
  }
  const surface = gridElement.parentElement?.parentElement;
  if (surface?.classList.contains(IC_DOT_GRID_SURFACE_CLASS)) {
    return surface;
  }
  return gridElement;
}

export function dotGridMetricsFromElement(options: DotGridMetricsOptions): DotGridMetrics | null {
  const {
    gridElement,
    styleSource = gridElement,
    originElement,
    cssVars = IC_DOT_GRID_CSS_VARS,
    sizeFallback = DEFAULT_DOT_GRID_SIZE_PX,
  } = options;

  const size = readLengthPx(styleSource, cssVars.sizeVar, sizeFallback);
  if (size <= 0) {
    return null;
  }

  const phase = readLengthPx(
    styleSource,
    cssVars.phaseVar,
    defaultDotGridPhase(size),
  );
  const origin = resolveDotGridOriginElement(gridElement, originElement);
  const { left, top } = origin.getBoundingClientRect();

  return {
    originLeft: left,
    originTop: top,
    size,
    phase,
  };
}

export function createDotGridMacroLattice(span = 3): HTMLDivElement {
  const root = document.createElement("div");
  root.className = IC_DOT_GRID_MACRO_CLASS;
  root.setAttribute("aria-hidden", "true");
  root.style.setProperty("--ic-dot-grid-macro-span", String(span));
  const count = span * span;
  for (let index = 0; index < count; index += 1) {
    const cell = document.createElement("div");
    cell.className = IC_DOT_GRID_MACRO_CELL_CLASS;
    cell.dataset.macroIndex = String(index);
    root.appendChild(cell);
  }
  return root;
}

/** Surface wrapper (clips) + plane (macro + dots) — import `@westlane/isocanvas/dot-grid.css`. */
export function createDotGridSurface(options?: CreateDotGridSurfaceOptions): {
  surface: HTMLDivElement;
  grid: HTMLDivElement;
} {
  const surface = document.createElement("div");
  surface.className = IC_DOT_GRID_SURFACE_CLASS;

  const grid = document.createElement("div");
  grid.className = IC_DOT_GRID_CLASS;
  grid.setAttribute("aria-hidden", "true");

  if (options?.sizePx !== undefined) {
    surface.style.setProperty(IC_DOT_GRID_CSS_VARS.sizeVar, `${options.sizePx}px`);
  }
  if (options?.phasePx !== undefined) {
    surface.style.setProperty(IC_DOT_GRID_CSS_VARS.phaseVar, `${options.phasePx}px`);
  }

  const plane = document.createElement("div");
  plane.className = IC_DOT_GRID_PLANE_CLASS;
  plane.setAttribute("aria-hidden", "true");

  const macroSpan = options?.macroSpan;
  if (macroSpan !== undefined && macroSpan >= 2) {
    plane.appendChild(createDotGridMacroLattice(macroSpan));
  }
  plane.appendChild(grid);
  surface.appendChild(plane);
  return { surface, grid };
}
