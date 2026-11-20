// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { IsoCanvasStage } from "@westlane/isocanvas";
import {
  applyArtboardHomeCamera,
  attachWorldCameraPanZoom,
  mergeLocationHashWithViewport,
  parseViewportUrlFrame,
  readWorldCameraFromHost,
  stripViewFromHashFragment,
  syncBaseHashPreservingViewport,
  buildViewHashSuffixFromCameras,
  bindViewportUrlSync as bindViewportUrlSyncCore,
  createViewportUrlPanZoomHooks,
  restoreDiagramViewportAfterMount as restoreDiagramViewportAfterMountCore,
  applyViewportFromLocationHash,
  applyViewportUrlFrameToHost,
  pushViewportUrlNow,
  stripViewportFromLocationHash,
  VIEWPORT_CAMERA_CHANGE_EVENT,
  VIEWPORT_URL_PUSH_EVENT,
  type ViewportUrlFrame,
  type ViewportUrlSyncHandle,
} from "@westlane/isocanvas";
import {
  persistDemoSession,
  applyDemoViewportCamerasToStore,
  applyDemoWorldCameraToHost,
  demoWorldCameraLayerOptions,
  ensureDemoBaseline,
  getDemoCanvasCamera,
  getDemoViewportCameras,
  notifyDemoCanvasCameraChanged,
  setDemoCanvasCamera,
  syncDemoBaselineFromSvg,
} from "./session.js";
import { parseToolRouteHash, toolRouteHash, type DemoToolRoute } from "./tools.js";

export type { ViewportUrlFrame, ViewportUrlSyncHandle };
export {
  buildViewHashSuffixFromCameras,
  parseViewportUrlFrame,
  stripViewFromHashFragment,
  mergeLocationHashWithViewport as mergeRouteHash,
};

export function applyDemoHomeView(host: HTMLElement): boolean {
  const svg = host.querySelector("svg");
  if (!svg) {
    return false;
  }
  syncDemoBaselineFromSvg(svg);
  if (!applyArtboardHomeCamera(host)) {
    return false;
  }
  const camera = readWorldCameraFromHost(host);
  if (!camera) {
    return false;
  }
  setDemoCanvasCamera({ viewBox: camera });
  stripViewportFromLocationHash();
  pushViewportUrlNow(host);
  notifyDemoCanvasCameraChanged(host);
  return true;
}

let demoUrlSync: ViewportUrlSyncHandle | null = null;

export function scheduleDemoViewportUrlSync(): void {
  demoUrlSync?.schedule();
}

export function flushDemoViewportUrlSync(): void {
  demoUrlSync?.flush();
}

export function attachDemoIsoStageViewport(options: {
  stage: IsoCanvasStage;
  surface: HTMLElement;
  notifyHost: HTMLElement;
}): () => void {
  const urlHooks = createViewportUrlPanZoomHooks(demoUrlSync, { notifyHost: options.notifyHost });
  return options.stage.attachPanZoom({
    surface: options.surface,
    resyncOnHostEvent: VIEWPORT_CAMERA_CHANGE_EVENT,
    onViewBoxApplied: (viewBox, context) => {
      setDemoCanvasCamera({ viewBox });
      urlHooks.onViewBoxApplied(viewBox, context);
      if (context.notify) {
        notifyDemoCanvasCameraChanged(options.notifyHost);
      }
    },
  });
}

/** @deprecated Use {@link attachDemoIsoStageViewport} with `createIsoCanvasStage`. */
export function attachInfiniteCanvasViewport(options: {
  surface: HTMLElement;
  viewport: HTMLElement;
  host: HTMLElement;
}): () => void {
  void options.viewport;
  const urlHooks = createViewportUrlPanZoomHooks(demoUrlSync, { notifyHost: options.host });
  return attachWorldCameraPanZoom({
    surface: options.surface,
    host: options.host,
    worldCamera: demoWorldCameraLayerOptions(),
    resyncOnHostEvent: VIEWPORT_CAMERA_CHANGE_EVENT,
    onViewBoxApplied: (viewBox, context) => {
      setDemoCanvasCamera({ viewBox });
      urlHooks.onViewBoxApplied(viewBox, context);
      if (context.notify) {
        notifyDemoCanvasCameraChanged(options.host);
      }
    },
  });
}

export function hashRouteMatches(rawHash: string, route: DemoToolRoute): boolean {
  const parsed = parseToolRouteHash(rawHash);
  return parsed !== null && parsed.groupId === route.groupId && parsed.itemId === route.itemId;
}

export function syncRouteHashForTool(route: DemoToolRoute): void {
  syncBaseHashPreservingViewport({
    baseHash: toolRouteHash(route),
    hashMatchesBase: (raw, base) => {
      const route = parseToolRouteHash(base);
      return route !== null && hashRouteMatches(raw, route);
    },
  });
}

export function applyViewportFromUrlFrame(host: HTMLElement, frame: ViewportUrlFrame): boolean {
  const svg = host.querySelector("svg");
  if (!svg) {
    return false;
  }
  ensureDemoBaseline(svg);
  const ok = applyViewportUrlFrameToHost(host, frame, {
    worldCamera: demoWorldCameraLayerOptions(),
  });
  if (!ok) {
    return false;
  }
  const cameras = getDemoViewportCameras(host);
  if (cameras) {
    applyDemoViewportCamerasToStore(cameras);
  }
  notifyDemoCanvasCameraChanged(host);
  return true;
}

export function applyViewportFromHash(host: HTMLElement, rawHash: string): boolean {
  return applyViewportFromLocationHash(host, rawHash, {
    worldCamera: demoWorldCameraLayerOptions(),
  })
    ? (notifyDemoCanvasCameraChanged(host), true)
    : false;
}

export function restoreDemoViewportAfterToolMount(
  host: HTMLElement,
  options: {
    pendingView: ViewportUrlFrame | null;
    sameRouteRemount: boolean;
  },
): void {
  restoreDiagramViewportAfterMountCore({
    host,
    pendingView: options.pendingView,
    sameScopeRemount: options.sameRouteRemount,
    readStoredCameras: () => {
      const camera = getDemoCanvasCamera();
      return camera ? { canvas: camera } : null;
    },
    applyStoredCameras: (target, cameras) =>
      applyDemoWorldCameraToHost(target, cameras.canvas.viewBox),
    applyHome: applyDemoHomeView,
    worldCamera: demoWorldCameraLayerOptions(),
    urlSync: demoUrlSync,
  });
}

export function bindViewportUrlSync(options: {
  host: HTMLElement;
  viewport: HTMLElement;
  routeHash: () => string;
}): ViewportUrlSyncHandle {
  void options.viewport;
  demoUrlSync = bindViewportUrlSyncCore({
    host: options.host,
    baseHash: options.routeHash,
    readCameras: (host) => getDemoViewportCameras(host),
    readBaselineWidth: (host) => {
      const svg = host.querySelector("svg");
      if (!(svg instanceof SVGSVGElement)) {
        return null;
      }
      return syncDemoBaselineFromSvg(svg).baseW;
    },
    onAfterCommit: () => persistDemoSession(),
    resyncHostEvent: VIEWPORT_CAMERA_CHANGE_EVENT,
    pushHostEvent: VIEWPORT_URL_PUSH_EVENT,
  });
  return demoUrlSync;
}
