// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricPath } from "@elchininet/isometric";
import type { IsometricOrientation } from "../../types/diagram.js";
import {
  IC_ISO_CUBE_BOTTOM_RIM_CLASS,
  IC_ISO_CUBE_BOTTOM_RIM_FRONT_CLASS,
  IC_ISO_CUBE_BOTTOM_RIM_SIDE_CLASS,
} from "./cube-faces.js";
import {
  isoCubeVerticalFaceGroundEdge,
  paintIsoCubeCurvedGroundEdgePath,
} from "./vertical-face-curve.js";

function bottomRimCurve(
  modifierClass: string,
  face: "front" | "side",
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  const path = new IsometricPath({
    className: `${IC_ISO_CUBE_BOTTOM_RIM_CLASS} ${modifierClass}`,
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
  front: IsometricPath;
  side: IsometricPath;
};

export function createIsoCubeBottomRimPaths(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsoCubeBottomRimPaths {
  return {
    front: bottomRimCurve(
      IC_ISO_CUBE_BOTTOM_RIM_FRONT_CLASS,
      "front",
      width,
      depth,
      height,
      orientation,
    ),
    side: bottomRimCurve(
      IC_ISO_CUBE_BOTTOM_RIM_SIDE_CLASS,
      "side",
      width,
      depth,
      height,
      orientation,
    ),
  };
}

export function paintIsoCubeBottomRimPaths(
  paths: IsoCubeBottomRimPaths,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  const [frontFrom, frontTo] = isoCubeVerticalFaceGroundEdge(
    "front",
    width,
    depth,
    height,
    orientation,
  );
  const [sideFrom, sideTo] = isoCubeVerticalFaceGroundEdge("side", width, depth, height, orientation);
  paintIsoCubeCurvedGroundEdgePath(paths.front, frontFrom, frontTo, width, depth, height, orientation);
  paintIsoCubeCurvedGroundEdgePath(paths.side, sideFrom, sideTo, width, depth, height, orientation);
}
