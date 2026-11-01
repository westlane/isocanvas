// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ArtboardPlaneStage, ArtboardUserSize, PlaneBoxSpec } from "../types/artboard.js";
import type { ViewBox } from "../types/core.js";
import type { DiagramScene, DiagramSceneEdge, DiagramSceneNode } from "../types/diagram.js";

export type MergeDiagramScenesAlongPlaneRowOptions = {
  columnUserSize: ArtboardUserSize;
  gapPx: number;
};

/** Column-local plane coords: keep layout dot inset from scene viewBox origin (not tight node bounds). */
function nodesInColumnCell(scene: DiagramScene): DiagramSceneNode[] {
  const originX = scene.viewBox?.x ?? 0;
  const originY = scene.viewBox?.y ?? 0;
  return scene.nodes.map((node) => ({
    ...node,
    x: node.x - originX,
    y: node.y - originY,
  }));
}

export type PlaneRowColumnLayout = {
  cellWidth: number;
  cellHeight: number;
  gapPx: number;
  columnCount: number;
};

/** One artboard plane: columns laid out along +plane x with a fixed cell and gap (iso ground row). */
export function mergeDiagramScenesAlongPlaneRow(
  scenes: readonly DiagramScene[],
  options: MergeDiagramScenesAlongPlaneRowOptions,
): DiagramScene {
  const { width: cellW, height: cellH } = options.columnUserSize;
  const gap = Math.max(0, options.gapPx);
  const mergedNodes: DiagramSceneNode[] = [];
  const mergedEdges: DiagramSceneEdge[] = [];
  let maxDivisions = 0;
  let column = 0;

  for (const scene of scenes) {
    const offsetX = column * (cellW + gap);
    const columnNodes = nodesInColumnCell(scene);
    for (const node of columnNodes) {
      mergedNodes.push({
        ...node,
        x: node.x + offsetX,
      });
    }
    for (const edge of scene.edges ?? []) {
      mergedEdges.push({
        ...edge,
        id: `${column}:${edge.id ?? `${edge.from}->${edge.to}`}`,
      });
    }
    if (scene.divisions !== undefined) {
      maxDivisions = Math.max(maxDivisions, scene.divisions);
    }
    column += 1;
  }

  const count = Math.max(column, 1);
  const stripW = count * cellW + Math.max(0, count - 1) * gap;
  const viewBox: ViewBox = { x: 0, y: 0, w: stripW, h: cellH };

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

export function planeRowStripUserSize(
  columnCount: number,
  columnUserSize: ArtboardUserSize,
  gapPx: number,
): ArtboardUserSize {
  const count = Math.max(columnCount, 1);
  const gap = Math.max(0, gapPx);
  return {
    width: count * columnUserSize.width + Math.max(0, count - 1) * gap,
    height: columnUserSize.height,
  };
}

function planeRowColumnIndexForBox(
  planeX: number,
  planeRow: PlaneRowColumnLayout,
): number {
  const { cellWidth, gapPx, columnCount } = planeRow;
  const pitch = cellWidth + gapPx;
  for (let col = 0; col < columnCount; col += 1) {
    const start = col * pitch;
    if (planeX >= start && planeX < start + cellWidth) {
      return col;
    }
  }
  if (pitch <= 0 || columnCount <= 0) {
    return 0;
  }
  const col = Math.floor(planeX / pitch);
  return Math.min(columnCount - 1, Math.max(0, col));
}

/** Lattice snap stage for a box on a merged plane row (per-column stage, not full strip). */
export function artboardLatticeStageForPlaneBoxInRow(
  box: Pick<PlaneBoxSpec, "x">,
  stripStage: ArtboardPlaneStage,
  planeRow: PlaneRowColumnLayout,
): ArtboardPlaneStage {
  const col = planeRowColumnIndexForBox(box.x, planeRow);
  const pitch = planeRow.cellWidth + planeRow.gapPx;
  const stripX = stripStage.x ?? 0;
  const stripY = stripStage.y ?? 0;
  return {
    x: stripX + col * pitch,
    y: stripY,
    width: planeRow.cellWidth,
    height: planeRow.cellHeight,
    divisions: stripStage.divisions,
  };
}
