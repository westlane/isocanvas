// Copyright (C) 2026 West Lane - All Rights Reserved

/** When `"on"`, diagram surface CSS renders stencil outlines instead of filled shapes. */
export const IC_WIREFRAME_DATA_ATTR = "data-ic-wireframe";
export const IC_WIREFRAME_ON = "on";

export function readWireframeMode(target: HTMLElement): boolean {
  return target.getAttribute(IC_WIREFRAME_DATA_ATTR) === IC_WIREFRAME_ON;
}

export function applyWireframeMode(target: HTMLElement, enabled: boolean): void {
  if (enabled) {
    target.setAttribute(IC_WIREFRAME_DATA_ATTR, IC_WIREFRAME_ON);
  } else {
    target.removeAttribute(IC_WIREFRAME_DATA_ATTR);
  }
}

export function toggleWireframeMode(target: HTMLElement): boolean {
  const next = !readWireframeMode(target);
  applyWireframeMode(target, next);
  return next;
}
