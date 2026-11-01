// Copyright (C) 2026 West Lane - All Rights Reserved

import type { IsometricOrientation } from "../types/diagram.js";

export const IC_ISOMETRIC_ORIENTATION_ATTR = "data-ic-isometric-orientation";

export const DEFAULT_ISOMETRIC_ORIENTATION: IsometricOrientation = "default";

export function isIsometricOrientationRotated(orientation: IsometricOrientation): boolean {
  return orientation === "rotated";
}

export function readIsometricOrientationFromElement(
  element: HTMLElement,
): IsometricOrientation {
  return element.getAttribute(IC_ISOMETRIC_ORIENTATION_ATTR) === "rotated"
    ? "rotated"
    : DEFAULT_ISOMETRIC_ORIENTATION;
}

export function paintIsometricOrientation(
  element: HTMLElement,
  orientation: IsometricOrientation,
): void {
  if (orientation === DEFAULT_ISOMETRIC_ORIENTATION) {
    element.removeAttribute(IC_ISOMETRIC_ORIENTATION_ATTR);
    return;
  }
  element.setAttribute(IC_ISOMETRIC_ORIENTATION_ATTR, "rotated");
}

export function toggleIsometricOrientation(
  orientation: IsometricOrientation,
): IsometricOrientation {
  return isIsometricOrientationRotated(orientation)
    ? DEFAULT_ISOMETRIC_ORIENTATION
    : "rotated";
}

/** ic-canvas keeps the mount host on `props.container`, not a top-level field. */
export type IsometricCanvasMountHost = {
  props?: { container?: Element | string };
};

export function readIsometricOrientationFromCanvas(canvas: unknown): IsometricOrientation {
  const host = isometricCanvasMountHost(canvas);
  if (host) {
    return readIsometricOrientationFromElement(host);
  }
  return DEFAULT_ISOMETRIC_ORIENTATION;
}

export function isometricCanvasMountHost(canvas: unknown): HTMLElement | null {
  const raw = (canvas as IsometricCanvasMountHost).props?.container;
  if (raw instanceof HTMLElement) {
    return raw;
  }
  if (typeof raw === "string") {
    const el = document.querySelector(raw);
    return el instanceof HTMLElement ? el : null;
  }
  return null;
}

/** TOP labels read toward the viewer when the iso view is rotated 90° clockwise. */
export const ISO_BOX_LABEL_ROTATION_DEG: Record<IsometricOrientation, number> = {
  default: 0,
  rotated: 90,
};
