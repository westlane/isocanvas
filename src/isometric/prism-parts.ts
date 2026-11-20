// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { IsometricPath, IsometricRectangle, IsometricText } from "@elchininet/isometric";
import type { IsoBoxSpec, IsoFaceId, IsoPrismKind, IsometricOrientation } from "../types/diagram.js";
import { ISO_PRISM_CUBE } from "../types/diagram.js";
import type { IsoCanvasColors } from "../types/theme.js";
import { DEFAULT_ISOMETRIC_ORIENTATION } from "./orientation.js";
import { createLocalIsoBoxParts } from "./cube/box-parts.js";
import { ISO_CUBE_LABEL_FONT_SIZE_PX } from "./cube/canvas-text-style.js";
import type { IsoCubeBottomRimPaths } from "./cube/bottom-rim.js";
import { createLocalIsoHexBoxParts } from "./hexagon/hex-box-parts.js";
import type { IsoHexBottomRimPaths } from "./hexagon/hex-bottom-rim.js";
import { isIsoHexagonPrism } from "./hexagon/hex.js";

export function isoPrismKindForSpec(spec: Pick<IsoBoxSpec, "isoPrism">): IsoPrismKind {
  return spec.isoPrism ?? ISO_PRISM_CUBE;
}

export function createLocalIsoPrismParts(
  spec: IsoBoxSpec,
  colors: IsoCanvasColors,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
  labelFontSizePx: number = ISO_CUBE_LABEL_FONT_SIZE_PX,
): {
  faces: Record<IsoFaceId, IsometricRectangle | IsometricPath>;
  recessWalls: IsometricPath[];
  frontLight: IsometricPath;
  topGloss: IsometricPath;
  bottomRims: IsoCubeBottomRimPaths | IsoHexBottomRimPaths;
  label: IsometricText;
} {
  if (isIsoHexagonPrism(isoPrismKindForSpec(spec))) {
    return createLocalIsoHexBoxParts(spec, colors, orientation, labelFontSizePx);
  }
  return { ...createLocalIsoBoxParts(spec, colors, orientation, labelFontSizePx), recessWalls: [] };
}
