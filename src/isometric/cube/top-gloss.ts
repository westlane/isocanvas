// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricPath } from "@elchininet/isometric";
import type { IsometricOrientation } from "../../types/diagram.js";
import {
  IC_ISO_CUBE_TOP_GLOSS_CLASS,
  isoCubeTopFaceDiagonalShadeTriangleAnchors,
} from "./cube-faces.js";
import { ISO_CUBE_FACE_NO_STROKE } from "./canvas-text-style.js";

export function paintIsoCubeTopGlossTrianglePath(
  path: IsometricPath,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  const [a, b, c] = isoCubeTopFaceDiagonalShadeTriangleAnchors(width, depth, height, orientation);
  path.clear();
  path.moveTo(a.right, a.left, a.top).lineTo(b.right, b.left, b.top).lineTo(c.right, c.left, c.top);
}

export function createIsoCubeTopGlossTriangle(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  const path = new IsometricPath({
    className: IC_ISO_CUBE_TOP_GLOSS_CLASS,
    fillColor: "#000000",
    autoclose: true,
    ...ISO_CUBE_FACE_NO_STROKE,
  });
  paintIsoCubeTopGlossTrianglePath(path, width, depth, height, orientation);
  return path;
}
