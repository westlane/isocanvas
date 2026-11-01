// Copyright (C) 2026 West Lane - All Rights Reserved

import {
  artboardDivisionPitch,
  artboardDotStep,
  artboardPlaneCellCenteredFootprint,
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

const ARTBOARD_DIVISIONS = DEFAULT_ARTBOARD_GRID_DIVISIONS;
const MACRO_CELL_PITCH = artboardDivisionPitch(DEFAULT_ARTBOARD_USER_SIZE, ARTBOARD_DIVISIONS);
const MIDDLE_ROW = Math.floor(ARTBOARD_DIVISIONS / 2);

/** Reference stack height for the center column demo. */
export const DEMO_STACK_CENTER_LAYER_COUNT = 7;

/** One dot step of margin on each side inside the macro cell lattice. */
export const DEMO_STACK_FOOTPRINT_DOT_INSET = 1;

const THIN_CARD_HEIGHT_ISO = userPxToIsoUnits(6);

type DemoStackColumn = {
  idPrefix: string;
  col: number;
  layerCount: number;
};

const DEMO_STACK_COLUMNS: readonly DemoStackColumn[] = [
  {
    idPrefix: "left",
    col: 0,
    layerCount: Math.floor(DEMO_STACK_CENTER_LAYER_COUNT / 2),
  },
  {
    idPrefix: "center",
    col: MIDDLE_ROW,
    layerCount: DEMO_STACK_CENTER_LAYER_COUNT,
  },
  {
    idPrefix: "right",
    col: ARTBOARD_DIVISIONS - 1,
    layerCount: DEMO_STACK_CENTER_LAYER_COUNT * 2,
  },
];

const DEMO_STACK_TOP_LABEL: Record<DemoStackColumn["idPrefix"], string> = {
  left: "Small",
  center: "Medium",
  right: "Large",
};

/** Square footprint inset one dot from the macro cell lattice on each side. */
function stackSquareFootprint(): { widthPx: number; depthPx: number } {
  const step = artboardDotStep(MACRO_CELL_PITCH);
  const dotSpan =
    DEFAULT_ARTBOARD_DOTS_PER_CELL - 2 * DEMO_STACK_FOOTPRINT_DOT_INSET;
  const sidePx = dotSpan * step.xPx;
  return { widthPx: sidePx, depthPx: sidePx };
}

const STACK_CARD_FOOTPRINT = stackSquareFootprint();

function stackOrigin(col: number): { x: number; y: number } {
  return artboardPlaneCellCenteredFootprint(
    col,
    MIDDLE_ROW,
    MACRO_CELL_PITCH,
    STACK_CARD_FOOTPRINT,
  );
}

function planeBoxesForColumn(column: DemoStackColumn): PlaneBoxSpec[] {
  const origin = stackOrigin(column.col);
  return Array.from({ length: column.layerCount }, (_, layerIndex) => {
    const layer = layerIndex + 1;
    const isTop = layerIndex === 0;
    return {
      id: `stack-${column.idPrefix}-${layer}`,
      label: isTop
        ? (DEMO_STACK_TOP_LABEL[column.idPrefix] ?? column.idPrefix)
        : String(layer),
      x: origin.x,
      y: origin.y,
      footprintAnchor: "back-left",
      width: STACK_CARD_FOOTPRINT.widthPx,
      depth: STACK_CARD_FOOTPRINT.depthPx,
      height: THIN_CARD_HEIGHT_ISO,
      elevation: (column.layerCount - 1 - layerIndex) * THIN_CARD_HEIGHT_ISO,
    };
  });
}

/** Demo: three thin-card stacks on the middle row (half / base / double height). */
export function mountCardStack(host: HTMLElement, colors: IsoCanvasColors): SVGSVGElement {
  const canvas = mountIsometricCanvasOnHost(host);
  const stage = defaultIsoArtboardStage();
  const boxes = DEMO_STACK_COLUMNS.flatMap((column) => planeBoxesForColumn(column));

  mountPlaneBoxesOnCanvas(canvas, boxes, colors, { stage });

  return decorateCubeCanvas(canvas);
}
