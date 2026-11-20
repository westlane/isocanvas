// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

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
import type { PlaneRowColumnLayout } from "../stage/stage-plane-row-scene.js";
import { planeRowColumnIndexForBox } from "../stage/stage-plane-row-scene.js";
import type { PlaneGridMountPlan } from "../stage/plane-grid-mount.js";
import {
  planeGridCellBounds,
  planeGridCellIndexForPoint,
} from "../stage/stage-plane-grid-scene.js";

/** Guide-step margin on the leading artboard edges (min X / min Y) of the layout band. */
export const DEFAULT_ARTBOARD_LAYOUT_DOT_INSET = 2;

/** Nudge diagram cubes toward +plane y after collection label layout (fine dots). */
export const DEFAULT_DIAGRAM_CONTENT_DOWN_DOTS = 1;

export function shiftDiagramSceneNodesDownDots(
  nodes: readonly DiagramSceneNode[],
  stage: Pick<ArtboardPlaneStage, "width" | "height" | "divisions">,
  downDots: number,
): DiagramSceneNode[] {
  if (downDots <= 0 || nodes.length === 0) {
    return [...nodes];
  }
  const divisions = stage.divisions ?? DEFAULT_ARTBOARD_GRID_DIVISIONS;
  const pitch = artboardDivisionPitch({ width: stage.width, height: stage.height }, divisions);
  const deltaY = downDots * artboardDotStep(pitch).yPx;
  return nodes.map((node) => ({ ...node, y: node.y + deltaY }));
}

/**
 * Trailing edge inset (max X / max Y). One line wider than {@link DEFAULT_ARTBOARD_LAYOUT_DOT_INSET}
 * so cell-center stud rims match the leading side (3 visible dots vs 2).
 */
export const DEFAULT_ARTBOARD_LAYOUT_DOT_INSET_TRAILING = 3;
/** Minimum clear fine-line gap between neighbors in a space-between row (class diagram columns). */
export const DEFAULT_ROW_INTER_COLUMN_GAP_LINES = 5;
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
  /** Per-item footprints (same length as `itemCount`); skips uniform row shrink-to-fit. */
  itemFootprints?: ReadonlyArray<{ widthPx: number; depthPx: number }>;
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

/** Shrink line spans so content + fixed gaps fits the row band (never overlaps). */
function fitPackedRowSizeLinesToBand(
  sizeLines: readonly number[],
  innerLineSpan: number,
  minGapLines: number,
): { sizeLines: number[]; gapLines: number } {
  if (sizeLines.length === 0) {
    return { sizeLines: [], gapLines: minGapLines };
  }
  const gapCount = Math.max(0, sizeLines.length - 1);
  const sumLines = (lines: readonly number[]) => lines.reduce((sum, line) => sum + line, 0);
  const required = sizeLines.map((line) => Math.max(1, line));
  let lines = [...required];
  let gap = minGapLines;

  const fits = (lineSpans: readonly number[], gapLines: number) =>
    sumLines(lineSpans) + gapCount * gapLines <= innerLineSpan;

  while (!fits(lines, gap) && gap > 1) {
    gap -= 1;
  }

  if (fits(lines, gap)) {
    return { sizeLines: lines, gapLines: gap };
  }

  while (!fits(lines, gap)) {
    const widest = Math.max(...lines);
    const index = lines.indexOf(widest);
    if (index < 0 || lines[index]! <= required[index]!) {
      break;
    }
    lines = lines.map((line, i) => (i === index ? line - 1 : line));
  }

  if (fits(lines, gap)) {
    return { sizeLines: lines, gapLines: gap };
  }

  const maxContentLines = innerLineSpan - gapCount * gap;
  if (maxContentLines < lines.length) {
    return {
      sizeLines: required.map((line) => Math.max(1, Math.min(line, maxContentLines))),
      gapLines: gap,
    };
  }

  lines = [...required];
  while (sumLines(lines) > maxContentLines) {
    const shrinkable = lines
      .map((line, i) => ({ line, i, headroom: line - required[i]! }))
      .filter((entry) => entry.headroom > 0);
    if (shrinkable.length === 0) {
      break;
    }
    const target = shrinkable.reduce((best, entry) => (entry.line > best.line ? entry : best));
    lines = lines.map((line, i) => (i === target.i ? line - 1 : line));
  }
  return {
    sizeLines: lines.map((line, i) => Math.max(required[i]!, line)),
    gapLines: gap,
  };
}

function packedRowStartsOnGridLines(
  sizeLines: readonly number[],
  bandMinLine: number,
  minGapLines: number,
): number[] {
  if (sizeLines.length === 0) {
    return [];
  }
  let line = bandMinLine;
  const starts = [line];
  for (let i = 1; i < sizeLines.length; i += 1) {
    line += sizeLines[i - 1]! + minGapLines;
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

  const perItemFootprints =
    options.itemFootprints && options.itemFootprints.length >= itemCount
      ? options.itemFootprints.slice(0, itemCount)
      : undefined;

  let footprint = artboardSnapFootprintToGridLines(footprintUser, lineStep);
  if (!perItemFootprints) {
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
  }

  const rowDepthPx = perItemFootprints
    ? Math.max(
        ...perItemFootprints.map((item) =>
          artboardSnapFootprintToGridLines(item, lineStep, "ceil").depthPx,
        ),
      )
    : footprint.depthPx;

  const useDiagramBand = options.rowCount !== undefined;
  const planeY = useDiagramBand
    ? planeYForSpaceBetweenRowBand(
        row,
        rowCount,
        rowDepthPx,
        band.minY,
        band.maxY,
        lineStep.yPx,
      )
    : artboardPlaneMacroCellFootprintOnGridLines(
        0,
        row,
        pitch,
        { widthPx: footprint.widthPx, depthPx: rowDepthPx },
        marginLeading,
        dotsPerCell,
      ).y;

  const originX = stage.x ?? 0;
  const originY = stage.y ?? 0;

  let xs: number[];
  let itemSizes: { widthPx: number; depthPx: number }[];

  if (perItemFootprints) {
    itemSizes = perItemFootprints.map((item) =>
      artboardSnapFootprintToGridLines(item, lineStep, "ceil"),
    );
    itemSizes = itemSizes.map((item) => ({ ...item, depthPx: rowDepthPx }));
    let sizeLines = itemSizes.map((item) =>
      Math.max(1, Math.ceil(item.widthPx / lineStep.xPx)),
    );
    const packed = fitPackedRowSizeLinesToBand(sizeLines, innerLineSpan, minGapLines);
    sizeLines = packed.sizeLines;
    itemSizes = itemSizes.map((item, index) => ({
      widthPx: sizeLines[index]! * lineStep.xPx,
      depthPx: item.depthPx,
    }));
    const startLines = packedRowStartsOnGridLines(sizeLines, bandMinLine, packed.gapLines);
    xs = startLines.map((line) => line * lineStep.xPx);
  } else {
    const columnXs = planeAxisSpaceBetweenPositions(
      columnSlots,
      columnBand.minX,
      columnBand.maxX,
      footprint.widthPx,
      lineStep.xPx,
    );
    xs = gridCols !== undefined ? columnXs.slice(0, itemCount) : columnXs;
    itemSizes = xs.map(() => footprint);
  }

  return xs.map((x, index) => {
    const size = itemSizes[index] ?? footprint;
    const enforced = enforcePlaneBoxOnArtboardLattice(
      {
        id: "_",
        label: "_",
        x: x + originX,
        y: planeY + originY,
        width: size.widthPx,
        depth: size.depthPx,
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

/** Default class-diagram column slots when repacking label-sized rows on an artboard. */
export const DIAGRAM_SCENE_ROW_GRID_COLS = 3;

export type DiagramSceneRowRelayoutOptions = ArtboardRowSpaceBetweenOptions & {
  footprintUser: { widthPx: number; depthPx: number };
  /** When set, repack within each plane-row artboard column (merged strip). */
  planeRowColumns?: PlaneRowColumnLayout;
  /** When set, repack within each plane-grid artboard cell (merged grid). */
  planeGridMount?: PlaneGridMountPlan;
};

const ROW_Y_CLUSTER_EPSILON_PX = 2;

function clusterDiagramSceneNodesByRow(
  nodes: readonly DiagramSceneNode[],
): DiagramSceneNode[][] {
  const sorted = [...nodes].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: DiagramSceneNode[][] = [];
  for (const node of sorted) {
    const last = rows[rows.length - 1];
    if (!last || Math.abs(node.y - last[0]!.y) > ROW_Y_CLUSTER_EPSILON_PX) {
      rows.push([node]);
      continue;
    }
    last.push(node);
  }
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
  }
  return rows;
}

/** Repack each row left-to-right on the grid after footprints change (no horizontal overlap). */
export function relayoutDiagramSceneNodesInPackedRows(
  nodes: readonly DiagramSceneNode[],
  stage: ArtboardPlaneStage,
  options: DiagramSceneRowRelayoutOptions,
): DiagramSceneNode[] {
  if (nodes.length === 0) {
    return [];
  }
  if (options.planeGridMount) {
    return relayoutDiagramSceneNodesInPackedPlaneGridCells(
      nodes,
      stage,
      options.planeGridMount,
      options,
    );
  }
  if (options.planeRowColumns) {
    return relayoutDiagramSceneNodesInPackedPlaneRowColumns(
      nodes,
      stage,
      options.planeRowColumns,
      options,
    );
  }
  return relayoutDiagramSceneNodesOnSingleArtboard(nodes, stage, options);
}

function relayoutDiagramSceneNodesInPackedPlaneRowColumns(
  nodes: readonly DiagramSceneNode[],
  stripStage: ArtboardPlaneStage,
  planeRow: PlaneRowColumnLayout,
  options: DiagramSceneRowRelayoutOptions,
): DiagramSceneNode[] {
  const pitch = planeRow.cellWidth + planeRow.gapPx;
  const stripX = stripStage.x ?? 0;
  const byId = new Map<string, DiagramSceneNode>();

  for (let col = 0; col < planeRow.columnCount; col += 1) {
    const colStart = stripX + col * pitch;
    const columnNodes = nodes.filter((node) => planeRowColumnIndexForBox(node.x, planeRow) === col);
    if (columnNodes.length === 0) {
      continue;
    }
    const columnStage: ArtboardPlaneStage = {
      x: 0,
      y: stripStage.y ?? 0,
      width: planeRow.cellWidth,
      height: planeRow.cellHeight,
      ...(stripStage.divisions !== undefined ? { divisions: stripStage.divisions } : {}),
    };
    const columnLocal = columnNodes.map((node) => ({
      ...node,
      x: node.x - colStart,
    }));
    const relaid = relayoutDiagramSceneNodesOnSingleArtboard(columnLocal, columnStage, options);
    for (const node of relaid) {
      byId.set(node.id, {
        ...node,
        x: node.x + colStart,
      });
    }
  }

  return nodes.map((node) => byId.get(node.id) ?? node);
}

function relayoutDiagramSceneNodesInPackedPlaneGridCells(
  nodes: readonly DiagramSceneNode[],
  stripStage: ArtboardPlaneStage,
  gridMount: PlaneGridMountPlan,
  options: DiagramSceneRowRelayoutOptions,
): DiagramSceneNode[] {
  const { layout, cells } = gridMount;
  const byId = new Map<string, DiagramSceneNode>();

  for (let cellIndex = 0; cellIndex < cells.length; cellIndex += 1) {
    const slot = cells[cellIndex]!;
    const bounds = planeGridCellBounds(slot, layout);
    const cellNodes = nodes.filter(
      (node) => planeGridCellIndexForPoint(node.x, node.y, layout, cells) === cellIndex,
    );
    if (cellNodes.length === 0) {
      continue;
    }
    const cellStage: ArtboardPlaneStage = {
      x: 0,
      y: 0,
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      ...(stripStage.divisions !== undefined ? { divisions: stripStage.divisions } : {}),
    };
    const cellLocal = cellNodes.map((node) => ({
      ...node,
      x: node.x - bounds.minX,
      y: node.y - bounds.minY,
    }));
    const relaid = relayoutDiagramSceneNodesOnSingleArtboard(cellLocal, cellStage, options);
    for (const node of relaid) {
      byId.set(node.id, {
        ...node,
        x: node.x + bounds.minX,
        y: node.y + bounds.minY,
      });
    }
  }

  return nodes.map((node) => byId.get(node.id) ?? node);
}

function relayoutDiagramSceneNodesOnSingleArtboard(
  nodes: readonly DiagramSceneNode[],
  stage: ArtboardPlaneStage,
  options: DiagramSceneRowRelayoutOptions,
): DiagramSceneNode[] {
  if (nodes.length === 0) {
    return [];
  }
  const stackMembersByGroup = new Map<string, DiagramSceneNode[]>();
  const layoutNodes: DiagramSceneNode[] = [];
  for (const node of nodes) {
    const groupId = node.stackGroupId?.trim();
    if (groupId) {
      const list = stackMembersByGroup.get(groupId) ?? [];
      list.push(node);
      stackMembersByGroup.set(groupId, list);
      continue;
    }
    layoutNodes.push(node);
  }
  for (const members of stackMembersByGroup.values()) {
    const representative = [...members].sort(
      (a, b) => (a.elevation ?? 0) - (b.elevation ?? 0),
    )[0]!;
    layoutNodes.push(representative);
  }

  const rows = clusterDiagramSceneNodesByRow(layoutNodes);
  const rowCount = options.rowCount ?? rows.length;
  const rowSpan = options.rowSpan ?? stage.divisions ?? rowCount;
  const gridCols = options.gridCols ?? DIAGRAM_SCENE_ROW_GRID_COLS;
  const byId = new Map<string, DiagramSceneNode>();

  rows.forEach((rowNodes, rowIndex) => {
    const itemFootprints = rowNodes.map((node) => ({
      widthPx: node.w,
      depthPx: node.h,
    }));
    const rects = planeRectsSpaceBetweenInRow(rowIndex, rowNodes.length, options.footprintUser, {
      stage,
      dotInset: options.dotInset ?? DEFAULT_ARTBOARD_LAYOUT_DOT_INSET,
      dotInsetTrailing: options.dotInsetTrailing ?? DEFAULT_ARTBOARD_LAYOUT_DOT_INSET_TRAILING,
      rowCount,
      rowSpan,
      gridCols,
      itemFootprints,
      ...(options.dotsPerCell !== undefined ? { dotsPerCell: options.dotsPerCell } : {}),
      ...(options.minInterColumnGapLines !== undefined
        ? { minInterColumnGapLines: options.minInterColumnGapLines }
        : {}),
    });
    rowNodes.forEach((node, index) => {
      const rect = rects[index];
      if (!rect) {
        byId.set(node.id, node);
        return;
      }
      const placed = {
        ...node,
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
      };
      byId.set(node.id, placed);
      const groupId = node.stackGroupId?.trim();
      if (!groupId) {
        return;
      }
      const members = stackMembersByGroup.get(groupId);
      if (!members) {
        return;
      }
      for (const member of members) {
        if (member.id === node.id) {
          continue;
        }
        byId.set(member.id, {
          ...member,
          x: rect.x,
          y: rect.y,
          w: rect.w,
          h: rect.h,
        });
      }
    });
  });

  return nodes.map((node) => byId.get(node.id) ?? node);
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
