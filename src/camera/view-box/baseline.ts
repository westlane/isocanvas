// Copyright (C) 2026 West Lane - All Rights Reserved

import type { ViewBoxBaseline } from "../../types/camera.js";
import type { ViewBox } from "../../types/core.js";
import { readViewBoxFromSvg } from "./attributes.js";

function parseDatasetNumber(raw: string | undefined): number | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : undefined;
}

/** Persist 1× home framing on the SVG (matches {@link readViewBoxBaselineFromSvg}). */
export function writeViewBoxHomeMetadata(svg: SVGSVGElement, home: ViewBox): void {
  svg.dataset.debugBaseW = String(home.w);
  svg.dataset.debugBaseH = String(home.h);
  svg.dataset.debugHomeX = String(home.x);
  svg.dataset.debugHomeY = String(home.y);
}

/** Baseline size and home top-left from SVG mount metadata (or current viewBox). */
export function readViewBoxBaselineFromSvg(svg: SVGSVGElement): ViewBoxBaseline {
  const vb = readViewBoxFromSvg(svg);
  const fromW = parseDatasetNumber(svg.dataset.debugBaseW);
  const fromH = parseDatasetNumber(svg.dataset.debugBaseH);
  const homeX = parseDatasetNumber(svg.dataset.debugHomeX);
  const homeY = parseDatasetNumber(svg.dataset.debugHomeY);
  const baseW = fromW !== undefined && fromW > 0 ? fromW : vb.w;
  const baseH = fromH !== undefined && fromH > 0 ? fromH : vb.h;
  if (homeX !== undefined && homeY !== undefined) {
    return { baseW, baseH, homeX, homeY };
  }
  return { baseW, baseH, homeX: vb.x, homeY: vb.y };
}

/** Camera viewBox at 1× zoom and the recorded home origin (iso footprints often use negative plane y). */
export function viewBoxBaselineHome(baseline: ViewBoxBaseline): ViewBox {
  return {
    x: baseline.homeX ?? 0,
    y: baseline.homeY ?? 0,
    w: baseline.baseW,
    h: baseline.baseH,
  };
}

/** Pan offset from home; zero when the camera matches {@link viewBoxBaselineHome}. */
export function viewBoxOffsetFromHome(
  camera: ViewBox,
  baseline: ViewBoxBaseline,
): { x: number; y: number } {
  return {
    x: camera.x - (baseline.homeX ?? 0),
    y: camera.y - (baseline.homeY ?? 0),
  };
}
