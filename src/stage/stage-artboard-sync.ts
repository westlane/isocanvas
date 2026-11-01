// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { syncDiagramArtboardToScene } from "../diagram/diagram-document.js";
import { applyArtboardUserSize } from "../layout/artboard.js";
import { renderDiagramScene } from "../diagram/render-scene.js";
import type { CreateArtboardOptions } from "../layout/artboard.js";
import type { DiagramScene } from "../types/diagram.js";
import type { IsoCanvasColors } from "../types/theme.js";
import type {
  IsoCanvasArtboardId,
  IsoCanvasStage,
  IsoCanvasStageAddArtboardOptions,
} from "../types/stage.js";
import {
  normalizeRowArtboardUserHeights,
  normalizeRowArtboardUserSizes,
  isStageRowContinuous,
  IC_ARTBOARD_LABEL_ATTR,
  IC_ROW_COLUMN_ATTR,
  IC_ROW_COLUMN_INDEX_VAR,
  IC_PLANE_ROW_HOST_ATTR,
} from "./stage-row-layout.js";
import {
  mergeDiagramScenesAlongPlaneRow,
  planeRowStripUserSize,
} from "./stage-plane-row-scene.js";
import type { ArtboardUserSize } from "../types/artboard.js";

export type IsoCanvasStageArtboardSpec = {
  id: IsoCanvasArtboardId;
  label?: string;
  scene?: DiagramScene;
} & Partial<CreateArtboardOptions>;

export type SyncIsoCanvasStageArtboardRegistryOptions = {
  /** Defaults merged into each newly added artboard. */
  createDefaults?: CreateArtboardOptions;
};

function readStageRowGapPx(stage: IsoCanvasStage): number {
  const raw = stage.container.style.getPropertyValue("--ic-stage-row-gap").trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 6;
}

/** Add, remove, and relabel artboards to match `specs` (order preserved). */
export function syncIsoCanvasStageArtboardRegistry(
  stage: IsoCanvasStage,
  specs: readonly IsoCanvasStageArtboardSpec[],
  options: SyncIsoCanvasStageArtboardRegistryOptions = {},
): void {
  const nextIds = new Set(specs.map((spec) => spec.id));
  for (const id of stage.artboardIds()) {
    if (!nextIds.has(id)) {
      stage.removeArtboard(id);
    }
  }
  const defaults = options.createDefaults ?? {};
  for (const spec of specs) {
    const { id, label, scene: _scene, ...createPartial } = spec;
    if (!stage.hasArtboard(id)) {
      const addOptions: IsoCanvasStageAddArtboardOptions = {
        id,
        embedDotGrid: false,
        ...defaults,
        ...createPartial,
        ...(label !== undefined ? { label } : {}),
      };
      stage.addArtboard(addOptions);
    } else if (label !== undefined) {
      stage.getArtboard(id)?.artboard.root.setAttribute(IC_ARTBOARD_LABEL_ATTR, label);
    }
  }
  stage.relayoutArtboards();
}

/** Apply each scene’s viewBox to its artboard root; row layout normalizes heights in relayout. */
export function syncDiagramArtboardSizesOnStage(
  stage: IsoCanvasStage,
  items: ReadonlyArray<{ id: IsoCanvasArtboardId; scene: DiagramScene }>,
): void {
  if (isStageRowContinuous(stage)) {
    for (const { id, scene } of items) {
      const entry = stage.getArtboard(id);
      if (!entry) {
        continue;
      }
      syncDiagramArtboardToScene(entry.artboard.root, scene);
    }
    normalizeRowArtboardUserSizes(stage.getArtboards(), {
      matchWidth: true,
      matchHeight: true,
    });
    return;
  }
  for (const { id, scene } of items) {
    const entry = stage.getArtboard(id);
    if (!entry) {
      continue;
    }
    syncDiagramArtboardToScene(entry.artboard.root, scene);
  }
  if (stage.layout === "row") {
    normalizeRowArtboardUserHeights(stage.getArtboards());
  }
}

function continuousRowColumnUserSize(stage: IsoCanvasStage): ArtboardUserSize | null {
  if (!isStageRowContinuous(stage)) {
    return null;
  }
  const { width, height } = normalizeRowArtboardUserSizes(stage.getArtboards(), {
    matchWidth: true,
    matchHeight: true,
  });
  if (width === null || height === null || width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}

function markPlaneRowHosts(stage: IsoCanvasStage, hostId: IsoCanvasArtboardId | null): void {
  const ids = stage.artboardIds();
  ids.forEach((id, index) => {
    const entry = stage.getArtboard(id);
    if (!entry) {
      return;
    }
    if (hostId !== null && id === hostId) {
      entry.artboard.root.setAttribute(IC_PLANE_ROW_HOST_ATTR, "true");
    } else {
      entry.artboard.root.removeAttribute(IC_PLANE_ROW_HOST_ATTR);
    }
    entry.artboard.root.setAttribute(IC_ROW_COLUMN_ATTR, String(index));
    entry.artboard.root.style.setProperty(IC_ROW_COLUMN_INDEX_VAR, String(index));
  });
  stage.container.style.setProperty("--ic-row-column-count", String(ids.length));
}

export type RenderDiagramScenesOnIsoCanvasStageOptions = {
  colors: IsoCanvasColors;
  emptyHtml?: string;
};

const DEFAULT_EMPTY_HTML = '<p class="ic-artboard-empty">No objects on this artboard</p>';

function renderContinuousPlaneRow(
  stage: IsoCanvasStage,
  items: ReadonlyArray<{ id: IsoCanvasArtboardId; scene: DiagramScene }>,
  options: RenderDiagramScenesOnIsoCanvasStageOptions,
): void {
  const columnUserSize = continuousRowColumnUserSize(stage);
  const gapPx = readStageRowGapPx(stage);
  const ordered = stage
    .artboardIds()
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is { id: IsoCanvasArtboardId; scene: DiagramScene } => item !== undefined);

  if (!columnUserSize || ordered.length === 0) {
    return;
  }

  const hostId = ordered[0]!.id;
  const hostEntry = stage.getArtboard(hostId);
  if (!hostEntry) {
    return;
  }

  markPlaneRowHosts(stage, hostId);

  const visibleItems = ordered.filter((item) => stage.isArtboardVisible(item.id));
  const visibleScenes = visibleItems.map((item) => item.scene);
  const merged = mergeDiagramScenesAlongPlaneRow(visibleScenes, {
    columnUserSize,
    gapPx,
  });
  const stripSize = planeRowStripUserSize(
    Math.max(visibleScenes.length, 1),
    columnUserSize,
    gapPx,
  );
  applyArtboardUserSize(hostEntry.artboard.root, stripSize);

  const emptyHtml = options.emptyHtml ?? DEFAULT_EMPTY_HTML;
  for (const { id } of ordered) {
    const entry = stage.getArtboard(id);
    if (!entry) {
      continue;
    }
    entry.host.replaceChildren();
    if (id !== hostId) {
      continue;
    }
    if (!merged.nodes.length) {
      entry.host.innerHTML = emptyHtml;
      continue;
    }
    renderDiagramScene(entry.host, merged, options.colors, {
      artboardUserSize: stripSize,
      viewportMeetAlign: "min",
      planeRowColumns: {
        cellWidth: columnUserSize.width,
        cellHeight: columnUserSize.height,
        gapPx,
        columnCount: Math.max(visibleScenes.length, 1),
      },
    });
  }
}

/** Mount or refresh diagram SVG on every registered artboard. */
export function renderDiagramScenesOnIsoCanvasStage(
  stage: IsoCanvasStage,
  items: ReadonlyArray<{ id: IsoCanvasArtboardId; scene: DiagramScene }>,
  options: RenderDiagramScenesOnIsoCanvasStageOptions,
): void {
  syncDiagramArtboardSizesOnStage(stage, items);
  stage.relayoutArtboards();

  if (isStageRowContinuous(stage)) {
    renderContinuousPlaneRow(stage, items, options);
    return;
  }

  const emptyHtml = options.emptyHtml ?? DEFAULT_EMPTY_HTML;
  for (const { id, scene } of items) {
    const entry = stage.getArtboard(id);
    if (!entry) {
      continue;
    }
    const { host } = entry;
    host.replaceChildren();
    if (!scene.nodes?.length) {
      host.innerHTML = emptyHtml;
      continue;
    }
    renderDiagramScene(host, scene, options.colors);
  }
}

/** One-shot: registry + sizes + render (typical watch / dash refresh). */
export function mountDiagramScenesOnIsoCanvasStage(
  stage: IsoCanvasStage,
  specs: readonly IsoCanvasStageArtboardSpec[],
  renderOptions: RenderDiagramScenesOnIsoCanvasStageOptions,
  registryOptions?: SyncIsoCanvasStageArtboardRegistryOptions,
): void {
  syncIsoCanvasStageArtboardRegistry(stage, specs, registryOptions);
  const scenes = specs
    .filter((spec): spec is IsoCanvasStageArtboardSpec & { scene: DiagramScene } => spec.scene !== undefined)
    .map((spec) => ({ id: spec.id, scene: spec.scene }));
  if (scenes.length > 0) {
    renderDiagramScenesOnIsoCanvasStage(stage, scenes, renderOptions);
  }
}
