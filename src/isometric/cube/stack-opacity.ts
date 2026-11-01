// Copyright (C) 2026 West Lane - All Rights Reserved

import type { PlaneBoxSpec } from "../../types/artboard.js";
import type { StackLayerPresentation } from "../../types/diagram.js";
import { userPxToIsoUnits } from "./cube.js";

/** ic-canvas `top` bump for stacked layers above the bottom card (after artboard ground lift). */
export const ISO_STACK_ARTBOARD_CLEARANCE_ISO = userPxToIsoUnits(1);

export function planeBoxStackFootprintKey(
  box: Pick<PlaneBoxSpec, "x" | "y">,
): string {
  return `${box.x}|${box.y}`;
}

/** One entry per box id when two or more boxes share a footprint (same-plane stack). */
export function stackLayerPresentationByBoxId(
  boxes: readonly PlaneBoxSpec[],
): Map<string, StackLayerPresentation> {
  const groups = new Map<string, PlaneBoxSpec[]>();
  for (const box of boxes) {
    const key = planeBoxStackFootprintKey(box);
    const list = groups.get(key) ?? [];
    list.push(box);
    groups.set(key, list);
  }
  const out = new Map<string, StackLayerPresentation>();
  for (const group of groups.values()) {
    if (group.length <= 1) {
      continue;
    }
    const sorted = [...group].sort((a, b) => (a.elevation ?? 0) - (b.elevation ?? 0));
    const size = sorted.length;
    for (let rank = 0; rank < sorted.length; rank += 1) {
      out.set(sorted[rank]!.id, { rank, size });
    }
  }
  return out;
}

/** Lift every layer in a stack so the bottom card clears the artboard ground (z=0). */
export function elevateStackLayersAboveArtboardGround(
  boxes: readonly PlaneBoxSpec[],
): PlaneBoxSpec[] {
  const stacked = stackLayerPresentationByBoxId(boxes);
  if (stacked.size === 0) {
    return [...boxes];
  }
  return boxes.map((box) => {
    if (!stacked.has(box.id)) {
      return box;
    }
    const elevation = (box.elevation ?? 0) + ISO_STACK_ARTBOARD_CLEARANCE_ISO;
    return { ...box, elevation };
  });
}

/** 0 at stack bottom, 1 at top. */
export function stackLayerDepthFraction(presentation: StackLayerPresentation): number {
  if (presentation.size <= 1) {
    return 1;
  }
  return presentation.rank / (presentation.size - 1);
}

const STACK_FACE_OPACITY_MIN = 0.32;
const STACK_LABEL_OPACITY_MIN = 0.1;
/** >1 keeps top label crisp while dropping quickly on the card just below. */
const STACK_LABEL_CURVE_EXPONENT = 4.5;
const STACK_FACE_CURVE_EXPONENT = 1.35;
/** Label font at stack bottom relative to the base cube label size. */
const STACK_LABEL_FONT_SCALE_MIN = 0.55;

function stackOpacityFromDepth(t: number, min: number, curveExponent: number): number {
  const eased = t ** curveExponent;
  return min + (1 - min) * eased;
}

export function stackFaceOpacity(presentation: StackLayerPresentation): number {
  const t = stackLayerDepthFraction(presentation);
  return stackOpacityFromDepth(t, STACK_FACE_OPACITY_MIN, STACK_FACE_CURVE_EXPONENT);
}

export function stackLabelOpacity(presentation: StackLayerPresentation): number {
  const t = stackLayerDepthFraction(presentation);
  return stackOpacityFromDepth(t, STACK_LABEL_OPACITY_MIN, STACK_LABEL_CURVE_EXPONENT);
}

export function stackLabelFontSizePx(
  baseFontSizePx: number,
  presentation: StackLayerPresentation,
): number {
  const t = stackLayerDepthFraction(presentation);
  const scale = STACK_LABEL_FONT_SCALE_MIN + (1 - STACK_LABEL_FONT_SCALE_MIN) * t;
  return baseFontSizePx * scale;
}
