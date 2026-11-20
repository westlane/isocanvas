// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import {
  animateSpringScalar,
  readPrefersReducedMotion,
  type SpringStepConfig,
} from "../../motion/spring-scalar.js";
import type { IsometricOrientation } from "../../types/diagram.js";
import {
  applyIsoCubeExtrusionRatioToLiveParts,
  getIsoCubeShellLiveParts,
} from "./iso-cube-live-parts.js";

/** Latched / pointer-down press — shortens extrusion in iso units (footprint unchanged). */
export const ISO_CUBE_EXTRUSION_PRESS_RATIO = 0.88;

/** Deeper press while selected and pointer-down. */
export const ISO_CUBE_EXTRUSION_PRESS_RATIO_DEEP = 0.84;

/** Press down (shorter extrusion) — slower, heavier spring. */
export const ISO_CUBE_EXTRUSION_SPRING_PRESS = {
  stiffness: 260,
  damping: 34,
} as const;

/** Pop up (release / deselect) — faster spring back to full height. */
export const ISO_CUBE_EXTRUSION_SPRING_RELEASE = {
  stiffness: 1050,
  damping: 44,
} as const;

/** @deprecated Use {@link ISO_CUBE_EXTRUSION_SPRING_PRESS}. */
export const ISO_CUBE_EXTRUSION_SPRING = ISO_CUBE_EXTRUSION_SPRING_PRESS;

const IC_CUBE_WIDTH_ATTR = "data-ic-cube-width";
const IC_CUBE_DEPTH_ATTR = "data-ic-cube-depth";
const IC_CUBE_HEIGHT_ATTR = "data-ic-cube-height";
const IC_CUBE_ORIENTATION_ATTR = "data-ic-cube-orientation";
const IC_LABEL_FONT_SIZE_ATTR = "data-ic-label-font-size";

const extrusionSpringByShell = new WeakMap<
  Element,
  { ratio: number; velocity: number; target: number; animation: { cancel: () => void } | null }
>();

function extrusionSpringConfigForDirection(
  currentRatio: number,
  targetRatio: number,
): SpringStepConfig {
  return targetRatio > currentRatio
    ? ISO_CUBE_EXTRUSION_SPRING_RELEASE
    : ISO_CUBE_EXTRUSION_SPRING_PRESS;
}

export function paintIsoCubeShellGeometryDataset(
  shell: Element,
  dimensions: {
    width: number;
    depth: number;
    height: number;
    orientation: IsometricOrientation;
    labelFontSizePx: number;
  },
): void {
  shell.setAttribute(IC_CUBE_WIDTH_ATTR, String(dimensions.width));
  shell.setAttribute(IC_CUBE_DEPTH_ATTR, String(dimensions.depth));
  shell.setAttribute(IC_CUBE_HEIGHT_ATTR, String(dimensions.height));
  shell.setAttribute(IC_CUBE_ORIENTATION_ATTR, dimensions.orientation);
  shell.setAttribute(IC_LABEL_FONT_SIZE_ATTR, String(dimensions.labelFontSizePx));
}

function clampExtrusionRatio(ratio: number): number {
  return Math.max(0.05, Math.min(1, ratio));
}

function cancelExtrusionSpring(shell: Element): void {
  const state = extrusionSpringByShell.get(shell);
  state?.animation?.cancel();
  if (state) {
    state.animation = null;
  }
}

/** Instant geometry (tests and reduced-motion). */
export function applyIsoCubeExtrusionPressToShell(shell: Element, extrusionRatio: number): void {
  cancelExtrusionSpring(shell);
  const parts = getIsoCubeShellLiveParts(shell);
  if (!parts) {
    return;
  }
  const ratio = clampExtrusionRatio(extrusionRatio);
  applyIsoCubeExtrusionRatioToLiveParts(parts, ratio);
  extrusionSpringByShell.set(shell, {
    ratio,
    velocity: 0,
    target: ratio,
    animation: null,
  });
}

/** Spring-animated extrusion toward `extrusionRatio`. */
export function animateIsoCubeExtrusionPressToShell(shell: Element, extrusionRatio: number): void {
  const parts = getIsoCubeShellLiveParts(shell);
  if (!parts) {
    return;
  }
  const target = clampExtrusionRatio(extrusionRatio);
  if (readPrefersReducedMotion()) {
    applyIsoCubeExtrusionPressToShell(shell, target);
    return;
  }

  let state = extrusionSpringByShell.get(shell);
  if (!state) {
    state = { ratio: 1, velocity: 0, target: 1, animation: null };
    extrusionSpringByShell.set(shell, state);
  }
  cancelExtrusionSpring(shell);
  state.target = target;

  if (Math.abs(state.ratio - target) < 0.0005 && Math.abs(state.velocity) < 0.0005) {
    applyIsoCubeExtrusionRatioToLiveParts(parts, target);
    state.ratio = target;
    state.velocity = 0;
    return;
  }

  const springConfig = extrusionSpringConfigForDirection(state.ratio, target);
  const scalar = { value: state.ratio, velocity: state.velocity };
  state.animation = animateSpringScalar({
    state: scalar,
    target,
    config: springConfig,
    onUpdate: (value) => {
      state.ratio = value;
      state.velocity = scalar.velocity;
      applyIsoCubeExtrusionRatioToLiveParts(parts, value);
    },
    onSettled: () => {
      const current = extrusionSpringByShell.get(shell);
      if (current) {
        current.ratio = scalar.value;
        current.velocity = 0;
        current.animation = null;
      }
    },
  });
}

export function restoreIsoCubeExtrusionOnHost(
  host: HTMLElement,
  selectedIds: ReadonlySet<string>,
): void {
  for (const shell of Array.from(host.querySelectorAll("g.ic-iso-cube-shell"))) {
    const nested = shell.querySelector("g.node[data-object-id]");
    const id = nested?.getAttribute("data-object-id")?.trim();
    const ratio = id && selectedIds.has(id) ? ISO_CUBE_EXTRUSION_PRESS_RATIO : 1;
    animateIsoCubeExtrusionPressToShell(shell, ratio);
  }
}

export function applyIsoCubePointerPressToHost(
  host: HTMLElement,
  objectId: string | null,
  selectedIds: ReadonlySet<string>,
): void {
  if (!objectId) {
    return;
  }
  const node = host.querySelector(`g.node[data-object-id="${CSS.escape(objectId)}"]`);
  const shell = node?.closest("g.ic-iso-cube-shell");
  if (!shell) {
    return;
  }
  const ratio = selectedIds.has(objectId)
    ? ISO_CUBE_EXTRUSION_PRESS_RATIO_DEEP
    : ISO_CUBE_EXTRUSION_PRESS_RATIO;
  animateIsoCubeExtrusionPressToShell(shell, ratio);
}

export function readIsoCubeShellRestExtrusionHeight(shell: Element): number | null {
  const height = Number(shell.getAttribute(IC_CUBE_HEIGHT_ATTR));
  return Number.isFinite(height) ? height : null;
}
