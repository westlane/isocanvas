// Copyright (C) 2026 West Lane - All Rights Reserved

import {
  attachWorldCameraPanZoom,
  centeredArtboardHomeView,
  urlFrameFromViewportCameras,
  viewportCamerasFromParts,
  type ViewportCameras,
} from "@westlane/isocanvas";
import {
  persistDemoSession,
  applyDemoCanvasCameraToHost,
  applyDemoViewportCamerasToStore,
  applyDemoWorldCameraToHost,
  demoWorldCameraLayerOptions,
  ensureDemoBaseline,
  getDemoBaselineForSvg,
  getDemoViewportCameras,
  notifyDemoCanvasCameraChanged,
  setDemoCanvasCamera,
  syncDemoBaselineFromSvg,
} from "./session.js";
import { parseToolRouteHash, toolRouteHash, type DemoToolRoute } from "./tools.js";

export function applyDemoHomeView(host: HTMLElement): boolean {
  const svg = host.querySelector("svg");
  if (!svg) {
    return false;
  }
  const base = syncDemoBaselineFromSvg(svg);
  const viewBox = centeredArtboardHomeView(host, base);
  if (!viewBox) {
    return false;
  }
  const applied = applyDemoWorldCameraToHost(host, viewBox);
  if (!applied) {
    return false;
  }
  setDemoCanvasCamera({ viewBox });
  const stripped = stripViewFromHashFragment(window.location.hash.replace(/^#/, ""));
  history.replaceState(history.state, "", `#${stripped}`);
  host.dispatchEvent(new CustomEvent("viewport-url-push", { bubbles: true }));
  notifyDemoCanvasCameraChanged(host);
  return true;
}

export function attachInfiniteCanvasViewport(options: {
  surface: HTMLElement;
  viewport: HTMLElement;
  host: HTMLElement;
}): () => void {
  return attachWorldCameraPanZoom({
    surface: options.surface,
    host: options.host,
    worldCamera: demoWorldCameraLayerOptions(),
    resyncOnHostEvent: "viewport-debug-tick",
    onViewBoxApplied: (viewBox, { notify }) => {
      setDemoCanvasCamera({ viewBox });
      if (notify) {
        notifyDemoCanvasCameraChanged(options.host);
      }
    },
  });
}

/** URL payload: canvas zoom/center. */
export type ViewportUrlFrame = {
  zoom: number;
  cx: number;
  cy: number;
};

const VIEW_TOKEN = "&view=";

export function stripViewFromHashFragment(raw: string): string {
  const withoutHash = raw.replace(/^#/, "");
  const idx = withoutHash.indexOf(VIEW_TOKEN);
  return idx < 0 ? withoutHash : withoutHash.slice(0, idx);
}

export function parseViewportUrlFrame(raw: string): ViewportUrlFrame | null {
  const withoutHash = raw.replace(/^#/, "");
  const idx = withoutHash.indexOf(VIEW_TOKEN);
  if (idx < 0) {
    return null;
  }
  const segment = withoutHash.slice(idx + VIEW_TOKEN.length).split("&")[0] ?? "";
  if (!segment) {
    return null;
  }
  const parts = segment.split("/");
  if (parts.length !== 3) {
    return null;
  }
  const zoom = Number.parseFloat(parts[0] ?? "");
  const cx = Number.parseFloat(parts[1] ?? "");
  const cy = Number.parseFloat(parts[2] ?? "");
  if (!Number.isFinite(zoom) || zoom <= 0 || !Number.isFinite(cx) || !Number.isFinite(cy)) {
    return null;
  }
  return { zoom, cx, cy };
}

export function buildViewHashSuffixFromCameras(
  cameras: ViewportCameras,
  baselineWidth: number,
): string {
  const frame = urlFrameFromViewportCameras(cameras, baselineWidth);
  const roundedZoom = Math.round(frame.zoom * 100) / 100;
  const roundedCx = Math.round(frame.cx * 100) / 100;
  const roundedCy = Math.round(frame.cy * 100) / 100;
  return `${VIEW_TOKEN}${roundedZoom}/${roundedCx}/${roundedCy}`;
}

export function hashRouteMatches(rawHash: string, route: DemoToolRoute): boolean {
  const parsed = parseToolRouteHash(rawHash);
  return parsed !== null && parsed.groupId === route.groupId && parsed.itemId === route.itemId;
}

export function syncRouteHashForTool(route: DemoToolRoute): void {
  const targetRouteHash = toolRouteHash(route);
  const viewInHash = parseViewportUrlFrame(window.location.hash);
  const sameRoute = hashRouteMatches(window.location.hash, route);
  if (sameRoute && viewInHash) {
    return;
  }
  if (window.location.hash !== targetRouteHash) {
    history.replaceState(history.state, "", targetRouteHash);
  }
}

export function mergeRouteHash(
  routeHashValue: string,
  cameras: ViewportCameras,
  baselineWidth: number,
): string {
  return `${routeHashValue}${buildViewHashSuffixFromCameras(cameras, baselineWidth)}`;
}

let applyingFromUrl = false;

export function applyViewportFromUrlFrame(host: HTMLElement, frame: ViewportUrlFrame): boolean {
  const svg = host.querySelector("svg");
  if (!svg) {
    return false;
  }
  const base = ensureDemoBaseline(svg);
  applyingFromUrl = true;
  try {
    const cameras = viewportCamerasFromParts({
      zoom: frame.zoom,
      cx: frame.cx,
      cy: frame.cy,
      baselineWidth: base.baseW,
      baselineHeight: base.baseH,
    });
    applyDemoViewportCamerasToStore(cameras);
    applyDemoWorldCameraToHost(host, cameras.canvas.viewBox);
    applyDemoCanvasCameraToHost(host);
    notifyDemoCanvasCameraChanged(host);
    return true;
  } finally {
    applyingFromUrl = false;
  }
}

export function applyViewportFromHash(host: HTMLElement, rawHash: string): boolean {
  const frame = parseViewportUrlFrame(rawHash);
  if (!frame) {
    return false;
  }
  return applyViewportFromUrlFrame(host, frame);
}

export type ViewportUrlSyncHandle = {
  unbind: () => void;
  pushNow: () => void;
};

let viewportUrlPushNow: (() => void) | null = null;

export function bindViewportUrlSync(options: {
  host: HTMLElement;
  viewport: HTMLElement;
  routeHash: () => string;
}): ViewportUrlSyncHandle {
  const URL_PUSH_DEBOUNCE_MS = 400;
  let debounceId = 0;

  const commitHashToHistory = (): void => {
    if (applyingFromUrl) {
      return;
    }
    const svg = options.host.querySelector("svg");
    if (!svg) {
      return;
    }
    const base = getDemoBaselineForSvg(svg);
    if (!base) {
      return;
    }
    const cameras = getDemoViewportCameras(options.host);
    if (!cameras) {
      return;
    }
    const next = mergeRouteHash(options.routeHash(), cameras, base.baseW);
    if (window.location.hash !== next) {
      history.replaceState(history.state, "", next);
    }
    persistDemoSession();
  };

  const cancelScheduledPush = (): void => {
    if (debounceId !== 0) {
      clearTimeout(debounceId);
      debounceId = 0;
    }
  };

  const pushNow = (): void => {
    cancelScheduledPush();
    commitHashToHistory();
  };

  const schedulePush = (): void => {
    if (applyingFromUrl) {
      return;
    }
    cancelScheduledPush();
    debounceId = window.setTimeout(() => {
      debounceId = 0;
      commitHashToHistory();
    }, URL_PUSH_DEBOUNCE_MS);
  };

  const onTick = (): void => {
    schedulePush();
  };

  options.host.addEventListener("viewport-debug-tick", onTick);
  options.host.addEventListener("viewport-url-push", pushNow);
  viewportUrlPushNow = pushNow;

  return {
    pushNow,
    unbind: () => {
      if (viewportUrlPushNow === pushNow) {
        viewportUrlPushNow = null;
      }
      options.host.removeEventListener("viewport-debug-tick", onTick);
      options.host.removeEventListener("viewport-url-push", pushNow);
      cancelScheduledPush();
    },
  };
}
