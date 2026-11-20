// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricPath } from "@elchininet/isometric";
import type { IsometricOrientation } from "../../types/diagram.js";
import {
  IC_ISO_CUBE_TOP_GLOSS_CLASS,
  isoCubeTopFaceCornerAnchors,
  ISO_CUBE_TOP_GLOSS_DIAGONAL_BULGE_RATIO,
  ISO_CUBE_TOP_GLOSS_INSET_RATIO,
} from "./cube-faces.js";
import { ISO_CUBE_FACE_NO_STROKE } from "./canvas-text-style.js";
import {
  isoCubeFootprintBulgeIso,
  isoCubeFootprintDiagonalBulgeControl,
  isoCubeFootprintEdgeBulgeControl,
  lerpIsoTopPlaneAnchor,
} from "./top-face-curve.js";

/** Dark half of top face (A–D–C); diagonal fade runs dark → light toward B. */
export function paintIsoCubeTopGlossTrianglePath(
  path: IsometricPath,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  const [a, b, c, d] = isoCubeTopFaceCornerAnchors(width, depth, height, orientation);
  const center = {
    right: (a.right + c.right) / 2,
    left: (a.left + c.left) / 2,
  };
  const inset = ISO_CUBE_TOP_GLOSS_INSET_RATIO;
  const aP = lerpIsoTopPlaneAnchor(a, center, inset);
  const bP = lerpIsoTopPlaneAnchor(b, center, inset);
  const cP = lerpIsoTopPlaneAnchor(c, center, inset);
  const dP = lerpIsoTopPlaneAnchor(d, center, inset);
  const t = a.top;
  const bulge = isoCubeFootprintBulgeIso(width, depth);

  const ad = isoCubeFootprintEdgeBulgeControl(aP, dP, center, t, bulge);
  const dc = isoCubeFootprintEdgeBulgeControl(dP, cP, center, t, bulge);
  const ca = isoCubeFootprintDiagonalBulgeControl(
    cP,
    aP,
    bP,
    bulge * ISO_CUBE_TOP_GLOSS_DIAGONAL_BULGE_RATIO,
  );

  path.clear();
  path
    .moveTo(aP.right, aP.left, aP.top)
    .curveTo(ad.right, ad.left, ad.top, dP.right, dP.left, dP.top)
    .curveTo(dc.right, dc.left, dc.top, cP.right, cP.left, cP.top)
    .curveTo(ca.right, ca.left, ca.top, aP.right, aP.left, aP.top);
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
