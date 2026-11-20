// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { RenderDiagramSceneOptions } from "../diagram/render-scene.js";
import type { ArtboardUserSize } from "../types/artboard.js";
import type { IsoCanvasStage } from "../types/stage.js";
import { DEFAULT_ISO_CANVAS_STAGE_ROW_CONTINUOUS_GAP_PX } from "./stage-row-layout.js";
import type { PlaneRowColumnLayout } from "./stage-plane-row-scene.js";

/** Per-column iso artboard collection title (SW badge on the column ground). */
export type PlaneRowColumnSpec = {
  collectionLabel?: string;
  collectionLabelFill?: string;
  /** @deprecated Badges anchor to artboard SW, not cube content. */
  contentMaxPlaneY?: number;
};

/** Stage + render policy for one continuous iso plane row (merged strip). */
export type PlaneRowMountPlan = {
  cellWidth: number;
  cellHeight: number;
  gapPx: number;
  columns: readonly PlaneRowColumnSpec[];
};

export function planeRowColumnCount(plan: PlaneRowMountPlan): number {
  return Math.max(plan.columns.length, 1);
}

export function buildPlaneRowMountPlan(
  cellSize: ArtboardUserSize,
  gapPx: number,
  columns: readonly PlaneRowColumnSpec[],
): PlaneRowMountPlan {
  return {
    cellWidth: cellSize.width,
    cellHeight: cellSize.height,
    gapPx: Math.max(0, gapPx),
    columns,
  };
}

export function planeRowColumnSpecFromFields(fields: {
  collectionLabel?: string;
  collectionLabelFill?: string;
  label?: string;
}): PlaneRowColumnSpec {
  const collectionLabel = fields.collectionLabel ?? fields.label;
  return {
    ...(collectionLabel !== undefined ? { collectionLabel } : {}),
    ...(fields.collectionLabelFill !== undefined
      ? { collectionLabelFill: fields.collectionLabelFill }
      : {}),
  };
}

export function planeRowColumnLayoutFromMountPlan(plan: PlaneRowMountPlan): PlaneRowColumnLayout {
  return {
    cellWidth: plan.cellWidth,
    cellHeight: plan.cellHeight,
    gapPx: plan.gapPx,
    columnCount: planeRowColumnCount(plan),
    columnLabels: plan.columns.map((column) => column.collectionLabel),
    columnLabelFills: plan.columns.map((column) => column.collectionLabelFill),
  };
}

export function planeRowMountPlanHasCollectionLabels(plan: PlaneRowMountPlan): boolean {
  return plan.columns.some((column) => column.collectionLabel?.trim());
}

export function planeRowColumnLayoutHasCollectionLabels(layout: PlaneRowColumnLayout): boolean {
  return layout.columnLabels?.some((label) => label?.trim()) ?? false;
}

/** Gap between DOM row columns and iso merge strip (`--ic-stage-row-gap`). */
export function readContinuousStageRowGapPx(stage: IsoCanvasStage): number {
  const raw = stage.container.style.getPropertyValue("--ic-stage-row-gap").trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : DEFAULT_ISO_CANVAS_STAGE_ROW_CONTINUOUS_GAP_PX;
}

export function renderDiagramSceneOptionsForColumnSpec(
  column: PlaneRowColumnSpec | undefined,
): Pick<RenderDiagramSceneOptions, "artboardCollection"> {
  const label = column?.collectionLabel?.trim();
  if (!label || !column) {
    return {};
  }
  const fill = column.collectionLabelFill?.trim();
  return {
    artboardCollection: {
      collectionLabel: label,
      ...(fill ? { collectionLabelFill: fill } : {}),
    },
  };
}

export function renderDiagramSceneOptionsForPlaneRowMount(
  plan: PlaneRowMountPlan,
  extras: Pick<RenderDiagramSceneOptions, "artboardUserSize" | "viewportMeetAlign">,
): Pick<RenderDiagramSceneOptions, "artboardUserSize" | "viewportMeetAlign" | "planeRowMount"> {
  return {
    ...extras,
    planeRowMount: plan,
  };
}

/** @deprecated Collection badges use {@link artboardPlaneCollectionLabelBottomLeftFloatAnchor} on the artboard SW pin. */
export function planeRowMountPlanWithCollectionContentExtents(
  plan: PlaneRowMountPlan,
  _nodes: readonly { x: number; y: number; h: number }[],
  _planeRow: PlaneRowColumnLayout,
): PlaneRowMountPlan {
  return plan;
}
