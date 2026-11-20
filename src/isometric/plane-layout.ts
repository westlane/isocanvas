// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ArtboardPlaneStage, PlaneBoxSpec } from "../types/artboard.js";
import type { IsoBoxSpec, IsometricOrientation } from "../types/diagram.js";
import { artboardGroundElevationIso } from "../layout/artboard-outline.js";
import { DEFAULT_ISOMETRIC_ORIENTATION } from "./orientation.js";
import { artboardPlaneToIsoGround, isoSizeFromDiagramUser } from "./diagram-user.js";
import { extrusionHeightForFootprint } from "./cube/cube.js";
import type { ArtboardPlanePoint } from "../types/diagram.js";

/**
 * Plane `(x, y)` pins a footprint corner (see {@link PlaneFootprintAnchorCorner});
 * ic-canvas mounts at ground (l=0, r=0) via {@link planeFootprintIcAnchorPoint}.
 */
export function planeBoxFootprintAnchor(box: Pick<PlaneBoxSpec, "x" | "y">): ArtboardPlanePoint {
  return { x: box.x, y: box.y };
}

/** Plane coordinates of ic-canvas ground anchor (l=0, r=0) for a pinned footprint corner. */
export function planeFootprintIcAnchorPoint(
  box: Pick<PlaneBoxSpec, "x" | "y" | "width" | "depth" | "footprintAnchor">,
): ArtboardPlanePoint {
  const pin = box.footprintAnchor ?? "plane-top-left";
  switch (pin) {
    case "plane-top-left":
    case "back-left":
      /** Local footprint spans l ∈ [−width, 0], r ∈ [0, depth]; (x, y) is that anchor corner. */
      return { x: box.x, y: box.y };
    default: {
      const _exhaustive: never = pin;
      return _exhaustive;
    }
  }
}

/** Map overhead box layout to ic-canvas mount spec (single projection step). */
export function isoBoxSpecFromPlaneBox(
  box: PlaneBoxSpec,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
  stage?: Pick<ArtboardPlaneStage, "width" | "height">,
): IsoBoxSpec {
  const footprintWidthPx =
    orientation === "rotated" ? box.depth : box.width;
  const footprintDepthPx =
    orientation === "rotated" ? box.width : box.depth;
  /** 90° on the ground: long edge follows the other plane axis (still one ic-canvas box). */
  const { width, depth } = isoSizeFromDiagramUser(footprintWidthPx, footprintDepthPx);
  const height =
    box.height ??
    extrusionHeightForFootprint(width, depth);
  const icAnchor = planeFootprintIcAnchorPoint(box);
  const ground = artboardPlaneToIsoGround(
    icAnchor.x,
    icAnchor.y,
    orientation,
    stage,
  );
  return {
    id: box.id,
    label: box.label,
    left: ground.left,
    right: ground.right,
    width,
    depth,
    height,
    ...(box.elevation !== undefined ? { elevation: box.elevation } : {}),
    ...(box.monoFaceFill !== undefined ? { monoFaceFill: box.monoFaceFill } : {}),
    ...(box.cubeFaceColors !== undefined ? { cubeFaceColors: box.cubeFaceColors } : {}),
    ...(box.compactLabel ? { compactLabel: true } : {}),
    ...(box.planeBoxRole !== undefined ? { planeBoxRole: box.planeBoxRole } : {}),
    ...(box.omitCubeLabel ? { omitCubeLabel: true } : {}),
    ...(box.isoPrism !== undefined ? { isoPrism: box.isoPrism } : {}),
  };
}

export function isoBoxSpecsFromPlaneBoxes(
  boxes: readonly PlaneBoxSpec[],
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
  stage?: Pick<ArtboardPlaneStage, "width" | "height">,
): IsoBoxSpec[] {
  return boxes.map((box) => isoBoxSpecFromPlaneBox(box, orientation, stage));
}

/** Lift iso box specs onto the artboard ground plane (matches dot grid / outline `top`). */
export function applyArtboardGroundElevation(spec: IsoBoxSpec): IsoBoxSpec {
  const groundTop = artboardGroundElevationIso();
  return {
    ...spec,
    elevation: (spec.elevation ?? 0) + groundTop,
  };
}

export function isoBoxSpecsOnArtboardGround(
  boxes: readonly PlaneBoxSpec[],
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
  stage?: Pick<ArtboardPlaneStage, "width" | "height">,
): IsoBoxSpec[] {
  return isoBoxSpecsFromPlaneBoxes(boxes, orientation, stage).map(applyArtboardGroundElevation);
}