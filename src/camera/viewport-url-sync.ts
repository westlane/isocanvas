// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ViewportCameras, WorldCameraLayerOptions } from "../types/camera.js";
import type { ViewBox } from "../types/core.js";
import { readViewBoxBaselineFromSvg } from "./view-box/baseline.js";
import {
  applyWorldCameraToHost,
  readWorldCameraFromHost,
} from "./world/apply-world-camera.js";
import {
  urlFrameFromViewportCameras,
  viewportCamerasFromParts,
  canvasCameraFromSvg,
} from "./viewport-cameras.js";

/** Hash suffix token: `#…&view=zoom/cx/cy` (shareable deep link to pan/zoom). */
export const VIEWPORT_URL_VIEW_TOKEN = "&view=";

/** View-only hash when there is no route segment (`#view=zoom/cx/cy`). */
export const VIEWPORT_URL_VIEW_ONLY_PREFIX = "view=";

/** Fired on the diagram host when the URL hash should commit immediately. */
export const VIEWPORT_URL_PUSH_EVENT = "ic-viewport-url-push";

/** Fired on the diagram host when camera state changed (debounced URL sync may listen). */
export const VIEWPORT_CAMERA_CHANGE_EVENT = "ic-viewport-camera-change";

/** Zoom + viewBox center encoded in the location hash. */
export type ViewportUrlFrame = {
  zoom: number;
  cx: number;
  cy: number;
};

export type ViewportUrlHistory = Pick<History, "replaceState">;

export type ViewportUrlLocation = Pick<Location, "hash">;

const defaultHistory = (): ViewportUrlHistory =>
  typeof history === "undefined" ? { replaceState: () => {} } : history;

const defaultLocation = (): ViewportUrlLocation =>
  typeof location === "undefined" ? { hash: "" } : location;

export function stripViewFromHashFragment(raw: string): string {
  const withoutHash = raw.replace(/^#/, "");
  if (withoutHash.startsWith(VIEWPORT_URL_VIEW_ONLY_PREFIX)) {
    return "";
  }
  const idx = withoutHash.indexOf(VIEWPORT_URL_VIEW_TOKEN);
  return idx < 0 ? withoutHash : withoutHash.slice(0, idx);
}

function parseViewUrlSegment(segment: string): ViewportUrlFrame | null {
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

export function parseViewportUrlFrame(raw: string): ViewportUrlFrame | null {
  const withoutHash = raw.replace(/^#/, "");
  if (withoutHash.startsWith(VIEWPORT_URL_VIEW_ONLY_PREFIX)) {
    return parseViewUrlSegment(withoutHash.slice(VIEWPORT_URL_VIEW_ONLY_PREFIX.length).split("&")[0] ?? "");
  }
  const idx = withoutHash.indexOf(VIEWPORT_URL_VIEW_TOKEN);
  if (idx < 0) {
    return null;
  }
  const segment = withoutHash.slice(idx + VIEWPORT_URL_VIEW_TOKEN.length).split("&")[0] ?? "";
  return parseViewUrlSegment(segment);
}

export function buildViewHashSuffixFromCameras(
  cameras: ViewportCameras,
  baselineWidth: number,
): string {
  const frame = urlFrameFromViewportCameras(cameras, baselineWidth);
  const roundedZoom = Math.round(frame.zoom * 100) / 100;
  const roundedCx = Math.round(frame.cx * 100) / 100;
  const roundedCy = Math.round(frame.cy * 100) / 100;
  return `${VIEWPORT_URL_VIEW_TOKEN}${roundedZoom}/${roundedCx}/${roundedCy}`;
}

function viewOnlyLocationHash(cameras: ViewportCameras, baselineWidth: number): string {
  const frame = urlFrameFromViewportCameras(cameras, baselineWidth);
  const roundedZoom = Math.round(frame.zoom * 100) / 100;
  const roundedCx = Math.round(frame.cx * 100) / 100;
  const roundedCy = Math.round(frame.cy * 100) / 100;
  return `#${VIEWPORT_URL_VIEW_ONLY_PREFIX}${roundedZoom}/${roundedCx}/${roundedCy}`;
}

export function mergeLocationHashWithViewport(
  baseHash: string,
  cameras: ViewportCameras,
  baselineWidth: number,
): string {
  if (baseHash === "#") {
    return viewOnlyLocationHash(cameras, baselineWidth);
  }
  return `${baseHash}${buildViewHashSuffixFromCameras(cameras, baselineWidth)}`;
}

export function syncBaseHashPreservingViewport(options: {
  baseHash: string;
  rawHash?: string;
  hashMatchesBase?: (rawHash: string, baseHash: string) => boolean;
  history?: ViewportUrlHistory;
  location?: ViewportUrlLocation;
}): void {
  const historyRef = options.history ?? defaultHistory();
  const locationRef = options.location ?? defaultLocation();
  const raw = options.rawHash ?? locationRef.hash;
  const viewInHash = parseViewportUrlFrame(raw);
  const matches =
    options.hashMatchesBase?.(raw, options.baseHash) ??
    (options.baseHash === "#"
      ? raw === "#" || raw.startsWith(`#${VIEWPORT_URL_VIEW_ONLY_PREFIX}`)
      : raw === options.baseHash || raw.startsWith(`${options.baseHash}${VIEWPORT_URL_VIEW_TOKEN}`));
  if (matches && viewInHash) {
    return;
  }
  if (raw !== options.baseHash) {
    historyRef.replaceState(history.state, "", options.baseHash);
  }
}

export function readViewportCamerasFromDiagramHost(
  host: HTMLElement,
): ViewportCameras | null {
  const fromHost = readWorldCameraFromHost(host);
  if (fromHost) {
    return { canvas: { viewBox: { ...fromHost } } };
  }
  const svg = host.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) {
    return null;
  }
  const { camera } = canvasCameraFromSvg(svg);
  return { canvas: camera };
}

export function readViewportBaselineWidthFromHost(host: HTMLElement): number | null {
  const svg = host.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) {
    return null;
  }
  return readViewBoxBaselineFromSvg(svg).baseW;
}

let applyingViewportFromUrl = false;

export type ApplyViewportUrlFrameOptions = {
  worldCamera?: WorldCameraLayerOptions;
};

export function applyViewportUrlFrameToHost(
  host: HTMLElement,
  frame: ViewportUrlFrame,
  options: ApplyViewportUrlFrameOptions = {},
): boolean {
  const svg = host.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) {
    return false;
  }
  const baseline = readViewBoxBaselineFromSvg(svg);
  applyingViewportFromUrl = true;
  try {
    const cameras = viewportCamerasFromParts({
      zoom: frame.zoom,
      cx: frame.cx,
      cy: frame.cy,
      baselineWidth: baseline.baseW,
      baselineHeight: baseline.baseH,
    });
    return applyWorldCameraToHost(host, cameras.canvas.viewBox, options.worldCamera ?? {});
  } finally {
    applyingViewportFromUrl = false;
  }
}

export function applyViewportFromLocationHash(
  host: HTMLElement,
  rawHash: string,
  options: ApplyViewportUrlFrameOptions = {},
): boolean {
  const frame = parseViewportUrlFrame(rawHash);
  if (!frame) {
    return false;
  }
  return applyViewportUrlFrameToHost(host, frame, options);
}

export function stripViewportFromLocationHash(options: {
  history?: ViewportUrlHistory;
  location?: ViewportUrlLocation;
} = {}): void {
  const historyRef = options.history ?? defaultHistory();
  const locationRef = options.location ?? defaultLocation();
  const stripped = stripViewFromHashFragment(locationRef.hash.replace(/^#/, ""));
  const next = stripped ? `#${stripped}` : "";
  if (locationRef.hash !== next) {
    historyRef.replaceState(history.state, "", next);
  }
}

export function notifyViewportCameraChanged(host: HTMLElement): void {
  host.dispatchEvent(new CustomEvent(VIEWPORT_CAMERA_CHANGE_EVENT, { bubbles: true }));
}

export function pushViewportUrlNow(host: HTMLElement): void {
  host.dispatchEvent(new CustomEvent(VIEWPORT_URL_PUSH_EVENT, { bubbles: true }));
}

const DEFAULT_URL_DEBOUNCE_MS = 400;
const DEFAULT_CAMERA_READY_FRAMES = 12;

/** Retry until SVG layout can accept {@link applyWorldCameraToHost}. */
export function whenDiagramHostCameraReady(
  host: HTMLElement,
  run: () => boolean,
  options: { maxFrames?: number } = {},
): void {
  const maxFrames = options.maxFrames ?? DEFAULT_CAMERA_READY_FRAMES;
  const attempt = (framesLeft: number): void => {
    const svg = host.querySelector("svg");
    if (!(svg instanceof SVGSVGElement)) {
      if (framesLeft <= 0) {
        return;
      }
      requestAnimationFrame(() => attempt(framesLeft - 1));
      return;
    }
    if (run()) {
      return;
    }
    if (framesLeft <= 0) {
      return;
    }
    requestAnimationFrame(() => attempt(framesLeft - 1));
  };
  attempt(maxFrames);
}

export type ViewportUrlSyncHandle = {
  unbind: () => void;
  pushNow: () => void;
  schedule: () => void;
  flush: () => void;
};

export type BindViewportUrlSyncOptions = {
  host: HTMLElement;
  baseHash: () => string;
  readCameras?: (host: HTMLElement) => ViewportCameras | null;
  readBaselineWidth?: (host: HTMLElement) => number | null;
  onAfterCommit?: () => void;
  debounceMs?: number;
  resyncHostEvent?: string;
  pushHostEvent?: string;
  history?: ViewportUrlHistory;
  location?: ViewportUrlLocation;
};

export function bindViewportUrlSync(options: BindViewportUrlSyncOptions): ViewportUrlSyncHandle {
  const debounceMs = options.debounceMs ?? DEFAULT_URL_DEBOUNCE_MS;
  const historyRef = options.history ?? defaultHistory();
  const locationRef = options.location ?? defaultLocation();
  const readCameras =
    options.readCameras ??
    ((host: HTMLElement) => readViewportCamerasFromDiagramHost(host));
  const readBaselineWidth =
    options.readBaselineWidth ??
    ((host: HTMLElement) => readViewportBaselineWidthFromHost(host));
  const resyncEvent = options.resyncHostEvent ?? VIEWPORT_CAMERA_CHANGE_EVENT;
  const pushEvent = options.pushHostEvent ?? VIEWPORT_URL_PUSH_EVENT;

  let debounceId = 0;

  const commitHashToHistory = (): void => {
    if (applyingViewportFromUrl) {
      return;
    }
    const baselineWidth = readBaselineWidth(options.host);
    if (baselineWidth === null || baselineWidth <= 0) {
      return;
    }
    const cameras = readCameras(options.host);
    if (!cameras) {
      return;
    }
    const next = mergeLocationHashWithViewport(options.baseHash(), cameras, baselineWidth);
    if (locationRef.hash !== next) {
      historyRef.replaceState(history.state, "", next);
    }
    options.onAfterCommit?.();
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

  const schedule = (): void => {
    if (applyingViewportFromUrl) {
      return;
    }
    cancelScheduledPush();
    debounceId = window.setTimeout(() => {
      debounceId = 0;
      commitHashToHistory();
    }, debounceMs);
  };

  const onTick = (): void => {
    schedule();
  };

  options.host.addEventListener(resyncEvent, onTick);
  options.host.addEventListener(pushEvent, pushNow);

  return {
    pushNow,
    schedule,
    flush: pushNow,
    unbind: () => {
      options.host.removeEventListener(resyncEvent, onTick);
      options.host.removeEventListener(pushEvent, pushNow);
      cancelScheduledPush();
    },
  };
}

/** Wire {@link IsoCanvasStage.attachPanZoom} `onViewBoxApplied` to URL hash sync. */
export function createViewportUrlPanZoomHooks(
  handle: Pick<ViewportUrlSyncHandle, "schedule" | "flush"> | null,
  options: { notifyHost?: HTMLElement } = {},
): {
  onViewBoxApplied: (viewBox: ViewBox, context: { notify: boolean }) => void;
} {
  return {
    onViewBoxApplied: (_viewBox, { notify }) => {
      handle?.schedule();
      if (notify) {
        if (options.notifyHost) {
          notifyViewportCameraChanged(options.notifyHost);
        }
        handle?.flush();
      }
    },
  };
}

export type RestoreDiagramViewportAfterMountOptions = {
  host: HTMLElement;
  pendingView: ViewportUrlFrame | null;
  sameScopeRemount: boolean;
  readStoredCameras: () => ViewportCameras | null;
  applyStoredCameras: (host: HTMLElement, cameras: ViewportCameras) => boolean;
  applyHome: (host: HTMLElement) => boolean;
  onRestored?: () => void;
  worldCamera?: WorldCameraLayerOptions;
  urlSync?: Pick<ViewportUrlSyncHandle, "flush"> | null;
};

/** Prefer hash view, then in-memory store on same-scope remount, else home. */
export function restoreDiagramViewportAfterMount(
  options: RestoreDiagramViewportAfterMountOptions,
): void {
  whenDiagramHostCameraReady(options.host, () => {
    if (options.pendingView) {
      const applyOptions: ApplyViewportUrlFrameOptions = {};
      if (options.worldCamera !== undefined) {
        applyOptions.worldCamera = options.worldCamera;
      }
      const ok = applyViewportUrlFrameToHost(options.host, options.pendingView, applyOptions);
      if (ok) {
        notifyViewportCameraChanged(options.host);
        options.urlSync?.flush();
        options.onRestored?.();
      }
      return ok;
    }
    const stored = options.sameScopeRemount ? options.readStoredCameras() : null;
    if (stored && options.applyStoredCameras(options.host, stored)) {
      notifyViewportCameraChanged(options.host);
      options.urlSync?.flush();
      options.onRestored?.();
      return true;
    }
    const ok = options.applyHome(options.host);
    if (ok) {
      options.urlSync?.flush();
      options.onRestored?.();
    }
    return ok;
  });
}
