// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricPath, PlaneView } from "@elchininet/isometric";
import type { IsometricOrientation } from "../../types/diagram.js";
import {
  IC_ISO_CUBE_TOP_GLOSS_CLASS,
  ISO_CUBE_TOP_GLOSS_DIAGONAL_BULGE_RATIO,
  ISO_CUBE_TOP_GLOSS_INSET_RATIO,
} from "../cube/cube-faces.js";
import { ISO_CUBE_FACE_NO_STROKE } from "../cube/canvas-text-style.js";
import {
  isoCubeFootprintBulgeIso,
  isoCubeFootprintDiagonalBulgeControl,
  isoCubeFootprintEdgeBulgeControl,
  lerpIsoTopPlaneAnchor,
} from "../cube/top-face-curve.js";
import { isoHexFootprintCenter, isoHexTopFootprintVertices } from "./hex-faces.js";

type Anchor = { right: number; left: number; top: number };

/** Complementary top half (flip of v0–v3 gloss): v3→v4→v5→v0, closing diagonal v0→v3. */
const HEX_TOP_GLOSS_VERTEX_INDICES = [3, 4, 5, 0] as const;

function insetHexGlossAnchors(
  vertices: readonly Anchor[],
  indices: readonly number[],
): Anchor[] {
  const center = isoHexFootprintCenter(vertices);
  const inset = ISO_CUBE_TOP_GLOSS_INSET_RATIO;
  return indices.map((i) => lerpIsoTopPlaneAnchor(vertices[i]!, center, inset));
}

export function paintIsoHexTopGlossHalfPath(
  path: IsometricPath,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  const vertices = isoHexTopFootprintVertices(width, depth, height, orientation);
  const ring = insetHexGlossAnchors(vertices, HEX_TOP_GLOSS_VERTEX_INDICES);
  const center = isoHexFootprintCenter(vertices);
  const t = ring[0]?.top ?? vertices[0]?.top ?? height;
  const bulge = isoCubeFootprintBulgeIso(width, depth);
  const towardLight = vertices[1]!;

  path.clear();
  const first = ring[0]!;
  path.moveTo(first.right, first.left, first.top);

  for (let i = 0; i < ring.length; i += 1) {
    const from = ring[i]!;
    const to = ring[(i + 1) % ring.length]!;
    const isClosingDiagonal = i === ring.length - 1;
    const ctrl = isClosingDiagonal
      ? isoCubeFootprintDiagonalBulgeControl(
          from,
          to,
          towardLight,
          bulge * ISO_CUBE_TOP_GLOSS_DIAGONAL_BULGE_RATIO,
        )
      : isoCubeFootprintEdgeBulgeControl(from, to, center, t, bulge);
    path.curveTo(ctrl.right, ctrl.left, ctrl.top, to.right, to.left, to.top);
  }
}

export function createIsoHexTopGlossHalf(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  const path = new IsometricPath({
    planeView: PlaneView.TOP,
    className: IC_ISO_CUBE_TOP_GLOSS_CLASS,
    fillColor: "#000000",
    autoclose: true,
    ...ISO_CUBE_FACE_NO_STROKE,
  });
  paintIsoHexTopGlossHalfPath(path, width, depth, height, orientation);
  return path;
}
