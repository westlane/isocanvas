// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ViewBoxCenterArtboardOptions } from "../camera/fit/center-artboard-view.js";
import type { CreateArtboardOptions } from "../layout/artboard.js";
import type { ArtboardElements } from "../layout/artboard.js";
import type { WorldCameraLayerOptions } from "./camera.js";
import type { ViewBox } from "./core.js";

/** Stable id for {@link IsoCanvasStage.addArtboard} / lookup APIs. */
export type IsoCanvasArtboardId = string;

/** One registered artboard on a stage (Mapbox-style layer handle). */
export type IsoCanvasArtboardEntry = {
  id: IsoCanvasArtboardId;
  artboard: ArtboardElements;
  /** Diagram mount target — mount cube SVG here. */
  host: HTMLDivElement;
};

export type IsoCanvasStageLayout = "single" | "row" | "stack";

/** Placement of one artboard on a continuous stage grid (`row.grid` + `row.continuous`). */
export type PlaneGridCellSlot = {
  col: number;
  row: number;
  colSpan?: number;
  rowSpan?: number;
};

export type IsoCanvasStageRowLayoutOptions = {
  /** Gap between artboards in the row/stack (px). */
  gapPx?: number;
  /** Isometric pitch applied to the whole row (`rotateX`). */
  pitchDeg?: number;
  /** Map bearing applied to the row (`rotateZ`). */
  bearingDeg?: number;
  /** When true (default in row layout), one pan/zoom drives every visible artboard. */
  syncCamera?: boolean;
  /** Row: equalize logical artboard user height to the tallest scene (default true). */
  alignUserHeights?: boolean;
  /**
   * Row: tight horizontal iso strip — small gap, equal column user width + height
   * (three slabs read as one continuous ground row).
   */
  continuous?: boolean;
  /** Row + continuous: merge artboards on a 2D slot grid (`gridSlot` on each artboard). */
  grid?: boolean;
};

export type IsoCanvasStageAddArtboardOptions = CreateArtboardOptions & {
  id: IsoCanvasArtboardId;
  /** Optional caption rendered above the artboard in row layout. */
  label?: string;
  /** Stage grid cell when `row.grid` + `row.continuous` are enabled. */
  gridSlot?: PlaneGridCellSlot;
};

export type CreateIsoCanvasStageOptions = {
  /** Extra class names on the stage container (e.g. demo `ic-stage-viewport`). */
  className?: string;
  /** Pan/zoom pointer capture; defaults to the stage container. */
  surface?: HTMLElement;
  /** `single` — one visible artboard; `row` — side by side; `stack` — three+ artboards on one iso tilt, stacked in depth (+y plane). */
  layout?: IsoCanvasStageLayout;
  row?: IsoCanvasStageRowLayoutOptions;
  /** Seed artboards at creation time. */
  artboards?: readonly IsoCanvasStageAddArtboardOptions[];
  /** Initial active artboard (defaults to first seeded id). */
  activeArtboardId?: IsoCanvasArtboardId;
  worldCamera?: WorldCameraLayerOptions;
  onViewBoxChange?: (viewBox: ViewBox, artboardId: IsoCanvasArtboardId) => void;
};

export type IsoCanvasStageFitOptions = ViewBoxCenterArtboardOptions;

export type IsoCanvasStagePanZoomOptions = {
  /** Pointer capture for pan/zoom (defaults to stage container or `CreateIsoCanvasStageOptions.surface`). */
  surface?: HTMLElement;
  resyncOnHostEvent?: string;
  spacePanClass?: string;
  panningClass?: string;
  onViewBoxApplied?: (
    viewBox: ViewBox,
    context: { notify: boolean; artboardId?: IsoCanvasArtboardId },
  ) => void;
};

export type IsoCanvasStage = {
  readonly layout: IsoCanvasStageLayout;
  /** Mount this element in your app viewport (single map surface). */
  readonly container: HTMLDivElement;
  readonly activeArtboardId: IsoCanvasArtboardId | null;
  addArtboard: (options: IsoCanvasStageAddArtboardOptions) => IsoCanvasArtboardEntry;
  removeArtboard: (id: IsoCanvasArtboardId) => boolean;
  hasArtboard: (id: IsoCanvasArtboardId) => boolean;
  getArtboard: (id: IsoCanvasArtboardId) => IsoCanvasArtboardEntry | undefined;
  getArtboards: () => readonly IsoCanvasArtboardEntry[];
  artboardIds: () => readonly IsoCanvasArtboardId[];
  /** Row layout: refresh CSS vars after add/remove (no-op in single layout). */
  relayoutArtboards: () => void;
  setActiveArtboard: (id: IsoCanvasArtboardId) => boolean;
  /** User visibility (row: hide column; single: must also be active to show). Default true for new artboards. */
  setArtboardVisible: (id: IsoCanvasArtboardId, visible: boolean) => boolean;
  isArtboardVisible: (id: IsoCanvasArtboardId) => boolean;
  getActiveArtboard: () => IsoCanvasArtboardEntry | undefined;
  /** Default framed camera for one artboard or the active artboard. */
  fitArtboard: (
    id?: IsoCanvasArtboardId,
    options?: IsoCanvasStageFitOptions,
  ) => boolean;
  /** Frame the active artboard (alias for apps that think in “map bounds”). */
  fitView: (options?: IsoCanvasStageFitOptions) => boolean;
  attachPanZoom: (options?: IsoCanvasStagePanZoomOptions) => () => void;
  /** Row + syncCamera: copy primary host world camera to every visible peer. */
  syncRowWorldCamera: () => boolean;
  destroy: () => void;
};
