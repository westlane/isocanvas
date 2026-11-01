// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ViewBox } from "../types/core.js";
import { isValidViewBox, clamp } from "./view-box/clamp.js";
import { readViewBoxFromSvg, viewBoxAlignFromSvg } from "./view-box/attributes.js";
import {
  applyWorldCameraToHost,
  readWorldCameraFromHost,
  readWorldCameraViewport,
} from "./world/apply-world-camera.js";
import {
  viewBoxPanByWorldViewport,
  viewBoxUserFromClientInWorldViewport,
  viewBoxZoomAtPoint,
  wheelZoomFactor,
} from "./interaction.js";
import type { WorldCameraLayerOptions } from "../types/camera.js";

/** Options for {@link attachWorldCameraPanZoom}. */
export type AttachWorldCameraPanZoomOptions = {
  surface: HTMLElement;
  host: HTMLElement;
  worldCamera?: WorldCameraLayerOptions;
  onViewBoxApplied?: (viewBox: ViewBox, context: { notify: boolean }) => void;
  resyncOnHostEvent?: string;
  spacePanClass?: string;
  panningClass?: string;
};

export type WorldCameraPanZoomDetach = () => void;

function hostSvg(host: HTMLElement): SVGSVGElement | null {
  const svg = host.querySelector("svg");
  return svg instanceof SVGSVGElement ? svg : null;
}

function clampViewBox(vb: ViewBox): ViewBox {
  return {
    x: clamp(vb.x, -1e6, 1e6),
    y: clamp(vb.y, -1e6, 1e6),
    w: clamp(vb.w, 1e-6, 1e6),
    h: clamp(vb.h, 1e-6, 1e6),
  };
}

/** Logical camera: host world attribute when present, else SVG viewBox. */
export function readLogicalViewBoxFromHost(host: HTMLElement, svg: SVGSVGElement): ViewBox {
  const fromHost = readWorldCameraFromHost(host);
  if (fromHost) {
    return fromHost;
  }
  return readViewBoxFromSvg(svg);
}

/** Primary or middle-button drag may pan the world camera. */
export function canStartWorldCameraPan(event: PointerEvent): boolean {
  return event.button === 0 || event.button === 1;
}

/** Pointer + wheel pan/zoom on a world-camera host; returns detach. */
export function attachWorldCameraPanZoom(
  options: AttachWorldCameraPanZoomOptions,
): WorldCameraPanZoomDetach {
  const spacePanClass = options.spacePanClass ?? "is-space-pan";
  const panningClass = options.panningClass ?? "is-panning";
  let spacePan = false;
  let panning = false;
  let panPointerId = -1;
  let lastPanX = 0;
  let lastPanY = 0;

  const viewportMetrics = (): {
    width: number;
    height: number;
    anchorRect: DOMRect;
    offsetX: number;
    offsetY: number;
  } | null => {
    const svg = hostSvg(options.host);
    if (!svg) {
      return null;
    }
    const layout = readWorldCameraViewport(options.host, options.worldCamera);
    if (!layout) {
      const rect = options.surface.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return null;
      }
      return {
        width: rect.width,
        height: rect.height,
        anchorRect: rect,
        offsetX: 0,
        offsetY: 0,
      };
    }
    return {
      width: layout.viewport.widthPx,
      height: layout.viewport.heightPx,
      anchorRect: layout.anchorRect,
      offsetX: layout.viewport.offsetXPx,
      offsetY: layout.viewport.offsetYPx,
    };
  };

  const applyCamera = (next: ViewBox, notify = true): void => {
    if (!isValidViewBox(next)) {
      return;
    }
    const clamped = clampViewBox(next);
    applyWorldCameraToHost(options.host, clamped, options.worldCamera);
    options.onViewBoxApplied?.(clamped, { notify });
  };

  const resyncWorld = (): void => {
    const svg = hostSvg(options.host);
    if (!svg) {
      return;
    }
    const fromHost = readWorldCameraFromHost(options.host);
    if (fromHost) {
      applyCamera(fromHost, false);
      return;
    }
    applyCamera(readViewBoxFromSvg(svg), false);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "Space" && !spacePan) {
      spacePan = true;
      options.surface.classList.add(spacePanClass);
      event.preventDefault();
    }
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    if (event.code === "Space") {
      spacePan = false;
      options.surface.classList.remove(spacePanClass);
    }
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (!canStartWorldCameraPan(event)) {
      return;
    }
    const svg = hostSvg(options.host);
    if (!svg) {
      return;
    }
    panning = true;
    panPointerId = event.pointerId;
    lastPanX = event.clientX;
    lastPanY = event.clientY;
    options.surface.classList.add(panningClass);
    options.surface.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!panning || event.pointerId !== panPointerId) {
      return;
    }
    const svg = hostSvg(options.host);
    if (!svg) {
      return;
    }
    const dx = event.clientX - lastPanX;
    const dy = event.clientY - lastPanY;
    lastPanX = event.clientX;
    lastPanY = event.clientY;
    const metrics = viewportMetrics();
    if (!metrics) {
      return;
    }
    const { width, height } = metrics;
    const vb = readLogicalViewBoxFromHost(options.host, svg);
    const align = viewBoxAlignFromSvg(svg);
    applyCamera(viewBoxPanByWorldViewport(vb, dx, dy, width, height, align));
  };

  const endPan = (event: PointerEvent): void => {
    if (!panning || event.pointerId !== panPointerId) {
      return;
    }
    panning = false;
    options.surface.classList.remove(panningClass);
    try {
      options.surface.releasePointerCapture(panPointerId);
    } catch {
      /* ignore */
    }
  };

  const onWheel = (event: WheelEvent): void => {
    const svg = hostSvg(options.host);
    if (!svg) {
      return;
    }
    const metrics = viewportMetrics();
    if (!metrics) {
      return;
    }
    const { width, height, anchorRect, offsetX, offsetY } = metrics;
    if (width <= 0 || height <= 0) {
      return;
    }
    event.preventDefault();
    const vb = readLogicalViewBoxFromHost(options.host, svg);
    const align = viewBoxAlignFromSvg(svg);
    const { x: userX, y: userY } = viewBoxUserFromClientInWorldViewport(
      event.clientX,
      event.clientY,
      anchorRect,
      vb,
      width,
      height,
      offsetX,
      offsetY,
      align,
    );
    if (event.shiftKey) {
      applyCamera(
        viewBoxPanByWorldViewport(vb, event.deltaX, event.deltaY, width, height, align),
      );
      return;
    }
    const factor = wheelZoomFactor(event.deltaY);
    applyCamera(viewBoxZoomAtPoint(vb, userX, userY, factor));
  };

  const capture = { capture: true };
  const onContextMenu = (event: Event): void => {
    event.preventDefault();
  };
  options.surface.addEventListener("contextmenu", onContextMenu);
  options.surface.addEventListener("pointerdown", onPointerDown, capture);
  options.surface.addEventListener("pointermove", onPointerMove, capture);
  options.surface.addEventListener("pointerup", endPan, capture);
  options.surface.addEventListener("pointercancel", endPan, capture);
  options.surface.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("resize", resyncWorld);

  const resyncEvent = options.resyncOnHostEvent;
  if (resyncEvent) {
    options.host.addEventListener(resyncEvent, resyncWorld);
  }

  return () => {
    options.surface.removeEventListener("contextmenu", onContextMenu);
    options.surface.removeEventListener("pointerdown", onPointerDown, capture);
    options.surface.removeEventListener("pointermove", onPointerMove, capture);
    options.surface.removeEventListener("pointerup", endPan, capture);
    options.surface.removeEventListener("pointercancel", endPan, capture);
    options.surface.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("resize", resyncWorld);
    if (resyncEvent) {
      options.host.removeEventListener(resyncEvent, resyncWorld);
    }
  };
}
