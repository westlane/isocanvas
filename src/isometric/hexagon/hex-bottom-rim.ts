// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricPath } from "@elchininet/isometric";
import type { IsometricOrientation } from "../../types/diagram.js";
import {
  IC_ISO_CUBE_BOTTOM_RIM_CLASS,
  IC_ISO_CUBE_BOTTOM_RIM_BOTTOM_CLASS,
  IC_ISO_CUBE_BOTTOM_RIM_LEFT_CLASS,
} from "../cube/cube-faces.js";
import {
  isoHexVerticalFaceGroundEdge,
  paintIsoHexCurvedGroundEdgePath,
  paintIsoHexFrontGroundRimPath,
} from "./hex-vertical-face.js";

function groundRimCurve(
  face: "front" | "side",
  className: string,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsometricPath {
  const path = new IsometricPath({
    className: `${IC_ISO_CUBE_BOTTOM_RIM_CLASS} ${className}`,
    fillColor: "transparent",
    strokeColor: "transparent",
    strokeWidth: 1,
    autoclose: false,
  });
  if (face === "front") {
    paintIsoHexFrontGroundRimPath(path, width, depth, height, orientation);
  } else {
    const [from, to] = isoHexVerticalFaceGroundEdge(face, width, depth, height, orientation);
    paintIsoHexCurvedGroundEdgePath(path, from, to, width, depth, height, orientation);
  }
  return path;
}

export type IsoHexBottomRimPaths = {
  bottom: IsometricPath;
  left: IsometricPath;
};

export function isoHexBottomRimPathList(paths: IsoHexBottomRimPaths): IsometricPath[] {
  return [paths.bottom, paths.left];
}

export function createIsoHexBottomRimPaths(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): IsoHexBottomRimPaths {
  return {
    bottom: groundRimCurve(
      "front",
      IC_ISO_CUBE_BOTTOM_RIM_BOTTOM_CLASS,
      width,
      depth,
      height,
      orientation,
    ),
    left: groundRimCurve(
      "side",
      IC_ISO_CUBE_BOTTOM_RIM_LEFT_CLASS,
      width,
      depth,
      height,
      orientation,
    ),
  };
}

export function paintIsoHexBottomRimPaths(
  paths: IsoHexBottomRimPaths,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
): void {
  for (const face of ["front", "side"] as const) {
    const key = face === "front" ? "bottom" : "left";
    if (face === "front") {
      paintIsoHexFrontGroundRimPath(paths[key], width, depth, height, orientation);
    } else {
      const [from, to] = isoHexVerticalFaceGroundEdge(face, width, depth, height, orientation);
      paintIsoHexCurvedGroundEdgePath(paths[key], from, to, width, depth, height, orientation);
    }
  }
}
