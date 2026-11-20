// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ViewBox } from "../../types/core.js";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isValidViewBox(next: ViewBox): boolean {
  return (
    Number.isFinite(next.x) &&
    Number.isFinite(next.y) &&
    Number.isFinite(next.w) &&
    Number.isFinite(next.h) &&
    next.w > 0 &&
    next.h > 0
  );
}
