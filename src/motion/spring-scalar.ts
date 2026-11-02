// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { readPrefersReducedMotion, springStep, type SpringStepConfig } from "./spring-step.js";

export type SpringScalarState = {
  value: number;
  velocity: number;
};

export type AnimateSpringScalarOptions = {
  state: SpringScalarState;
  target: number;
  config: SpringStepConfig;
  onUpdate: (value: number) => void;
  onSettled?: () => void;
};

export type SpringScalarAnimation = {
  cancel: () => void;
};

const MAX_FRAME_DT_SECONDS = 0.04;

/**
 * rAF spring toward `target`. Reuses `state` for value/velocity (e.g. per-widget WeakMap entry).
 * Honors `prefers-reduced-motion` (single snap to target).
 */
export function animateSpringScalar(options: AnimateSpringScalarOptions): SpringScalarAnimation {
  const { state, config, onUpdate, onSettled } = options;
  const target = options.target;

  if (readPrefersReducedMotion()) {
    state.value = target;
    state.velocity = 0;
    onUpdate(target);
    onSettled?.();
    return { cancel: () => {} };
  }

  let frame = 0;
  let lastTime = performance.now();

  const cancel = (): void => {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  const tick = (now: number): void => {
    const dt = Math.min(MAX_FRAME_DT_SECONDS, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    const step = springStep(state.value, state.velocity, target, dt, config);
    state.value = step.value;
    state.velocity = step.velocity;
    onUpdate(state.value);
    if (step.settled) {
      frame = 0;
      onSettled?.();
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);
  return { cancel };
}

export { readPrefersReducedMotion, springStep, type SpringStepConfig, type SpringStepResult } from "./spring-step.js";
