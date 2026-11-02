// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane
/** Demo session snapshot, persistence adapters, and in-memory artboard slices. */

import {
  applyWorldCameraToHost as applyWorldCameraCore,
  canvasCameraFromSvg,
  DEFAULT_ISOMETRIC_ORIENTATION,
  paintIsometricOrientation,
  readViewBoxBaselineFromSvg,
  readWorldCameraFromHost,
  toggleIsometricOrientation,
  VIEWPORT_CAMERA_CHANGE_EVENT,
  type CanvasCamera,
  type IsometricOrientation,
  type ViewBoxBaseline,
  type ViewportCameras,
  type WorldCameraLayerOptions,
} from "@westlane/isocanvas";
import {
  createLoroFieldPersistenceWithLocalDocBytes,
  createLocalStoragePersistenceAdapter,
  createMemoryPersistenceAdapter,
  createPersistenceRegistry,
  createSessionStoragePersistenceAdapter,
  createWebStoragePersistenceAdapter,
  snapshotFromVersionedValue,
  type PersistenceAdapter,
} from "@westlane/isocanvas/persistence";
import { getDemoLogger } from "./log.js";

export function canvasRouteKey(route: { groupId: string; itemId: string }): string {
  return `${route.groupId}/${route.itemId}`;
}

let demoIsometricOrientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION;

export function getDemoIsometricOrientation(): IsometricOrientation {
  return demoIsometricOrientation;
}

export function setDemoIsometricOrientation(orientation: IsometricOrientation): void {
  demoIsometricOrientation = orientation;
}

export function applyDemoIsometricOrientationToHost(host: HTMLElement): void {
  paintIsometricOrientation(host, demoIsometricOrientation);
}

export function toggleDemoIsometricOrientation(host: HTMLElement): IsometricOrientation {
  demoIsometricOrientation = toggleIsometricOrientation(demoIsometricOrientation);
  applyDemoIsometricOrientationToHost(host);
  return demoIsometricOrientation;
}

export function demoWorldCameraLayerOptions(): WorldCameraLayerOptions {
  const frame = document.getElementById("diagram-frame");
  return {
    fallbackAnchor: frame instanceof HTMLElement ? frame : null,
  };
}

let canvasCamera: CanvasCamera | undefined;
let baseline: ViewBoxBaseline | undefined;

export function getDemoCanvasCamera(): CanvasCamera | undefined {
  return canvasCamera ? { viewBox: { ...canvasCamera.viewBox } } : undefined;
}

export function setDemoCanvasCamera(camera: CanvasCamera): void {
  canvasCamera = { viewBox: { ...camera.viewBox } };
}

export function ensureDemoBaseline(svg: SVGSVGElement): ViewBoxBaseline {
  if (baseline) {
    return baseline;
  }
  return syncDemoBaselineFromSvg(svg);
}

/** Re-read home framing from SVG mount metadata (use before snap-home). */
export function syncDemoBaselineFromSvg(svg: SVGSVGElement): ViewBoxBaseline {
  baseline = readViewBoxBaselineFromSvg(svg);
  return baseline;
}

export function resetDemoBaseline(): void {
  baseline = undefined;
}

export function applyDemoWorldCameraToHost(
  host: HTMLElement,
  camera: CanvasCamera["viewBox"],
): boolean {
  return applyWorldCameraCore(host, camera, demoWorldCameraLayerOptions());
}

export function captureDemoCanvasCameraFromDom(host: HTMLElement): CanvasCamera | null {
  const fromHost = readWorldCameraFromHost(host);
  if (fromHost) {
    const camera = { viewBox: fromHost };
    setDemoCanvasCamera(camera);
    return camera;
  }
  const svg = host.querySelector("svg");
  if (!svg) {
    return null;
  }
  const base = ensureDemoBaseline(svg);
  const { camera } = canvasCameraFromSvg(svg, {
    x: 0,
    y: 0,
    w: base.baseW,
    h: base.baseH,
  });
  setDemoCanvasCamera(camera);
  return camera;
}

export function applyDemoCanvasCameraToHost(host: HTMLElement): boolean {
  const svg = host.querySelector("svg");
  if (!svg) {
    return false;
  }
  const base = ensureDemoBaseline(svg);
  const camera = getDemoCanvasCamera() ?? {
    viewBox: { x: 0, y: 0, w: base.baseW, h: base.baseH },
  };
  return applyDemoWorldCameraToHost(host, camera.viewBox);
}

export function getDemoViewportCameras(host: HTMLElement): ViewportCameras | null {
  captureDemoCanvasCameraFromDom(host);
  const canvas = getDemoCanvasCamera();
  if (!canvas) {
    return null;
  }
  return {
    canvas,
  };
}

export function applyDemoViewportCamerasToStore(cameras: ViewportCameras): void {
  setDemoCanvasCamera(cameras.canvas);
}

export function notifyDemoCanvasCameraChanged(host: HTMLElement): void {
  captureDemoCanvasCameraFromDom(host);
  host.dispatchEvent(new CustomEvent(VIEWPORT_CAMERA_CHANGE_EVENT, { bubbles: true }));
  host.dispatchEvent(new CustomEvent("viewport-debug-tick", { bubbles: true }));
}

export function getDemoBaselineForSvg(svg: SVGSVGElement): ViewBoxBaseline | null {
  return baseline ?? ensureDemoBaseline(svg);
}

export const DEMO_SESSION_VERSION = 2 as const;

export type DemoSessionSnapshot = {
  v: typeof DEMO_SESSION_VERSION;
  canvas?: CanvasCamera;
  isometricOrientation?: IsometricOrientation;
  slices: Record<string, unknown>;
};

export function demoSessionSnapshotFromValue(value: unknown): DemoSessionSnapshot | null {
  return snapshotFromVersionedValue<DemoSessionSnapshot>(value, DEMO_SESSION_VERSION);
}

export const DEFAULT_DEMO_SESSION_STORAGE_KEY = "isocanvas-demo-session";

export type DemoSessionPersistenceAdapter = PersistenceAdapter<DemoSessionSnapshot>;

const demoSessionPersistence = createPersistenceRegistry<DemoSessionSnapshot>();

export function getDemoSessionPersistenceAdapter(): DemoSessionPersistenceAdapter {
  return demoSessionPersistence.getAdapter();
}

export function setDemoSessionPersistenceAdapter(
  adapter: DemoSessionPersistenceAdapter | null,
): void {
  demoSessionPersistence.setAdapter(adapter);
}

export function setDemoSessionPersistenceAfterSave(fn: (() => void) | undefined): void {
  demoSessionPersistence.setAfterSave(fn);
}

export function runDemoSessionPersistenceAfterSave(): void {
  demoSessionPersistence.runAfterSave();
}

function parseDemoSessionRaw(raw: string): DemoSessionSnapshot | null {
  try {
    return demoSessionSnapshotFromValue(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function createMemoryDemoSessionPersistenceAdapter(
  initial: DemoSessionSnapshot | null = null,
): DemoSessionPersistenceAdapter & { snapshot: () => DemoSessionSnapshot | null } {
  return createMemoryPersistenceAdapter(initial);
}

export function createWebStorageAdapter(options: {
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  key?: string;
  id?: string;
}): DemoSessionPersistenceAdapter {
  return createWebStoragePersistenceAdapter({
    storage: options.storage,
    key: options.key ?? DEFAULT_DEMO_SESSION_STORAGE_KEY,
    id: options.id,
    parse: parseDemoSessionRaw,
  });
}

export function createLocalStorageAdapter(
  key = DEFAULT_DEMO_SESSION_STORAGE_KEY,
): DemoSessionPersistenceAdapter | null {
  return createLocalStoragePersistenceAdapter({
    key,
    parse: parseDemoSessionRaw,
  });
}

export function createSessionStorageAdapter(
  key = DEFAULT_DEMO_SESSION_STORAGE_KEY,
): DemoSessionPersistenceAdapter | null {
  return createSessionStoragePersistenceAdapter({
    key,
    parse: parseDemoSessionRaw,
  });
}

const DEMO_LORO_MAP_NAME = "isocanvasShowcase";
export const DEMO_LORO_FIELD_KEY = "demoSession";

export function installDemoSessionPersistence(): void {
  const { adapter, afterSave } = createLoroFieldPersistenceWithLocalDocBytes({
    mapName: DEMO_LORO_MAP_NAME,
    fieldKey: DEMO_LORO_FIELD_KEY,
    parse: demoSessionSnapshotFromValue,
    localSessionKey: DEFAULT_DEMO_SESSION_STORAGE_KEY,
  });
  setDemoSessionPersistenceAdapter(adapter);
  setDemoSessionPersistenceAfterSave(afterSave);
  getDemoLogger("persistence").info("Demo session persistence installed", {
    adapter: adapter.id,
  });
}

const artboardSlices = new Map<string, unknown>();

export function buildDemoSessionSnapshot(): DemoSessionSnapshot {
  const slices: Record<string, unknown> = {};
  for (const [key, value] of artboardSlices) {
    slices[key] = value;
  }
  const camera = getDemoCanvasCamera();
  return {
    v: 2,
    ...(camera ? { canvas: camera } : {}),
    isometricOrientation: getDemoIsometricOrientation(),
    slices,
  };
}

export function applyDemoSessionSnapshot(snapshot: DemoSessionSnapshot): void {
  if (snapshot.isometricOrientation) {
    setDemoIsometricOrientation(snapshot.isometricOrientation);
  }
  if (snapshot.canvas) {
    setDemoCanvasCamera(snapshot.canvas);
  }
  artboardSlices.clear();
  if (snapshot.slices) {
    for (const [key, value] of Object.entries(snapshot.slices)) {
      artboardSlices.set(key, value);
    }
  }
}

export function getArtboardSlice<T = unknown>(key: string): T | undefined {
  const value = artboardSlices.get(key);
  return value as T | undefined;
}

export function setArtboardSlice(key: string, slice: unknown): void {
  artboardSlices.set(key, slice);
  persistDemoSession();
}

export function clearArtboardSlice(key: string): void {
  artboardSlices.delete(key);
  persistDemoSession();
}

export function persistDemoSession(): void {
  getDemoSessionPersistenceAdapter().save(buildDemoSessionSnapshot());
  runDemoSessionPersistenceAfterSave();
}

export function hydrateDemoSession(): void {
  const snapshot = getDemoSessionPersistenceAdapter().load();
  if (!snapshot) {
    getDemoLogger("persistence").debug("No saved session to hydrate");
    return;
  }
  applyDemoSessionSnapshot(snapshot);
  getDemoLogger("persistence").info("Session hydrated", {
    adapter: getDemoSessionPersistenceAdapter().id,
    hasCamera: Boolean(snapshot.canvas),
    slices: Object.keys(snapshot.slices).length,
  });
}

export function routeKey(route: { groupId: string; itemId: string }): string {
  return canvasRouteKey(route);
}
