// Copyright (C) 2026 West Lane - All Rights Reserved

import {
  applyArtboardHomeCamera,
  type ViewBoxCenterArtboardOptions,
  DEFAULT_VIEWBOX_CENTER_ARTBOARD_OPTIONS,
} from "../camera/fit/center-artboard-view.js";
import type { DiagramNodeSelectionDetach } from "../camera/node-selection.js";
import { attachDiagramNodeSelection } from "../camera/node-selection.js";
import { saveDiagramViewportToStorage } from "../camera/diagram-viewport-persistence.js";
import type { WorldCameraPanZoomDetach } from "../camera/world-pan-zoom.js";
import { attachWorldCameraPanZoom } from "../camera/world-pan-zoom.js";
import {
  applyArtboardUserSize,
  createArtboard,
  DEFAULT_ARTBOARD_USER_SIZE,
  type ArtboardElements,
  type CreateArtboardOptions,
} from "../layout/artboard.js";
import { createDefaultThemeManager, type ThemeManager } from "../theme/manager.js";
import { applyGridLinesMode } from "../theme/grid-lines-mode.js";
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

/** Turn on layout guides for a diagram artboard (matches {@link applyDefaultDiagramTheme}). */
export function enableDiagramArtboardGridLines(artboardRoot: HTMLElement): void {
  applyGridLinesMode(artboardRoot, true);
}

/** Apply {@link DEFAULT_ISO_CANVAS_THEME} tokens on `target` (required for visible ground dots). */
export function applyDefaultDiagramTheme(
  target: HTMLElement = document.documentElement,
): ThemeManager {
  const manager = createDefaultThemeManager(target);
  manager.apply();
  target.dataset.icTheme = manager.getTheme().id;
  applyGridLinesMode(target, true);
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
  options: ViewBoxCenterArtboardOptions = DEFAULT_VIEWBOX_CENTER_ARTBOARD_OPTIONS,
): void {
  applyArtboardHomeCamera(host, options);
}

export function attachDiagramViewportPanZoom(options: {
  surface: HTMLElement;
  host: HTMLElement;
  /** When set, pan/zoom viewBox is persisted to `localStorage` under this key. */
  persistViewportStorageKey?: string;
}): WorldCameraPanZoomDetach {
  const { persistViewportStorageKey, ...panZoomOptions } = options;
  if (!persistViewportStorageKey) {
    return attachWorldCameraPanZoom(panZoomOptions);
  }
  return attachWorldCameraPanZoom({
    ...panZoomOptions,
    onViewBoxApplied: (viewBox, context) => {
      if (context.notify) {
        saveDiagramViewportToStorage(persistViewportStorageKey, viewBox);
      }
    },
  });
}

export {
  clearDiagramViewportStorage,
  loadDiagramViewportFromStorage,
  parseDiagramViewportStorageSnapshot,
  restoreDiagramViewportFromStorage,
  saveDiagramViewportToStorage,
  serializeDiagramViewportStorageSnapshot,
} from "../camera/diagram-viewport-persistence.js";

export function attachDiagramViewportNodeSelection(options: {
  surface: HTMLElement;
  host: HTMLElement;
  onSelectionChange?: (selectedIds: readonly string[]) => void;
}): DiagramNodeSelectionDetach {
  return attachDiagramNodeSelection(options);
}

export {
  applyDiagramNodeSelection,
  clearDiagramNodeSelection,
  IC_NODE_SELECTED_CLASS,
} from "../camera/node-selection.js";
