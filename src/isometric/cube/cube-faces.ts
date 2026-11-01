// Copyright (C) 2026 West Lane - All Rights Reserved

import { PlaneView } from "ic-canvas";
import type { IsoFaceId, IsometricOrientation } from "../../types/diagram.js";
import { DEFAULT_ISOMETRIC_ORIENTATION } from "../orientation.js";

/** Face paths for CSS (solid fills; wireframe supplies strokes). */
export const IC_ISO_CUBE_FACE_CLASS = "ic-iso-cube-face";

export function isoCubeFaceClassName(face: IsoFaceId): string {
  return `${IC_ISO_CUBE_FACE_CLASS} ic-iso-cube-face--${face}`;
}

/** Mount + global paint interleave (back → front). */
export const ISO_CUBE_MOUNT_FACE_ORDER: readonly IsoFaceId[] = [
  "bottom",
  "back",
  "left",
  "side",
  "front",
  "top",
];

type FaceRectLayout = {
  planeView: PlaneView;
  width: number;
  height: number;
  left?: number;
  right?: number;
  top?: number;
};

function isoCubeFaceRectLayoutDefaultPlaneTopLeft(
  face: IsoFaceId,
  width: number,
  depth: number,
  height: number,
): FaceRectLayout {
  switch (face) {
    case "bottom":
    case "top":
      return {
        planeView: PlaneView.TOP,
        width: depth,
        height: width,
        left: -width,
        right: 0,
        top: face === "bottom" ? 0 : height,
      };
    case "back":
      return { planeView: PlaneView.FRONT, width, height, left: -width, right: 0 };
    case "front":
      return { planeView: PlaneView.FRONT, width, height, left: -width, right: depth };
    case "left":
      return { planeView: PlaneView.SIDE, width: depth, height, left: -width, right: 0 };
    case "side":
      return { planeView: PlaneView.SIDE, width: depth, height, left: 0, right: 0 };
    default: {
      const _exhaustive: never = face;
      return _exhaustive;
    }
  }
}

/** Rotated iso: local footprint spans l ∈ [0, width], r ∈ [0, depth] (matches {@link isoStageGroundTopLayout}). */
function isoCubeFaceRectLayoutRotatedPlaneTopLeft(
  face: IsoFaceId,
  width: number,
  depth: number,
  height: number,
): FaceRectLayout {
  if (face === "bottom" || face === "top") {
    return {
      planeView: PlaneView.TOP,
      width: depth,
      height: width,
      left: 0,
      right: 0,
      top: face === "bottom" ? 0 : height,
    };
  }
  const base = isoCubeFaceRectLayoutDefaultPlaneTopLeft(face, width, depth, height);
  return { ...base, left: (base.left ?? 0) + width };
}

/**
 * Footprint pinned at plane top-left before iso projection.
 * Default: local l ∈ [−width, 0], r ∈ [0, depth].
 * Rotated: local l ∈ [0, width], r ∈ [0, depth].
 */
export function isoCubeFaceRectLayoutForPlaneTopLeft(
  face: IsoFaceId,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): FaceRectLayout {
  if (orientation === "rotated") {
    return isoCubeFaceRectLayoutRotatedPlaneTopLeft(face, width, depth, height);
  }
  return isoCubeFaceRectLayoutDefaultPlaneTopLeft(face, width, depth, height);
}

/** Library rectangle props per face (local to footprint anchor). TOP plane: width→r (depth), height→l (width). */
export function isoCubeFaceRectLayout(
  face: IsoFaceId,
  width: number,
  depth: number,
  height: number,
): FaceRectLayout {
  switch (face) {
    case "bottom":
    case "top":
      return {
        planeView: PlaneView.TOP,
        width: depth,
        height: width,
        top: face === "bottom" ? 0 : height,
      };
    case "back":
      return { planeView: PlaneView.FRONT, width, height, right: 0 };
    case "front":
      return { planeView: PlaneView.FRONT, width, height, right: depth };
    case "left":
      return { planeView: PlaneView.SIDE, width: depth, height, left: 0 };
    case "side":
      return { planeView: PlaneView.SIDE, width: depth, height, left: width };
    default: {
      const _exhaustive: never = face;
      return _exhaustive;
    }
  }
}
