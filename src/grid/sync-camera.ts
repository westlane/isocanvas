// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ViewBox } from "../types/core.js";
import { worldCameraViewportFromRects } from "../camera/world/world-viewport.js";
import {
  DEFAULT_DOT_GRID_MARK_PX,
  DEFAULT_DOT_GRID_SIZE_PX,
  defaultDotGridPhase,
  IC_DOT_GRID_CSS_VARS,
  IC_DOT_GRID_MACRO_CLASS,
  IC_DOT_GRID_MARK_VAR,
  IC_DOT_GRID_PLANE_CLASS,
  readLengthPx,
} from "./surface.js";
import {
  composeDotGridLayerTransform,
  readDotGridMacroAlign,
  readDotGridProjection,
} from "./projection.js";
import { dotGridMacroHomeOriginUser } from "./macro-origin.js";
import { IC_ARTBOARD_CLASS } from "../layout/artboard.js";
import {
  dotGridPatternOnPlane,
  dotGridSquareMaskDataUri,
  dotGridWorldStyleFromViewBox,
} from "./world-style.js";
import { readDotGridFillFromElement, removeSvgDotGrid, syncSvgDotGridFromViewBox } from "./svg.js";

function dotGridPlaneLayoutOriginInAnchorPx(
  anchor: HTMLElement,
  plane: HTMLElement,
): { x: number; y: number } {
  const previousTransform = plane.style.transform;
  plane.style.transform = "";
  const anchorRect = anchor.getBoundingClientRect();
  const planeRect = plane.getBoundingClientRect();
  plane.style.transform = previousTransform;
  return {
    x: planeRect.left - anchorRect.left,
    y: planeRect.top - anchorRect.top,
  };
}

function dotGridPlanePanStyle(
  dotStyle: ReturnType<typeof dotGridWorldStyleFromViewBox>,
  layoutOrigin: { x: number; y: number },
): ReturnType<typeof dotGridWorldStyleFromViewBox> {
  return {
    ...dotStyle,
    planePanXPx: dotStyle.planePanXPx - layoutOrigin.x,
    planePanYPx: dotStyle.planePanYPx - layoutOrigin.y,
  };
}

function cssDotGridLayerEnabled(grid: HTMLElement): boolean {
  return getComputedStyle(grid).getPropertyValue("--ic-dot-grid-layer").trim() !== "svg";
}

function setDotGridMaskTileStyles(
  grid: HTMLElement,
  tileSize: string,
  tilePosition: string,
  maskImage: string,
): void {
  grid.style.backgroundImage = "none";
  grid.style.backgroundSize = "";
  grid.style.backgroundPosition = "";
  grid.style.webkitMaskImage = maskImage;
  grid.style.maskImage = maskImage;
  grid.style.webkitMaskSize = tileSize;
  grid.style.maskSize = tileSize;
  grid.style.webkitMaskPosition = tilePosition;
  grid.style.maskPosition = tilePosition;
}

function clearDotGridMaskTileStyles(grid: HTMLElement): void {
  grid.style.backgroundImage = "";
  grid.style.backgroundSize = "";
  grid.style.backgroundPosition = "";
  grid.style.webkitMaskImage = "";
  grid.style.maskImage = "";
  grid.style.webkitMaskSize = "";
  grid.style.maskSize = "";
  grid.style.webkitMaskPosition = "";
  grid.style.maskPosition = "";
}

export function clearCssDotGridWorldStyles(grid: HTMLElement): void {
  clearDotGridMaskTileStyles(grid);
  grid.style.removeProperty(IC_DOT_GRID_CSS_VARS.sizeVar);
  grid.style.removeProperty(IC_DOT_GRID_CSS_VARS.phaseVar);
}

export function dotGridPlaneElement(grid: HTMLElement): HTMLElement {
  const parent = grid.parentElement;
  if (!parent?.classList.contains(IC_DOT_GRID_PLANE_CLASS)) {
    throw new Error(`Dot grid must be wrapped in .${IC_DOT_GRID_PLANE_CLASS}`);
  }
  return parent;
}

function formatDotGridPlaneTransform(
  planeTransform: string,
  dotStyle: ReturnType<typeof dotGridWorldStyleFromViewBox>,
): string {
  const pan = `translate(${dotStyle.planePanXPx}px, ${dotStyle.planePanYPx}px)`;
  /** Pan after skew/cover so tx/ty match SVG viewBox letterboxing in anchor space. */
  return planeTransform ? `${pan} ${planeTransform}` : pan;
}

function syncMacroLatticeWithWorldScale(
  plane: HTMLElement,
  patternCellPx: number,
  gridSizePx: number,
  grid: HTMLElement,
): void {
  const macro = plane.querySelector(`.${IC_DOT_GRID_MACRO_CLASS}`);
  if (!(macro instanceof HTMLElement)) {
    return;
  }
  const spanRaw = getComputedStyle(macro).getPropertyValue("--ic-dot-grid-macro-span").trim();
  const span = Number.parseInt(spanRaw, 10);
  if (!Number.isFinite(span) || span < 2) {
    return;
  }
  const macroCellPx = span * patternCellPx;
  const extentPx = span * macroCellPx;
  macro.style.width = `${extentPx}px`;
  macro.style.height = `${extentPx}px`;
  macro.style.gridTemplateColumns = `repeat(${span}, ${macroCellPx}px)`;
  macro.style.gridTemplateRows = `repeat(${span}, ${macroCellPx}px)`;
  macro.style.transformOrigin = "0 0";
  if (grid.closest(".ic-artboard")) {
    macro.style.transform = "";
    return;
  }
  const home = dotGridMacroHomeOriginUser(gridSizePx, span);
  const planeHomeX = gridSizePx > 0 ? (home.x / gridSizePx) * patternCellPx : 0;
  const planeHomeY = gridSizePx > 0 ? (home.y / gridSizePx) * patternCellPx : 0;
  macro.style.transform = `translate(${-planeHomeX}px, ${-planeHomeY}px)`;
}

function clearMacroLatticeWorldStyles(plane: HTMLElement): void {
  const macro = plane.querySelector(`.${IC_DOT_GRID_MACRO_CLASS}`);
  if (!(macro instanceof HTMLElement)) {
    return;
  }
  macro.style.width = "";
  macro.style.height = "";
  macro.style.gridTemplateColumns = "";
  macro.style.gridTemplateRows = "";
  macro.style.transform = "";
  macro.style.transformOrigin = "";
}

function applyCssDotGridPlaneStyles(
  anchor: HTMLElement,
  grid: HTMLElement,
  planeTransform: string,
  dotStyle: ReturnType<typeof dotGridWorldStyleFromViewBox>,
  pattern: ReturnType<typeof dotGridPatternOnPlane>,
  gridSizePx: number,
): void {
  const plane = dotGridPlaneElement(grid);
  const layoutOrigin = dotGridPlaneLayoutOriginInAnchorPx(anchor, plane);
  const panStyle = dotGridPlanePanStyle(dotStyle, layoutOrigin);
  plane.style.transformOrigin = "0 0";
  plane.style.transform = formatDotGridPlaneTransform(planeTransform, panStyle);
  grid.style.transform = "";
  const markPx = readLengthPx(anchor, IC_DOT_GRID_MARK_VAR, DEFAULT_DOT_GRID_MARK_PX);
  const maskImage = dotGridSquareMaskDataUri(markPx, dotStyle.cellPx);
  setDotGridMaskTileStyles(grid, pattern.backgroundSize, pattern.phaseBackgroundPosition, maskImage);
  if (readDotGridMacroAlign(anchor) === "world") {
    syncMacroLatticeWithWorldScale(plane, pattern.localCellPx, gridSizePx, grid);
  } else {
    clearMacroLatticeWorldStyles(plane);
  }
}

function setDotGridPlaneProjectionTransform(grid: HTMLElement, planeTransform: string): void {
  const plane = dotGridPlaneElement(grid);
  plane.style.transformOrigin = "0 0";
  plane.style.transform = planeTransform;
  grid.style.transform = "";
}

export type SyncDotGridWithWorldCameraOptions = {
  anchor: HTMLElement;
  grid: HTMLElement;
  svg: SVGSVGElement;
  camera: ViewBox;
  contentAlign?: "mid" | "min";
};

function artboardEmbeddedGrid(grid: HTMLElement): boolean {
  return grid.closest(`.${IC_ARTBOARD_CLASS}`) instanceof HTMLElement;
}

/** CSS or SVG dot grid synced to world camera viewBox and viewport layout. */
export function syncDotGridWithWorldCamera(options: SyncDotGridWithWorldCameraOptions): void {
  const { anchor, grid, svg, camera, contentAlign } = options;
  const anchorRect = anchor.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();
  if (anchorRect.width <= 0 || anchorRect.height <= 0 || svgRect.width <= 0 || svgRect.height <= 0) {
    return;
  }

  const projection = readDotGridProjection(grid);
  const embeddedArtboard = artboardEmbeddedGrid(grid);

  const gridSize = readLengthPx(anchor, IC_DOT_GRID_CSS_VARS.sizeVar, DEFAULT_DOT_GRID_SIZE_PX);
  const phase = readLengthPx(
    anchor,
    IC_DOT_GRID_CSS_VARS.phaseVar,
    defaultDotGridPhase(gridSize),
  );

  if (cssDotGridLayerEnabled(grid)) {
    removeSvgDotGrid(svg);
    grid.style.opacity = "";
    grid.style.visibility = "";
    const cameraViewport = worldCameraViewportFromRects(anchorRect, svgRect);
    const dotStyle = dotGridWorldStyleFromViewBox(
      camera,
      cameraViewport.widthPx,
      cameraViewport.heightPx,
      gridSize,
      phase,
      {
        insetAnchorPx: 0,
        contentOffsetXPx: cameraViewport.offsetXPx,
        contentOffsetYPx: cameraViewport.offsetYPx,
        contentAlign: contentAlign ?? (embeddedArtboard ? "min" : "mid"),
      },
    );
    const worldScale = gridSize > 0 ? dotStyle.cellPx / gridSize : 1;
    const planeTransform = composeDotGridLayerTransform(projection, worldScale);
    const pattern = dotGridPatternOnPlane(gridSize, phase);
    applyCssDotGridPlaneStyles(anchor, grid, planeTransform, dotStyle, pattern, gridSize);
    grid.style.setProperty(IC_DOT_GRID_CSS_VARS.sizeVar, `${dotStyle.cellPx}px`);
    grid.style.setProperty(IC_DOT_GRID_CSS_VARS.phaseVar, `${dotStyle.phasePx}px`);
  } else {
    const planeTransform = composeDotGridLayerTransform(projection, 1);
    setDotGridPlaneProjectionTransform(grid, planeTransform);
    clearCssDotGridWorldStyles(grid);
    clearMacroLatticeWorldStyles(dotGridPlaneElement(grid));
    grid.style.opacity = "0";
    grid.style.visibility = "hidden";
    syncSvgDotGridFromViewBox(svg, camera, {
      cellSize: gridSize,
      phase,
      dotFill: readDotGridFillFromElement(anchor),
      projection: embeddedArtboard ? "orthogonal" : projection,
      ...(embeddedArtboard ? { marginRatio: 0 } : {}),
    });
  }
}

export function clearDotGridWorldCamera(grid: HTMLElement, svg: SVGSVGElement): void {
  const plane = dotGridPlaneElement(grid);
  plane.style.transform = "";
  grid.style.transform = "";
  clearCssDotGridWorldStyles(grid);
  clearMacroLatticeWorldStyles(plane);
  grid.style.opacity = "";
  grid.style.visibility = "";
  removeSvgDotGrid(svg);
}
