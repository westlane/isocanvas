// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

export type SpringStepConfig = {
  stiffness: number;
  damping: number;
  /** Stop when |value − target| and |velocity| are below this. */
  restEpsilon?: number;
};

export type SpringStepResult = {
  value: number;
  velocity: number;
  settled: boolean;
};

/** One integration step toward `target` (semi-implicit Euler, unit-consistent with dt in seconds). */
export function springStep(
  value: number,
  velocity: number,
  target: number,
  dtSeconds: number,
  config: SpringStepConfig,
): SpringStepResult {
  const restEpsilon = config.restEpsilon ?? 0.002;
  const acceleration =
    -config.stiffness * (value - target) - config.damping * velocity;
  const nextVelocity = velocity + acceleration * dtSeconds;
  const nextValue = value + nextVelocity * dtSeconds;
  const settled =
    Math.abs(nextValue - target) < restEpsilon &&
    Math.abs(nextVelocity) < restEpsilon;
  if (settled) {
    return { value: target, velocity: 0, settled: true };
  }
  return { value: nextValue, velocity: nextVelocity, settled: false };
}

export function readPrefersReducedMotion(): boolean {
  if (typeof matchMedia !== "function") {
    return false;
  }
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
