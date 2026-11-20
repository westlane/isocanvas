// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricPath } from "@elchininet/isometric";
import type { IsoFaceId, IsometricOrientation } from "../../types/diagram.js";
import {
  IC_ISO_CUBE_FRONT_LIGHT_CLASS,
  isoCubeFaceClassName,
} from "../cube/cube-faces.js";
import { ISO_CUBE_FACE_NO_STROKE } from "../cube/canvas-text-style.js";
import { isoCubeFootprintBulgeIso } from "../cube/top-face-curve.js";
import {
  isoHexBottomFootprintVertices,
  isoHexFootprintCenter,
  isoHexTopFootprintVertices,
} from "./hex-faces.js";

type Anchor = { right: number; left: number; top: number };

/**
 * Hex vertical edge indices per mount slot (geometry only).
 * Recess uses one SVG path per edge (see {@link createIsoHexRecessWallPaths}).
 */
function hexVerticalEdgeIndicesForFace(face: IsoFaceId): readonly number[] {
  switch (face) {
    case "back":
      return [5, 0];
    case "side":
      return [1];
    case "front":
      return [2];
    case "left":
      return [3, 4];
    default:
      return [];
  }
}

/** All vertical edges painted with cube recess / `--ic-iso-left-fill`. */
export function isoHexLeftVerticalEdgeIndices(): readonly number[] {
  return [0, 3, 4, 5];
}

/** Back-left vertical under the label start (mounted on the back face path). */
export function isoHexBackLeftVerticalEdgeIndex(): number {
  return 0;
}

/** Vertical edge index painted as `side` (cube-equivalent right ridge). */
export function isoHexSideVerticalEdgeIndex(): number {
  return 1;
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

function paintHexEdgeVerticalQuad(
  path: IsometricPath,
  edgeIndex: number,
  bottom: readonly Anchor[],
  top: readonly Anchor[],
  width: number,
  depth: number,
  append: boolean,
): void {
  const i = edgeIndex;
  const j = (edgeIndex + 1) % bottom.length;
  const bl = bottom[i]!;
  const br = bottom[j]!;
  const tr = top[j]!;
  const tl = top[i]!;
  const center = isoHexFootprintCenter(bottom);
  const bulge = isoCubeFootprintBulgeIso(width, depth);
  const bottomCtrl = footprintParallelEdgeBulgeControl(bl, br, center, bulge);
  const topCtrl = footprintParallelEdgeBulgeControl(tl, tr, center, bulge);

  if (!append) {
    path.clear();
  }
  path
    .moveTo(bl.right, bl.left, bl.top)
    .lineTo(tl.right, tl.left, tl.top)
    .curveTo(topCtrl.right, topCtrl.left, topCtrl.top, tr.right, tr.left, tr.top)
    .lineTo(br.right, br.left, br.top)
    .curveTo(bottomCtrl.right, bottomCtrl.left, bottomCtrl.top, bl.right, bl.left, bl.top);
}

function hexVerts(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): { bottom: Anchor[]; top: Anchor[] } {
  return {
    bottom: isoHexBottomFootprintVertices(width, depth, height, orientation),
    top: isoHexTopFootprintVertices(width, depth, height, orientation),
  };
}

function edgesForFace(face: IsoFaceId): readonly number[] {
  return hexVerticalEdgeIndicesForFace(face);
}

export function paintIsoHexVerticalEdgeIndices(
  path: IsometricPath,
  edgeIndices: readonly number[],
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  const { bottom, top } = hexVerts(width, depth, height, orientation);
  if (edgeIndices.length === 0) {
    path.clear();
    return;
  }
  edgeIndices.forEach((edgeIndex, index) => {
    paintHexEdgeVerticalQuad(path, edgeIndex, bottom, top, width, depth, index > 0);
  });
}

export function paintIsoHexCurvedVerticalFacePath(
  path: IsometricPath,
  face: IsoFaceId,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  paintIsoHexVerticalEdgeIndices(
    path,
    edgesForFace(face),
    width,
    depth,
    height,
    orientation,
  );
}

function createHexVerticalFacePath(
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

export function createIsoHexCurvedVerticalFace(
  face: IsoFaceId,
  fill: string,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  return createIsoHexVerticalWall(face, face, fill, width, depth, height, orientation);
}

/** Mount slot geometry with a possibly different CSS face (recess → `left` class). */
export function createIsoHexVerticalWall(
  edgeFace: IsoFaceId,
  cssFace: IsoFaceId,
  fill: string,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  return createHexVerticalFacePath(isoCubeFaceClassName(cssFace), fill, (path) =>
    paintIsoHexCurvedVerticalFacePath(path, edgeFace, width, depth, height, orientation),
  );
}

export function paintIsoHexVerticalEdgeQuads(
  path: IsometricPath,
  edgeIndices: readonly number[],
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  const { bottom, top } = hexVerts(width, depth, height, orientation);
  if (edgeIndices.length === 0) {
    path.clear();
    return;
  }
  edgeIndices.forEach((edgeIndex, index) => {
    paintHexEdgeVerticalQuad(path, edgeIndex, bottom, top, width, depth, index > 0);
  });
}

const ISO_HEX_RECESS_EDGE_INDICES = [0, 3, 4, 5] as const;
/** Edges 0, 4, 5 face away from the viewer; edge 3 (front-left) must paint last or they overdraw it. */
const ISO_HEX_RECESS_PAINT_ORDER = [0, 5, 4, 3] as const;
const ISO_HEX_VERTICAL_EDGE_INDICES = [0, 1, 2, 3, 4, 5] as const;

const IC_ISO_HEX_VERTICAL_SHELL_OCCLUDER_CLASS = "ic-iso-hex-vertical-shell-occluder";

/** Opaque backing for all six vertical edges (visible walls paint on top). */
export function createIsoHexVerticalShellOccluder(
  fill: string,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  return createHexVerticalFacePath(IC_ISO_HEX_VERTICAL_SHELL_OCCLUDER_CLASS, fill, (path) =>
    paintIsoHexVerticalEdgeQuads(
      path,
      ISO_HEX_VERTICAL_EDGE_INDICES,
      width,
      depth,
      height,
      orientation,
    ),
  );
}

const IC_ISO_HEX_RECESS_OCCLUDER_CLASS = "ic-iso-hex-recess-occluder";

/** @deprecated Prefer {@link createIsoHexVerticalShellOccluder}. */
export function createIsoHexRecessOccluder(
  fill: string,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  return createHexVerticalFacePath(IC_ISO_HEX_RECESS_OCCLUDER_CLASS, fill, (path) =>
    paintIsoHexVerticalEdgeQuads(
      path,
      ISO_HEX_RECESS_EDGE_INDICES,
      width,
      depth,
      height,
      orientation,
    ),
  );
}

/** One filled quad per recess edge — avoids multi-subpath SVG fill holes on the left side. */
export function createIsoHexVerticalEdgePath(
  edgeIndex: number,
  fill: string,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  const path = createHexVerticalFacePath(isoCubeFaceClassName("left"), fill, (paintPath) =>
    paintIsoHexVerticalEdgeIndices(paintPath, [edgeIndex], width, depth, height, orientation),
  );
  path.getElement().setAttribute("data-ic-hex-recess-edge", String(edgeIndex));
  return path;
}

export function createIsoHexRecessWallPaths(
  edgeFills: readonly string[],
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath[] {
  return ISO_HEX_RECESS_PAINT_ORDER.map((edgeIndex) =>
    createIsoHexVerticalEdgePath(
      edgeIndex,
      edgeFills[ISO_HEX_RECESS_EDGE_INDICES.indexOf(edgeIndex)]!,
      width,
      depth,
      height,
      orientation,
    ),
  );
}

export function isoHexRecessEdgeIndices(): readonly number[] {
  return ISO_HEX_RECESS_EDGE_INDICES;
}

export function createIsoHexFrontLightOverlay(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  return createHexVerticalFacePath(IC_ISO_CUBE_FRONT_LIGHT_CLASS, "#000", (path) =>
    paintIsoHexCurvedVerticalFacePath(path, "front", width, depth, height, orientation),
  );
}

export function isoHexVerticalFaceGroundEdge(
  face: "front" | "side",
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): [Anchor, Anchor] {
  const { bottom } = hexVerts(width, depth, height, orientation);
  if (face === "front") {
    return [bottom[2]!, bottom[4]!];
  }
  return [bottom[1]!, bottom[2]!];
}

export function paintIsoHexCurvedGroundEdgePath(
  path: IsometricPath,
  from: Anchor,
  to: Anchor,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  const { bottom } = hexVerts(width, depth, height, orientation);
  const center = isoHexFootprintCenter(bottom);
  const bulge = isoCubeFootprintBulgeIso(width, depth);
  const ctrl = footprintParallelEdgeBulgeControl(from, to, center, bulge);
  path.clear();
  path
    .moveTo(from.right, from.left, from.top)
    .curveTo(ctrl.right, ctrl.left, ctrl.top, to.right, to.left, to.top);
}

export function paintIsoHexFrontGroundRimPath(
  path: IsometricPath,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  const { bottom } = hexVerts(width, depth, height, orientation);
  const center = isoHexFootprintCenter(bottom);
  const bulge = isoCubeFootprintBulgeIso(width, depth);
  const chain = [bottom[2]!, bottom[3]!, bottom[4]!];
  path.clear();
  path.moveTo(chain[0]!.right, chain[0]!.left, chain[0]!.top);
  for (let i = 1; i < chain.length; i += 1) {
    const from = chain[i - 1]!;
    const to = chain[i]!;
    const ctrl = footprintParallelEdgeBulgeControl(from, to, center, bulge);
    path.curveTo(ctrl.right, ctrl.left, ctrl.top, to.right, to.left, to.top);
  }
}
