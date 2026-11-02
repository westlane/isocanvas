// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ArtboardPlaneStage, ArtboardUserSize, PlaneBoxSpec } from "../types/artboard.js";
import type { ViewBox } from "../types/core.js";
import type { DiagramScene, DiagramSceneEdge, DiagramSceneNode } from "../types/diagram.js";
import { nodesInColumnCell } from "./stage-plane-row-scene.js";

import type { PlaneGridCellSlot } from "../types/stage.js";
import { artboardCollectionLabelBandPx } from "./collection-label-band.js";

export type { PlaneGridCellSlot };

export type PlaneGridLayout = {
  cellWidth: number;
  cellHeight: number;
  gapPx: number;
  labelBandPx: number;
  columnCount: number;
  rowCount: number;
};

export type MergeDiagramScenesOnPlaneGridEntry = {
  scene: DiagramScene;
  slot: PlaneGridCellSlot;
};

export type MergeDiagramScenesOnPlaneGridOptions = {
  cellUserSize: ArtboardUserSize;
  gapPx: number;
};

function spanValue(value: number | undefined, fallback: number): number {
  const span = value ?? fallback;
  return Math.max(1, span);
}

export function planeGridCellExtent(
  slot: PlaneGridCellSlot,
  cellUserSize: ArtboardUserSize,
  gapPx: number,
): ArtboardUserSize {
  const gap = Math.max(0, gapPx);
  const colSpan = spanValue(slot.colSpan, 1);
  const rowSpan = spanValue(slot.rowSpan, 1);
  return {
    width: colSpan * cellUserSize.width + Math.max(0, colSpan - 1) * gap,
    height: rowSpan * cellUserSize.height + Math.max(0, rowSpan - 1) * gap,
  };
}

export function planeGridCellOrigin(
  slot: PlaneGridCellSlot,
  cellUserSize: ArtboardUserSize,
  gapPx: number,
  labelBandPx: number = artboardCollectionLabelBandPx(),
): { x: number; y: number } {
  const gap = Math.max(0, gapPx);
  return {
    x: slot.col * (cellUserSize.width + gap),
    y: slot.row * (cellUserSize.height + gap + labelBandPx),
  };
}

export function planeGridLayoutFromSlots(
  slots: readonly PlaneGridCellSlot[],
  cellUserSize: ArtboardUserSize,
  gapPx: number,
): PlaneGridLayout {
  let columnCount = 1;
  let rowCount = 1;
  for (const slot of slots) {
    const colSpan = spanValue(slot.colSpan, 1);
    const rowSpan = spanValue(slot.rowSpan, 1);
    columnCount = Math.max(columnCount, slot.col + colSpan);
    rowCount = Math.max(rowCount, slot.row + rowSpan);
  }
  const labelBandPx = artboardCollectionLabelBandPx();
  return {
    cellWidth: cellUserSize.width,
    cellHeight: cellUserSize.height,
    gapPx: Math.max(0, gapPx),
    labelBandPx,
    columnCount,
    rowCount,
  };
}

export function planeGridStripUserSize(layout: PlaneGridLayout): ArtboardUserSize {
  const { cellWidth, cellHeight, gapPx, labelBandPx, columnCount, rowCount } = layout;
  return {
    width: columnCount * cellWidth + Math.max(0, columnCount - 1) * gapPx,
    height:
      rowCount * cellHeight +
      Math.max(0, rowCount - 1) * gapPx +
      rowCount * labelBandPx,
  };
}

/** Merge catalog artboard scenes on a 2D plane grid (+x columns, +y rows). */
export function mergeDiagramScenesOnPlaneGrid(
  entries: readonly MergeDiagramScenesOnPlaneGridEntry[],
  options: MergeDiagramScenesOnPlaneGridOptions,
): DiagramScene {
  const gap = Math.max(0, options.gapPx);
  const cellUserSize = options.cellUserSize;
  const layout = planeGridLayoutFromSlots(
    entries.map((entry) => entry.slot),
    cellUserSize,
    gap,
  );
  const mergedNodes: DiagramSceneNode[] = [];
  const mergedEdges: DiagramSceneEdge[] = [];
  let maxDivisions = 0;
  let index = 0;

  for (const entry of entries) {
    const origin = planeGridCellOrigin(entry.slot, cellUserSize, gap, layout.labelBandPx);
    const localNodes = nodesInColumnCell(entry.scene);
    for (const node of localNodes) {
      mergedNodes.push({
        ...node,
        x: node.x + origin.x,
        y: node.y + origin.y,
      });
    }
    for (const edge of entry.scene.edges ?? []) {
      mergedEdges.push({
        ...edge,
        id: `${index}:${edge.id ?? `${edge.from}->${edge.to}`}`,
      });
    }
    if (entry.scene.divisions !== undefined) {
      maxDivisions = Math.max(maxDivisions, entry.scene.divisions);
    }
    index += 1;
  }

  const stripSize = planeGridStripUserSize(layout);
  const viewBox: ViewBox = { x: 0, y: 0, w: stripSize.width, h: stripSize.height };

  if (mergedNodes.length === 0) {
    return { nodes: [], viewBox };
  }

  return {
    viewBox,
    ...(maxDivisions > 0 ? { divisions: maxDivisions } : {}),
    nodes: mergedNodes,
    ...(mergedEdges.length > 0 ? { edges: mergedEdges } : {}),
  };
}

export function planeGridCellBounds(
  slot: PlaneGridCellSlot,
  layout: PlaneGridLayout,
): { minX: number; minY: number; maxX: number; maxY: number } {
  const origin = planeGridCellOrigin(
    slot,
    { width: layout.cellWidth, height: layout.cellHeight },
    layout.gapPx,
    layout.labelBandPx,
  );
  const extent = planeGridCellExtent(
    slot,
    { width: layout.cellWidth, height: layout.cellHeight },
    layout.gapPx,
  );
  return {
    minX: origin.x,
    minY: origin.y,
    maxX: origin.x + extent.width,
    maxY: origin.y + extent.height,
  };
}

/** Which grid cell owns a plane point (for lattice relayout). */
export function planeGridCellIndexForPoint(
  planeX: number,
  planeY: number,
  layout: PlaneGridLayout,
  cells: readonly PlaneGridCellSlot[],
): number {
  for (let index = 0; index < cells.length; index += 1) {
    const bounds = planeGridCellBounds(cells[index]!, layout);
    if (
      planeX >= bounds.minX &&
      planeX < bounds.maxX &&
      planeY >= bounds.minY &&
      planeY < bounds.maxY
    ) {
      return index;
    }
  }
  return 0;
}

export function artboardLatticeStageForPlaneBoxInGrid(
  box: Pick<PlaneBoxSpec, "x" | "y">,
  stripStage: ArtboardPlaneStage,
  layout: PlaneGridLayout,
  cells: readonly PlaneGridCellSlot[],
): ArtboardPlaneStage {
  const index = planeGridCellIndexForPoint(box.x, box.y, layout, cells);
  const slot = cells[index] ?? { col: 0, row: 0 };
  const origin = planeGridCellOrigin(
    slot,
    { width: layout.cellWidth, height: layout.cellHeight },
    layout.gapPx,
    layout.labelBandPx,
  );
  const extent = planeGridCellExtent(
    slot,
    { width: layout.cellWidth, height: layout.cellHeight },
    layout.gapPx,
  );
  const stage: ArtboardPlaneStage = {
    x: (stripStage.x ?? 0) + origin.x,
    y: (stripStage.y ?? 0) + origin.y,
    width: extent.width,
    height: extent.height,
  };
  if (stripStage.divisions !== undefined) {
    stage.divisions = stripStage.divisions;
  }
  if (stripStage.subdivisions !== undefined) {
    stage.subdivisions = stripStage.subdivisions;
  }
  return stage;
}
