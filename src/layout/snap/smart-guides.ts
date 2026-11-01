// Copyright (C) 2026 West Lane - All Rights Reserved

import type { Box2d } from "../../types/core.js";
import type { AlignmentGuide } from "../../types/grid.js";

export type AlignmentSnapResult = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  guides: AlignmentGuide[];
};

type BBoxLines = {
  min: number;
  mid: number;
  max: number;
};

function boxLines(box: Box2d, axis: "x" | "y"): BBoxLines {
  if (axis === "x") {
    return {
      min: box.x,
      mid: box.x + box.width / 2,
      max: box.x + box.width,
    };
  }
  return {
    min: box.y,
    mid: box.y + box.height / 2,
    max: box.y + box.height,
  };
}

const KINDS: AlignmentGuide["kind"][] = ["min", "mid", "max"];

function bestAxisSnap(
  moving: BBoxLines,
  others: Box2d[],
  axis: "x" | "y",
  threshold: number,
): { delta: number; guides: AlignmentGuide[] } {
  let bestDelta = 0;
  let bestDistance = threshold + 1;
  const guides: AlignmentGuide[] = [];

  for (let index = 0; index < others.length; index += 1) {
    const target = boxLines(others[index]!, axis);
    for (const kind of KINDS) {
      const targetValue = target[kind];
      for (const movingKind of KINDS) {
        const movingValue = moving[movingKind];
        const delta = targetValue - movingValue;
        const distance = Math.abs(delta);
        if (distance > threshold) {
          continue;
        }
        if (distance < bestDistance - 1e-6) {
          bestDistance = distance;
          bestDelta = delta;
          guides.length = 0;
          guides.push({ axis, value: targetValue, kind, targetIndex: index });
        } else if (Math.abs(distance - bestDistance) <= 1e-6) {
          guides.push({ axis, value: targetValue, kind, targetIndex: index });
        }
      }
    }
  }

  if (bestDistance > threshold) {
    return { delta: 0, guides: [] };
  }
  return { delta: bestDelta, guides };
}

export type AlignmentSnapOptions = {
  moving: Box2d;
  others: readonly Box2d[];
  /** Max px/user-unit distance to snap (same space as `moving`). */
  threshold: number;
};

/**
 * Figma-style edge/center alignment against sibling boxes (same coordinate space as `moving`).
 */
export function snapBoxWithAlignmentGuides(options: AlignmentSnapOptions): AlignmentSnapResult {
  const { moving, others, threshold } = options;
  if (others.length === 0 || threshold <= 0) {
    return { x: moving.x, y: moving.y, dx: 0, dy: 0, guides: [] };
  }

  const xSnap = bestAxisSnap(boxLines(moving, "x"), [...others], "x", threshold);
  const ySnap = bestAxisSnap(boxLines(moving, "y"), [...others], "y", threshold);

  return {
    x: moving.x + xSnap.delta,
    y: moving.y + ySnap.delta,
    dx: xSnap.delta,
    dy: ySnap.delta,
    guides: [...(xSnap.delta !== 0 ? xSnap.guides : []), ...(ySnap.delta !== 0 ? ySnap.guides : [])],
  };
}
