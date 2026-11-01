// Copyright (C) 2026 West Lane - All Rights Reserved

import type { CanvasCamera, ViewportCameras } from "../types/camera.js";
import type { ViewBox } from "../types/core.js";
import {
  readViewBoxFromSvg,
  viewBoxCenter,
  viewBoxFromZoomCenter,
  zoomFromViewBox,
} from "./view-box/attributes.js";

export function canvasCameraFromSvg(
  svg: SVGSVGElement,
  baseline?: ViewBox,
): { camera: CanvasCamera; baseline: ViewBox } {
  const viewBox = readViewBoxFromSvg(svg);
  const resolvedBaseline = baseline ?? viewBox;
  return {
    camera: { viewBox: { ...viewBox } },
    baseline: { ...resolvedBaseline },
  };
}

export function viewportCamerasFromParts(options: {
  zoom: number;
  cx: number;
  cy: number;
  baselineWidth: number;
  baselineHeight: number;
}): ViewportCameras {
  return {
    canvas: {
      viewBox: viewBoxFromZoomCenter(
        options.zoom,
        options.cx,
        options.cy,
        options.baselineWidth,
        options.baselineHeight,
      ),
    },
  };
}

export function urlFrameFromViewportCameras(
  cameras: ViewportCameras,
  baselineWidth: number,
): { zoom: number; cx: number; cy: number } {
  const { cx, cy } = viewBoxCenter(cameras.canvas.viewBox);
  return {
    zoom: zoomFromViewBox(cameras.canvas.viewBox, baselineWidth),
    cx,
    cy,
  };
}
