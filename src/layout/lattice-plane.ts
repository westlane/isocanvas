// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { artboardUserToPlane } from "./artboard-coords.js";
import type { ArtboardPlaneStage, ArtboardUserSize, PlaneBoxSpec } from "../types/artboard.js";
import {
  DEFAULT_ARTBOARD_DOTS_PER_CELL,
  DEFAULT_ARTBOARD_DOT_LATTICE_PHASE,
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
  DEFAULT_ARTBOARD_USER_SIZE,
  type ArtboardDotLatticePhase,
} from "./artboard.js";

export type { ArtboardDotLatticePhase } from "./artboard.js";

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

/** Top-left stud of a macro cell's dot lattice (on intersections by default). */
export function artboardPlaneCellFirstDot(
  col: number,
  row: number,
  pitch: ArtboardLatticePitch,
  dotsPerCell = DEFAULT_ARTBOARD_DOTS_PER_CELL,
  phase: ArtboardDotLatticePhase = DEFAULT_ARTBOARD_DOT_LATTICE_PHASE,
): { x: number; y: number } {
  const corner = artboardPlaneCellOrigin(col, row, pitch);
  const step = artboardDotStep(pitch, dotsPerCell);
  const originInCell = artboardDotLatticeOriginInCell(step, phase);
  return { x: corner.x + originInCell.xPx, y: corner.y + originInCell.yPx };
}

/** Round a footprint to whole grid-line spans (far edges on division guides, not dot centers). */
export function artboardSnapFootprintToGridLines(
  footprint: ArtboardLatticeFootprintUser,
  lineStep: ArtboardLatticePitch,
): ArtboardLatticeFootprintUser {
  return {
    widthPx: Math.max(lineStep.xPx, Math.round(footprint.widthPx / lineStep.xPx) * lineStep.xPx),
    depthPx: Math.max(lineStep.yPx, Math.round(footprint.depthPx / lineStep.yPx) * lineStep.yPx),
  };
}

/** @deprecated Prefer {@link artboardSnapFootprintToGridLines} for plane boxes. */
export function artboardSnapFootprintToDots(
  footprint: ArtboardLatticeFootprintUser,
  pitch: ArtboardLatticePitch,
  dotsPerCell = DEFAULT_ARTBOARD_DOTS_PER_CELL,
): ArtboardLatticeFootprintUser {
  return artboardSnapFootprintToGridLines(footprint, artboardDotStep(pitch, dotsPerCell));
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

/** Dot spacing on the artboard plane (matches iso SVG ground pattern). */
export function artboardPlaneDotStep(
  stage: Pick<ArtboardPlaneStage, "width" | "height" | "divisions">,
  dotsPerCell = DEFAULT_ARTBOARD_DOTS_PER_CELL,
): ArtboardLatticePitch {
  const divisions = stage.divisions ?? DEFAULT_ARTBOARD_GRID_DIVISIONS;
  const pitch = artboardDivisionPitch(
    { width: stage.width, height: stage.height },
    divisions,
  );
  return artboardDotStep(pitch, dotsPerCell);
}

/** Fine iso ground guide spacing in plane pixels (lines at multiples of this step). */
export function artboardPlaneGridLineStep(
  stage: Pick<ArtboardPlaneStage, "width" | "height" | "divisions">,
  dotsPerCell = DEFAULT_ARTBOARD_DOTS_PER_CELL,
): ArtboardLatticePitch {
  return artboardPlaneDotStep(stage, dotsPerCell);
}

export function snapPlaneAxisToArtboardGridLine(
  value: number,
  lineStep: number,
  origin = 0,
): number {
  return Math.round((value - origin) / lineStep) * lineStep + origin;
}

/** Snap a plane point to the nearest iso ground division guide intersection. */
export function snapPlanePointToArtboardGridLine(
  planeX: number,
  planeY: number,
  stage: Pick<ArtboardPlaneStage, "width" | "height" | "divisions" | "x" | "y">,
  dotsPerCell = DEFAULT_ARTBOARD_DOTS_PER_CELL,
): { x: number; y: number } {
  const lineStep = artboardPlaneGridLineStep(stage, dotsPerCell);
  const originX = stage.x ?? 0;
  const originY = stage.y ?? 0;
  return {
    x: snapPlaneAxisToArtboardGridLine(planeX, lineStep.xPx, originX),
    y: snapPlaneAxisToArtboardGridLine(planeY, lineStep.yPx, originY),
  };
}

/** Scale a footprint to fit the line-bounded inner band of one macro cell. */
export function artboardSnapFootprintToMacroCellInner(
  footprintUser: ArtboardLatticeFootprintUser,
  pitch: ArtboardLatticePitch,
  marginLines = 1,
  dotsPerCell = DEFAULT_ARTBOARD_DOTS_PER_CELL,
): ArtboardLatticeFootprintUser {
  const lineStep = artboardDotStep(pitch, dotsPerCell);
  const preferred = artboardSnapFootprintToGridLines(footprintUser, lineStep);
  const lineSpan = dotsPerCell - 2 * marginLines;
  const inner = { widthPx: lineSpan * lineStep.xPx, depthPx: lineSpan * lineStep.yPx };
  const scale = Math.min(
    1,
    inner.widthPx / preferred.widthPx,
    inner.depthPx / preferred.depthPx,
  );
  return artboardSnapFootprintToGridLines(
    { widthPx: preferred.widthPx * scale, depthPx: preferred.depthPx * scale },
    lineStep,
  );
}

/**
 * Center a line-snapped footprint inside one macro cell (margins measured in guide steps).
 */
export function artboardPlaneMacroCellFootprintOnGridLines(
  col: number,
  row: number,
  pitch: ArtboardLatticePitch,
  footprint: ArtboardLatticeFootprintUser,
  marginLines = 1,
  dotsPerCell = DEFAULT_ARTBOARD_DOTS_PER_CELL,
): { x: number; y: number; widthPx: number; depthPx: number } {
  const lineStep = artboardDotStep(pitch, dotsPerCell);
  const corner = artboardPlaneCellOrigin(col, row, pitch);
  const x0 = corner.x + marginLines * lineStep.xPx;
  const y0 = corner.y + marginLines * lineStep.yPx;
  const x1 = corner.x + pitch.xPx - marginLines * lineStep.xPx;
  const y1 = corner.y + pitch.yPx - marginLines * lineStep.yPx;
  const sized = artboardSnapFootprintToGridLines(
    {
      widthPx: Math.min(footprint.widthPx, x1 - x0),
      depthPx: Math.min(footprint.depthPx, y1 - y0),
    },
    lineStep,
  );
  const slackX = x1 - x0 - sized.widthPx;
  const slackY = y1 - y0 - sized.depthPx;
  const x =
    x0 + Math.round(slackX / (2 * lineStep.xPx)) * lineStep.xPx;
  const y =
    y0 + Math.round(slackY / (2 * lineStep.yPx)) * lineStep.yPx;
  return { x, y, widthPx: sized.widthPx, depthPx: sized.depthPx };
}

/** Offset from a macro cell corner to the first stud in that cell. */
export function artboardDotLatticeOriginInCell(
  step: ArtboardLatticePitch,
  phase: ArtboardDotLatticePhase = DEFAULT_ARTBOARD_DOT_LATTICE_PHASE,
): ArtboardLatticePitch {
  const inset = phase === "cell-center" ? 0.5 : 0;
  return { xPx: step.xPx * inset, yPx: step.yPx * inset };
}

/** Iso ground guide position along one axis (between studs when `intersection`). */
export function artboardIsoGroundGuideFraction(
  lineIndex: number,
  lineCount: number,
  phase: ArtboardDotLatticePhase = DEFAULT_ARTBOARD_DOT_LATTICE_PHASE,
): number {
  if (phase === "intersection") {
    return (lineIndex - 0.5) / lineCount;
  }
  return lineIndex / lineCount;
}

function snapPlaneAxisToDotLattice(
  value: number,
  step: number,
  phase: ArtboardDotLatticePhase = DEFAULT_ARTBOARD_DOT_LATTICE_PHASE,
): number {
  if (phase === "cell-center") {
    const index = Math.round((value - step / 2) / step);
    return index * step + step / 2;
  }
  return Math.round(value / step) * step;
}

/** Snap a plane point to the nearest stud on the iso ground lattice. */
export function snapPlanePointToArtboardDotCenter(
  planeX: number,
  planeY: number,
  stage: Pick<ArtboardPlaneStage, "width" | "height" | "divisions" | "x" | "y">,
  dotsPerCell = DEFAULT_ARTBOARD_DOTS_PER_CELL,
  phase: ArtboardDotLatticePhase = DEFAULT_ARTBOARD_DOT_LATTICE_PHASE,
): { x: number; y: number } {
  const step = artboardPlaneDotStep(stage, dotsPerCell);
  const originX = stage.x ?? 0;
  const originY = stage.y ?? 0;
  return {
    x: snapPlaneAxisToDotLattice(planeX - originX, step.xPx, phase) + originX,
    y: snapPlaneAxisToDotLattice(planeY - originY, step.yPx, phase) + originY,
  };
}

/** Pin box corners to division guides; stretch footprint to whole line spans. */
export function enforcePlaneBoxOnArtboardLattice(
  box: PlaneBoxSpec,
  stage: ArtboardPlaneStage,
  dotsPerCell = DEFAULT_ARTBOARD_DOTS_PER_CELL,
): PlaneBoxSpec {
  const lineStep = artboardPlaneGridLineStep(stage, dotsPerCell);
  const anchor = snapPlanePointToArtboardGridLine(box.x, box.y, stage, dotsPerCell);
  const footprint = artboardSnapFootprintToGridLines(
    { widthPx: box.width, depthPx: box.depth },
    lineStep,
  );
  return {
    ...box,
    x: anchor.x,
    y: anchor.y,
    width: footprint.widthPx,
    depth: footprint.depthPx,
  };
}

/** @deprecated Use {@link enforcePlaneBoxOnArtboardLattice}. */
export const snapPlaneBoxToArtboardDotGrid = enforcePlaneBoxOnArtboardLattice;
