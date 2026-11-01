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
  IsoCanvasStagePanZoomOptions,
} from "../types/stage.js";
import type { ViewBox } from "../types/core.js";

export const IC_CANVAS_STAGE_CLASS = "ic-canvas-stage";

export const IC_ARTBOARD_ID_ATTR = "data-ic-artboard-id";

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

function splitAddOptions(
  options: IsoCanvasStageAddArtboardOptions,
): { id: IsoCanvasArtboardId; create: CreateArtboardOptions } {
  const { id, ...create } = options;
  return { id, create };
}

export function createIsoCanvasStage(options: CreateIsoCanvasStageOptions = {}): IsoCanvasStage {
  const container = document.createElement("div");
  container.className = [IC_CANVAS_STAGE_CLASS, options.className].filter(Boolean).join(" ");

  const artboards = new Map<IsoCanvasArtboardId, IsoCanvasArtboardEntry>();
  const cameraByArtboard = new Map<IsoCanvasArtboardId, ViewBox>();
  let activeArtboardId: IsoCanvasArtboardId | null = null;
  let panZoomDetach: (() => void) | null = null;
  let panZoomSurface: HTMLElement | null = null;
  let panZoomOptions: IsoCanvasStagePanZoomOptions | undefined;

  const worldCamera = options.worldCamera;

  const syncVisibility = (): void => {
    for (const [id, entry] of artboards) {
      const hidden = id !== activeArtboardId;
      entry.artboard.root.hidden = hidden;
    }
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
    const host = activeHost();
    if (!host) {
      return () => {};
    }
    const panOpts = panZoomOptions;
    panZoomDetach = attachWorldCameraPanZoom({
      surface,
      host,
      ...(worldCamera !== undefined ? { worldCamera } : {}),
      ...(panOpts?.resyncOnHostEvent !== undefined
        ? { resyncOnHostEvent: panOpts.resyncOnHostEvent }
        : {}),
      ...(panOpts?.spacePanClass !== undefined ? { spacePanClass: panOpts.spacePanClass } : {}),
      ...(panOpts?.panningClass !== undefined ? { panningClass: panOpts.panningClass } : {}),
      onViewBoxApplied: (viewBox, context) => {
        if (activeArtboardId !== null) {
          cameraByArtboard.set(activeArtboardId, viewBox);
          if (context.notify) {
            options.onViewBoxChange?.(viewBox, activeArtboardId);
          }
        }
        panOpts?.onViewBoxApplied?.(viewBox, context);
      },
    });
    return () => {
      panZoomDetach?.();
      panZoomDetach = null;
    };
  };

  const addArtboard = (addOptions: IsoCanvasStageAddArtboardOptions): IsoCanvasArtboardEntry => {
    const { id, create } = splitAddOptions(addOptions);
    if (artboards.has(id)) {
      throw new Error(`IsoCanvasStage: artboard id already registered: ${id}`);
    }
    const artboard = createArtboard(create);
    artboard.root.setAttribute(IC_ARTBOARD_ID_ATTR, id);
    const entry = artboardEntryFromDom(id, artboard);
    artboards.set(id, entry);
    container.appendChild(artboard.root);
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
    return entry;
  };

  const setActiveArtboard = (id: IsoCanvasArtboardId): boolean => {
    if (!artboards.has(id)) {
      return false;
    }
    if (activeArtboardId === id) {
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

  const stage: IsoCanvasStage = {
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
      entry.artboard.root.remove();
      if (activeArtboardId === id) {
        const next = artboards.keys().next().value as IsoCanvasArtboardId | undefined;
        activeArtboardId = next ?? null;
        syncVisibility();
        if (activeArtboardId) {
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
    setActiveArtboard,
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
      return stage.fitArtboard(undefined, fitOptions);
    },
    attachPanZoom(panOptions?: IsoCanvasStagePanZoomOptions): () => void {
      const surface = panOptions?.surface ?? options.surface ?? container;
      return attachPanZoomInner(surface, panOptions);
    },
    destroy(): void {
      panZoomDetach?.();
      panZoomDetach = null;
      for (const entry of artboards.values()) {
        entry.artboard.root.remove();
      }
      artboards.clear();
      cameraByArtboard.clear();
      activeArtboardId = null;
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
  IsoCanvasStagePanZoomOptions,
} from "../types/stage.js";
