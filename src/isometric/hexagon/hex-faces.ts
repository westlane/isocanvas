// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { IsometricOrientation } from "../../types/diagram.js";
import {
  isoCubeBottomFaceCornerAnchors,
  isoCubeTopFaceCornerAnchors,
  type IsoTopPlaneAnchor,
} from "../cube/cube-faces.js";

type FootprintCorner = IsoTopPlaneAnchor;

/** Flat-top hex inscribed in the cube footprint parallelogram (u along AB, v along AD). */
export function isoHexFootprintVerticesFromCorners(
  corners: [FootprintCorner, FootprintCorner, FootprintCorner, FootprintCorner],
): FootprintCorner[] {
  const [a, b, _c, d] = corners;
  const map = (u: number, v: number): FootprintCorner => ({
    right: a.right + u * (b.right - a.right) + v * (d.right - a.right),
    left: a.left + u * (b.left - a.left) + v * (d.left - a.left),
    top: a.top,
  });
  return [
    map(0.25, 0),
    map(0.75, 0),
    map(1, 0.5),
    map(0.75, 1),
    map(0.25, 1),
    map(0, 0.5),
  ];
}

export function isoHexBottomFootprintVertices(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): FootprintCorner[] {
  return isoHexFootprintVerticesFromCorners(
    isoCubeBottomFaceCornerAnchors(width, depth, height, orientation),
  );
}

export function isoHexTopFootprintVertices(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): FootprintCorner[] {
  return isoHexFootprintVerticesFromCorners(
    isoCubeTopFaceCornerAnchors(width, depth, height, orientation),
  );
}

export function isoHexFootprintCenter(vertices: readonly FootprintCorner[]): {
  right: number;
  left: number;
} {
  let right = 0;
  let left = 0;
  for (const v of vertices) {
    right += v.right;
    left += v.left;
  }
  const n = vertices.length || 1;
  return { right: right / n, left: left / n };
}
