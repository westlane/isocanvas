// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

/** When `"on"`, artboard division guides and SVG layout guides are visible (solid or wireframe). */
export const IC_GRID_LINES_DATA_ATTR = "data-ic-grid-lines";
export const IC_GRID_LINES_ON = "on";

export function readGridLinesMode(target: HTMLElement): boolean {
  return target.getAttribute(IC_GRID_LINES_DATA_ATTR) === IC_GRID_LINES_ON;
}

export function applyGridLinesMode(target: HTMLElement, enabled: boolean): void {
  if (enabled) {
    target.setAttribute(IC_GRID_LINES_DATA_ATTR, IC_GRID_LINES_ON);
  } else {
    target.removeAttribute(IC_GRID_LINES_DATA_ATTR);
  }
}

export function toggleGridLinesMode(target: HTMLElement): boolean {
  const next = !readGridLinesMode(target);
  applyGridLinesMode(target, next);
  return next;
}
