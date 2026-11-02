// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { IsometricPath, IsometricRectangle, IsometricText } from "@elchininet/isometric";
import type { IsoFaceId, IsometricOrientation } from "../../types/diagram.js";
import {
  ISO_CUBE_MOUNT_FACE_ORDER,
  isoCubeFaceRectLayoutForPlaneTopLeft,
} from "./cube-faces.js";
import {
  displayIsoCubeTopLabelText,
  isoBoxTopFaceLabelLayout,
} from "./canvas-text-style.js";
import { paintIsoCubeTopGlossTrianglePath } from "./top-gloss.js";
import { paintIsoCubeCurvedTopFacePath } from "./top-face-curve.js";
import {
  isIsoCurvedVerticalFace,
  paintIsoCubeCurvedVerticalFacePath,
} from "./vertical-face-curve.js";

export type IsoCubeShellLiveParts = {
  faces: Record<IsoFaceId, IsometricRectangle | IsometricPath>;
  topGloss: IsometricPath;
  label: IsometricText;
  width: number;
  depth: number;
  height: number;
  extrusionHeight: number;
  orientation: IsometricOrientation;
  labelFontSizePx: number;
  labelText: string;
  omitLabel: boolean;
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
  const { width, depth, orientation } = parts;

  for (const face of ISO_CUBE_MOUNT_FACE_ORDER) {
    if (face === "bottom") {
      continue;
    }
    if (face === "top") {
      paintIsoCubeCurvedTopFacePath(
        parts.faces.top as IsometricPath,
        width,
        depth,
        extrusionHeight,
        orientation,
      );
      parts.faces.top.update();
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
      continue;
    }
    const layout = isoCubeFaceRectLayoutForPlaneTopLeft(
      face,
      width,
      depth,
      extrusionHeight,
      orientation,
    );
    applyFaceRectLayout(parts.faces[face] as IsometricRectangle, layout);
  }

  paintIsoCubeTopGlossTrianglePath(
    parts.topGloss,
    width,
    depth,
    extrusionHeight,
    orientation,
  );

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
