// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricPath } from "@elchininet/isometric";
import type { IsometricOrientation } from "../../types/diagram.js";
import {
  isoCubeBottomFaceCornerAnchors,
  isoCubeFaceClassName,
  isoCubeFootprintCornerAnchorsFromLayout,
  isoCubeTopFaceCornerAnchors,
  ISO_CUBE_FOOTPRINT_CURVE_BULGE_RATIO,
} from "./cube-faces.js";
import { ISO_CUBE_FACE_NO_STROKE } from "./canvas-text-style.js";

type Anchor = { right: number; left: number; top: number };

export function isoCubeFootprintBulgeIso(width: number, depth: number): number {
  return Math.min(width, depth) * ISO_CUBE_FOOTPRINT_CURVE_BULGE_RATIO;
}

export function lerpIsoTopPlaneAnchor(
  point: Anchor,
  center: { right: number; left: number },
  towardCenterRatio: number,
): Anchor {
  const t = Math.max(0, Math.min(1, towardCenterRatio));
  return {
    right: point.right + (center.right - point.right) * t,
    left: point.left + (center.left - point.left) * t,
    top: point.top,
  };
}

export function isoCubeFootprintEdgeBulgeControl(
  from: Anchor,
  to: Anchor,
  center: { right: number; left: number },
  top: number,
  bulgeIso: number,
): Anchor {
  const midR = (from.right + to.right) / 2;
  const midL = (from.left + to.left) / 2;
  const dr = midR - center.right;
  const dl = midL - center.left;
  const len = Math.hypot(dr, dl);
  if (len < 1e-9) {
    return { right: midR, left: midL, top };
  }
  return {
    right: midR + (dr / len) * bulgeIso,
    left: midL + (dl / len) * bulgeIso,
    top,
  };
}

/** Bulge a diagonal toward a corner outside the segment (e.g. gloss triangle third edge). */
export function isoCubeFootprintDiagonalBulgeControl(
  from: Anchor,
  to: Anchor,
  towardCorner: Anchor,
  bulgeIso: number,
): Anchor {
  const midR = (from.right + to.right) / 2;
  const midL = (from.left + to.left) / 2;
  const dr = towardCorner.right - midR;
  const dl = towardCorner.left - midL;
  const len = Math.hypot(dr, dl);
  const top = from.top;
  if (len < 1e-9) {
    return { right: midR, left: midL, top };
  }
  return {
    right: midR + (dr / len) * bulgeIso,
    left: midL + (dl / len) * bulgeIso,
    top,
  };
}

function bulgeControl(
  from: Anchor,
  to: Anchor,
  center: { right: number; left: number },
  top: number,
  bulgeIso: number,
): Anchor {
  return isoCubeFootprintEdgeBulgeControl(from, to, center, top, bulgeIso);
}

export function paintIsoCubeCurvedFootprintPath(
  path: IsometricPath,
  corners: [Anchor, Anchor, Anchor, Anchor],
  bulgeIso: number,
): void {
  const [a, b, c, d] = corners;
  const t = a.top;
  const center = {
    right: (a.right + c.right) / 2,
    left: (a.left + c.left) / 2,
  };

  const ab = bulgeControl(a, b, center, t, bulgeIso);
  const bc = bulgeControl(b, c, center, t, bulgeIso);
  const cd = bulgeControl(c, d, center, t, bulgeIso);
  const da = bulgeControl(d, a, center, t, bulgeIso);

  path.clear();
  path
    .moveTo(a.right, a.left, a.top)
    .curveTo(ab.right, ab.left, ab.top, b.right, b.left, b.top)
    .curveTo(bc.right, bc.left, bc.top, c.right, c.left, c.top)
    .curveTo(cd.right, cd.left, cd.top, d.right, d.left, d.top)
    .curveTo(da.right, da.left, da.top, a.right, a.left, a.top);
}

function footprintBulgeIso(width: number, depth: number): number {
  return isoCubeFootprintBulgeIso(width, depth);
}

export function paintIsoCubeCurvedTopFacePath(
  path: IsometricPath,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  paintIsoCubeCurvedFootprintPath(
    path,
    isoCubeTopFaceCornerAnchors(width, depth, height, orientation),
    footprintBulgeIso(width, depth),
  );
}

export function paintIsoCubeCurvedBottomFacePath(
  path: IsometricPath,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  paintIsoCubeCurvedFootprintPath(
    path,
    isoCubeBottomFaceCornerAnchors(width, depth, height, orientation),
    footprintBulgeIso(width, depth),
  );
}

type FootprintLayout = Parameters<typeof isoCubeFootprintCornerAnchorsFromLayout>[0];

/** Press-bottom / shadow footprint (may use {@link isoFootprintMarginBottomLayout}). */
export function paintIsoCubeCurvedFootprintLayoutPath(
  path: IsometricPath,
  layout: FootprintLayout,
  width: number,
  depth: number,
): void {
  paintIsoCubeCurvedFootprintPath(
    path,
    isoCubeFootprintCornerAnchorsFromLayout(layout),
    footprintBulgeIso(width, depth),
  );
}

function createCurvedFootprintFace(
  className: string,
  fill: string,
  paint: (path: IsometricPath) => void,
): IsometricPath {
  const path = new IsometricPath({
    className,
    fillColor: fill,
    autoclose: true,
    ...ISO_CUBE_FACE_NO_STROKE,
  });
  paint(path);
  return path;
}

export function createIsoCubeCurvedTopFace(
  fill: string,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  return createCurvedFootprintFace(isoCubeFaceClassName("top"), fill, (path) =>
    paintIsoCubeCurvedTopFacePath(path, width, depth, height, orientation),
  );
}

export function createIsoCubeCurvedBottomFace(
  fill: string,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  return createCurvedFootprintFace(isoCubeFaceClassName("bottom"), fill, (path) =>
    paintIsoCubeCurvedBottomFacePath(path, width, depth, height, orientation),
  );
}

export function createIsoCubeCurvedFootprintFromLayout(
  className: string,
  fill: string,
  layout: FootprintLayout,
  width: number,
  depth: number,
): IsometricPath {
  return createCurvedFootprintFace(className, fill, (path) =>
    paintIsoCubeCurvedFootprintLayoutPath(path, layout, width, depth),
  );
}
