// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ViewBox } from "./core.js";

/** SVG framing for one diagram surface (watch: panel viewBox). */
export interface CanvasCamera {
  viewBox: ViewBox;
}

export interface ViewportCameras {
  canvas: CanvasCamera;
}

export type ViewBoxBaseline = {
  baseW: number;
  baseH: number;
  /** viewBox `x`/`y` at 1× home (defaults to 0 when omitted). */
  homeX?: number;
  homeY?: number;
};

export type WorldCameraLayerOptions = {
  /** Used when `.ic-dot-grid-surface` is missing (e.g. tests). */
  fallbackAnchor?: HTMLElement | null;
};

export type WorldViewBoxAlign = "mid" | "min";
