// Copyright (C) 2026 West Lane - All Rights Reserved

import type { ViewBox } from "../../types/core.js";
import type { ViewBoxBaseline } from "../../types/camera.js";

export type ViewBoxFitContentOptions = {
  paddingRatio?: number;
  minWidthRatio?: number;
};

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
  const minWidthRatio = options.minWidthRatio ?? 1;
  const aspect = baseline.baseW / baseline.baseH;
  if (bbox.width <= 0 || bbox.height <= 0) {
    return { x: 0, y: 0, w: baseline.baseW, h: baseline.baseH };
  }

  const pad = Math.max(bbox.width, bbox.height) * paddingRatio;
  let w = bbox.width + pad * 2;
  let h = bbox.height + pad * 2;
  if (w / h > aspect) {
    h = w / aspect;
  } else {
    w = h * aspect;
  }

  const minW = baseline.baseW * minWidthRatio;
  if (w < minW) {
    w = minW;
    h = w / aspect;
  }
  if (w > baseline.baseW) {
    w = baseline.baseW;
    h = baseline.baseH;
  }

  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;
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
