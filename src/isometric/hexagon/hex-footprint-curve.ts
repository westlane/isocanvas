// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricPath } from "@elchininet/isometric";
import type { IsometricOrientation } from "../../types/diagram.js";
import { isoCubeFaceClassName } from "../cube/cube-faces.js";
import { IC_ISO_HEX_INTERIOR_CAP_CLASS } from "./hex.js";
import { ISO_CUBE_FACE_NO_STROKE } from "../cube/canvas-text-style.js";
import {
  isoCubeFootprintEdgeBulgeControl,
  isoCubeFootprintBulgeIso,
} from "../cube/top-face-curve.js";
import {
  isoHexBottomFootprintVertices,
  isoHexFootprintCenter,
  isoHexFootprintVerticesFromCorners,
  isoHexTopFootprintVertices,
} from "./hex-faces.js";

type Anchor = { right: number; left: number; top: number };

export function paintIsoHexCurvedFootprintPath(
  path: IsometricPath,
  vertices: readonly Anchor[],
  width: number,
  depth: number,
): void {
  if (vertices.length < 3) {
    return;
  }
  const bulgeIso = isoCubeFootprintBulgeIso(width, depth);
  const center = isoHexFootprintCenter(vertices);
  const n = vertices.length;
  const controls: Anchor[] = [];
  for (let i = 0; i < n; i += 1) {
    const from = vertices[i]!;
    const to = vertices[(i + 1) % n]!;
    controls.push(isoCubeFootprintEdgeBulgeControl(from, to, center, from.top, bulgeIso));
  }

  path.clear();
  const first = vertices[0]!;
  path.moveTo(first.right, first.left, first.top);
  for (let i = 0; i < n; i += 1) {
    const to = vertices[(i + 1) % n]!;
    const ctrl = controls[i]!;
    path.curveTo(ctrl.right, ctrl.left, ctrl.top, to.right, to.left, to.top);
  }
}

function createHexFootprintFace(
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

export function createIsoHexCurvedTopFace(
  fill: string,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  return createHexFootprintFace(isoCubeFaceClassName("top"), fill, (path) => {
    const verts = isoHexTopFootprintVertices(width, depth, height, orientation);
    paintIsoHexCurvedFootprintPath(path, verts, width, depth);
  });
}

export function createIsoHexCurvedBottomFace(
  fill: string,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  return createHexFootprintFace(isoCubeFaceClassName("bottom"), fill, (path) => {
    const verts = isoHexBottomFootprintVertices(width, depth, height, orientation);
    paintIsoHexCurvedFootprintPath(path, verts, width, depth);
  });
}

/** Solid hex floor mounted inside the volume (recess-colored, fully opaque). */
export function createIsoHexInteriorCap(
  fill: string,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  return createHexFootprintFace(IC_ISO_HEX_INTERIOR_CAP_CLASS, fill, (path) => {
    const verts = isoHexBottomFootprintVertices(width, depth, height, orientation);
    paintIsoHexCurvedFootprintPath(path, verts, width, depth);
  });
}

export function paintIsoHexCurvedTopFacePath(
  path: IsometricPath,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  paintIsoHexCurvedFootprintPath(
    path,
    isoHexTopFootprintVertices(width, depth, height, orientation),
    width,
    depth,
  );
}

export function paintIsoHexCurvedBottomFacePath(
  path: IsometricPath,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  paintIsoHexCurvedFootprintPath(
    path,
    isoHexBottomFootprintVertices(width, depth, height, orientation),
    width,
    depth,
  );
}

export function createIsoHexCurvedFootprintFromLayout(
  className: string,
  fill: string,
  layout: {
    width: number;
    height: number;
    left?: number;
    right?: number;
    top?: number;
  },
  width: number,
  depth: number,
): IsometricPath {
  return createHexFootprintFace(className, fill, (path) => {
    const r0 = layout.right ?? 0;
    const l0 = layout.left ?? 0;
    const dr = layout.width;
    const dl = layout.height;
    const t = layout.top ?? 0;
    const corners: [Anchor, Anchor, Anchor, Anchor] = [
      { right: r0, left: l0, top: t },
      { right: r0 + dr, left: l0, top: t },
      { right: r0 + dr, left: l0 + dl, top: t },
      { right: r0, left: l0 + dl, top: t },
    ];
    paintIsoHexCurvedFootprintPath(
      path,
      isoHexFootprintVerticesFromCorners(corners as [Anchor, Anchor, Anchor, Anchor]),
      width,
      depth,
    );
  });
}
