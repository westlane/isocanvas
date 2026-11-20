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
  isStageRowGrid,
  IC_ROW_COLUMN_ATTR,
  IC_ROW_COLUMN_INDEX_VAR,
  IC_PLANE_ROW_HOST_ATTR,
  IC_GRID_CELL_COLUMN_ATTR,
  IC_GRID_CELL_ROW_ATTR,
  IC_GRID_CELL_COLUMN_SPAN_ATTR,
  IC_GRID_CELL_ROW_SPAN_ATTR,
  IC_GRID_COLUMN_COUNT_VAR,
  IC_GRID_ROW_COUNT_VAR,
  IC_GRID_LABEL_BAND_VAR,
} from "./stage-row-layout.js";
import {
  mergeDiagramScenesAlongPlaneRow,
  planeRowStripUserSize,
} from "./stage-plane-row-scene.js";
import type { ArtboardUserSize } from "../types/artboard.js";
import {
  buildPlaneRowMountPlan,
  planeRowColumnSpecFromFields,
  planeRowMountPlanHasCollectionLabels,
  readContinuousStageRowGapPx,
  renderDiagramSceneOptionsForPlaneRowMount,
  type PlaneRowColumnSpec,
} from "./plane-row-mount.js";
import type { PlaneGridCellSlot } from "../types/stage.js";
import {
  mergeDiagramScenesOnPlaneGrid,
  planeGridStripUserSize,
  type PlaneGridLayout,
} from "./stage-plane-grid-scene.js";
import {
  buildPlaneGridMountPlan,
  planeGridMountPlanHasCollectionLabels,
  renderDiagramSceneOptionsForPlaneGridMount,
} from "./plane-grid-mount.js";

export type IsoCanvasStageArtboardSpec = {
  id: IsoCanvasArtboardId;
  /** Collection title rendered as iso badge on the artboard SVG (alias: {@link collectionLabel}). */
  label?: string;
  collectionLabel?: string;
  collectionLabelFill?: string;
  /** Placement on a continuous stage grid (when {@link isStageRowGrid} is active). */
  gridSlot?: PlaneGridCellSlot;
  scene?: DiagramScene;
} & Partial<CreateArtboardOptions>;

export type SyncIsoCanvasStageArtboardRegistryOptions = {
  /** Defaults merged into each newly added artboard. */
  createDefaults?: CreateArtboardOptions;
};

/** Add, remove, and relabel artboards to match `specs` (order preserved). */
export function syncIsoCanvasStageArtboardRegistry(
  stage: IsoCanvasStage,
  specs: readonly IsoCanvasStageArtboardSpec[],
  options: SyncIsoCanvasStageArtboardRegistryOptions = {},
): void {
  const specIds = specs.map((spec) => spec.id);
  for (const id of stage.artboardIds()) {
    if (!specIds.includes(id)) {
      stage.removeArtboard(id);
    }
  }
  const currentIds = stage.artboardIds();
  const orderMatches =
    currentIds.length === specIds.length &&
    specIds.every((id, index) => currentIds[index] === id);
  if (!orderMatches) {
    for (const id of [...stage.artboardIds()]) {
      stage.removeArtboard(id);
    }
  }
  const defaults = options.createDefaults ?? {};
  for (const spec of specs) {
    const { id, label: _label, collectionLabel: _cl, scene: _scene, ...createPartial } = spec;
    if (!stage.hasArtboard(id)) {
      const addOptions: IsoCanvasStageAddArtboardOptions = {
        id,
        embedDotGrid: false,
        ...defaults,
        ...createPartial,
      };
      stage.addArtboard(addOptions);
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

function markPlaneGridHosts(
  stage: IsoCanvasStage,
  hostId: IsoCanvasArtboardId | null,
  items: ReadonlyArray<IsoCanvasStageDiagramMountItem>,
  layout: PlaneGridLayout,
): void {
  const slotById = new Map(items.map((item) => [item.id, item.gridSlot]));
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
    const slot = slotById.get(id) ?? { col: index, row: 0 };
    entry.artboard.root.setAttribute(IC_GRID_CELL_COLUMN_ATTR, String(slot.col));
    entry.artboard.root.setAttribute(IC_GRID_CELL_ROW_ATTR, String(slot.row));
    entry.artboard.root.style.setProperty("--ic-grid-cell-column", String(slot.col));
    entry.artboard.root.style.setProperty("--ic-grid-cell-row", String(slot.row));
    entry.artboard.root.style.setProperty(
      "--ic-grid-cell-column-span",
      String(slot.colSpan ?? 1),
    );
    entry.artboard.root.style.setProperty("--ic-grid-cell-row-span", String(slot.rowSpan ?? 1));
    if (slot.colSpan !== undefined && slot.colSpan > 1) {
      entry.artboard.root.setAttribute(IC_GRID_CELL_COLUMN_SPAN_ATTR, String(slot.colSpan));
    } else {
      entry.artboard.root.removeAttribute(IC_GRID_CELL_COLUMN_SPAN_ATTR);
    }
    if (slot.rowSpan !== undefined && slot.rowSpan > 1) {
      entry.artboard.root.setAttribute(IC_GRID_CELL_ROW_SPAN_ATTR, String(slot.rowSpan));
    } else {
      entry.artboard.root.removeAttribute(IC_GRID_CELL_ROW_SPAN_ATTR);
    }
    entry.artboard.root.setAttribute(IC_ROW_COLUMN_ATTR, String(slot.col));
    entry.artboard.root.style.setProperty(IC_ROW_COLUMN_INDEX_VAR, String(slot.col));
  });
  stage.container.style.setProperty(IC_GRID_COLUMN_COUNT_VAR, String(layout.columnCount));
  stage.container.style.setProperty(IC_GRID_ROW_COUNT_VAR, String(layout.rowCount));
  stage.container.style.setProperty(IC_GRID_LABEL_BAND_VAR, `${layout.labelBandPx}px`);
  stage.container.style.setProperty("--ic-row-column-count", String(layout.columnCount));
}

export type RenderDiagramScenesOnIsoCanvasStageOptions = {
  colors: IsoCanvasColors;
  emptyHtml?: string;
};

export type IsoCanvasStageDiagramMountItem = {
  id: IsoCanvasArtboardId;
  scene: DiagramScene;
  column: PlaneRowColumnSpec;
  gridSlot?: PlaneGridCellSlot;
};

function diagramMountItemsFromSpecs(
  specs: readonly IsoCanvasStageArtboardSpec[],
): IsoCanvasStageDiagramMountItem[] {
  return specs
    .filter((spec): spec is IsoCanvasStageArtboardSpec & { scene: DiagramScene } => spec.scene !== undefined)
    .map((spec) => ({
      id: spec.id,
      scene: spec.scene,
      column: planeRowColumnSpecFromFields(spec),
      ...(spec.gridSlot !== undefined ? { gridSlot: spec.gridSlot } : {}),
    }));
}

const DEFAULT_EMPTY_HTML = '<p class="ic-artboard-empty">No objects on this artboard</p>';

function renderContinuousPlaneRow(
  stage: IsoCanvasStage,
  items: ReadonlyArray<IsoCanvasStageDiagramMountItem>,
  options: RenderDiagramScenesOnIsoCanvasStageOptions,
): void {
  const columnUserSize = continuousRowColumnUserSize(stage);
  const gapPx = readContinuousStageRowGapPx(stage);
  const ordered = stage
    .artboardIds()
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is IsoCanvasStageDiagramMountItem => item !== undefined);

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
  const mountPlan = buildPlaneRowMountPlan(
    columnUserSize,
    gapPx,
    visibleItems.map((item) => item.column),
  );
  const merged = mergeDiagramScenesAlongPlaneRow(visibleScenes, {
    columnUserSize,
    gapPx,
  });
  const stripSize = planeRowStripUserSize(mountPlan.columns.length, columnUserSize, gapPx);
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
    if (!merged.nodes.length && !planeRowMountPlanHasCollectionLabels(mountPlan)) {
      entry.host.innerHTML = emptyHtml;
      continue;
    }
    const sceneToRender =
      merged.nodes.length > 0
        ? merged
        : {
            nodes: [],
            viewBox: merged.viewBox ?? {
              x: 0,
              y: 0,
              w: stripSize.width,
              h: stripSize.height,
            },
          };
    renderDiagramScene(
      entry.host,
      sceneToRender,
      options.colors,
      renderDiagramSceneOptionsForPlaneRowMount(mountPlan, {
        artboardUserSize: stripSize,
        viewportMeetAlign: "min",
      }),
    );
  }
}

function renderContinuousPlaneGrid(
  stage: IsoCanvasStage,
  items: ReadonlyArray<IsoCanvasStageDiagramMountItem>,
  options: RenderDiagramScenesOnIsoCanvasStageOptions,
): void {
  const cellUserSize = continuousRowColumnUserSize(stage);
  const gapPx = readContinuousStageRowGapPx(stage);
  const ordered = stage
    .artboardIds()
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is IsoCanvasStageDiagramMountItem => item !== undefined);

  if (!cellUserSize || ordered.length === 0) {
    return;
  }

  const hostId = ordered[0]!.id;
  const hostEntry = stage.getArtboard(hostId);
  if (!hostEntry) {
    return;
  }

  const visibleItems = ordered.filter((item) => stage.isArtboardVisible(item.id));
  const gridCells = visibleItems.map((item, index) => ({
    ...(item.gridSlot ?? { col: index, row: 0 }),
    ...item.column,
  }));
  const mountPlan = buildPlaneGridMountPlan(cellUserSize, gapPx, gridCells);
  markPlaneGridHosts(stage, hostId, ordered, mountPlan.layout);

  const mergeEntries = visibleItems.map((item, index) => ({
    scene: item.scene,
    slot: item.gridSlot ?? { col: index, row: 0 },
  }));
  const merged = mergeDiagramScenesOnPlaneGrid(mergeEntries, {
    cellUserSize,
    gapPx,
  });
  const stripSize = planeGridStripUserSize(mountPlan.layout);
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
    if (!merged.nodes.length && !planeGridMountPlanHasCollectionLabels(mountPlan)) {
      entry.host.innerHTML = emptyHtml;
      continue;
    }
    const sceneToRender =
      merged.nodes.length > 0
        ? merged
        : {
            nodes: [],
            viewBox: merged.viewBox ?? {
              x: 0,
              y: 0,
              w: stripSize.width,
              h: stripSize.height,
            },
          };
    renderDiagramScene(
      entry.host,
      sceneToRender,
      options.colors,
      renderDiagramSceneOptionsForPlaneGridMount(mountPlan, {
        artboardUserSize: stripSize,
        viewportMeetAlign: "min",
      }),
    );
  }
}

/** Mount or refresh diagram SVG on every registered artboard. */
export function renderDiagramScenesOnIsoCanvasStage(
  stage: IsoCanvasStage,
  items: ReadonlyArray<IsoCanvasStageDiagramMountItem>,
  options: RenderDiagramScenesOnIsoCanvasStageOptions,
): void {
  syncDiagramArtboardSizesOnStage(
    stage,
    items.map(({ id, scene }) => ({ id, scene })),
  );
  stage.relayoutArtboards();

  if (isStageRowContinuous(stage)) {
    if (isStageRowGrid(stage)) {
      renderContinuousPlaneGrid(stage, items, options);
    } else {
      renderContinuousPlaneRow(stage, items, options);
    }
    return;
  }

  const emptyHtml = options.emptyHtml ?? DEFAULT_EMPTY_HTML;
  for (const item of items) {
    const entry = stage.getArtboard(item.id);
    if (!entry) {
      continue;
    }
    const { host } = entry;
    const { scene } = item;
    host.replaceChildren();
    const hasLabel = Boolean(item.column.collectionLabel?.trim());
    if (!scene.nodes?.length && !hasLabel) {
      host.innerHTML = emptyHtml;
      continue;
    }
    renderDiagramScene(host, scene, options.colors, {
      artboardCollection: item.column,
    });
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
  const items = diagramMountItemsFromSpecs(specs);
  if (items.length > 0) {
    renderDiagramScenesOnIsoCanvasStage(stage, items, renderOptions);
  }
}
