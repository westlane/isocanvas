// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricPath } from "@elchininet/isometric";
import type { IsometricOrientation } from "../../types/diagram.js";
import {
  IC_ISO_CUBE_BOTTOM_RIM_CLASS,
  IC_ISO_CUBE_BOTTOM_RIM_FRONT_CLASS,
  IC_ISO_CUBE_BOTTOM_RIM_SIDE_CLASS,
  isoCubeFrontBottomRimAnchors,
  isoCubeSideBottomRimAnchors,
} from "./cube-faces.js";

function bottomRimLine(
  modifierClass: string,
  from: { right: number; left: number; top: number },
  to: { right: number; left: number; top: number },
): IsometricPath {
  const path = new IsometricPath({
    className: `${IC_ISO_CUBE_BOTTOM_RIM_CLASS} ${modifierClass}`,
    fillColor: "transparent",
    strokeColor: "transparent",
    strokeWidth: 1,
    autoclose: false,
  });
  path.moveTo(from.right, from.left, from.top).lineTo(to.right, to.left, to.top);
  return path;
}

export function createIsoCubeBottomRimPaths(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): { front: IsometricPath; side: IsometricPath } {
  const [frontA, frontB] = isoCubeFrontBottomRimAnchors(width, depth, height, orientation);
  const [sideA, sideB] = isoCubeSideBottomRimAnchors(width, depth, height, orientation);
  return {
    front: bottomRimLine(IC_ISO_CUBE_BOTTOM_RIM_FRONT_CLASS, frontA, frontB),
    side: bottomRimLine(IC_ISO_CUBE_BOTTOM_RIM_SIDE_CLASS, sideA, sideB),
  };
}
