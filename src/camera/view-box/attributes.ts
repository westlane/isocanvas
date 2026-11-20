// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ViewBox } from "../../types/core.js";
import type { WorldViewBoxAlign } from "../../types/camera.js";

export function parseViewBoxAttribute(raw: string | null): ViewBox {
  const parts = raw?.trim().split(/\s+/).map(Number) ?? [];
  if (parts.length === 4 && parts.every((value) => Number.isFinite(value))) {
    return { x: parts[0]!, y: parts[1]!, w: parts[2]!, h: parts[3]! };
  }
  return { x: 0, y: 0, w: 1, h: 1 };
}

export function readViewBoxFromSvg(svg: SVGSVGElement): ViewBox {
  return parseViewBoxAttribute(svg.getAttribute("viewBox"));
}

/** `preserveAspectRatio` for framing artboard content centered in the viewport (SVG meet). */
export const VIEWPORT_CENTERED_MEET = "xMidYMid meet";

export const VIEWPORT_LEFT_BOTTOM_MEET = "xMinYMin meet";

export function setViewportCenteredMeet(svg: SVGSVGElement): void {
  svg.setAttribute("preserveAspectRatio", VIEWPORT_CENTERED_MEET);
}

export function setViewportLeftBottomMeet(svg: SVGSVGElement): void {
  svg.setAttribute("preserveAspectRatio", VIEWPORT_LEFT_BOTTOM_MEET);
}

function applyViewportMeet(svg: SVGSVGElement): void {
  if (svg.dataset.icViewportMeet === "min") {
    setViewportLeftBottomMeet(svg);
    return;
  }
  setViewportCenteredMeet(svg);
}

export function writeViewBoxToSvg(svg: SVGSVGElement, viewBox: ViewBox): void {
  const next = [viewBox.x, viewBox.y, viewBox.w, viewBox.h].join(" ");
  if (svg.getAttribute("viewBox") === next) {
    return;
  }
  svg.setAttribute("viewBox", next);
  applyViewportMeet(svg);
}

const VIEWBOX_EPS = 1e-9;

/** Cheap guard before touching DOM during synced multi-host camera updates. */
export function viewBoxesNearlyEqual(a: ViewBox, b: ViewBox): boolean {
  return (
    Math.abs(a.x - b.x) < VIEWBOX_EPS &&
    Math.abs(a.y - b.y) < VIEWBOX_EPS &&
    Math.abs(a.w - b.w) < VIEWBOX_EPS &&
    Math.abs(a.h - b.h) < VIEWBOX_EPS
  );
}

/** Match {@link worldTransformFromViewBox} / SVG `preserveAspectRatio` meet alignment. */
export function viewBoxAlignFromSvg(svg: SVGSVGElement): WorldViewBoxAlign {
  const token = svg.getAttribute("preserveAspectRatio")?.trim().split(/\s+/)[0] ?? "xMidYMid";
  if (token === "xMinYMin") {
    return "min";
  }
  return "mid";
}

export function viewBoxCenter(viewBox: ViewBox): { cx: number; cy: number } {
  return {
    cx: viewBox.x + viewBox.w / 2,
    cy: viewBox.y + viewBox.h / 2,
  };
}

export function zoomFromViewBox(viewBox: ViewBox, baselineWidth: number): number {
  return baselineWidth / Math.max(viewBox.w, 1e-6);
}

export function viewBoxFromZoomCenter(
  zoom: number,
  cx: number,
  cy: number,
  baselineWidth: number,
  baselineHeight: number,
): ViewBox {
  const w = baselineWidth / zoom;
  const h = baselineHeight / zoom;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}
