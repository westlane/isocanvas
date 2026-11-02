// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricPath } from "@elchininet/isometric";
import type { IsometricOrientation } from "../../types/diagram.js";
import {
  IC_ISO_CUBE_BOTTOM_RIM_CLASS,
  IC_ISO_CUBE_BOTTOM_RIM_BOTTOM_CLASS,
  IC_ISO_CUBE_BOTTOM_RIM_LEFT_CLASS,
} from "./cube-faces.js";
import {
  isoCubeVerticalFaceGroundEdge,
  paintIsoCubeCurvedGroundEdgePath,
  type IsoCurvedVerticalFaceId,
} from "./vertical-face-curve.js";

/** Front = toward-viewer base (“bottom”); side = screen-left base segment — not the `left` face or full right slab stroke. */
const GROUND_RIM_SPEC = [
  { face: "front", key: "bottom", className: IC_ISO_CUBE_BOTTOM_RIM_BOTTOM_CLASS },
  { face: "side", key: "left", className: IC_ISO_CUBE_BOTTOM_RIM_LEFT_CLASS },
] as const satisfies readonly {
  face: IsoCurvedVerticalFaceId;
  key: "bottom" | "left";
  className: string;
}[];

function groundRimCurve(
  face: (typeof GROUND_RIM_SPEC)[number]["face"],
  className: string,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  const path = new IsometricPath({
    className: `${IC_ISO_CUBE_BOTTOM_RIM_CLASS} ${className}`,
    fillColor: "transparent",
    strokeColor: "transparent",
    strokeWidth: 1,
    autoclose: false,
  });
  const [from, to] = isoCubeVerticalFaceGroundEdge(face, width, depth, height, orientation);
  paintIsoCubeCurvedGroundEdgePath(path, from, to, width, depth, height, orientation);
  return path;
}

export type IsoCubeBottomRimPaths = {
  bottom: IsometricPath;
  left: IsometricPath;
};

export function isoCubeBottomRimPathList(paths: IsoCubeBottomRimPaths): IsometricPath[] {
  return [paths.bottom, paths.left];
}

export function createIsoCubeBottomRimPaths(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsoCubeBottomRimPaths {
  const bottomSpec = GROUND_RIM_SPEC[0];
  const leftSpec = GROUND_RIM_SPEC[1];
  return {
    bottom: groundRimCurve(bottomSpec.face, bottomSpec.className, width, depth, height, orientation),
    left: groundRimCurve(leftSpec.face, leftSpec.className, width, depth, height, orientation),
  };
}

export function paintIsoCubeBottomRimPaths(
  paths: IsoCubeBottomRimPaths,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  for (const { face, key } of GROUND_RIM_SPEC) {
    const [from, to] = isoCubeVerticalFaceGroundEdge(face, width, depth, height, orientation);
    paintIsoCubeCurvedGroundEdgePath(paths[key], from, to, width, depth, height, orientation);
  }
}
