// Copyright (C) 2026 West Lane - All Rights Reserved

import {
  DEFAULT_ARTBOARD_DOTS_PER_CELL,
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
  DEFAULT_ARTBOARD_USER_SIZE,
} from "../layout/artboard.js";
import {
  artboardDivisionPitch,
  artboardDotStep,
  artboardPlaneCellOrigin,
  artboardPlaneMacroCellFootprintOnGridLines,
  artboardSnapFootprintToGridLines,
  artboardSnapFootprintToMacroCellInner,
  enforcePlaneBoxOnArtboardLattice,
} from "../layout/lattice-plane.js";
import type { ArtboardPlaneStage, PlaneBoxSpec } from "../types/artboard.js";
import type { DiagramSceneNode } from "../types/diagram.js";

/** Guide-step margin on the leading artboard edges (min X / min Y) of the layout band. */
export const DEFAULT_ARTBOARD_LAYOUT_DOT_INSET = 2;
/**
 * Trailing edge inset (max X / max Y). One line wider than {@link DEFAULT_ARTBOARD_LAYOUT_DOT_INSET}
 * so cell-center stud rims match the leading side (3 visible dots vs 2).
 */
export const DEFAULT_ARTBOARD_LAYOUT_DOT_INSET_TRAILING = 3;
/** Minimum clear fine-line gap between neighbors in a space-between row (class diagram columns). */
export const DEFAULT_ROW_INTER_COLUMN_GAP_LINES = 3;
export type MacroGridCellLayoutOptions = {
  stage?: ArtboardPlaneStage;
  /** Leading-edge inset in fine guide lines (default {@link DEFAULT_ARTBOARD_LAYOUT_DOT_INSET}). */
  dotInset?: number;
  /** Trailing-edge inset in fine guide lines (default {@link DEFAULT_ARTBOARD_LAYOUT_DOT_INSET_TRAILING}). */
  dotInsetTrailing?: number;
  dotsPerCell?: number;
};

export type ArtboardRowSpaceBetweenOptions = MacroGridCellLayoutOptions & {
  /** Macro columns spanned by the row band (default: `rowSpan` or stage `divisions`). */
  colSpan?: number;
  /** Total content rows in the diagram (vertical space-between when set). */
  rowCount?: number;
  /** Macro rows spanned vertically (default `rowCount` or stage `divisions`). */
  rowSpan?: number;
  /** Fixed column count for the grid (partial rows use left columns, same X as full rows). */
  gridCols?: number;
  /** Target minimum clear gap between columns in fine guide lines (default {@link DEFAULT_ROW_INTER_COLUMN_GAP_LINES}). */
  minInterColumnGapLines?: number;
};

function artboardInnerBandOnGrid(
  pitch: ReturnType<typeof artboardDivisionPitch>,
  lineStep: ReturnType<typeof artboardDotStep>,
  marginLeading: number,
  colSpan: number,
  rowSpan: number,
  marginTrailing = marginLeading,
): { minX: number; maxX: number; minY: number; maxY: number } {
  const topLeft = artboardPlaneCellOrigin(0, 0, pitch);
  const bottomRight = artboardPlaneCellOrigin(colSpan - 1, rowSpan - 1, pitch);
  return {
    minX: topLeft.x + marginLeading * lineStep.xPx,
    maxX: bottomRight.x + pitch.xPx - marginTrailing * lineStep.xPx,
    minY: topLeft.y + marginLeading * lineStep.yPx,
    maxY: bottomRight.y + pitch.yPx - marginTrailing * lineStep.yPx,
  };
}

/** Assign equal +1 line gaps from the center outward when slack does not divide evenly. */
function interColumnGapLines(totalClearGapLines: number, gapCount: number): number[] {
  if (gapCount <= 0) {
    return [];
  }
  const base = Math.floor(totalClearGapLines / gapCount);
  const rem = totalClearGapLines % gapCount;
  if (rem === 0) {
    return Array.from({ length: gapCount }, () => base);
  }
  const gaps = Array.from({ length: gapCount }, () => base);
  const mid = Math.floor(gapCount / 2);
  const order: number[] = [mid];
  for (let d = 1; order.length < gapCount; d += 1) {
    if (mid - d >= 0) {
      order.push(mid - d);
    }
    if (order.length < gapCount && mid + d < gapCount) {
      order.push(mid + d);
    }
  }
  for (let k = 0; k < rem; k += 1) {
    gaps[order[k]!]! += 1;
  }
  return gaps;
}

function spaceBetweenStartsOnGridLines(
  itemCount: number,
  bandMinLine: number,
  bandMaxLine: number,
  sizeLines: number,
): number[] {
  if (itemCount <= 0) {
    return [];
  }
  if (itemCount === 1) {
    const slack = bandMaxLine - bandMinLine - sizeLines;
    return [bandMinLine + Math.floor(slack / 2)];
  }
  const innerLines = bandMaxLine - bandMinLine;
  const totalClearGapLines = innerLines - itemCount * sizeLines;
  const gaps = interColumnGapLines(totalClearGapLines, itemCount - 1);
  let line = bandMinLine;
  const starts = [line];
  for (let i = 1; i < itemCount; i += 1) {
    line += sizeLines + gaps[i - 1]!;
    starts.push(line);
  }
  return starts;
}

function shrinkFootprintWidthForMinRowGap(
  footprint: { widthPx: number; depthPx: number },
  lineStep: ReturnType<typeof artboardDotStep>,
  innerLineSpan: number,
  itemCount: number,
  minGapLines: number,
): { widthPx: number; depthPx: number } {
  if (itemCount <= 1) {
    return footprint;
  }
  const gapCount = itemCount - 1;
  const maxSizeLines = Math.floor(
    (innerLineSpan - gapCount * minGapLines) / itemCount,
  );
  let sizeLines = Math.max(1, Math.round(footprint.widthPx / lineStep.xPx));
  if (maxSizeLines < 1) {
    return footprint;
  }
  sizeLines = Math.min(sizeLines, maxSizeLines);
  while (sizeLines > 1) {
    const clear = innerLineSpan - itemCount * sizeLines;
    if (clear >= gapCount * minGapLines && clear % gapCount === 0) {
      break;
    }
    sizeLines -= 1;
  }
  sizeLines = Math.max(1, sizeLines);
  return artboardSnapFootprintToGridLines(
    { widthPx: sizeLines * lineStep.xPx, depthPx: footprint.depthPx },
    lineStep,
  );
}

function planeAxisSpaceBetweenPositions(
  itemCount: number,
  bandMin: number,
  bandMax: number,
  itemSize: number,
  lineStep: number,
): number[] {
  if (itemCount <= 0) {
    return [];
  }
  const sizeLines = Math.max(1, Math.round(itemSize / lineStep));
  const bandMinLine = Math.round(bandMin / lineStep);
  const bandMaxLine = Math.round(bandMax / lineStep);
  return spaceBetweenStartsOnGridLines(itemCount, bandMinLine, bandMaxLine, sizeLines).map(
    (line) => line * lineStep,
  );
}

function planeYForSpaceBetweenRowBand(
  rowIndex: number,
  rowCount: number,
  footprintDepthPx: number,
  bandMinY: number,
  bandMaxY: number,
  lineStepY: number,
): number {
  const ys = planeAxisSpaceBetweenPositions(
    rowCount,
    bandMinY,
    bandMaxY,
    footprintDepthPx,
    lineStepY,
  );
  return ys[rowIndex] ?? bandMinY;
}

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
  const margin = options.dotInset ?? DEFAULT_ARTBOARD_LAYOUT_DOT_INSET;
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

/**
 * Place `itemCount` footprints on one artboard row with space-between (first/last flush to the
 * row inner band, equal gaps on division guides). Default for diagram rows on the macro grid.
 */
export function planeRectsSpaceBetweenInRow(
  row: number,
  itemCount: number,
  footprintUser: { widthPx: number; depthPx: number },
  options: ArtboardRowSpaceBetweenOptions = {},
): Pick<DiagramSceneNode, "x" | "y" | "w" | "h">[] {
  if (itemCount <= 0) {
    return [];
  }
  const stage = options.stage ?? defaultLatticeStage();
  const dotsPerCell = options.dotsPerCell ?? DEFAULT_ARTBOARD_DOTS_PER_CELL;
  const marginLeading = options.dotInset ?? DEFAULT_ARTBOARD_LAYOUT_DOT_INSET;
  const marginTrailing = options.dotInsetTrailing ?? marginLeading;
  const divisions = stage.divisions ?? DEFAULT_ARTBOARD_GRID_DIVISIONS;
  const rowCount = Math.max(1, options.rowCount ?? 1);
  const rowSpan = Math.max(rowCount, options.rowSpan ?? divisions);
  const colSpan = Math.max(1, options.colSpan ?? rowSpan);
  const pitch = artboardDivisionPitch(
    { width: stage.width, height: stage.height },
    divisions,
  );
  const lineStep = artboardDotStep(pitch, dotsPerCell);
  const rowBand = artboardInnerBandOnGrid(
    pitch,
    lineStep,
    marginLeading,
    colSpan,
    rowSpan,
    marginTrailing,
  );
  /** Horizontal space-between uses symmetric insets so column gutters divide evenly. */
  const columnBand =
    marginTrailing > marginLeading
      ? artboardInnerBandOnGrid(pitch, lineStep, marginLeading, colSpan, rowSpan, marginLeading)
      : rowBand;
  const band = rowBand;
  const innerWidth = columnBand.maxX - columnBand.minX;
  const bandMinLine = Math.round(columnBand.minX / lineStep.xPx);
  const bandMaxLine = Math.round(columnBand.maxX / lineStep.xPx);
  const innerLineSpan = bandMaxLine - bandMinLine;
  const minGapLines = options.minInterColumnGapLines ?? DEFAULT_ROW_INTER_COLUMN_GAP_LINES;
  const gridCols = options.gridCols;
  const columnSlots = gridCols ?? itemCount;
  const layoutColumnCount = columnSlots;

  let footprint = artboardSnapFootprintToGridLines(footprintUser, lineStep);
  footprint = shrinkFootprintWidthForMinRowGap(
    footprint,
    lineStep,
    innerLineSpan,
    layoutColumnCount,
    minGapLines,
  );
  const maxRowWidth = columnSlots * footprint.widthPx;
  if (maxRowWidth > innerWidth) {
    const scale = innerWidth / maxRowWidth;
    footprint = artboardSnapFootprintToGridLines(
      { widthPx: footprint.widthPx * scale, depthPx: footprint.depthPx * scale },
      lineStep,
    );
    footprint = shrinkFootprintWidthForMinRowGap(
      footprint,
      lineStep,
      innerLineSpan,
      layoutColumnCount,
      minGapLines,
    );
  }

  const useDiagramBand = options.rowCount !== undefined;
  const planeY = useDiagramBand
    ? planeYForSpaceBetweenRowBand(
        row,
        rowCount,
        footprint.depthPx,
        band.minY,
        band.maxY,
        lineStep.yPx,
      )
    : artboardPlaneMacroCellFootprintOnGridLines(
        0,
        row,
        pitch,
        footprint,
        marginLeading,
        dotsPerCell,
      ).y;

  const originX = stage.x ?? 0;
  const originY = stage.y ?? 0;

  const columnXs = planeAxisSpaceBetweenPositions(
    columnSlots,
    columnBand.minX,
    columnBand.maxX,
    footprint.widthPx,
    lineStep.xPx,
  );
  const xs =
    gridCols !== undefined ? columnXs.slice(0, itemCount) : columnXs;

  return xs.map((x) => {
    const enforced = enforcePlaneBoxOnArtboardLattice(
      {
        id: "_",
        label: "_",
        x: x + originX,
        y: planeY + originY,
        width: footprint.widthPx,
        depth: footprint.depthPx,
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
  });
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
