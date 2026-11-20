// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { DotGridMetrics, GridAxisPolicy } from "../../types/grid.js";

export function effectiveGridCellSize(policy: GridAxisPolicy): number {
  const size = policy.size;
  if (size <= 0) {
    return size;
  }
  const subdivision = policy.subdivision ?? 1;
  if (subdivision <= 1) {
    return size;
  }
  return size / subdivision;
}

export function snapAxisToGrid(value: number, policy: GridAxisPolicy): number {
  const cell = effectiveGridCellSize(policy);
  if (cell <= 0 || !Number.isFinite(value)) {
    return value;
  }

  const { origin, phase } = policy;
  const snapped =
    origin + phase + Math.round((value - origin - phase) / cell) * cell;

  const magnet = policy.magnetPx ?? 0;
  if (magnet > 0 && Math.abs(snapped - value) > magnet) {
    return value;
  }
  return snapped;
}

export function gridAxisPolicyFromMetrics(
  grid: DotGridMetrics,
  axis: "x" | "y",
  overrides?: Partial<GridAxisPolicy>,
): GridAxisPolicy {
  const base: GridAxisPolicy =
    axis === "x"
      ? {
          origin: grid.originLeft,
          phase: grid.phase,
          size: grid.size,
        }
      : {
          origin: grid.originTop,
          phase: grid.phase,
          size: grid.size,
        };
  return { ...base, ...overrides };
}
