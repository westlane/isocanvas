// Copyright (C) 2026 West Lane - All Rights Reserved

import { applyWorldCameraToHost } from "../camera/world/apply-world-camera.js";
import { attachWorldCameraPanZoom } from "../camera/world-pan-zoom.js";
import {
  centeredArtboardHomeView,
  viewBoxCenterArtboardInCamera,
  type ViewBoxCenterArtboardOptions,
} from "../camera/fit/center-artboard-view.js";
import { readViewBoxBaselineFromSvg } from "../camera/view-box/baseline.js";
import type { WorldCameraPanZoomDetach } from "../camera/world-pan-zoom.js";
import {
  applyArtboardUserSize,
  createArtboard,
  DEFAULT_ARTBOARD_USER_SIZE,
  type ArtboardElements,
  type CreateArtboardOptions,
} from "../layout/artboard.js";
import { createDefaultThemeManager, type ThemeManager } from "../theme/manager.js";
import type { DiagramScene } from "../types/diagram.js";
import type { ArtboardUserSize } from "../types/artboard.js";

export { DEFAULT_DIAGRAM_ARTBOARD_SHELL_CHROME } from "../isometric/stage/stage-shell.js";

/** Frame-only artboard; iso ground + dots live in the cube SVG (not the DOM dot plane). */
export function createDiagramArtboard(
  options: CreateArtboardOptions = {},
): ArtboardElements {
  return createArtboard({
    embedDotGrid: false,
    ...options,
  });
}

/** Apply {@link DEFAULT_ISO_CANVAS_THEME} tokens on `target` (required for visible ground dots). */
export function applyDefaultDiagramTheme(
  target: HTMLElement = document.documentElement,
): ThemeManager {
  const manager = createDefaultThemeManager(target);
  manager.apply();
  target.dataset.icTheme = manager.getTheme().id;
  return manager;
}

export function artboardUserSizeFromDiagramScene(scene: DiagramScene): ArtboardUserSize {
  const viewBox = scene.viewBox;
  if (viewBox && viewBox.w > 0 && viewBox.h > 0) {
    return { width: viewBox.w, height: viewBox.h };
  }
  return DEFAULT_ARTBOARD_USER_SIZE;
}

export function syncDiagramArtboardToScene(
  artboardRoot: HTMLElement,
  scene: DiagramScene,
): void {
  applyArtboardUserSize(artboardRoot, artboardUserSizeFromDiagramScene(scene));
}

export function frameDiagramSceneCamera(
  host: HTMLElement,
  options: ViewBoxCenterArtboardOptions = { contentPaddingRatio: 0.1 },
): void {
  const svg = host.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) {
    return;
  }
  const baseline = readViewBoxBaselineFromSvg(svg);
  const viewBox =
    viewBoxCenterArtboardInCamera(host, baseline, options) ??
    centeredArtboardHomeView(host, baseline);
  if (viewBox) {
    applyWorldCameraToHost(host, viewBox);
  }
}

export function attachDiagramViewportPanZoom(options: {
  surface: HTMLElement;
  host: HTMLElement;
}): WorldCameraPanZoomDetach {
  return attachWorldCameraPanZoom(options);
}
