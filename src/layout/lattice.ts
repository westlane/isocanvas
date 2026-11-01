// Copyright (C) 2026 West Lane - All Rights Reserved

import { artboardPlaneToIsoGround } from "../isometric/diagram-user.js";
import { artboardUserToPlane } from "./artboard-coords.js";
import type { ArtboardUserSize } from "../types/artboard.js";
import { DEFAULT_ARTBOARD_DOTS_PER_CELL, DEFAULT_ARTBOARD_USER_SIZE } from "./artboard.js";

/** Where column 0 / row 0 sits on the artboard. */
export type ArtboardLatticeOrigin = "top-left" | "bottom-left";

export type ArtboardLatticePitch = {
  xPx: number;
  yPx: number;
};

/** Pitch of one macro cell when the artboard is split into `divisions`×`divisions`. */
export function artboardDivisionPitch(
  userSize: ArtboardUserSize,
  divisions: number,
): ArtboardLatticePitch {
  return {
    xPx: userSize.width / divisions,
    yPx: userSize.height / divisions,
  };
}

export type ArtboardLatticeFootprintUser = {
  widthPx: number;
  depthPx: number;
};

export type ArtboardLatticeCell = {
  col: number;
  row: number;
};

/** Shift a footprint pin west (`leftDots`) and south (`downDots`) on the dot lattice. */
export type ArtboardLatticeDotPinOffset = {
  leftDots?: number;
  downDots?: number;
};

/** Cell anchor in artboard plane space (viewBox top-left origin, +y down). */
export function artboardPlaneCellOrigin(
  col: number,
  row: number,
  pitch: ArtboardLatticePitch,
  options?: {
    origin?: ArtboardLatticeOrigin;
    artboardHeight?: number;
  },
): { x: number; y: number } {
  const origin = options?.origin ?? "top-left";
  const x = col * pitch.xPx;
  if (origin === "top-left") {
    return { x, y: row * pitch.yPx };
  }
  const h = options?.artboardHeight ?? DEFAULT_ARTBOARD_USER_SIZE.height;
  return artboardUserToPlane(col * pitch.xPx, row * pitch.yPx, h);
}

/** Spacing between dots inside a macro cell. */
export function artboardDotStep(
  pitch: ArtboardLatticePitch,
  dotsPerCell = DEFAULT_ARTBOARD_DOTS_PER_CELL,
): ArtboardLatticePitch {
  return { xPx: pitch.xPx / dotsPerCell, yPx: pitch.yPx / dotsPerCell };
}

/** Plane top-left for a footprint centered in a macro cell (division pitch). */
export function artboardPlaneCellCenteredFootprint(
  col: number,
  row: number,
  pitch: ArtboardLatticePitch,
  footprint: ArtboardLatticeFootprintUser,
): { x: number; y: number } {
  const corner = artboardPlaneCellOrigin(col, row, pitch);
  return {
    x: corner.x + (pitch.xPx - footprint.widthPx) / 2,
    y: corner.y + (pitch.yPx - footprint.depthPx) / 2,
  };
}

/**
 * Plane `(x, y)` pins the footprint **back-left** ground corner (higher in default iso)
 * to the macro cell's top-left dot.
 */
export function artboardPlaneCellFootprintAtTopLeftDot(
  col: number,
  row: number,
  pitch: ArtboardLatticePitch,
  dotsPerCell = DEFAULT_ARTBOARD_DOTS_PER_CELL,
  offset: ArtboardLatticeDotPinOffset = {},
): { x: number; y: number } {
  const dot = artboardPlaneCellFirstDot(col, row, pitch, dotsPerCell);
  const step = artboardDotStep(pitch, dotsPerCell);
  const leftDots = offset.leftDots ?? 0;
  const downDots = offset.downDots ?? 0;
  return {
    x: dot.x - leftDots * step.xPx,
    y: dot.y + downDots * step.yPx,
  };
}

/** Top-left dot of a macro cell's centered dot lattice (half a dot step in from the cell corner). */
export function artboardPlaneCellFirstDot(
  col: number,
  row: number,
  pitch: ArtboardLatticePitch,
  dotsPerCell = DEFAULT_ARTBOARD_DOTS_PER_CELL,
): { x: number; y: number } {
  const corner = artboardPlaneCellOrigin(col, row, pitch);
  const step = artboardDotStep(pitch, dotsPerCell);
  return { x: corner.x + step.xPx / 2, y: corner.y + step.yPx / 2 };
}

/** Round a footprint to whole dot steps so its far edges land on dot rows (min one step). */
export function artboardSnapFootprintToDots(
  footprint: ArtboardLatticeFootprintUser,
  pitch: ArtboardLatticePitch,
  dotsPerCell = DEFAULT_ARTBOARD_DOTS_PER_CELL,
): ArtboardLatticeFootprintUser {
  const step = artboardDotStep(pitch, dotsPerCell);
  return {
    widthPx: Math.max(1, Math.round(footprint.widthPx / step.xPx)) * step.xPx,
    depthPx: Math.max(1, Math.round(footprint.depthPx / step.yPx)) * step.yPx,
  };
}

/** Iso ground anchor for a lattice cell (plane layout → {@link artboardPlaneToIsoGround}). */
export function artboardLatticeCellIsoGround(
  col: number,
  row: number,
  pitch: ArtboardLatticePitch,
  options?: {
    origin?: ArtboardLatticeOrigin;
    artboardHeight?: number;
    /** Center this footprint in the macro cell (requires pitch = division cell size). */
    footprintUser?: ArtboardLatticeFootprintUser;
  },
): { left: number; right: number } {
  const plane = artboardPlaneCellOrigin(col, row, pitch, options);
  if (options?.footprintUser) {
    plane.x += (pitch.xPx - options.footprintUser.widthPx) / 2;
    plane.y += (pitch.yPx - options.footprintUser.depthPx) / 2;
  }
  return artboardPlaneToIsoGround(plane.x, plane.y);
}

/** Back-to-front mount order: lower rows first, then columns left to right. */
export function compareArtboardLatticeCells(
  a: ArtboardLatticeCell,
  b: ArtboardLatticeCell,
): number {
  if (a.row !== b.row) {
    return a.row - b.row;
  }
  return a.col - b.col;
}

/** User-space artboard size that fits a col×row lattice from the top-left anchor. */
export function artboardUserSizeForLattice(
  cols: number,
  rows: number,
  cell: { widthPx: number; depthPx: number },
  gapPx: number,
): { width: number; height: number } {
  return {
    width: cols * cell.widthPx + Math.max(0, cols - 1) * gapPx,
    height: rows * cell.depthPx + Math.max(0, rows - 1) * gapPx,
  };
}
