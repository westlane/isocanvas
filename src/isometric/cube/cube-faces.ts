// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { PlaneView } from "@elchininet/isometric";
import type { IsoFaceId, IsometricOrientation } from "../../types/diagram.js";
import { DEFAULT_ISOMETRIC_ORIENTATION } from "../orientation.js";

/** Face paths for CSS (solid fills; wireframe supplies strokes). */
export const IC_ISO_CUBE_FACE_CLASS = "ic-iso-cube-face";

/** Groups cube faces + label node for hit-testing and hover paint. */
export const IC_ISO_CUBE_SHELL_CLASS = "ic-iso-cube-shell";

/** Full footprint highlight; {@link IC_ISO_CUBE_VOLUME_CLASS} shrinks inside it when pressed. */
export const IC_ISO_CUBE_PRESS_BOTTOM_CLASS = "ic-iso-cube-press-bottom";

/** Opaque artboard-matched pad under the cube (blocks grid); not the visible shadow ring. */
export const IC_ISO_CUBE_FOOTPRINT_OCCLUDER_CLASS = "ic-iso-cube-footprint-occluder";

/** Cube faces + label; CSS scale from bottom center when shell is pressed / selected. */
export const IC_ISO_CUBE_VOLUME_CLASS = "ic-iso-cube-volume";

/** Diagonal triangle overlay on the top face (one half of the parallelogram; not a hit target). */
export const IC_ISO_CUBE_TOP_GLOSS_CLASS = "ic-iso-cube-top-gloss";

/** Lit front fill revealed from center when the shell is pressed / selected (CSS mask). */
export const IC_ISO_CUBE_FRONT_LIGHT_CLASS = "ic-iso-cube-front-light";

/** Ground contact strokes — front (bottom) + side (screen-left base) edges (see bottom-rim.ts). */
export const IC_ISO_CUBE_BOTTOM_RIM_CLASS = "ic-iso-cube-bottom-rim";
/** Front face ground edge — visible bottom of the button. */
export const IC_ISO_CUBE_BOTTOM_RIM_BOTTOM_CLASS = "ic-iso-cube-bottom-rim--bottom";
/** Side face ground edge — visible bottom-left base segment (styled with left ink, not right). */
export const IC_ISO_CUBE_BOTTOM_RIM_LEFT_CLASS = "ic-iso-cube-bottom-rim--left";

/** @deprecated Closed full-footprint ring; use partial {@link IC_ISO_CUBE_BOTTOM_RIM_CLASS} segments. */
export const IC_ISO_CUBE_FOOTPRINT_CONTACT_CLASS = "ic-iso-cube-footprint-contact";

export type IsoTopPlaneAnchor = { right: number; left: number; top: number };

/** Bulge on each footprint edge in iso units (× min(width, depth)). */
export const ISO_CUBE_FOOTPRINT_CURVE_BULGE_RATIO = 0.045;

/** Inset top gloss triangle corners toward footprint center (0–1 lerp). */
export const ISO_CUBE_TOP_GLOSS_INSET_RATIO = 0.09;

/** Diagonal gloss edge bulge as a fraction of footprint edge bulge. */
export const ISO_CUBE_TOP_GLOSS_DIAGONAL_BULGE_RATIO = 0.55;

/** @deprecated Use {@link ISO_CUBE_FOOTPRINT_CURVE_BULGE_RATIO}. */
export const ISO_CUBE_TOP_FACE_CURVE_BULGE_RATIO = ISO_CUBE_FOOTPRINT_CURVE_BULGE_RATIO;

type FootprintLayout = {
  width: number;
  height: number;
  left?: number;
  right?: number;
  top?: number;
};

/** Footprint parallelogram corners A→B→C→D from a TOP-plane face layout. */
export function isoCubeFootprintCornerAnchorsFromLayout(
  layout: FootprintLayout,
): [IsoTopPlaneAnchor, IsoTopPlaneAnchor, IsoTopPlaneAnchor, IsoTopPlaneAnchor] {
  const r0 = layout.right ?? 0;
  const l0 = layout.left ?? 0;
  const dr = layout.width;
  const dl = layout.height;
  const t = layout.top ?? 0;
  return [
    { right: r0, left: l0, top: t },
    { right: r0 + dr, left: l0, top: t },
    { right: r0 + dr, left: l0 + dl, top: t },
    { right: r0, left: l0 + dl, top: t },
  ];
}

/**
 * Top footprint parallelogram corners A→B→C→D (same layout as the flat top rect).
 */
export function isoCubeTopFaceCornerAnchors(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): [IsoTopPlaneAnchor, IsoTopPlaneAnchor, IsoTopPlaneAnchor, IsoTopPlaneAnchor] {
  const layout = isoCubeFaceRectLayoutForPlaneTopLeft("top", width, depth, height, orientation);
  return isoCubeFootprintCornerAnchorsFromLayout(layout);
}

/** Bottom footprint corners (same bulge silhouette as top, at ground elevation). */
export function isoCubeBottomFaceCornerAnchors(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): [IsoTopPlaneAnchor, IsoTopPlaneAnchor, IsoTopPlaneAnchor, IsoTopPlaneAnchor] {
  const layout = isoCubeFaceRectLayoutForPlaneTopLeft("bottom", width, depth, height, orientation);
  return isoCubeFootprintCornerAnchorsFromLayout(layout);
}

/**
 * Shade triangle for the top face: diagonal A→C; this is the A–D–C half (complement of A–B–C).
 */
export function isoCubeTopFaceDiagonalShadeTriangleAnchors(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): [IsoTopPlaneAnchor, IsoTopPlaneAnchor, IsoTopPlaneAnchor] {
  const [a, , c, d] = isoCubeTopFaceCornerAnchors(width, depth, height, orientation);
  return [a, d, c];
}

/** Ground-level segment on the front face (visible “bottom” edge of the button). */
export function isoCubeFrontBottomRimAnchors(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): [IsoTopPlaneAnchor, IsoTopPlaneAnchor] {
  const layout = isoCubeFaceRectLayoutForPlaneTopLeft("front", width, depth, height, orientation);
  const r = layout.right ?? 0;
  const l0 = layout.left ?? 0;
  const t = 0;
  return [
    { right: r, left: l0, top: t },
    { right: r, left: l0 + layout.width, top: t },
  ];
}

/** Ground-level segment on the side face (visible “bottom left” edge of the button). */
export function isoCubeSideBottomRimAnchors(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): [IsoTopPlaneAnchor, IsoTopPlaneAnchor] {
  const layout = isoCubeFaceRectLayoutForPlaneTopLeft("side", width, depth, height, orientation);
  const r0 = layout.right ?? 0;
  const l = layout.left ?? 0;
  const t = 0;
  return [
    { right: r0, left: l, top: t },
    { right: r0 + layout.width, left: l, top: t },
  ];
}

/** Outset on the ground TOP plane for the cube drop shadow (iso units). */
export const ISO_CUBE_GROUND_SHADOW_MARGIN_ISO = 0.16;

/** @deprecated Use {@link IC_ISO_CUBE_PRESS_BOTTOM_CLASS}. */
export const IC_ISO_CUBE_FOOTPRINT_INSET_CLASS = IC_ISO_CUBE_PRESS_BOTTOM_CLASS;

export function isoCubeFaceClassName(face: IsoFaceId): string {
  return `${IC_ISO_CUBE_FACE_CLASS} ic-iso-cube-face--${face}`;
}

/** Mount + global paint interleave (back → front). */
export const ISO_CUBE_MOUNT_FACE_ORDER: readonly IsoFaceId[] = [
  "bottom",
  "back",
  "left",
  "side",
  "front",
  "top",
];

type FaceRectLayout = {
  planeView: PlaneView;
  width: number;
  height: number;
  left?: number;
  right?: number;
  top?: number;
};

function isoCubeFaceRectLayoutDefaultPlaneTopLeft(
  face: IsoFaceId,
  width: number,
  depth: number,
  height: number,
): FaceRectLayout {
  switch (face) {
    case "bottom":
    case "top":
      return {
        planeView: PlaneView.TOP,
        width: depth,
        height: width,
        left: -width,
        right: 0,
        top: face === "bottom" ? 0 : height,
      };
    case "back":
      return { planeView: PlaneView.FRONT, width, height, left: -width, right: 0 };
    case "front":
      return { planeView: PlaneView.FRONT, width, height, left: -width, right: depth };
    case "left":
      return { planeView: PlaneView.SIDE, width: depth, height, left: -width, right: 0 };
    case "side":
      return { planeView: PlaneView.SIDE, width: depth, height, left: 0, right: 0 };
    default: {
      const _exhaustive: never = face;
      return _exhaustive;
    }
  }
}

/** Rotated iso: local footprint spans l ∈ [0, width], r ∈ [0, depth] (matches {@link isoStageGroundTopLayout}). */
function isoCubeFaceRectLayoutRotatedPlaneTopLeft(
  face: IsoFaceId,
  width: number,
  depth: number,
  height: number,
): FaceRectLayout {
  if (face === "bottom" || face === "top") {
    return {
      planeView: PlaneView.TOP,
      width: depth,
      height: width,
      left: 0,
      right: 0,
      top: face === "bottom" ? 0 : height,
    };
  }
  const base = isoCubeFaceRectLayoutDefaultPlaneTopLeft(face, width, depth, height);
  return { ...base, left: (base.left ?? 0) + width };
}

/**
 * Footprint pinned at plane top-left before iso projection.
 * Default: local l ∈ [−width, 0], r ∈ [0, depth].
 * Rotated: local l ∈ [0, width], r ∈ [0, depth].
 */
export function isoCubeFaceRectLayoutForPlaneTopLeft(
  face: IsoFaceId,
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): FaceRectLayout {
  if (orientation === "rotated") {
    return isoCubeFaceRectLayoutRotatedPlaneTopLeft(face, width, depth, height);
  }
  return isoCubeFaceRectLayoutDefaultPlaneTopLeft(face, width, depth, height);
}

/**
 * Bottom TOP-plane rect outset by a constant margin in iso plane units (equal on all four sides).
 */
export function isoFootprintMarginBottomLayout(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
  marginIso: number,
): FaceRectLayout {
  const base = isoCubeFaceRectLayoutForPlaneTopLeft("bottom", width, depth, height, orientation);
  const m = marginIso;
  if (m <= 0) {
    return { ...base };
  }
  if (orientation === "rotated") {
    return {
      ...base,
      width: depth + 2 * m,
      height: width + 2 * m,
      left: -m,
      right: -m,
    };
  }
  return {
    ...base,
    width: depth + 2 * m,
    height: width + 2 * m,
    left: -width - m,
    right: -m,
  };
}

/**
 * Bottom TOP-plane rect expanded uniformly about the footprint center (even margin on all sides).
 * Matches {@link isoCubeFaceRectLayoutForPlaneTopLeft}("bottom", …) at scale 1.
 * @deprecated Prefer {@link isoFootprintMarginBottomLayout} for equal plane margin.
 */
export function isoFootprintOutsetBottomLayout(
  width: number,
  depth: number,
  height: number,
  orientation: IsometricOrientation,
  scale: number,
): FaceRectLayout {
  const base = isoCubeFaceRectLayoutForPlaneTopLeft("bottom", width, depth, height, orientation);
  if (scale === 1) {
    return { ...base };
  }
  const s = scale;
  if (orientation === "rotated") {
    return {
      ...base,
      width: depth * s,
      height: width * s,
      left: (width * (1 - s)) / 2,
      right: (depth * (1 - s)) / 2,
    };
  }
  return {
    ...base,
    width: depth * s,
    height: width * s,
    left: (-width * (1 + s)) / 2,
    right: (depth * (1 - s)) / 2,
  };
}

/** Library rectangle props per face (local to footprint anchor). TOP plane: width→r (depth), height→l (width). */
export function isoCubeFaceRectLayout(
  face: IsoFaceId,
  width: number,
  depth: number,
  height: number,
): FaceRectLayout {
  switch (face) {
    case "bottom":
    case "top":
      return {
        planeView: PlaneView.TOP,
        width: depth,
        height: width,
        top: face === "bottom" ? 0 : height,
      };
    case "back":
      return { planeView: PlaneView.FRONT, width, height, right: 0 };
    case "front":
      return { planeView: PlaneView.FRONT, width, height, right: depth };
    case "left":
      return { planeView: PlaneView.SIDE, width: depth, height, left: 0 };
    case "side":
      return { planeView: PlaneView.SIDE, width: depth, height, left: width };
    default: {
      const _exhaustive: never = face;
      return _exhaustive;
    }
  }
}
