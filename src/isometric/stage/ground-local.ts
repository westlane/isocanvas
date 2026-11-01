// Copyright (C) 2026 West Lane - All Rights Reserved

import { PlaneView } from "ic-canvas";
import type { IsoBoxSpec, IsometricOrientation } from "../../types/diagram.js";
import { DEFAULT_ISOMETRIC_ORIENTATION } from "../orientation.js";

/**
 * ic-canvas TOP ground uses +l toward −planeX. Plane `[0, W] × [0, H]` is
 * local l ∈ [−W_iso, 0], r ∈ [0, H_iso] anchored at plane (0, 0).
 */
export function isoGroundFootprintLSpan(footprintWidthIso: number): { left: number; right: number } {
  return { left: -footprintWidthIso, right: 0 };
}

/** Shift a box footprint so plane top-left `(x, y)` is the anchor and the solid fills +x/+y in plane. */
export function isoBoxFootprintAlignGroup(spec: Pick<IsoBoxSpec, "width">): {
  left: number;
  right: number;
  top: number;
} {
  return { left: -spec.width, right: 0, top: 0 };
}

export function isoStageGroundBottomLayout(
  footprintWidthIso: number,
  footprintDepthIso: number,
): {
  planeView: PlaneView;
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
} {
  return {
    planeView: PlaneView.TOP,
    width: footprintDepthIso,
    height: footprintWidthIso,
    ...isoGroundFootprintLSpan(footprintWidthIso),
    top: 0,
  };
}

/** Rotated view: plane (0,0) at the diamond top; footprint spans +l and +r from the anchor. */
export function isoStageGroundTopLayout(
  footprintWidthIso: number,
  footprintDepthIso: number,
): {
  planeView: PlaneView;
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
} {
  return {
    planeView: PlaneView.TOP,
    width: footprintWidthIso,
    height: footprintDepthIso,
    left: 0,
    right: 0,
    top: 0,
  };
}

export function isoStageGroundLayout(
  footprintWidthIso: number,
  footprintDepthIso: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): ReturnType<typeof isoStageGroundBottomLayout> {
  if (orientation === "rotated") {
    return isoStageGroundTopLayout(footprintWidthIso, footprintDepthIso);
  }
  return isoStageGroundBottomLayout(footprintWidthIso, footprintDepthIso);
}
