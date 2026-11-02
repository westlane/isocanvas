// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import {
  applyArtboardHomeCamera,
  type ViewBoxCenterArtboardOptions,
} from "../camera/fit/center-artboard-view.js";
import { attachWorldCameraPanZoom } from "../camera/world-pan-zoom.js";
import {
  applyWorldCameraToHost,
  readWorldCameraFromHost,
} from "../camera/world/apply-world-camera.js";
import { createArtboard, type CreateArtboardOptions } from "../layout/artboard.js";
import type {
  CreateIsoCanvasStageOptions,
  IsoCanvasArtboardEntry,
  IsoCanvasArtboardId,
  IsoCanvasStage,
  IsoCanvasStageAddArtboardOptions,
  IsoCanvasStageLayout,
  IsoCanvasStagePanZoomOptions,
} from "../types/stage.js";
import type { ViewBox } from "../types/core.js";
import {
  attachSyncedWorldCameraPanZoom,
  DEFAULT_ISO_CANVAS_STAGE_ROW_BEARING_DEG,
  DEFAULT_ISO_CANVAS_STAGE_ROW_CONTINUOUS_GAP_PX,
  DEFAULT_ISO_CANVAS_STAGE_ROW_GAP_PX,
  DEFAULT_ISO_CANVAS_STAGE_ROW_PITCH_DEG,
  IC_ARTBOARD_LABEL_ATTR,
  IC_CANVAS_STAGE_LAYOUT_ROW_CLASS,
  IC_CANVAS_STAGE_LAYOUT_STACK_CLASS,
  IC_CANVAS_STAGE_ROW_WRAPPER_CLASS,
  IC_STAGE_ROW_CONTINUOUS_ATTR,
  IC_STAGE_ROW_GRID_ATTR,
  IC_PLANE_ROW_HOST_ATTR,
  IC_ROW_COLUMN_ATTR,
  IC_ROW_COLUMN_INDEX_VAR,
  isMultiArtboardStageLayout,
  syncWorldCameraAcrossHosts,
  normalizeRowArtboardUserHeights,
  normalizeRowArtboardUserSizes,
} from "./stage-row-layout.js";

export const IC_CANVAS_STAGE_CLASS = "ic-canvas-stage";

export const IC_ARTBOARD_ID_ATTR = "data-ic-artboard-id";

export { IC_ARTBOARD_LABEL_ATTR, IC_CANVAS_STAGE_ROW_WRAPPER_CLASS } from "./stage-row-layout.js";

function artboardEntryFromDom(
  id: IsoCanvasArtboardId,
  artboard: ReturnType<typeof createArtboard>,
): IsoCanvasArtboardEntry {
  return {
    id,
    artboard,
    host: artboard.content,
  };
}

function splitAddOptions(options: IsoCanvasStageAddArtboardOptions): {
  id: IsoCanvasArtboardId;
  label?: string;
  create: CreateArtboardOptions;
} {
  const { id, label, ...create } = options;
  return label === undefined ? { id, create } : { id, label, create };
}

export function createIsoCanvasStage(options: CreateIsoCanvasStageOptions = {}): IsoCanvasStage {
  const layout: IsoCanvasStageLayout = options.layout ?? "single";
  const rowGapPx =
    options.row?.gapPx ??
    (options.row?.continuous === true
      ? DEFAULT_ISO_CANVAS_STAGE_ROW_CONTINUOUS_GAP_PX
      : DEFAULT_ISO_CANVAS_STAGE_ROW_GAP_PX);
  const rowPitchDeg = options.row?.pitchDeg ?? DEFAULT_ISO_CANVAS_STAGE_ROW_PITCH_DEG;
  const rowBearingDeg = options.row?.bearingDeg ?? DEFAULT_ISO_CANVAS_STAGE_ROW_BEARING_DEG;
  const rowSyncCamera = options.row?.syncCamera !== false;
  const rowAlignUserHeights = options.row?.alignUserHeights !== false;
  const rowContinuous = options.row?.continuous === true && layout === "row";
  const rowGrid = options.row?.grid === true && rowContinuous;

  const container = document.createElement("div");
  container.className = [IC_CANVAS_STAGE_CLASS, options.className].filter(Boolean).join(" ");

  const rowWrapper =
    isMultiArtboardStageLayout(layout)
      ? (() => {
          container.classList.add(
            layout === "stack" ? IC_CANVAS_STAGE_LAYOUT_STACK_CLASS : IC_CANVAS_STAGE_LAYOUT_ROW_CLASS,
          );
          const row = document.createElement("div");
          row.className = IC_CANVAS_STAGE_ROW_WRAPPER_CLASS;
          container.appendChild(row);
          return row;
        })()
      : null;

  const artboardParent = (): HTMLElement => rowWrapper ?? container;

  const applyRowLayoutVars = (): void => {
    if (!isMultiArtboardStageLayout(layout)) {
      return;
    }
    container.style.setProperty("--ic-stage-row-gap", `${rowGapPx}px`);
    container.style.setProperty("--ic-stage-pitch", String(rowPitchDeg));
    container.style.setProperty("--ic-stage-bearing", String(rowBearingDeg));
    if (rowContinuous) {
      container.setAttribute(IC_STAGE_ROW_CONTINUOUS_ATTR, "true");
    } else {
      container.removeAttribute(IC_STAGE_ROW_CONTINUOUS_ATTR);
    }
    if (rowGrid) {
      container.setAttribute(IC_STAGE_ROW_GRID_ATTR, "true");
    } else {
      container.removeAttribute(IC_STAGE_ROW_GRID_ATTR);
    }
  };
  applyRowLayoutVars();

  const artboards = new Map<IsoCanvasArtboardId, IsoCanvasArtboardEntry>();
  const cameraByArtboard = new Map<IsoCanvasArtboardId, ViewBox>();
  const artboardVisible = new Map<IsoCanvasArtboardId, boolean>();
  let activeArtboardId: IsoCanvasArtboardId | null = null;
  let panZoomDetach: (() => void) | null = null;
  let panZoomSurface: HTMLElement | null = null;
  let panZoomOptions: IsoCanvasStagePanZoomOptions | undefined;

  const worldCamera = options.worldCamera;

  const isArtboardVisible = (id: IsoCanvasArtboardId): boolean => {
    if (!artboards.has(id)) {
      return false;
    }
    return artboardVisible.get(id) !== false;
  };

  const syncVisibility = (): void => {
    for (const [id, entry] of artboards) {
      const userVisible = isArtboardVisible(id);
      if (isMultiArtboardStageLayout(layout)) {
        entry.artboard.root.hidden = !userVisible;
        continue;
      }
      entry.artboard.root.hidden = !userVisible || id !== activeArtboardId;
    }
  };

  const visibleArtboardEntries = (): IsoCanvasArtboardEntry[] =>
    [...artboards.values()].filter((entry) => isArtboardVisible(entry.id));

  const planeRowCameraHost = (): HTMLDivElement | null => {
    if (!rowContinuous) {
      return null;
    }
    for (const entry of visibleArtboardEntries()) {
      if (entry.artboard.root.getAttribute(IC_PLANE_ROW_HOST_ATTR) === "true") {
        return entry.host;
      }
    }
    return null;
  };

  const visibleHosts = (): HTMLDivElement[] => {
    const planeHost = planeRowCameraHost();
    if (planeHost) {
      return [planeHost];
    }
    return visibleArtboardEntries().map((entry) => entry.host);
  };

  const activeHost = (): HTMLDivElement | null => {
    if (activeArtboardId === null) {
      return null;
    }
    return artboards.get(activeArtboardId)?.host ?? null;
  };

  const rememberActiveCamera = (): void => {
    if (activeArtboardId === null) {
      return;
    }
    const host = activeHost();
    if (!host) {
      return;
    }
    const camera = readWorldCameraFromHost(host);
    if (camera) {
      cameraByArtboard.set(activeArtboardId, camera);
    }
  };

  const restoreOrFitCamera = (
    id: IsoCanvasArtboardId,
    fit?: ViewBoxCenterArtboardOptions,
  ): void => {
    const entry = artboards.get(id);
    if (!entry) {
      return;
    }
    const saved = cameraByArtboard.get(id);
    if (saved && fit === undefined) {
      applyWorldCameraToHost(entry.host, saved, worldCamera ?? {});
      return;
    }
    applyArtboardHomeCamera(entry.host, fit);
    const camera = readWorldCameraFromHost(entry.host);
    if (camera) {
      cameraByArtboard.set(id, camera);
    }
  };

  const attachPanZoomInner = (
    surface: HTMLElement,
    nextPanOptions?: IsoCanvasStagePanZoomOptions,
  ): (() => void) => {
    if (nextPanOptions !== undefined) {
      panZoomOptions = { ...panZoomOptions, ...nextPanOptions };
    }
    panZoomDetach?.();
    panZoomDetach = null;
    panZoomSurface = surface;
    const panOpts = panZoomOptions;
    const onViewBoxApplied = (
      viewBox: ViewBox,
      context: { notify: boolean; artboardId?: IsoCanvasArtboardId },
    ): void => {
      if (isMultiArtboardStageLayout(layout) && rowSyncCamera) {
        const visible = visibleArtboardEntries();
        for (const entry of visible) {
          cameraByArtboard.set(entry.id, viewBox);
        }
        if (context.notify) {
          const primaryId = visible[0]?.id;
          if (primaryId) {
            options.onViewBoxChange?.(viewBox, primaryId);
            panOpts?.onViewBoxApplied?.(viewBox, { notify: true, artboardId: primaryId });
          } else {
            panOpts?.onViewBoxApplied?.(viewBox, { notify: context.notify });
          }
        } else {
          panOpts?.onViewBoxApplied?.(viewBox, { notify: false });
        }
        return;
      }
      if (layout === "single" && activeArtboardId !== null) {
        cameraByArtboard.set(activeArtboardId, viewBox);
        if (context.notify) {
          options.onViewBoxChange?.(viewBox, activeArtboardId);
        }
      }
      if (context.artboardId) {
        cameraByArtboard.set(context.artboardId, viewBox);
        if (context.notify) {
          options.onViewBoxChange?.(viewBox, context.artboardId);
        }
      }
      panOpts?.onViewBoxApplied?.(viewBox, context);
    };

    if (isMultiArtboardStageLayout(layout) && rowSyncCamera) {
      const hosts = visibleHosts();
      const primary = hosts[0];
      if (!primary) {
        return () => {};
      }
      panZoomDetach = attachSyncedWorldCameraPanZoom({
        surface,
        host: primary,
        hosts,
        ...(worldCamera !== undefined ? { worldCamera } : {}),
        ...(panOpts?.resyncOnHostEvent !== undefined
          ? { resyncOnHostEvent: panOpts.resyncOnHostEvent }
          : {}),
        ...(panOpts?.spacePanClass !== undefined ? { spacePanClass: panOpts.spacePanClass } : {}),
        ...(panOpts?.panningClass !== undefined ? { panningClass: panOpts.panningClass } : {}),
        onViewBoxApplied,
      });
      return () => {
        panZoomDetach?.();
        panZoomDetach = null;
      };
    }

    if (isMultiArtboardStageLayout(layout)) {
      const detaches: (() => void)[] = [];
      for (const entry of visibleArtboardEntries()) {
        const artboardId = entry.id;
        detaches.push(
          attachWorldCameraPanZoom({
            surface: entry.artboard.root,
            host: entry.host,
            ...(worldCamera !== undefined ? { worldCamera } : {}),
            ...(panOpts?.resyncOnHostEvent !== undefined
              ? { resyncOnHostEvent: panOpts.resyncOnHostEvent }
              : {}),
            ...(panOpts?.spacePanClass !== undefined ? { spacePanClass: panOpts.spacePanClass } : {}),
            ...(panOpts?.panningClass !== undefined ? { panningClass: panOpts.panningClass } : {}),
            onViewBoxApplied: (viewBox, context) => {
              onViewBoxApplied(viewBox, { ...context, artboardId });
            },
            onPanEnd: (viewBox) => {
              onViewBoxApplied(viewBox, { notify: true, artboardId });
            },
          }),
        );
      }
      panZoomDetach = () => {
        for (const detach of detaches) {
          detach();
        }
      };
      return () => {
        panZoomDetach?.();
        panZoomDetach = null;
      };
    }

    const host = activeHost();
    if (!host) {
      return () => {};
    }
    panZoomDetach = attachWorldCameraPanZoom({
      surface,
      host,
      ...(worldCamera !== undefined ? { worldCamera } : {}),
      ...(panOpts?.resyncOnHostEvent !== undefined
        ? { resyncOnHostEvent: panOpts.resyncOnHostEvent }
        : {}),
      ...(panOpts?.spacePanClass !== undefined ? { spacePanClass: panOpts.spacePanClass } : {}),
      ...(panOpts?.panningClass !== undefined ? { panningClass: panOpts.panningClass } : {}),
      onViewBoxApplied,
    });
    return () => {
      panZoomDetach?.();
      panZoomDetach = null;
    };
  };

  const addArtboard = (addOptions: IsoCanvasStageAddArtboardOptions): IsoCanvasArtboardEntry => {
    const { id, label, create } = splitAddOptions(addOptions);
    if (artboards.has(id)) {
      throw new Error(`IsoCanvasStage: artboard id already registered: ${id}`);
    }
    const artboard = createArtboard(create);
    artboard.root.setAttribute(IC_ARTBOARD_ID_ATTR, id);
    if (label) {
      artboard.root.setAttribute(IC_ARTBOARD_LABEL_ATTR, label);
    } else {
      artboard.root.removeAttribute(IC_ARTBOARD_LABEL_ATTR);
    }
    const entry = artboardEntryFromDom(id, artboard);
    artboards.set(id, entry);
    artboardVisible.set(id, true);
    artboardParent().appendChild(artboard.root);
    if (activeArtboardId === null) {
      activeArtboardId = id;
      syncVisibility();
      applyArtboardHomeCamera(entry.host);
    } else {
      syncVisibility();
    }
    if (panZoomSurface) {
      attachPanZoomInner(panZoomSurface);
    }
    if (isMultiArtboardStageLayout(layout) && rowSyncCamera && panZoomSurface) {
      syncWorldCameraAcrossHosts(visibleHosts(), worldCamera);
    }
    return entry;
  };

  const setArtboardVisible = (id: IsoCanvasArtboardId, visible: boolean): boolean => {
    if (!artboards.has(id)) {
      return false;
    }
    artboardVisible.set(id, visible);
    if (layout === "single" && !visible && activeArtboardId === id) {
      rememberActiveCamera();
      const next = [...artboards.keys()].find(
        (candidate) => candidate !== id && isArtboardVisible(candidate),
      );
      activeArtboardId = next ?? null;
      if (activeArtboardId) {
        restoreOrFitCamera(activeArtboardId);
      }
    }
    syncVisibility();
    if (panZoomSurface) {
      attachPanZoomInner(panZoomSurface);
    }
    if (isMultiArtboardStageLayout(layout) && rowSyncCamera) {
      syncWorldCameraAcrossHosts(visibleHosts(), worldCamera);
    }
    return true;
  };

  const setActiveArtboard = (id: IsoCanvasArtboardId): boolean => {
    if (!artboards.has(id)) {
      return false;
    }
    if (!isArtboardVisible(id)) {
      return false;
    }
    if (activeArtboardId === id) {
      return true;
    }
    if (isMultiArtboardStageLayout(layout)) {
      activeArtboardId = id;
      return true;
    }
    rememberActiveCamera();
    activeArtboardId = id;
    syncVisibility();
    restoreOrFitCamera(id);
    if (panZoomSurface) {
      attachPanZoomInner(panZoomSurface);
    }
    return true;
  };

  const relayoutArtboards = (): void => {
    applyRowLayoutVars();
    if (!isMultiArtboardStageLayout(layout)) {
      return;
    }
    if (rowContinuous) {
      const entries = [...artboards.values()];
      normalizeRowArtboardUserSizes(entries, {
        matchHeight: rowAlignUserHeights,
        matchWidth: true,
      });
      container.style.setProperty("--ic-row-column-count", String(entries.length));
      entries.forEach((entry, index) => {
        entry.artboard.root.setAttribute(IC_ROW_COLUMN_ATTR, String(index));
        entry.artboard.root.style.setProperty(IC_ROW_COLUMN_INDEX_VAR, String(index));
      });
      return;
    }
    if (rowAlignUserHeights) {
      normalizeRowArtboardUserHeights([...artboards.values()]);
    }
  };

  const stage: IsoCanvasStage = {
    layout,
    container,
    get activeArtboardId() {
      return activeArtboardId;
    },
    addArtboard,
    removeArtboard(id: IsoCanvasArtboardId): boolean {
      const entry = artboards.get(id);
      if (!entry) {
        return false;
      }
      if (activeArtboardId === id) {
        rememberActiveCamera();
      }
      artboards.delete(id);
      cameraByArtboard.delete(id);
      artboardVisible.delete(id);
      entry.artboard.root.remove();
      if (activeArtboardId === id) {
        const next = artboards.keys().next().value as IsoCanvasArtboardId | undefined;
        activeArtboardId = next ?? null;
        syncVisibility();
        if (activeArtboardId && layout === "single") {
          restoreOrFitCamera(activeArtboardId);
        }
        if (panZoomSurface) {
          attachPanZoomInner(panZoomSurface);
        }
      }
      return true;
    },
    hasArtboard(id: IsoCanvasArtboardId): boolean {
      return artboards.has(id);
    },
    getArtboard(id: IsoCanvasArtboardId): IsoCanvasArtboardEntry | undefined {
      return artboards.get(id);
    },
    getArtboards(): readonly IsoCanvasArtboardEntry[] {
      return [...artboards.values()];
    },
    artboardIds(): readonly IsoCanvasArtboardId[] {
      return [...artboards.keys()];
    },
    relayoutArtboards,
    setActiveArtboard,
    setArtboardVisible,
    isArtboardVisible,
    getActiveArtboard(): IsoCanvasArtboardEntry | undefined {
      return activeArtboardId ? artboards.get(activeArtboardId) : undefined;
    },
    fitArtboard(id?: IsoCanvasArtboardId, fitOptions?: ViewBoxCenterArtboardOptions): boolean {
      const targetId = id ?? activeArtboardId;
      if (!targetId) {
        return false;
      }
      const entry = artboards.get(targetId);
      if (!entry) {
        return false;
      }
      const ok = applyArtboardHomeCamera(entry.host, fitOptions);
      if (ok) {
        const camera = readWorldCameraFromHost(entry.host);
        if (camera) {
          cameraByArtboard.set(targetId, camera);
        }
      }
      return ok;
    },
    fitView(fitOptions?: ViewBoxCenterArtboardOptions): boolean {
      if (isMultiArtboardStageLayout(layout)) {
        let ok = false;
        if (rowContinuous) {
          const host = planeRowCameraHost();
          if (host) {
            const entry = visibleArtboardEntries().find((e) => e.host === host);
            if (entry) {
              ok = stage.fitArtboard(entry.id, fitOptions);
            }
          }
        } else {
          for (const id of stage.artboardIds()) {
            if (!stage.isArtboardVisible(id)) {
              continue;
            }
            ok = stage.fitArtboard(id, fitOptions) || ok;
          }
        }
        if (rowSyncCamera) {
          syncWorldCameraAcrossHosts(visibleHosts(), worldCamera);
        }
        return ok;
      }
      return stage.fitArtboard(undefined, fitOptions);
    },
    attachPanZoom(panOptions?: IsoCanvasStagePanZoomOptions): () => void {
      const surface = panOptions?.surface ?? options.surface ?? container;
      return attachPanZoomInner(surface, panOptions);
    },
    syncRowWorldCamera(): boolean {
      if (!isMultiArtboardStageLayout(layout) || !rowSyncCamera) {
        return false;
      }
      return syncWorldCameraAcrossHosts(visibleHosts(), worldCamera);
    },
    destroy(): void {
      panZoomDetach?.();
      panZoomDetach = null;
      for (const entry of artboards.values()) {
        entry.artboard.root.remove();
      }
      artboards.clear();
      cameraByArtboard.clear();
      artboardVisible.clear();
      activeArtboardId = null;
      rowWrapper?.remove();
      container.remove();
    },
  };

  if (options.artboards) {
    for (const seed of options.artboards) {
      addArtboard(seed);
    }
    if (options.activeArtboardId) {
      setActiveArtboard(options.activeArtboardId);
    }
  }

  return stage;
}

export type {
  CreateIsoCanvasStageOptions,
  IsoCanvasArtboardEntry,
  IsoCanvasArtboardId,
  IsoCanvasStage,
  IsoCanvasStageAddArtboardOptions,
  IsoCanvasStageFitOptions,
  IsoCanvasStageLayout,
  IsoCanvasStagePanZoomOptions,
  IsoCanvasStageRowLayoutOptions,
} from "../types/stage.js";
