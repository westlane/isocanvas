// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

export {
  attachSyncedWorldCameraPanZoom,
  applyWorldCameraViewBoxToHost,
  DEFAULT_ISO_CANVAS_STAGE_ROW_BEARING_DEG,
  DEFAULT_ISO_CANVAS_STAGE_ROW_CONTINUOUS_GAP_PX,
  DEFAULT_ISO_CANVAS_STAGE_ROW_GAP_PX,
  DEFAULT_ISO_CANVAS_STAGE_ROW_PITCH_DEG,
  IC_ARTBOARD_LABEL_ATTR,
  IC_CANVAS_STAGE_LAYOUT_ROW_CLASS,
  IC_CANVAS_STAGE_LAYOUT_STACK_CLASS,
  IC_CANVAS_STAGE_ROW_WRAPPER_CLASS,
  IC_STAGE_ROW_CONTINUOUS_ATTR,
  IC_PLANE_ROW_HOST_ATTR,
  isMultiArtboardStageLayout,
  isStageRowContinuous,
  normalizeRowArtboardUserSizes,
  normalizeRowArtboardUserHeights,
  syncWorldCameraAcrossHosts,
} from "./stage-row-layout.js";
export {
  mergeDiagramScenesAlongPlaneRow,
  planeRowStripUserSize,
} from "./stage-plane-row-scene.js";
export type { MergeDiagramScenesAlongPlaneRowOptions, PlaneRowColumnLayout } from "./stage-plane-row-scene.js";
export {
  mountDiagramScenesOnIsoCanvasStage,
  renderDiagramScenesOnIsoCanvasStage,
  syncDiagramArtboardSizesOnStage,
  syncIsoCanvasStageArtboardRegistry,
} from "./stage-artboard-sync.js";
export type {
  IsoCanvasStageArtboardSpec,
  IsoCanvasStageDiagramMountItem,
  RenderDiagramScenesOnIsoCanvasStageOptions,
  SyncIsoCanvasStageArtboardRegistryOptions,
} from "./stage-artboard-sync.js";
export {
  buildPlaneRowMountPlan,
  planeRowColumnLayoutFromMountPlan,
  planeRowColumnSpecFromFields,
  readContinuousStageRowGapPx,
} from "./plane-row-mount.js";
export type { PlaneRowColumnSpec, PlaneRowMountPlan } from "./plane-row-mount.js";
export { attachIsoCanvasStageNodeSelection } from "./iso-canvas-stage-selection.js";
export {
  createIsoCanvasStage,
  IC_ARTBOARD_ID_ATTR,
  IC_CANVAS_STAGE_CLASS,
} from "./iso-canvas-stage.js";
export type {
  CreateIsoCanvasStageOptions,
  IsoCanvasArtboardEntry,
  IsoCanvasArtboardId,
  IsoCanvasStage,
  IsoCanvasStageAddArtboardOptions,
  IsoCanvasStageFitOptions,
  IsoCanvasStageLayout,
  IsoCanvasStagePanZoomOptions,
  IsoCanvasStageRowLayoutOptions,
} from "./iso-canvas-stage.js";
