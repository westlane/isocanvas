// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import {
  artboardDivisionPitch,
  artboardDotStep,
  artboardPlaneCellCenteredFootprint,
  artboardSnapFootprintToDots,
  compareArtboardLatticeCells,
  DEFAULT_ARTBOARD_DOTS_PER_CELL,
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
  DEFAULT_ARTBOARD_USER_SIZE,
  decorateCubeCanvas,
  defaultIsoArtboardStage,
  mountIsometricCanvasOnHost,
  mountPlaneBoxesOnCanvas,
  userPxToIsoUnits,
  type IsoCanvasColors,
  type PlaneBoxSpec,
} from "@westlane/isocanvas";
import type { CardGridCell } from "./types.js";
import {
  DEMO_CARD_GRID_DOT_INSET,
  DEMO_CARD_GRID,
  DEMO_CARD_USER_DEPTH_PX,
  DEMO_CARD_USER_WIDTH_PX,
} from "./card-grid-cells.js";

const MACRO_CELL_PITCH = artboardDivisionPitch(
  DEFAULT_ARTBOARD_USER_SIZE,
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
);

/** Footprint snapped to dots, inset from macro cell edges (centered mount). */
function demoGridCardFootprint(): { widthPx: number; depthPx: number } {
  const step = artboardDotStep(MACRO_CELL_PITCH);
  const dotSpan = DEFAULT_ARTBOARD_DOTS_PER_CELL - 2 * DEMO_CARD_GRID_DOT_INSET;
  const inner = { widthPx: dotSpan * step.xPx, depthPx: dotSpan * step.yPx };
  const preferred = artboardSnapFootprintToDots(
    { widthPx: DEMO_CARD_USER_WIDTH_PX, depthPx: DEMO_CARD_USER_DEPTH_PX },
    MACRO_CELL_PITCH,
  );
  const scale = Math.min(
    1,
    inner.widthPx / preferred.widthPx,
    inner.depthPx / preferred.depthPx,
  );
  return artboardSnapFootprintToDots(
    { widthPx: preferred.widthPx * scale, depthPx: preferred.depthPx * scale },
    MACRO_CELL_PITCH,
  );
}

const CARD_FOOTPRINT = demoGridCardFootprint();

function planeBoxFromCell(cell: CardGridCell): PlaneBoxSpec {
  const { x, y } = artboardPlaneCellCenteredFootprint(
    cell.col,
    cell.row,
    MACRO_CELL_PITCH,
    CARD_FOOTPRINT,
  );
  return {
    id: cell.id,
    label: cell.label,
    x,
    y,
    footprintAnchor: "back-left",
    width: CARD_FOOTPRINT.widthPx,
    depth: CARD_FOOTPRINT.depthPx,
    ...(cell.heightUserPx !== undefined
      ? { height: userPxToIsoUnits(cell.heightUserPx) }
      : {}),
  };
}

/** Demo: one card per macro cell on the default 3×3 plane grid. */
export function mountCardGrid(host: HTMLElement, colors: IsoCanvasColors): SVGSVGElement {
  const canvas = mountIsometricCanvasOnHost(host);
  const stage = defaultIsoArtboardStage();
  const boxes = DEMO_CARD_GRID.filter(
    (cell) => cell.col < stage.divisions! && cell.row < stage.divisions!,
  )
    .slice()
    .sort(compareArtboardLatticeCells)
    .map((cell) => planeBoxFromCell(cell));

  mountPlaneBoxesOnCanvas(canvas, boxes, colors, {
    stage,
    artboardShellChrome: "full",
  });

  return decorateCubeCanvas(canvas);
}
