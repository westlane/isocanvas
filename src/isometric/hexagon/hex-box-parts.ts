// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { IsometricPath, IsometricRectangle, IsometricText } from "@elchininet/isometric";
import type { IsoBoxSpec, IsoFaceId, IsometricOrientation } from "../../types/diagram.js";
import type { IsoCanvasColors } from "../../types/theme.js";
import { DEFAULT_ISOMETRIC_ORIENTATION } from "../orientation.js";
import { ISO_CUBE_MOUNT_FACE_ORDER } from "../cube/cube-faces.js";
import { faceFillsForBox, createIsoBoxLabel } from "../cube/prism-shared.js";
import { createIsoHexTopGlossHalf } from "./hex-top-gloss.js";
import {
  createIsoHexCurvedBottomFace,
  createIsoHexCurvedTopFace,
} from "./hex-footprint-curve.js";
import {
  createIsoHexFrontLightOverlay,
  createIsoHexCurvedVerticalFace,
  createIsoHexRecessWallPaths,
  createIsoHexVerticalShellOccluder,
} from "./hex-vertical-face.js";
import { isoHexIdleVerticalShades } from "./hex-prism-shade.js";
import { createIsoHexBottomRimPaths, type IsoHexBottomRimPaths } from "./hex-bottom-rim.js";
import { ISO_CUBE_LABEL_FONT_SIZE_PX } from "../cube/canvas-text-style.js";

export function createLocalIsoHexBoxParts(
  spec: IsoBoxSpec,
  colors: IsoCanvasColors,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
  labelFontSizePx: number = ISO_CUBE_LABEL_FONT_SIZE_PX,
): {
  faces: Record<IsoFaceId, IsometricRectangle | IsometricPath>;
  recessWalls: IsometricPath[];
  verticalShellOccluder: IsometricPath;
  frontLight: IsometricPath;
  topGloss: IsometricPath;
  bottomRims: IsoHexBottomRimPaths;
  label: IsometricText;
} {
  const { width: w, depth: d, height: h } = spec;
  const fills = faceFillsForBox(spec, colors);
  const faces = {} as Record<IsoFaceId, IsometricRectangle | IsometricPath>;
  const { recessEdgeFills, front: frontFill, side: sideFill } = isoHexIdleVerticalShades(fills);

  faces.top = createIsoHexCurvedTopFace(fills.top, w, d, h, orientation);
  faces.bottom = createIsoHexCurvedBottomFace(fills.bottom, w, d, h, orientation);
  const recessWalls = createIsoHexRecessWallPaths(recessEdgeFills, w, d, h, orientation);
  const verticalShellOccluder = createIsoHexVerticalShellOccluder(fills.left, w, d, h, orientation);
  faces.back = recessWalls[0]!;
  faces.left = recessWalls[1]!;
  faces.side = createIsoHexCurvedVerticalFace("side", sideFill, w, d, h, orientation);
  faces.front = createIsoHexCurvedVerticalFace("front", frontFill, w, d, h, orientation);

  const topGloss = createIsoHexTopGlossHalf(w, d, h, orientation);
  const frontLight = createIsoHexFrontLightOverlay(w, d, h, orientation);
  const bottomRims = createIsoHexBottomRimPaths(w, d, h, orientation);

  const labelSize = spec.compactLabel ? labelFontSizePx * 0.72 : labelFontSizePx;
  const labelColors =
    spec.cubeFaceColors?.labelFill !== undefined
      ? { ...colors, isoLabelFill: spec.cubeFaceColors.labelFill }
      : colors;

  return {
    faces,
    recessWalls,
    verticalShellOccluder,
    frontLight,
    topGloss,
    bottomRims,
    label: createIsoBoxLabel(spec, labelColors, orientation, labelSize),
  };
}

export function mountIsoHexBoxPartsFaceOrder(): readonly IsoFaceId[] {
  return ISO_CUBE_MOUNT_FACE_ORDER;
}
