// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IC_DOT_GRID_CLASS, IC_DOT_GRID_SURFACE_CLASS } from "../grid/surface.js";
import { IC_ARTBOARD_CLASS, IC_ARTBOARD_CONTENT_CLASS } from "../layout/artboard.js";
import type { WorldCameraLayerOptions } from "../types/camera.js";

export type WorldCameraViewportLayers = {
  anchor: HTMLElement;
  /** Null when the artboard omits an embedded dot grid (iso ground lives in the diagram SVG). */
  grid: HTMLElement | null;
  contentLayer: HTMLElement;
  svg: SVGSVGElement;
};

export function resolveWorldCameraViewportLayers(
  host: HTMLElement,
  options: WorldCameraLayerOptions = {},
): WorldCameraViewportLayers | null {
  const svg = host.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) {
    return null;
  }

  const artboard = host.closest(`.${IC_ARTBOARD_CLASS}`);
  const artboardGrid = artboard?.querySelector(`.${IC_DOT_GRID_CLASS}`);
  const artboardSurface = artboardGrid?.closest(`.${IC_DOT_GRID_SURFACE_CLASS}`);
  const artboardContent = artboard?.querySelector(`.${IC_ARTBOARD_CONTENT_CLASS}`);

  const hostSurface = host.closest(`.${IC_DOT_GRID_SURFACE_CLASS}`);
  const surfaceGrid = hostSurface?.querySelector(`.${IC_DOT_GRID_CLASS}`) ?? null;

  const grid =
    (artboardGrid instanceof HTMLElement ? artboardGrid : null) ??
    (surfaceGrid instanceof HTMLElement ? surfaceGrid : null);
  const gridSurface =
    (artboardSurface instanceof HTMLElement ? artboardSurface : null) ??
    (hostSurface instanceof HTMLElement && grid != null && hostSurface.contains(grid)
      ? hostSurface
      : null);

  const contentLayer =
    (artboardContent instanceof HTMLElement ? artboardContent : null) ?? host;

  const anchor =
    gridSurface ??
    (artboard instanceof HTMLElement ? artboard : null) ??
    options.fallbackAnchor ??
    null;
  if (!(anchor instanceof HTMLElement)) {
    return null;
  }
  const gridlessHost = !(grid instanceof HTMLElement);
  const artboardFrameOnly = artboard instanceof HTMLElement && gridlessHost;
  if (gridlessHost && !artboardFrameOnly && !(options.fallbackAnchor instanceof HTMLElement)) {
    return null;
  }
  return {
    anchor,
    grid: grid instanceof HTMLElement ? grid : null,
    contentLayer,
    svg,
  };
}
