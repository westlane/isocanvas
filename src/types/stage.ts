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

export type IsoCanvasStageAddArtboardOptions = CreateArtboardOptions & {
  id: IsoCanvasArtboardId;
};

export type CreateIsoCanvasStageOptions = {
  /** Extra class names on the stage container (e.g. demo `ic-stage-viewport`). */
  className?: string;
  /** Pan/zoom pointer capture; defaults to the stage container. */
  surface?: HTMLElement;
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
  onViewBoxApplied?: (viewBox: ViewBox, context: { notify: boolean }) => void;
};

export type IsoCanvasStage = {
  /** Mount this element in your app viewport (single map surface). */
  readonly container: HTMLDivElement;
  readonly activeArtboardId: IsoCanvasArtboardId | null;
  addArtboard: (options: IsoCanvasStageAddArtboardOptions) => IsoCanvasArtboardEntry;
  removeArtboard: (id: IsoCanvasArtboardId) => boolean;
  hasArtboard: (id: IsoCanvasArtboardId) => boolean;
  getArtboard: (id: IsoCanvasArtboardId) => IsoCanvasArtboardEntry | undefined;
  getArtboards: () => readonly IsoCanvasArtboardEntry[];
  artboardIds: () => readonly IsoCanvasArtboardId[];
  setActiveArtboard: (id: IsoCanvasArtboardId) => boolean;
  getActiveArtboard: () => IsoCanvasArtboardEntry | undefined;
  /** Default framed camera for one artboard or the active artboard. */
  fitArtboard: (
    id?: IsoCanvasArtboardId,
    options?: IsoCanvasStageFitOptions,
  ) => boolean;
  /** Frame the active artboard (alias for apps that think in “map bounds”). */
  fitView: (options?: IsoCanvasStageFitOptions) => boolean;
  attachPanZoom: (options?: IsoCanvasStagePanZoomOptions) => () => void;
  destroy: () => void;
};
