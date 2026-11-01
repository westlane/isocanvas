// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

/** Logical artboard size in user units (+x right, +y up; origin bottom-left). */
export type ArtboardUserSize = {
  width: number;
  height: number;
};

/** Overhead layout rect on the artboard plane (viewBox top-left origin, +y down). */
export type ArtboardPlaneRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Artboard floor + macro grid — all geometry in plane space until mount projection. */
export type ArtboardPlaneStage = ArtboardPlaneRect & {
  divisions?: number;
  /** Fainter sub-guides per macro cell side (1 = none). */
  subdivisions?: number;
};

/** Which footprint corner `(x, y)` pins on the artboard plane before iso projection. */
export type PlaneFootprintAnchorCorner = "plane-top-left" | "back-left";

/** One extruded card/box before isometric projection. */
export type PlaneBoxSpec = {
  id: string;
  label: string;
  /**
   * Footprint anchor on the artboard plane (see {@link PlaneFootprintAnchorCorner}).
   * Both `plane-top-left` and `back-left` pin ic-canvas ground (l=0, r=0) at `(x, y)` — the
   * footprint corner on the back edge that reads higher in the default iso view.
   */
  x: number;
  y: number;
  footprintAnchor?: PlaneFootprintAnchorCorner;
  /** Footprint size in plane / user pixels. */
  width: number;
  depth: number;
  /** Extrusion in iso units; default from footprint at mount time. */
  height?: number;
  /** Lift above the footprint ground in iso units (same-plane stacks). */
  elevation?: number;
};

