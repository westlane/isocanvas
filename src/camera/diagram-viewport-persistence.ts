// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ViewBox } from "../types/core.js";
import { applyWorldCameraToHost } from "./world/apply-world-camera.js";
import { isValidViewBox } from "./view-box/clamp.js";

const DIAGRAM_VIEWPORT_STORAGE_VERSION = 1;

export type DiagramViewportStorageSnapshot = {
  v: typeof DIAGRAM_VIEWPORT_STORAGE_VERSION;
  viewBox: ViewBox;
};

export function parseDiagramViewportStorageSnapshot(raw: string): ViewBox | null {
  try {
    const parsed = JSON.parse(raw) as Partial<DiagramViewportStorageSnapshot>;
    if (parsed.v !== DIAGRAM_VIEWPORT_STORAGE_VERSION) {
      return null;
    }
    const viewBox = parsed.viewBox;
    if (!viewBox || !isValidViewBox(viewBox)) {
      return null;
    }
    return {
      x: viewBox.x,
      y: viewBox.y,
      w: viewBox.w,
      h: viewBox.h,
    };
  } catch {
    return null;
  }
}

export function serializeDiagramViewportStorageSnapshot(viewBox: ViewBox): string {
  const snapshot: DiagramViewportStorageSnapshot = {
    v: DIAGRAM_VIEWPORT_STORAGE_VERSION,
    viewBox: {
      x: viewBox.x,
      y: viewBox.y,
      w: viewBox.w,
      h: viewBox.h,
    },
  };
  return JSON.stringify(snapshot);
}

export type DiagramViewportStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function resolveDiagramViewportStorage(
  storage?: DiagramViewportStorage,
): DiagramViewportStorage | null {
  if (storage) {
    return storage;
  }
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}

export function loadDiagramViewportFromStorage(
  storageKey: string,
  storage?: DiagramViewportStorage,
): ViewBox | null {
  const resolved = resolveDiagramViewportStorage(storage);
  if (!resolved) {
    return null;
  }
  const raw = resolved.getItem(storageKey);
  if (!raw) {
    return null;
  }
  return parseDiagramViewportStorageSnapshot(raw);
}

export function saveDiagramViewportToStorage(
  storageKey: string,
  viewBox: ViewBox,
  storage?: DiagramViewportStorage,
): void {
  const resolved = resolveDiagramViewportStorage(storage);
  if (!resolved || !isValidViewBox(viewBox)) {
    return;
  }
  try {
    resolved.setItem(storageKey, serializeDiagramViewportStorageSnapshot(viewBox));
  } catch {
    // Quota or private mode.
  }
}

export function clearDiagramViewportStorage(
  storageKey: string,
  storage?: DiagramViewportStorage,
): void {
  resolveDiagramViewportStorage(storage)?.removeItem(storageKey);
}

/** Apply a stored world camera when valid; returns whether a snapshot was applied. */
export function restoreDiagramViewportFromStorage(
  host: HTMLElement,
  storageKey: string,
  storage?: DiagramViewportStorage,
): boolean {
  const viewBox = loadDiagramViewportFromStorage(storageKey, storage);
  if (!viewBox) {
    return false;
  }
  return applyWorldCameraToHost(host, viewBox);
}
