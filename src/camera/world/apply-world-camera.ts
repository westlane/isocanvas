// Copyright (C) 2026 West Lane - All Rights Reserved

import type { ViewBox } from "../../types/core.js";
import { resolveWorldCameraViewportLayers } from "../../viewport/world-camera-layers.js";
import { clearDotGridWorldCamera, syncDotGridWithWorldCamera } from "../../grid/sync-camera.js";
import { removeSvgDotGrid } from "../../grid/svg.js";
import { IC_ARTBOARD_CLASS } from "../../layout/artboard.js";
import { writeViewBoxToSvg, setViewportCenteredMeet } from "../view-box/attributes.js";
import { worldCameraViewportFromRects } from "./world-viewport.js";
import type { WorldCameraLayerOptions } from "../../types/camera.js";

export const IC_WORLD_CAMERA_ATTR = "data-ic-world-camera";

export function writeWorldCameraOnHost(host: HTMLElement, camera: ViewBox): void {
  host.setAttribute(
    IC_WORLD_CAMERA_ATTR,
    [camera.x, camera.y, camera.w, camera.h].map((value) => String(value)).join(" "),
  );
}

export function readWorldCameraFromHost(host: HTMLElement): ViewBox | null {
  return parseWorldCameraAttribute(host.getAttribute(IC_WORLD_CAMERA_ATTR));
}

export function parseWorldCameraAttribute(raw: string | null): ViewBox | null {
  const parts = raw?.trim().split(/\s+/).map(Number) ?? [];
  if (parts.length !== 4 || !parts.every((value) => Number.isFinite(value))) {
    return null;
  }
  const camera = { x: parts[0]!, y: parts[1]!, w: parts[2]!, h: parts[3]! };
  if (camera.w <= 0 || camera.h <= 0) {
    return null;
  }
  return camera;
}

/** Apply canvas viewBox + SVG/CSS dot grids; keeps diagram plane aligned in user space. */
export function applyWorldCameraToHost(
  host: HTMLElement,
  camera: ViewBox,
  options: WorldCameraLayerOptions = {},
): boolean {
  const layers = resolveWorldCameraViewportLayers(host, options);
  if (!layers) {
    return false;
  }
  const { anchor, grid, contentLayer, svg } = layers;
  const anchorRect = anchor.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();
  if (anchorRect.width <= 0 || anchorRect.height <= 0 || svgRect.width <= 0 || svgRect.height <= 0) {
    return false;
  }

  const embeddedArtboard = host.closest(`.${IC_ARTBOARD_CLASS}`) != null;
  const artboardRoot = host.closest(`.${IC_ARTBOARD_CLASS}`);
  const frameOnlyArtboard =
    artboardRoot instanceof HTMLElement && artboardRoot.dataset.icFrameOnly === "true";
  if (frameOnlyArtboard) {
    setViewportCenteredMeet(svg);
  }

  writeViewBoxToSvg(svg, camera);
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.display = "block";
  svg.style.maxWidth = embeddedArtboard ? "none" : "100%";
  svg.style.maxHeight = embeddedArtboard ? "none" : "100%";

  contentLayer.style.transformOrigin = "";
  contentLayer.style.transform = "";

  if (grid) {
    syncDotGridWithWorldCamera({
      anchor,
      grid,
      svg,
      camera,
      contentAlign: embeddedArtboard ? "min" : "mid",
    });
  } else {
    removeSvgDotGrid(svg);
  }

  writeWorldCameraOnHost(host, camera);
  return true;
}

export function clearWorldCameraOnHost(
  host: HTMLElement,
  options: WorldCameraLayerOptions = {},
): void {
  const layers = resolveWorldCameraViewportLayers(host, options);
  if (!layers) {
    host.removeAttribute(IC_WORLD_CAMERA_ATTR);
    return;
  }
  const { grid, contentLayer, svg } = layers;
  contentLayer.style.transform = "";
  if (grid) {
    clearDotGridWorldCamera(grid, svg);
  } else {
    removeSvgDotGrid(svg);
  }
  host.removeAttribute(IC_WORLD_CAMERA_ATTR);
}

export function readWorldCameraViewport(
  host: HTMLElement,
  options: WorldCameraLayerOptions = {},
): {
  anchorRect: DOMRect;
  viewport: ReturnType<typeof worldCameraViewportFromRects>;
} | null {
  const layers = resolveWorldCameraViewportLayers(host, options);
  if (!layers) {
    return null;
  }
  const anchorRect = layers.anchor.getBoundingClientRect();
  const svgRect = layers.svg.getBoundingClientRect();
  if (anchorRect.width <= 0 || anchorRect.height <= 0 || svgRect.width <= 0 || svgRect.height <= 0) {
    return null;
  }
  return {
    anchorRect,
    viewport: worldCameraViewportFromRects(anchorRect, svgRect),
  };
}
