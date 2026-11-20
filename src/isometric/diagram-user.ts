// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { artboardUserToPlane } from "../layout/artboard-coords.js";
import { DEFAULT_ARTBOARD_USER_SIZE } from "../layout/artboard.js";
import { ISO_DIAGRAM_PX_PER_UNIT, userPxToIsoUnits } from "./cube/cube.js";

import type { ArtboardPlaneStage } from "../types/artboard.js";
import type { IsometricOrientation } from "../types/diagram.js";
import { DEFAULT_ISOMETRIC_ORIENTATION } from "./orientation.js";
import type { ArtboardPlanePoint } from "../types/diagram.js";
import type { IsoGroundAnchor } from "../types/diagram.js";

export type ArtboardPlaneFootprint = Pick<ArtboardPlaneStage, "width" | "height">;

/**
 * Project overhead plane layout to ic-canvas ground axes.
 * Default: plane (0,0) is the south-west footprint corner (+plane x → −l, +plane y → +r).
 * Rotated (90° CW): plane (0,0) is the north/top diamond tip; content grows +l and +r from there.
 */
export function artboardPlaneToIsoGround(
  planeX: number,
  planeY: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
  stage?: ArtboardPlaneFootprint,
): IsoGroundAnchor {
  if (orientation === "rotated") {
    const stageHeight = stage?.height ?? DEFAULT_ARTBOARD_USER_SIZE.height;
    return {
      left: -userPxToIsoUnits(stageHeight - planeY),
      right: userPxToIsoUnits(planeX),
    };
  }
  return {
    left: -userPxToIsoUnits(planeX),
    right: userPxToIsoUnits(planeY),
  };
}

/** Inverse of {@link artboardPlaneToIsoGround} (for tests and hit-testing). */
export function artboardIsoGroundToPlane(
  left: number,
  right: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
  stage?: ArtboardPlaneFootprint,
): ArtboardPlanePoint {
  if (orientation === "rotated") {
    const stageHeight = stage?.height ?? DEFAULT_ARTBOARD_USER_SIZE.height;
    return {
      x: right * ISO_DIAGRAM_PX_PER_UNIT,
      y: stageHeight + left * ISO_DIAGRAM_PX_PER_UNIT,
    };
  }
  return {
    x: -left * ISO_DIAGRAM_PX_PER_UNIT,
    y: right * ISO_DIAGRAM_PX_PER_UNIT,
  };
}

/** Plane top-left of the artboard (viewBox 0,0). */
export function artboardPlaneTopLeftIsoGround(): IsoGroundAnchor {
  return artboardPlaneToIsoGround(0, 0);
}

/** Ground anchor from artboard user coords (origin bottom-left). */
export function isoGroundFromArtboardUser(
  userX: number,
  userY: number,
  artboardHeight: number = DEFAULT_ARTBOARD_USER_SIZE.height,
): IsoGroundAnchor {
  const plane = artboardUserToPlane(userX, userY, artboardHeight);
  return artboardPlaneToIsoGround(plane.x, plane.y);
}

export function isoSizeFromDiagramUser(
  userWidth: number,
  userDepth: number,
): { width: number; depth: number } {
  return {
    width: userPxToIsoUnits(userWidth),
    depth: userPxToIsoUnits(userDepth),
  };
}
