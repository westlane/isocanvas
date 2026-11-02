// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { IsometricPath, IsometricRectangle, IsometricText } from "@elchininet/isometric";
import type { IsoFaceId, IsoPrismKind, IsometricOrientation } from "../../types/diagram.js";
import { isIsoHexagonPrism } from "../hexagon/hex.js";
import { paintIsoHexCurvedTopFacePath, paintIsoHexCurvedBottomFacePath } from "../hexagon/hex-footprint-curve.js";
import { paintIsoHexCurvedVerticalFacePath, paintIsoHexVerticalEdgeIndices, paintIsoHexVerticalEdgeQuads } from "../hexagon/hex-vertical-face.js";
import { paintIsoHexBottomRimPaths, type IsoHexBottomRimPaths } from "../hexagon/hex-bottom-rim.js";
import {
  ISO_CUBE_MOUNT_FACE_ORDER,
  isoCubeFaceRectLayoutForPlaneTopLeft,
} from "./cube-faces.js";
import {
  displayIsoCubeTopLabelText,
  isoBoxTopFaceLabelLayout,
} from "./canvas-text-style.js";
import { paintIsoCubeTopGlossTrianglePath } from "./top-gloss.js";
import { paintIsoHexTopGlossHalfPath } from "../hexagon/hex-top-gloss.js";
import { paintIsoCubeCurvedTopFacePath } from "./top-face-curve.js";
import { paintIsoCubeBottomRimPaths, type IsoCubeBottomRimPaths } from "./bottom-rim.js";
import {
  isIsoCurvedVerticalFace,
  paintIsoCubeCurvedVerticalFacePath,
} from "./vertical-face-curve.js";

export type IsoCubeShellLiveParts = {
  faces: Record<IsoFaceId, IsometricRectangle | IsometricPath>;
  recessWalls: IsometricPath[];
  recessOccluder?: IsometricPath;
  verticalShellOccluder?: IsometricPath | undefined;
  interiorCap?: IsometricPath;
  frontLight: IsometricPath;
  topGloss: IsometricPath;
  bottomRims: IsoCubeBottomRimPaths | IsoHexBottomRimPaths;
  label: IsometricText;
  width: number;
  depth: number;
  height: number;
  extrusionHeight: number;
  orientation: IsometricOrientation;
  labelFontSizePx: number;
  labelText: string;
  omitLabel: boolean;
  isoPrism: IsoPrismKind;
};

const livePartsByShell = new WeakMap<Element, IsoCubeShellLiveParts>();

export function registerIsoCubeShellLiveParts(
  shell: Element,
  parts: IsoCubeShellLiveParts,
): void {
  livePartsByShell.set(shell, parts);
}

export function getIsoCubeShellLiveParts(shell: Element): IsoCubeShellLiveParts | undefined {
  return livePartsByShell.get(shell);
}

type FaceRectLayout = ReturnType<typeof isoCubeFaceRectLayoutForPlaneTopLeft>;

function applyFaceRectLayout(rect: IsometricRectangle, layout: FaceRectLayout): void {
  rect.width = layout.width;
  rect.height = layout.height;
  if (layout.left !== undefined) {
    rect.left = layout.left;
  }
  if (layout.right !== undefined) {
    rect.right = layout.right;
  }
  if (layout.top !== undefined) {
    rect.top = layout.top;
  }
  rect.update();
}

/** Shorten extrusion in iso units; footprint (width × depth) stays fixed. */
export function applyIsoCubeExtrusionRatioToLiveParts(
  parts: IsoCubeShellLiveParts,
  extrusionRatio: number,
): void {
  const ratio = Math.max(0.05, Math.min(1, extrusionRatio));
  const extrusionHeight = parts.height * ratio;
  parts.extrusionHeight = extrusionHeight;
  const { width, depth, orientation, isoPrism } = parts;
  const hex = isIsoHexagonPrism(isoPrism);

  for (const face of ISO_CUBE_MOUNT_FACE_ORDER) {
    if (face === "bottom") {
      if (hex && parts.interiorCap) {
        paintIsoHexCurvedBottomFacePath(
          parts.interiorCap,
          width,
          depth,
          extrusionHeight,
          orientation,
        );
        parts.interiorCap.update();
      }
      continue;
    }
    if (face === "top") {
      if (hex) {
        paintIsoHexCurvedTopFacePath(
          parts.faces.top as IsometricPath,
          width,
          depth,
          extrusionHeight,
          orientation,
        );
      } else {
        paintIsoCubeCurvedTopFacePath(
          parts.faces.top as IsometricPath,
          width,
          depth,
          extrusionHeight,
          orientation,
        );
      }
      parts.faces.top.update();
      continue;
    }
    if (hex && (face === "back" || face === "left" || face === "side" || face === "front")) {
      if (face === "back") {
        if (parts.verticalShellOccluder) {
          paintIsoHexVerticalEdgeQuads(
            parts.verticalShellOccluder,
            [0, 1, 2, 3, 4, 5],
            width,
            depth,
            extrusionHeight,
            orientation,
          );
          parts.verticalShellOccluder.update();
        }
        parts.recessWalls.forEach((wall) => {
          paintIsoHexVerticalEdgeIndices(
            wall,
            [Number(wall.getElement().getAttribute("data-ic-hex-recess-edge"))],
            width,
            depth,
            extrusionHeight,
            orientation,
          );
          wall.update();
        });
      }
      if (face === "left" || face === "back") {
        continue;
      }
      paintIsoHexCurvedVerticalFacePath(
        parts.faces[face] as IsometricPath,
        face,
        width,
        depth,
        extrusionHeight,
        orientation,
      );
      parts.faces[face].update();
      if (face === "front") {
        paintIsoHexCurvedVerticalFacePath(
          parts.frontLight,
          "front",
          width,
          depth,
          extrusionHeight,
          orientation,
        );
        parts.frontLight.update();
      }
      continue;
    }
    if (isIsoCurvedVerticalFace(face)) {
      paintIsoCubeCurvedVerticalFacePath(
        parts.faces[face] as IsometricPath,
        face,
        width,
        depth,
        extrusionHeight,
        orientation,
      );
      parts.faces[face].update();
      if (face === "front") {
        paintIsoCubeCurvedVerticalFacePath(
          parts.frontLight,
          "front",
          width,
          depth,
          extrusionHeight,
          orientation,
        );
        parts.frontLight.update();
      }
    }
  }

  if (hex) {
    paintIsoHexTopGlossHalfPath(parts.topGloss, width, depth, extrusionHeight, orientation);
  } else {
    paintIsoCubeTopGlossTrianglePath(
      parts.topGloss,
      width,
      depth,
      extrusionHeight,
      orientation,
    );
  }
  parts.topGloss.update();

  if (hex) {
    paintIsoHexBottomRimPaths(
      parts.bottomRims as IsoHexBottomRimPaths,
      width,
      depth,
      extrusionHeight,
      orientation,
    );
  } else {
    paintIsoCubeBottomRimPaths(
      parts.bottomRims as IsoCubeBottomRimPaths,
      width,
      depth,
      extrusionHeight,
      orientation,
    );
  }
  parts.bottomRims.bottom.update();
  parts.bottomRims.left.update();

  if (parts.omitLabel || !parts.labelText.trim()) {
    return;
  }

  const labelLayout = isoBoxTopFaceLabelLayout(width, depth, extrusionHeight, orientation);
  parts.label.left = labelLayout.left;
  parts.label.right = labelLayout.right;
  parts.label.top = labelLayout.top;
  parts.label.rotation = labelLayout.rotation;
  parts.label.text = displayIsoCubeTopLabelText({
    label: parts.labelText,
    widthIso: width,
    depthIso: depth,
    fontSizePx: parts.labelFontSizePx,
    orientation,
  });
  parts.label.update();
}
