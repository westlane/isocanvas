// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { RenderDiagramSceneOptions } from "../diagram/render-scene.js";
import type { ArtboardUserSize } from "../types/artboard.js";
import {
  planeGridLayoutFromSlots,
  type PlaneGridLayout,
} from "./stage-plane-grid-scene.js";
import type { PlaneGridCellSlot } from "../types/stage.js";
import type { PlaneRowColumnSpec } from "./plane-row-mount.js";

export type PlaneGridCellSpec = PlaneGridCellSlot & PlaneRowColumnSpec;

export type PlaneGridMountPlan = {
  cellWidth: number;
  cellHeight: number;
  gapPx: number;
  layout: PlaneGridLayout;
  cells: readonly PlaneGridCellSpec[];
};

export function buildPlaneGridMountPlan(
  cellSize: ArtboardUserSize,
  gapPx: number,
  cells: readonly PlaneGridCellSpec[],
): PlaneGridMountPlan {
  const layout = planeGridLayoutFromSlots(cells, cellSize, gapPx);
  return {
    cellWidth: cellSize.width,
    cellHeight: cellSize.height,
    gapPx: Math.max(0, gapPx),
    layout,
    cells,
  };
}

export function planeGridMountPlanHasCollectionLabels(plan: PlaneGridMountPlan): boolean {
  return plan.cells.some((cell) => cell.collectionLabel?.trim());
}

export function renderDiagramSceneOptionsForPlaneGridMount(
  plan: PlaneGridMountPlan,
  extras: Pick<RenderDiagramSceneOptions, "artboardUserSize" | "viewportMeetAlign">,
): Pick<RenderDiagramSceneOptions, "artboardUserSize" | "viewportMeetAlign" | "planeGridMount"> {
  return {
    ...extras,
    planeGridMount: plan,
  };
}
