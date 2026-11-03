// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricPath, PlaneView } from "@elchininet/isometric";
import type { IsoFaceId, IsometricOrientation } from "../../types/diagram.js";
import {
  isoCubeBottomFaceCornerAnchors,
  IC_ISO_CUBE_FRONT_LIGHT_CLASS,
  isoCubeFaceClassName,
  isoCubeFaceRectLayoutForPlaneTopLeft,
  ISO_CUBE_FOOTPRINT_CURVE_BULGE_RATIO,
} from "./cube-faces.js";
import { ISO_CUBE_FACE_NO_STROKE } from "./canvas-text-style.js";

type Anchor = { right: number; left: number; top: number };

const CURVED_VERTICAL_FACES = ["front", "side", "back", "left"] as const;
export type IsoCurvedVerticalFaceId = (typeof CURVED_VERTICAL_FACES)[number];

export function isIsoCurvedVerticalFace(face: IsoFaceId): face is IsoCurvedVerticalFaceId {
  return (CURVED_VERTICAL_FACES as readonly IsoFaceId[]).includes(face);
}

function footprintBulgeIso(width: number, depth: number): number {
  return Math.min(width, depth) * ISO_CUBE_FOOTPRINT_CURVE_BULGE_RATIO;
}

function footprintCenter(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): { right: number; left: number } {
  const [a, , c] = isoCubeBottomFaceCornerAnchors(width, depth, height, orientation);
  return {
    right: (a.right + c.right) / 2,
    left: (a.left + c.left) / 2,
  };
}

function footprintParallelEdgeBulgeControl(
  from: Anchor,
  to: Anchor,
  center: { right: number; left: number },
  bulgeIso: number,
): Anchor {
  const midR = (from.right + to.right) / 2;
  const midL = (from.left + to.left) / 2;
  const top = from.top;
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

function verticalFaceCorners(
  face: IsoCurvedVerticalFaceId,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): { bl: Anchor; br: Anchor; tr: Anchor; tl: Anchor } {
  const layout = isoCubeFaceRectLayoutForPlaneTopLeft(face, width, depth, height, orientation);
  const h = layout.height;
  if (layout.planeView === PlaneView.FRONT) {
    const r = layout.right ?? 0;
    const l0 = layout.left ?? 0;
    const wFace = layout.width;
    return {
      bl: { right: r, left: l0, top: 0 },
      br: { right: r, left: l0 + wFace, top: 0 },
      tr: { right: r, left: l0 + wFace, top: h },
      tl: { right: r, left: l0, top: h },
    };
  }
  const r0 = layout.right ?? 0;
  const l = layout.left ?? 0;
  const wFace = layout.width;
  return {
    bl: { right: r0, left: l, top: 0 },
    br: { right: r0 + wFace, left: l, top: 0 },
    tr: { right: r0 + wFace, left: l, top: h },
    tl: { right: r0, left: l, top: h },
  };
}

/** Visible ground contact edge (front / side rim uses the same geometry). */
export function isoCubeVerticalFaceGroundEdge(
  face: IsoCurvedVerticalFaceId,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): [Anchor, Anchor] {
  const { bl, br } = verticalFaceCorners(face, width, depth, height, orientation);
  return [bl, br];
}

export function paintIsoCubeCurvedGroundEdgePath(
  path: IsometricPath,
  from: Anchor,
  to: Anchor,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  const center = footprintCenter(width, depth, height, orientation);
  const bulge = footprintBulgeIso(width, depth);
  const ctrl = footprintParallelEdgeBulgeControl(from, to, center, bulge);
  path.clear();
  path
    .moveTo(from.right, from.left, from.top)
    .curveTo(ctrl.right, ctrl.left, ctrl.top, to.right, to.left, to.top);
}

export function paintIsoCubeCurvedVerticalFacePath(
  path: IsometricPath,
  face: IsoCurvedVerticalFaceId,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  const { bl, br, tr, tl } = verticalFaceCorners(face, width, depth, height, orientation);
  const center = footprintCenter(width, depth, height, orientation);
  const bulge = footprintBulgeIso(width, depth);
  const bottomCtrl = footprintParallelEdgeBulgeControl(bl, br, center, bulge);
  const topCtrl = footprintParallelEdgeBulgeControl(tl, tr, center, bulge);

  path.clear();
  path
    .moveTo(bl.right, bl.left, bl.top)
    .lineTo(tl.right, tl.left, tl.top)
    .curveTo(topCtrl.right, topCtrl.left, topCtrl.top, tr.right, tr.left, tr.top)
    .lineTo(br.right, br.left, br.top)
    .curveTo(bottomCtrl.right, bottomCtrl.left, bottomCtrl.top, bl.right, bl.left, bl.top);
}

export function createIsoCubeCurvedVerticalFace(
  face: IsoCurvedVerticalFaceId,
  fill: string,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  const path = new IsometricPath({
    className: isoCubeFaceClassName(face),
    fillColor: fill,
    autoclose: true,
    ...ISO_CUBE_FACE_NO_STROKE,
  });
  paintIsoCubeCurvedVerticalFacePath(path, face, width, depth, height, orientation);
  return path;
}

/** Same geometry as the front face; paint is driven by {@link IC_ISO_CUBE_FRONT_LIGHT_CLASS} in CSS. */
export function createIsoCubeFrontLightOverlay(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  const path = new IsometricPath({
    className: IC_ISO_CUBE_FRONT_LIGHT_CLASS,
    fillColor: "#000",
    autoclose: true,
    ...ISO_CUBE_FACE_NO_STROKE,
  });
  paintIsoCubeCurvedVerticalFacePath(path, "front", width, depth, height, orientation);
  return path;
}
