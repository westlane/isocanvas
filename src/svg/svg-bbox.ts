// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { Box2d } from "../types/core.js";

export function clientPointToSvgUser(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return { x: 0, y: 0 };
  }
  return pt.matrixTransform(ctm.inverse());
}

function minSizeBox(box: { x: number; y: number; width: number; height: number }): Box2d {
  return {
    x: box.x,
    y: box.y,
    width: Math.max(box.width, 1),
    height: Math.max(box.height, 1),
  };
}

function accumulateTranslateToSvg(element: Element, svg: SVGSVGElement): { x: number; y: number } {
  let tx = 0;
  let ty = 0;
  let node: Element | null = element;
  while (node && node !== svg) {
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

function elementBBoxViaTranslateChain(
  element: SVGGraphicsElement,
  svg: SVGSVGElement,
): Box2d | null {
  let local: DOMRect;
  try {
    local = element.getBBox();
  } catch {
    return null;
  }
  if (local.width <= 0 || local.height <= 0) {
    return null;
  }
  const shift = accumulateTranslateToSvg(element, svg);
  return minSizeBox({
    x: local.x + shift.x,
    y: local.y + shift.y,
    width: local.width,
    height: local.height,
  });
}

function elementBBoxViaCtm(element: SVGGraphicsElement, svg: SVGSVGElement): Box2d | null {
  let local: DOMRect;
  try {
    local = element.getBBox();
  } catch {
    return null;
  }
  if (local.width <= 0 || local.height <= 0) {
    return null;
  }
  const ctm = element.getCTM();
  if (!ctm || typeof svg.createSVGPoint !== "function") {
    return null;
  }
  const point = svg.createSVGPoint();
  if (typeof point.matrixTransform !== "function") {
    return null;
  }
  const corners = [
    { x: local.x, y: local.y },
    { x: local.x + local.width, y: local.y },
    { x: local.x, y: local.y + local.height },
    { x: local.x + local.width, y: local.y + local.height },
  ];
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const corner of corners) {
    point.x = corner.x;
    point.y = corner.y;
    const mapped = point.matrixTransform(ctm);
    minX = Math.min(minX, mapped.x);
    minY = Math.min(minY, mapped.y);
    maxX = Math.max(maxX, mapped.x);
    maxY = Math.max(maxY, mapped.y);
  }
  return minSizeBox({ x: minX, y: minY, width: maxX - minX, height: maxY - minY });
}

function elementBBoxViaScreenRect(
  element: SVGGraphicsElement,
  svg: SVGSVGElement,
): Box2d | null {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }
  const tl = clientPointToSvgUser(svg, rect.left, rect.top);
  const br = clientPointToSvgUser(svg, rect.right, rect.bottom);
  const x1 = Math.min(tl.x, br.x);
  const y1 = Math.min(tl.y, br.y);
  return minSizeBox({
    x: x1,
    y: y1,
    width: Math.max(tl.x, br.x) - x1,
    height: Math.max(tl.y, br.y) - y1,
  });
}

export function elementUserBBox(
  element: SVGGraphicsElement,
  fallbackSvg: SVGSVGElement | null,
): Box2d {
  const svg = element.ownerSVGElement ?? fallbackSvg;
  if (!svg || typeof element.getBBox !== "function") {
    return minSizeBox(element.getBBox?.() ?? { x: 0, y: 0, width: 1, height: 1 });
  }
  const fromScreen = elementBBoxViaScreenRect(element, svg);
  if (fromScreen) {
    return fromScreen;
  }
  const fromCtm = elementBBoxViaCtm(element, svg);
  if (fromCtm) {
    return fromCtm;
  }
  const fromTranslate = elementBBoxViaTranslateChain(element, svg);
  if (fromTranslate) {
    return fromTranslate;
  }
  return minSizeBox(element.getBBox());
}

/** True when the SVG is laid out so painted bounds are meaningful. */
export function svgHasPaintLayout(svg: SVGSVGElement): boolean {
  return svg.clientWidth > 0 && svg.clientHeight > 0;
}
