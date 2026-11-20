// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { Box2d } from "../types/core.js";

export function unionBox(target: Box2d, box: Box2d): Box2d {
  if (!Number.isFinite(box.width) || box.width <= 0) {
    return target;
  }
  if (!Number.isFinite(target.width) || target.width <= 0) {
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }
  const x1 = Math.min(target.x, box.x);
  const y1 = Math.min(target.y, box.y);
  const x2 = Math.max(target.x + target.width, box.x + box.width);
  const y2 = Math.max(target.y + target.height, box.y + box.height);
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

export function inflateBox(box: Box2d, factor = 1.45): Box2d {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const width = box.width * factor;
  const height = box.height * factor;
  return {
    x: cx - width / 2,
    y: cy - height / 2,
    width: Math.max(width, 1),
    height: Math.max(height, 1),
  };
}
