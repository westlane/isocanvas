// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ViewBox } from "./core.js";

/** Portable diagram interchange (e.g. domainspec kernel export). Render with `src/isometric/` helpers in apps. */

export type DiagramSceneNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type DiagramSceneEdge = {
  id?: string;
  from: string;
  to: string;
  label?: string;
};

export type DiagramScene = {
  viewBox?: ViewBox;
  /** Macro grid divisions used when placing nodes (must match render artboard stage). */
  divisions?: number;
  nodes: DiagramSceneNode[];
  edges?: DiagramSceneEdge[];
};

/** Footprint + extrusion for one cube-canvas primitive (six faces via TOP/FRONT/SIDE planes). */
export type IsoBoxSpec = {
  id: string;
  label: string;
  left: number;
  right: number;
  width: number;
  depth: number;
  height: number;
  /** Vertical offset from ground anchor in iso units. */
  elevation?: number;
};

export type IsoFaceId = "bottom" | "back" | "left" | "side" | "front" | "top";

/** 90° clockwise iso view — plane layout rotates before ic-canvas projection. */
export type IsometricOrientation = "default" | "rotated";

/** Overhead layout space: viewBox top-left origin, +x right, +y down (before isometric projection). */
export type ArtboardPlanePoint = {
  x: number;
  y: number;
};

/** ic-canvas ground anchor (`IsometricGroup` / path `moveTo(r, l, …)`). */
export type IsoGroundAnchor = {
  left: number;
  right: number;
};

export type StackLayerPresentation = {
  /** 0 = bottom of stack (lowest elevation). */
  rank: number;
  size: number;
};
