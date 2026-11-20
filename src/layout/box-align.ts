// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { readViewBoxFromSvg } from "../camera/view-box/attributes.js";
import { unionBox } from "./box2d.js";
import type { Box2d, ViewBox } from "../types/core.js";

/** Edge/center alignment for axis-aligned boxes (Figma-style align tools). */
export type BoxAlignMode =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "center-horizontal"
  | "center-vertical";

/** Map SVG `viewBox` user units to an axis-aligned canvas frame for alignment. */
export function boxFromViewBox(viewBox: ViewBox): Box2d {
  return { x: viewBox.x, y: viewBox.y, width: viewBox.w, height: viewBox.h };
}

/** Canvas bounds from a diagram SVG (its `viewBox`, or width/height fallback). */
export function canvasBoxFromSvg(svg: SVGSVGElement): Box2d {
  return boxFromViewBox(readViewBoxFromSvg(svg));
}

/** Bounding rectangle of one or more boxes (empty input → zero-area box at origin). */
export function boxesBounds(boxes: readonly Box2d[]): Box2d {
  return boxes.reduce(
    (target, box) => unionBox(target, box),
    { x: 0, y: 0, width: 0, height: 0 },
  );
}

/** Move `box` so the chosen edge or center matches `reference` on that axis. */
export function alignBox(box: Box2d, mode: BoxAlignMode, reference: Box2d): Box2d {
  switch (mode) {
    case "left":
      return { ...box, x: reference.x };
    case "right":
      return { ...box, x: reference.x + reference.width - box.width };
    case "top":
      return { ...box, y: reference.y };
    case "bottom":
      return { ...box, y: reference.y + reference.height - box.height };
    case "center-horizontal":
      return {
        ...box,
        x: reference.x + reference.width / 2 - box.width / 2,
      };
    case "center-vertical":
      return {
        ...box,
        y: reference.y + reference.height / 2 - box.height / 2,
      };
    default: {
      const never: never = mode;
      throw new Error(`Unhandled BoxAlignMode: ${never}`);
    }
  }
}

/**
 * Align every box to the same reference frame.
 * Default reference is the union bounds of `boxes` (selection hull).
 */
export function alignBoxes(
  boxes: readonly Box2d[],
  mode: BoxAlignMode,
  reference?: Box2d,
): Box2d[] {
  if (boxes.length === 0) {
    return [];
  }
  const ref = reference ?? boxesBounds(boxes);
  return boxes.map((box) => alignBox(box, mode, ref));
}
