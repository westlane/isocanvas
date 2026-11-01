// Copyright (C) 2026 West Lane - All Rights Reserved

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

export function elementUserBBox(
  element: SVGGraphicsElement,
  fallbackSvg: SVGSVGElement | null,
): Box2d {
  const svg = element.ownerSVGElement ?? fallbackSvg;
  if (!svg || typeof element.getBBox !== "function") {
    return minSizeBox(element.getBBox?.() ?? { x: 0, y: 0, width: 1, height: 1 });
  }
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 && rect.height <= 0) {
    return minSizeBox(element.getBBox());
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
