// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ViewBox } from "../types/core.js";
import {
  attachWorldCameraPanZoom,
  type AttachWorldCameraPanZoomOptions,
  type WorldCameraPanZoomDetach,
} from "../camera/world-pan-zoom.js";
import { applyWorldCameraViewBoxToHost } from "../camera/world/view-box-host.js";
import {
  linkedWorldCameraForBaseline,
  readViewBoxBaselineFromHost,
  syncLinkedWorldCameraAcrossHosts,
} from "../camera/world/linked-world-camera.js";
import {
  applyArtboardUserSize,
  artboardUserBoxFromElement,
} from "../layout/artboard.js";
import type { ViewBoxBaseline } from "../types/camera.js";
import type { IsoCanvasArtboardEntry, IsoCanvasStageLayout, IsoCanvasStage } from "../types/stage.js";

export const IC_CANVAS_STAGE_ROW_WRAPPER_CLASS = "ic-canvas-stage-row";

export const IC_CANVAS_STAGE_LAYOUT_ROW_CLASS = "ic-canvas-stage--layout-row";

export const IC_CANVAS_STAGE_LAYOUT_STACK_CLASS = "ic-canvas-stage--layout-stack";

export function isMultiArtboardStageLayout(layout: IsoCanvasStageLayout): boolean {
  return layout === "row" || layout === "stack";
}

export const IC_ARTBOARD_LABEL_ATTR = "data-ic-artboard-label";

export const DEFAULT_ISO_CANVAS_STAGE_ROW_GAP_PX = 20;

export const DEFAULT_ISO_CANVAS_STAGE_ROW_CONTINUOUS_GAP_PX = 56;

export const IC_STAGE_ROW_CONTINUOUS_ATTR = "data-ic-stage-row-continuous";

export const IC_ROW_COLUMN_ATTR = "data-ic-row-column";

export const IC_ROW_COLUMN_INDEX_VAR = "--ic-row-column-index";

export const IC_PLANE_ROW_HOST_ATTR = "data-ic-plane-row-host";

export function isStageRowContinuous(stage: Pick<IsoCanvasStage, "layout" | "container">): boolean {
  return (
    stage.layout === "row" &&
    stage.container.getAttribute(IC_STAGE_ROW_CONTINUOUS_ATTR) === "true"
  );
}

/** Pin each artboard on one horizontal plane: index × (user width + gap), no flex overlap. */
export function layoutContinuousRowPlaneColumns(
  container: HTMLElement,
  entries: readonly IsoCanvasArtboardEntry[],
  _gapPx: number,
): { width: number | null; height: number | null } {
  const sizes = normalizeRowArtboardUserSizes(entries, {
    matchHeight: true,
    matchWidth: true,
  });
  if (sizes.width === null || sizes.height === null || entries.length === 0) {
    for (const entry of entries) {
      entry.artboard.root.removeAttribute(IC_ROW_COLUMN_ATTR);
      entry.artboard.root.style.removeProperty(IC_ROW_COLUMN_INDEX_VAR);
    }
    container.style.removeProperty("--ic-row-column-count");
    container.style.removeProperty("--ic-row-column-user-width");
    container.style.removeProperty("--ic-row-column-user-height");
    return sizes;
  }
  const { width: userWidth, height: userHeight } = sizes;
  const count = entries.length;
  container.style.setProperty("--ic-row-column-count", String(count));
  container.style.setProperty("--ic-row-column-user-width", `${userWidth}px`);
  container.style.setProperty("--ic-row-column-user-height", `${userHeight}px`);
  entries.forEach((entry, index) => {
    entry.artboard.root.setAttribute(IC_ROW_COLUMN_ATTR, String(index));
    entry.artboard.root.style.setProperty(IC_ROW_COLUMN_INDEX_VAR, String(index));
  });
  return sizes;
}

export function clearContinuousRowPlaneColumns(
  container: HTMLElement,
  entries: readonly IsoCanvasArtboardEntry[],
): void {
  for (const entry of entries) {
    entry.artboard.root.removeAttribute(IC_ROW_COLUMN_ATTR);
    entry.artboard.root.style.removeProperty(IC_ROW_COLUMN_INDEX_VAR);
  }
  container.style.removeProperty("--ic-row-column-count");
  container.style.removeProperty("--ic-row-column-user-width");
  container.style.removeProperty("--ic-row-column-user-height");
}

export type NormalizeRowArtboardUserSizesOptions = {
  matchHeight?: boolean;
  matchWidth?: boolean;
};

/** Equalize logical user width and/or height across row artboards (iso continuous strip). */
export function normalizeRowArtboardUserSizes(
  entries: readonly IsoCanvasArtboardEntry[],
  options: NormalizeRowArtboardUserSizesOptions = {},
): { width: number | null; height: number | null } {
  const matchHeight = options.matchHeight !== false;
  const matchWidth = options.matchWidth === true;
  let maxHeight = 0;
  let maxWidth = 0;
  for (const entry of entries) {
    const box = artboardUserBoxFromElement(entry.artboard.root);
    if (!box) {
      continue;
    }
    maxHeight = Math.max(maxHeight, box.height);
    maxWidth = Math.max(maxWidth, box.width);
  }
  if (maxHeight <= 0 && maxWidth <= 0) {
    return { width: null, height: null };
  }
  for (const entry of entries) {
    const box = artboardUserBoxFromElement(entry.artboard.root);
    if (!box) {
      continue;
    }
    applyArtboardUserSize(entry.artboard.root, {
      width: matchWidth && maxWidth > 0 ? maxWidth : box.width,
      height: matchHeight && maxHeight > 0 ? maxHeight : box.height,
    });
  }
  return {
    width: matchWidth && maxWidth > 0 ? maxWidth : null,
    height: matchHeight && maxHeight > 0 ? maxHeight : null,
  };
}

/** Shared logical height for every artboard in a row (max of registered sizes). */
export function normalizeRowArtboardUserHeights(entries: readonly IsoCanvasArtboardEntry[]): number | null {
  return normalizeRowArtboardUserSizes(entries, { matchHeight: true, matchWidth: false }).height;
}

export const DEFAULT_ISO_CANVAS_STAGE_ROW_PITCH_DEG = 42;

export const DEFAULT_ISO_CANVAS_STAGE_ROW_BEARING_DEG = 0;

export { applyWorldCameraViewBoxToHost } from "../camera/world/view-box-host.js";

/** Pan/zoom one logical camera across every artboard host (row layout). */
export function attachSyncedWorldCameraPanZoom(
  options: AttachWorldCameraPanZoomOptions & { hosts: readonly HTMLElement[] },
): WorldCameraPanZoomDetach {
  const hosts = options.hosts.filter(Boolean);
  const primary = hosts[0];
  if (!primary) {
    return () => {};
  }
  const baselineByHost = new WeakMap<HTMLElement, ViewBoxBaseline>();
  const refreshBaselines = (): void => {
    for (const host of hosts) {
      const baseline = readViewBoxBaselineFromHost(host);
      if (baseline) {
        baselineByHost.set(host, baseline);
      }
    }
  };
  refreshBaselines();
  const syncPeersImmediate = (primaryCamera: ViewBox): void => {
    const primaryBaseline = baselineByHost.get(primary) ?? readViewBoxBaselineFromHost(primary);
    if (!primaryBaseline) {
      return;
    }
    if (!baselineByHost.has(primary)) {
      baselineByHost.set(primary, primaryBaseline);
    }
    for (const host of hosts) {
      if (host === primary) {
        continue;
      }
      const peerBaseline = baselineByHost.get(host) ?? readViewBoxBaselineFromHost(host);
      if (!peerBaseline) {
        continue;
      }
      if (!baselineByHost.has(host)) {
        baselineByHost.set(host, peerBaseline);
      }
      const linked = linkedWorldCameraForBaseline(primaryCamera, primaryBaseline, peerBaseline);
      applyWorldCameraViewBoxToHost(host, linked);
    }
  };
  let peerSyncRaf = 0;
  let peerSyncPending: ViewBox | null = null;
  const cancelPeerSyncRaf = (): void => {
    if (peerSyncRaf !== 0) {
      cancelAnimationFrame(peerSyncRaf);
      peerSyncRaf = 0;
    }
    peerSyncPending = null;
  };
  const schedulePeerSync = (viewBox: ViewBox): void => {
    peerSyncPending = viewBox;
    if (peerSyncRaf !== 0) {
      return;
    }
    peerSyncRaf = requestAnimationFrame(() => {
      peerSyncRaf = 0;
      const pending = peerSyncPending;
      peerSyncPending = null;
      if (pending) {
        syncPeersImmediate(pending);
      }
    });
  };
  const baseDetach = attachWorldCameraPanZoom({
    ...options,
    host: primary,
    onViewBoxApplied: (viewBox, context) => {
      if (context.notify) {
        cancelPeerSyncRaf();
        syncPeersImmediate(viewBox);
      } else {
        schedulePeerSync(viewBox);
      }
      options.onViewBoxApplied?.(viewBox, context);
    },
    onPanEnd: (viewBox) => {
      options.onPanEnd?.(viewBox);
    },
  });
  const resyncEvent = options.resyncOnHostEvent;
  const onHostResync = resyncEvent
    ? (): void => {
        refreshBaselines();
      }
    : null;
  if (onHostResync && resyncEvent) {
    primary.addEventListener(resyncEvent, onHostResync);
  }
  return () => {
    cancelPeerSyncRaf();
    if (onHostResync && resyncEvent) {
      primary.removeEventListener(resyncEvent, onHostResync);
    }
    baseDetach();
  };
}

/** Copy linked pan/zoom from the primary host to every peer (after per-artboard fit). */
export function syncWorldCameraAcrossHosts(
  hosts: readonly HTMLElement[],
  worldCamera?: AttachWorldCameraPanZoomOptions["worldCamera"],
): boolean {
  return syncLinkedWorldCameraAcrossHosts(hosts, worldCamera);
}
