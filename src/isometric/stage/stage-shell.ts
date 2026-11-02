// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import {
  IsometricGroup,
  IsometricPath,
  IsometricRectangle,
  IsometricText,
  PlaneView,
  type IsometricCanvas,
} from "@elchininet/isometric";
import type { ArtboardPlaneStage } from "../../types/artboard.js";
import type { IsometricOrientation } from "../../types/diagram.js";
import {
  artboardFaceClassName,
  ARTBOARD_SLAB_HEIGHT_USER_PX,
  artboardGroundElevationIso,
  IC_ARTBOARD_FINEGUIDE_CLASS,
  IC_ARTBOARD_GUIDE_CLASS,
  IC_ARTBOARD_OUTLINE_CLASS,
  IC_ARTBOARD_OUTLINE_LAYER_CLASS,
  IC_ARTBOARD_SUBGUIDE_CLASS,
} from "../../layout/artboard-outline.js";
import { DEFAULT_ISOMETRIC_ORIENTATION } from "../orientation.js";
import {
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
  DEFAULT_ARTBOARD_GRID_SUBDIVISIONS,
  DEFAULT_ARTBOARD_DOT_LATTICE_PHASE,
} from "../../layout/artboard.js";
import {
  artboardIsoGroundGuideFraction,
  artboardPlaneCollectionLabelBottomLeftFloatAnchor,
} from "../../layout/lattice-plane.js";
import { mountIsoGroundDotGrid } from "../../grid/svg.js";
import { artboardPlaneToIsoGround, isoSizeFromDiagramUser } from "../diagram-user.js";
import { isometricCanvasMountHost } from "../orientation.js";
import { isoCubeFaceRectLayoutForPlaneTopLeft } from "../cube/cube-faces.js";
import { userPxToIsoUnits } from "../cube/cube.js";
import {
  CANVAS_TEXT_NO_STROKE,
  formatIsoCanvasLabelText,
  isoBoxTopFaceLabelLayout,
  truncateIsoCanvasLabelText,
  ISO_CANVAS_LABEL_FONT_FAMILY,
  ISO_CANVAS_LABEL_FONT_WEIGHT,
  measureIsoCanvasLabelTextWidthPx,
} from "../cube/canvas-text-style.js";
import { isoStageGroundLayout } from "./ground-local.js";
import type { IsoGroundAnchor } from "../../types/diagram.js";
import type { PlaneRowColumnSpec, PlaneRowMountPlan } from "../../stage/plane-row-mount.js";
import type { PlaneGridMountPlan } from "../../stage/plane-grid-mount.js";
import {
  planeGridCellExtent,
  planeGridCellOrigin,
} from "../../stage/stage-plane-grid-scene.js";

function mountArtboardSlabFace(
  shell: IsometricGroup,
  face: "front" | "side",
  footprintWidthIso: number,
  footprintDepthIso: number,
  slabHeightIso: number,
  orientation: IsometricOrientation,
): void {
  const layout = isoCubeFaceRectLayoutForPlaneTopLeft(
    face,
    footprintWidthIso,
    footprintDepthIso,
    slabHeightIso,
    orientation,
  );
  shell.addChild(
    new IsometricRectangle({
      planeView: layout.planeView,
      width: layout.width,
      height: layout.height,
      ...(layout.left !== undefined ? { left: layout.left } : {}),
      ...(layout.right !== undefined ? { right: layout.right } : {}),
      ...(layout.top !== undefined ? { top: layout.top } : {}),
      className: artboardFaceClassName(face),
    }),
  );
}

/**
 * Macro / sub / fine splits on the iso ground (3×3 macro, 3×3 sub, 3×3 fine per cell).
 * Finest guides mount first; macro paints on top.
 */
function artboardIsoGroundGuideClass(
  lineIndex: number,
  grid: { divisions: number; subdivisions: number },
): string {
  const fineLinesPerMacro = grid.subdivisions;
  const macroStride = fineLinesPerMacro;
  /** Sub-guides: 3×3 inside each macro cell (independent of macro `divisions` count). */
  const subStride = fineLinesPerMacro / DEFAULT_ARTBOARD_GRID_DIVISIONS;
  if (!Number.isInteger(subStride) || subStride < 1) {
    throw new Error(
      "Artboard fine lines per macro must be divisible by DEFAULT_ARTBOARD_GRID_DIVISIONS",
    );
  }
  if (lineIndex % macroStride === 0) {
    return IC_ARTBOARD_GUIDE_CLASS;
  }
  if (lineIndex % subStride === 0) {
    return IC_ARTBOARD_SUBGUIDE_CLASS;
  }
  return IC_ARTBOARD_FINEGUIDE_CLASS;
}

function mountArtboardIsoGroundDivisions(
  shell: IsometricGroup,
  footprintWidthIso: number,
  footprintDepthIso: number,
  grid: { divisions: number; subdivisions: number },
  slabTop: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): void {
  const lines = grid.divisions * grid.subdivisions;
  const tiers: Array<{ className: string; indices: number[] }> = [
    { className: IC_ARTBOARD_FINEGUIDE_CLASS, indices: [] },
    { className: IC_ARTBOARD_SUBGUIDE_CLASS, indices: [] },
    { className: IC_ARTBOARD_GUIDE_CLASS, indices: [] },
  ];
  for (let i = 1; i < lines; i += 1) {
    const className = artboardIsoGroundGuideClass(i, grid);
    const tier = tiers.find((entry) => entry.className === className);
    tier?.indices.push(i);
  }
  for (const { className, indices } of tiers) {
    for (const i of indices) {
      mountIsoGroundGuidePair(
        shell,
        footprintWidthIso,
        footprintDepthIso,
        artboardIsoGroundGuideFraction(i, lines, DEFAULT_ARTBOARD_DOT_LATTICE_PHASE),
        className,
        slabTop,
        orientation,
      );
    }
  }
}

/** One guide along each ground axis at `fraction` of the footprint. */
function mountIsoGroundGuidePair(
  shell: IsometricGroup,
  footprintWidthIso: number,
  footprintDepthIso: number,
  fraction: number,
  className: string,
  slabTop: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): void {
  if (orientation === "rotated") {
    const lGuide = footprintDepthIso * fraction;
    shell.addChild(
      createIsoGroundGuideLine(
        { right: 0, left: lGuide },
        { right: footprintWidthIso, left: lGuide },
        className,
        slabTop,
      ),
    );
    const rGuide = footprintWidthIso * fraction;
    shell.addChild(
      createIsoGroundGuideLine(
        { right: rGuide, left: 0 },
        { right: rGuide, left: footprintDepthIso },
        className,
        slabTop,
      ),
    );
    return;
  }
  const lGuide = -footprintWidthIso * fraction;
  shell.addChild(
    createIsoGroundGuideLine(
      { right: 0, left: lGuide },
      { right: footprintDepthIso, left: lGuide },
      className,
      slabTop,
    ),
  );
  const rGuide = footprintDepthIso * fraction;
  shell.addChild(
    createIsoGroundGuideLine(
      { right: rGuide, left: 0 },
      { right: rGuide, left: -footprintWidthIso },
      className,
      slabTop,
    ),
  );
}

/** Single-stroke ground guide (a stroked thin rect would render as a double line). Styled by class CSS. */
function createIsoGroundGuideLine(
  from: IsoGroundAnchor,
  to: IsoGroundAnchor,
  className: string,
  slabTop: number,
): IsometricPath {
  const path = new IsometricPath({ className });
  path.moveTo(from.right, from.left, slabTop).lineTo(to.right, to.left, slabTop);
  return path;
}

export type ArtboardStageShellChrome = "full" | "ground-grid-only";

export const ARTBOARD_COLLECTION_LABEL_FONT_SIZE_PX = 72;

export const IC_ARTBOARD_COLLECTION_LABEL_BADGE_CLASS = "ic-artboard-collection-label-badge";

export const IC_ARTBOARD_COLLECTION_LABEL_BADGE_SIDE_CLASS =
  "ic-artboard-collection-label-badge-side";

export const IC_ARTBOARD_COLLECTION_LABEL_TEXT_CLASS = "ic-artboard-collection-label";

const COLLECTION_BADGE_PAD_X_PX = 36;
const COLLECTION_BADGE_PAD_Y_PX = 22;
/** Gap south of the artboard SW lattice pin before the badge footprint. */
const COLLECTION_LABEL_FLOAT_OFF_PX = 40;
/** Dot lattice inset from the artboard west/south edges (SW pin). */
export const ARTBOARD_COLLECTION_LABEL_MARGIN_DOTS = 0;
/** Fine plane nudge after SW pin (+y south, −x west). */
const COLLECTION_LABEL_NUDGE_PLANE_X_PX = -18;
const COLLECTION_LABEL_NUDGE_PLANE_Y_PX = 10;

export { artboardCollectionLabelBandPx } from "../../stage/collection-label-band.js";

function collectionBadgeSideFill(topFill: string): string {
  return topFill === "#3b0764" ? "#2e0654" : topFill;
}

function mountCollectionBadgeSlab(
  badge: IsometricGroup,
  footprintWidthIso: number,
  footprintDepthIso: number,
  slabHeightIso: number,
  topFill: string,
  orientation: IsometricOrientation,
): void {
  const sideFill = collectionBadgeSideFill(topFill);
  const topLayout = isoCubeFaceRectLayoutForPlaneTopLeft(
    "top",
    footprintWidthIso,
    footprintDepthIso,
    slabHeightIso,
    orientation,
  );
  badge.addChild(
    new IsometricRectangle({
      planeView: topLayout.planeView,
      width: topLayout.width,
      height: topLayout.height,
      ...(topLayout.left !== undefined ? { left: topLayout.left } : {}),
      ...(topLayout.right !== undefined ? { right: topLayout.right } : {}),
      ...(topLayout.top !== undefined ? { top: topLayout.top } : {}),
      fillColor: topFill,
      strokeColor: "transparent",
      strokeWidth: 0,
      className: IC_ARTBOARD_COLLECTION_LABEL_BADGE_CLASS,
    }),
  );
  for (const face of ["front", "side"] as const) {
    const layout = isoCubeFaceRectLayoutForPlaneTopLeft(
      face,
      footprintWidthIso,
      footprintDepthIso,
      slabHeightIso,
      orientation,
    );
    badge.addChild(
      new IsometricRectangle({
        planeView: layout.planeView,
        width: layout.width,
        height: layout.height,
        ...(layout.left !== undefined ? { left: layout.left } : {}),
        ...(layout.right !== undefined ? { right: layout.right } : {}),
        ...(layout.top !== undefined ? { top: layout.top } : {}),
        fillColor: sideFill,
        strokeColor: "transparent",
        strokeWidth: 0,
        className: IC_ARTBOARD_COLLECTION_LABEL_BADGE_SIDE_CLASS,
      }),
    );
  }
}

function collectionBadgeColorsFromShell(shell: IsometricGroup): { bg: string; fg: string } {
  const fallback = { bg: "#3b0764", fg: "#ffffff" };
  const svg = shell.getElement().ownerSVGElement;
  if (!(svg instanceof SVGSVGElement)) {
    return fallback;
  }
  const styles = getComputedStyle(svg);
  const bg = styles.getPropertyValue("--ic-artboard-collection-badge-bg").trim();
  const fg = styles.getPropertyValue("--ic-artboard-collection-badge-fg").trim();
  return {
    bg: bg || fallback.bg,
    fg: fg || fallback.fg,
  };
}

/** Iso badge + title at the bottom-left of each artboard column (iso SW pin). */
export function mountArtboardCollectionLabelOnShell(
  shell: IsometricGroup,
  stage: ArtboardPlaneStage,
  label: string,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): void {
  const trimmed = label.trim();
  if (!trimmed) {
    return;
  }
  const anchorPlane = artboardPlaneCollectionLabelBottomLeftFloatAnchor(stage, {
    marginDots: ARTBOARD_COLLECTION_LABEL_MARGIN_DOTS,
    floatBelowPx: COLLECTION_LABEL_FLOAT_OFF_PX,
    nudgePlaneXPx: COLLECTION_LABEL_NUDGE_PLANE_X_PX,
    nudgePlaneYPx: COLLECTION_LABEL_NUDGE_PLANE_Y_PX,
  });
  const stageX = stage.x ?? 0;
  const stageY = stage.y ?? 0;
  const ground = artboardPlaneToIsoGround(
    anchorPlane.x - stageX,
    anchorPlane.y - stageY,
    orientation,
    stage,
  );
  const slabHeightIso = userPxToIsoUnits(ARTBOARD_SLAB_HEIGHT_USER_PX);
  const fontSize = ARTBOARD_COLLECTION_LABEL_FONT_SIZE_PX;
  const formatted = formatIsoCanvasLabelText(trimmed);
  const text = truncateIsoCanvasLabelText(formatted, stage.width * 0.55, fontSize);
  const textWidthPx = measureIsoCanvasLabelTextWidthPx(text, fontSize);
  const badgeWidthPx = textWidthPx + COLLECTION_BADGE_PAD_X_PX * 2;
  const badgeDepthPx = fontSize + COLLECTION_BADGE_PAD_Y_PX * 2;
  const badgeWidthIso = userPxToIsoUnits(badgeWidthPx);
  const badgeDepthIso = userPxToIsoUnits(badgeDepthPx);
  const { bg, fg } = collectionBadgeColorsFromShell(shell);
  const labelLayout = isoBoxTopFaceLabelLayout(
    badgeWidthIso,
    badgeDepthIso,
    slabHeightIso,
    orientation,
  );
  const badge = new IsometricGroup({
    left: ground.left,
    right: ground.right,
    top: 0,
  });
  mountCollectionBadgeSlab(
    badge,
    badgeWidthIso,
    badgeDepthIso,
    slabHeightIso,
    bg,
    orientation,
  );
  badge.addChild(
    new IsometricText({
      planeView: PlaneView.TOP,
      text,
      left: labelLayout.left,
      right: labelLayout.right,
      top: labelLayout.top,
      fontSize,
      fontFamily: ISO_CANVAS_LABEL_FONT_FAMILY,
      fontStyle: "normal",
      fontWeight: ISO_CANVAS_LABEL_FONT_WEIGHT,
      fillColor: fg,
      ...CANVAS_TEXT_NO_STROKE,
      className: IC_ARTBOARD_COLLECTION_LABEL_TEXT_CLASS,
      origin: ["center", "center"],
      rotation: labelLayout.rotation,
      selectable: false,
    }),
  );
  shell.addChild(badge);
}

function applyCollectionLabelToShell(
  shell: IsometricGroup,
  stage: ArtboardPlaneStage,
  column: PlaneRowColumnSpec | undefined,
  orientation: IsometricOrientation,
): void {
  const text = column?.collectionLabel?.trim();
  if (!text) {
    return;
  }
  mountArtboardCollectionLabelOnShell(shell, stage, text, orientation);
}

/** One iso ground column shell; optional floating collection title. */
export function mountArtboardShellOnCanvas(
  canvas: IsometricCanvas,
  stage: ArtboardPlaneStage,
  orientation: IsometricOrientation,
  shellChrome: ArtboardStageShellChrome,
  column: PlaneRowColumnSpec | undefined,
): IsometricGroup {
  const shell = createArtboardStageShell(stage, orientation, shellChrome);
  addArtboardStageShell(canvas, shell, stage);
  applyCollectionLabelToShell(shell, stage, column, orientation);
  return shell;
}

/** Merged strip: one shell per {@link PlaneRowMountPlan} column; returns cube mount anchor. */
export function mountArtboardPlaneRowShellsOnCanvas(
  canvas: IsometricCanvas,
  stripStage: ArtboardPlaneStage,
  plan: PlaneRowMountPlan,
  orientation: IsometricOrientation,
  shellChrome: ArtboardStageShellChrome,
): IsometricGroup {
  const { cellWidth, cellHeight, gapPx, columns } = plan;
  const divisions = stripStage.divisions;
  const count = Math.max(columns.length, 1);
  for (let column = 0; column < count; column += 1) {
    const columnStage: ArtboardPlaneStage = {
      x: stripStage.x + column * (cellWidth + gapPx),
      y: stripStage.y,
      width: cellWidth,
      height: cellHeight,
      ...(divisions !== undefined ? { divisions } : {}),
    };
    mountArtboardShellOnCanvas(
      canvas,
      columnStage,
      orientation,
      shellChrome,
      columns[column],
    );
  }
  const stageGround = artboardPlaneToIsoGround(
    stripStage.x,
    stripStage.y,
    orientation,
    stripStage,
  );
  const anchor = new IsometricGroup({
    left: stageGround.left,
    right: stageGround.right,
    top: 0,
  });
  canvas.addChild(anchor);
  return anchor;
}

/** Merged grid: one iso ground shell per cell; returns cube mount anchor. */
export function mountArtboardPlaneGridShellsOnCanvas(
  canvas: IsometricCanvas,
  stripStage: ArtboardPlaneStage,
  plan: PlaneGridMountPlan,
  orientation: IsometricOrientation,
  shellChrome: ArtboardStageShellChrome,
): IsometricGroup {
  const { cellWidth, cellHeight, gapPx, layout, cells } = plan;
  const divisions = stripStage.divisions;
  const cellUserSize = { width: cellWidth, height: cellHeight };
  const labelBandPx = layout.labelBandPx;
  for (const cell of cells) {
    const origin = planeGridCellOrigin(cell, cellUserSize, gapPx, labelBandPx);
    const extent = planeGridCellExtent(cell, cellUserSize, gapPx);
    const columnStage: ArtboardPlaneStage = {
      x: stripStage.x + origin.x,
      y: stripStage.y + origin.y,
      width: extent.width,
      height: extent.height,
      ...(divisions !== undefined ? { divisions } : {}),
    };
    mountArtboardShellOnCanvas(
      canvas,
      columnStage,
      orientation,
      shellChrome,
      cell,
    );
  }
  const stageGround = artboardPlaneToIsoGround(
    stripStage.x,
    stripStage.y,
    orientation,
    stripStage,
  );
  const anchor = new IsometricGroup({
    left: stageGround.left,
    right: stageGround.right,
    top: 0,
  });
  canvas.addChild(anchor);
  return anchor;
}

/** Default for {@link renderDiagramScene} and {@link mountPlaneBoxesOnCanvas}. */
export const DEFAULT_DIAGRAM_ARTBOARD_SHELL_CHROME: ArtboardStageShellChrome =
  "ground-grid-only";

/** Ground outline (+ optional chrome); appearance comes from the artboard theme CSS, not mount props. */
export function createArtboardStageShell(
  stage: ArtboardPlaneStage,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
  chrome: ArtboardStageShellChrome = "full",
): IsometricGroup {
  const { width: footprintWidthIso, depth: footprintDepthIso } = isoSizeFromDiagramUser(
    stage.width,
    stage.height,
  );
  const anchor = artboardPlaneToIsoGround(stage.x, stage.y, orientation, stage);
  const groundLayout = isoStageGroundLayout(footprintWidthIso, footprintDepthIso, orientation);
  const slabHeightIso = userPxToIsoUnits(ARTBOARD_SLAB_HEIGHT_USER_PX);
  const slabTop = artboardGroundElevationIso();
  const shell = new IsometricGroup({
    left: anchor.left,
    right: anchor.right,
    top: 0,
  });
  const ground = new IsometricRectangle({
    planeView: groundLayout.planeView,
    width: groundLayout.width,
    height: groundLayout.height,
    left: groundLayout.left,
    right: groundLayout.right,
    top: slabTop,
    className: IC_ARTBOARD_OUTLINE_CLASS,
  });
  if (chrome === "ground-grid-only") {
    mountArtboardSlabFace(shell, "front", footprintWidthIso, footprintDepthIso, slabHeightIso, orientation);
    mountArtboardSlabFace(shell, "side", footprintWidthIso, footprintDepthIso, slabHeightIso, orientation);
    shell.addChild(ground);
    mountArtboardIsoGroundDivisions(
      shell,
      footprintWidthIso,
      footprintDepthIso,
      {
        divisions: stage.divisions ?? DEFAULT_ARTBOARD_GRID_DIVISIONS,
        subdivisions: stage.subdivisions ?? DEFAULT_ARTBOARD_GRID_SUBDIVISIONS,
      },
      slabTop,
      orientation,
    );
    return shell;
  }
  mountArtboardSlabFace(shell, "front", footprintWidthIso, footprintDepthIso, slabHeightIso, orientation);
  mountArtboardSlabFace(shell, "side", footprintWidthIso, footprintDepthIso, slabHeightIso, orientation);
  shell.addChild(ground);
  shell.addChild(
    new IsometricRectangle({
      planeView: groundLayout.planeView,
      width: groundLayout.width,
      height: groundLayout.height,
      left: groundLayout.left,
      right: groundLayout.right,
      top: slabTop,
      className: IC_ARTBOARD_OUTLINE_LAYER_CLASS,
    }),
  );
  mountArtboardIsoGroundDivisions(
    shell,
    footprintWidthIso,
    footprintDepthIso,
    {
      divisions: stage.divisions ?? DEFAULT_ARTBOARD_GRID_DIVISIONS,
      subdivisions: stage.subdivisions ?? DEFAULT_ARTBOARD_GRID_SUBDIVISIONS,
    },
    slabTop,
    orientation,
  );
  return shell;
}

/** Attach the stage shell, then lay dots under division guides (outline layer → dots → guides). */
export function addArtboardStageShell(
  canvas: IsometricCanvas,
  shell: IsometricGroup,
  stage: ArtboardPlaneStage,
): void {
  canvas.addChild(shell);
  const outline = shell.getElement().querySelector(`path.${IC_ARTBOARD_OUTLINE_CLASS}`);
  if (!(outline instanceof SVGPathElement)) {
    throw new Error("Artboard stage shell is missing its ground outline");
  }
  const themeHost = isometricCanvasMountHost(canvas);
  mountIsoGroundDotGrid(
    outline,
    {
      width: stage.width,
      height: stage.height,
      divisions: stage.divisions ?? DEFAULT_ARTBOARD_GRID_DIVISIONS,
    },
    themeHost ? { themeHost } : {},
  );
}
