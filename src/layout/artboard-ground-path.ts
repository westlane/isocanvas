// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { Box2d } from "../types/core.js";
import { IC_ARTBOARD_OUTLINE_CLASS } from "./artboard-outline.js";

/** Parse `M` / `L` vertices from an SVG path `d` (iso ground outlines use polylines only). */
export function parseSvgPathMoveLinePoints(d: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const re = /[ML]\s*(-?[\d.eE+-]+)[\s,]+(-?[\d.eE+-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    points.push({ x: Number(m[1]), y: Number(m[2]) });
  }
  return points;
}

function accumulateTranslateTransforms(
  element: Element,
  stopBefore: Element,
): { x: number; y: number } {
  let tx = 0;
  let ty = 0;
  let node: Element | null = element.parentElement;
  while (node && node !== stopBefore) {
    const transform = node.getAttribute("transform");
    if (transform?.includes("translate")) {
      const match = /translate\(([-\d.eE+-]+)[,\s]+([-,\d.eE+-]+)\)/.exec(transform);
      if (match) {
        tx += Number(match[1]);
        ty += Number(match[2]);
      }
    }
    node = node.parentElement;
  }
  return { x: tx, y: ty };
}

/** Map one vertex from path `d` local space into the owning SVG’s user space. */
export function artboardOutlinePathPointToSvgUserSpace(
  outline: SVGPathElement,
  local: { x: number; y: number },
): { x: number; y: number } {
  const svg = outline.ownerSVGElement;
  if (!svg) {
    return local;
  }
  if (typeof svg.createSVGPoint === "function") {
    const point = svg.createSVGPoint();
    point.x = local.x;
    point.y = local.y;
    const ctm = outline.getCTM();
    if (ctm && typeof point.matrixTransform === "function") {
      const mapped = point.matrixTransform(ctm);
      return { x: mapped.x, y: mapped.y };
    }
  }
  const shift = accumulateTranslateTransforms(outline, svg);
  return { x: local.x + shift.x, y: local.y + shift.y };
}

export function readArtboardOutlinePath(
  root: Element | DocumentFragment,
): SVGPathElement | null {
  const outline = root.querySelector(`path.${IC_ARTBOARD_OUTLINE_CLASS}`);
  return outline instanceof SVGPathElement ? outline : null;
}

/** Corner / edge endpoints of the iso artboard ground footprint in SVG user space. */
export function readArtboardOutlineEdgePoints(
  root: Element | DocumentFragment,
): { x: number; y: number }[] {
  const outline = readArtboardOutlinePath(root);
  if (!outline) {
    return [];
  }
  const local = parseSvgPathMoveLinePoints(outline.getAttribute("d") ?? "");
  return local.map((point) => artboardOutlinePathPointToSvgUserSpace(outline, point));
}

function boundsFromPoints(points: readonly { x: number; y: number }[]): Box2d | null {
  if (points.length === 0) {
    return null;
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const width = maxX - minX;
  const height = maxY - minY;
  if (width <= 0 || height <= 0) {
    return null;
  }
  return { x: minX, y: minY, width, height };
}

function centroidFromPoints(points: readonly { x: number; y: number }[]): { x: number; y: number } {
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

export function artboardOutlineEdgeCentroid(
  points: readonly { x: number; y: number }[],
): { x: number; y: number } | null {
  if (points.length === 0) {
    return null;
  }
  return centroidFromPoints(points);
}

export function artboardOutlineEdgeBoundsCenter(
  points: readonly { x: number; y: number }[],
): { x: number; y: number } | null {
  const bounds = boundsFromPoints(points);
  if (!bounds) {
    return null;
  }
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

export function artboardOutlineEdgeFitBox(points: readonly { x: number; y: number }[]): Box2d | null {
  return boundsFromPoints(points);
}

export function readArtboardOutlineEdgeFitBox(root: Element | DocumentFragment): Box2d | null {
  const points = readArtboardOutlineEdgePoints(root);
  if (points.length < 3) {
    return null;
  }
  return artboardOutlineEdgeFitBox(points);
}
