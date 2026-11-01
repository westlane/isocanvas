// Copyright (C) 2026 West Lane - All Rights Reserved

import type { ViewBox } from "../../types/core.js";
import type { ViewBoxBaseline } from "../../types/camera.js";

export type ViewBoxFitContentOptions = {
  paddingRatio?: number;
  /** Uniform inset on every side of the fitted content (camera user units). */
  paddingPx?: number;
  minWidthRatio?: number;
  /** When set, viewBox is centered here instead of the bbox geometric center. */
  contentCenter?: { x: number; y: number };
  /** Use content bounds aspect instead of baseline artboard aspect (avoids square letterboxing on iso). */
  matchContentAspect?: boolean;
};

function fitAspectRatio(
  bbox: { width: number; height: number },
  baseline: ViewBoxBaseline,
  options: ViewBoxFitContentOptions,
): number {
  if (
    options.matchContentAspect &&
    bbox.width > 0 &&
    bbox.height > 0
  ) {
    return bbox.width / bbox.height;
  }
  return baseline.baseW / baseline.baseH;
}

function applyMinWidthFloor(
  w: number,
  h: number,
  aspect: number,
  baseline: ViewBoxBaseline,
  minWidthRatio: number | undefined,
): { w: number; h: number } {
  const ratio = minWidthRatio ?? 0;
  if (ratio <= 0) {
    return { w, h };
  }
  const minW = baseline.baseW * ratio;
  if (w >= minW) {
    return { w, h };
  }
  return { w: minW, h: minW / aspect };
}

function resolveFitPaddingPx(
  halfExtent: number,
  options: ViewBoxFitContentOptions,
): number {
  if (options.paddingPx !== undefined && options.paddingPx >= 0) {
    return options.paddingPx;
  }
  const paddingRatio = options.paddingRatio ?? 0.42;
  return halfExtent * paddingRatio;
}

/** ViewBox centered on `center` with even user-space margin to the farthest point. */
export function viewBoxFitPointsAroundCenter(
  points: readonly { x: number; y: number }[],
  center: { x: number; y: number },
  baseline: ViewBoxBaseline,
  options: ViewBoxFitContentOptions = {},
): ViewBox {
  if (points.length === 0) {
    return { x: 0, y: 0, w: baseline.baseW, h: baseline.baseH };
  }

  let maxDx = 0;
  let maxDy = 0;
  for (const p of points) {
    maxDx = Math.max(maxDx, Math.abs(p.x - center.x));
    maxDy = Math.max(maxDy, Math.abs(p.y - center.y));
  }

  const halfExtent = Math.max(maxDx, maxDy, 1);
  const pad = resolveFitPaddingPx(halfExtent, options);
  let halfW = maxDx + pad;
  let halfH = maxDy + pad;
  let w = halfW * 2;
  let h = halfH * 2;
  const contentAspect = Math.max(maxDx * 2, 1) / Math.max(maxDy * 2, 1);
  const aspectForFit = options.matchContentAspect ? contentAspect : baseline.baseW / baseline.baseH;
  if (w / h > aspectForFit) {
    h = w / aspectForFit;
  } else {
    w = h * aspectForFit;
  }

  ({ w, h } = applyMinWidthFloor(w, h, aspectForFit, baseline, options.minWidthRatio));

  return { x: center.x - w / 2, y: center.y - h / 2, w, h };
}

function svgDiagramBBox(svg: SVGSVGElement): DOMRect {
  const root = svg.querySelector(":scope > g");
  if (root instanceof SVGGraphicsElement) {
    try {
      const box = root.getBBox();
      if (box.width > 0 && box.height > 0) {
        return box;
      }
    } catch {
      /* fall through */
    }
  }
  return svg.getBBox();
}

function viewBoxFitUserRect(
  bbox: { x: number; y: number; width: number; height: number },
  baseline: ViewBoxBaseline,
  options: ViewBoxFitContentOptions = {},
): ViewBox {
  const paddingRatio = options.paddingRatio ?? 0.42;
  const aspect = fitAspectRatio(bbox, baseline, options);
  if (bbox.width <= 0 || bbox.height <= 0) {
    return { x: 0, y: 0, w: baseline.baseW, h: baseline.baseH };
  }

  const pad =
    options.paddingPx !== undefined && options.paddingPx >= 0
      ? options.paddingPx
      : Math.max(bbox.width, bbox.height) * paddingRatio;
  let w = bbox.width + pad * 2;
  let h = bbox.height + pad * 2;
  if (w / h > aspect) {
    h = w / aspect;
  } else {
    w = h * aspect;
  }

  ({ w, h } = applyMinWidthFloor(w, h, aspect, baseline, options.minWidthRatio));

  const cx = options.contentCenter?.x ?? bbox.x + bbox.width / 2;
  const cy = options.contentCenter?.y ?? bbox.y + bbox.height / 2;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/** Frame viewBox around the artboard user box (centers logical artboard in the camera). */
export function viewBoxFitArtboardUserBox(
  box: { x: number; y: number; width: number; height: number },
  baseline: ViewBoxBaseline,
  options: ViewBoxFitContentOptions = {},
): ViewBox {
  return viewBoxFitUserRect(box, baseline, options);
}

/** Frame viewBox around diagram content with aspect ratio from baseline artboard. */
export function viewBoxFitSvgContent(
  svg: SVGSVGElement,
  baseline: ViewBoxBaseline,
  options: ViewBoxFitContentOptions = {},
): ViewBox {
  let bbox: DOMRect;
  try {
    bbox = svgDiagramBBox(svg);
  } catch {
    return { x: 0, y: 0, w: baseline.baseW, h: baseline.baseH };
  }
  if (bbox.width <= 0 || bbox.height <= 0) {
    return { x: 0, y: 0, w: baseline.baseW, h: baseline.baseH };
  }
  return viewBoxFitUserRect(bbox, baseline, options);
}
