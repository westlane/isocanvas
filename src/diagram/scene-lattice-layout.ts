// Copyright (C) 2026 West Lane - All Rights Reserved

import {
  DEFAULT_ARTBOARD_DOTS_PER_CELL,
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
  DEFAULT_ARTBOARD_USER_SIZE,
} from "../layout/artboard.js";
import {
  artboardDivisionPitch,
  artboardDotStep,
  artboardPlaneMacroCellFootprintOnGridLines,
  artboardSnapFootprintToMacroCellInner,
  enforcePlaneBoxOnArtboardLattice,
} from "../layout/lattice-plane.js";
import type { ArtboardPlaneStage, PlaneBoxSpec } from "../types/artboard.js";
import type { DiagramSceneNode } from "../types/diagram.js";

export type MacroGridCellLayoutOptions = {
  stage?: ArtboardPlaneStage;
  /** Guide-step margin inside each macro cell edge (default 1). */
  dotInset?: number;
  dotsPerCell?: number;
};

/**
 * One macro cell: footprint stretched to division guides, centered in the inner line band.
 */
export function planeRectForMacroGridCell(
  col: number,
  row: number,
  footprintUser: { widthPx: number; depthPx: number },
  options: MacroGridCellLayoutOptions = {},
): Pick<DiagramSceneNode, "x" | "y" | "w" | "h"> {
  const stage = options.stage ?? defaultLatticeStage();
  const dotsPerCell = options.dotsPerCell ?? DEFAULT_ARTBOARD_DOTS_PER_CELL;
  const pitch = artboardDivisionPitch(
    { width: stage.width, height: stage.height },
    stage.divisions ?? DEFAULT_ARTBOARD_GRID_DIVISIONS,
  );
  const margin = options.dotInset ?? 1;
  const footprint = artboardSnapFootprintToMacroCellInner(
    footprintUser,
    pitch,
    margin,
    dotsPerCell,
  );
  const placed = artboardPlaneMacroCellFootprintOnGridLines(
    col,
    row,
    pitch,
    footprint,
    margin,
    dotsPerCell,
  );
  const originX = stage.x ?? 0;
  const originY = stage.y ?? 0;
  const enforced = enforcePlaneBoxOnArtboardLattice(
    {
      id: "_",
      label: "_",
      x: placed.x + originX,
      y: placed.y + originY,
      width: placed.widthPx,
      depth: placed.depthPx,
      footprintAnchor: "back-left",
    },
    stage,
    dotsPerCell,
  );
  return {
    x: enforced.x,
    y: enforced.y,
    w: enforced.width,
    h: enforced.depth,
  };
}

export function defaultLatticeStage(
  userSize = DEFAULT_ARTBOARD_USER_SIZE,
): ArtboardPlaneStage {
  return {
    x: 0,
    y: 0,
    width: userSize.width,
    height: userSize.height,
    divisions: DEFAULT_ARTBOARD_GRID_DIVISIONS,
  };
}

/** Map portable scene node → plane box, then snap to division guides. */
export function planeBoxFromDiagramNodeOnLattice(
  node: Pick<DiagramSceneNode, "id" | "label" | "x" | "y" | "w" | "h">,
  stage: ArtboardPlaneStage,
  box: Omit<PlaneBoxSpec, "id" | "label" | "x" | "y" | "width" | "depth"> = {},
): PlaneBoxSpec {
  return enforcePlaneBoxOnArtboardLattice(
    {
      id: node.id,
      label: node.label,
      x: node.x,
      y: node.y,
      width: node.w,
      depth: node.h,
      footprintAnchor: "back-left",
      ...box,
    },
    stage,
  );
}

/** True when the box already sits on division guides with line-quantized size. */
export function planeBoxIsOnArtboardLattice(
  box: Pick<PlaneBoxSpec, "x" | "y" | "width" | "depth">,
  stage: ArtboardPlaneStage,
  epsilon = 1e-6,
): boolean {
  const enforced = enforcePlaneBoxOnArtboardLattice(
    {
      id: "_",
      label: "_",
      x: box.x,
      y: box.y,
      width: box.width,
      depth: box.depth,
      footprintAnchor: "back-left",
    },
    stage,
  );
  return (
    Math.abs(enforced.x - box.x) <= epsilon &&
    Math.abs(enforced.y - box.y) <= epsilon &&
    Math.abs(enforced.width - box.width) <= epsilon &&
    Math.abs(enforced.depth - box.depth) <= epsilon
  );
}

export function macroGridDotStepPx(stage: ArtboardPlaneStage = defaultLatticeStage()): number {
  const pitch = artboardDivisionPitch(
    { width: stage.width, height: stage.height },
    stage.divisions ?? DEFAULT_ARTBOARD_GRID_DIVISIONS,
  );
  return artboardDotStep(pitch).xPx;
}
