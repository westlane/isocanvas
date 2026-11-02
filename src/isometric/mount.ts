// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import {
  type IsometricCanvas,
  IsometricGroup,
  IsometricPath,
} from "@elchininet/isometric";
import type { ArtboardPlaneStage, ArtboardUserSize, PlaneBoxSpec } from "../types/artboard.js";
import type { IsoBoxSpec, IsoFaceId, IsometricOrientation } from "../types/diagram.js";
import type { IsoCanvasColors } from "../types/theme.js";
import { setViewportCenteredMeet, writeViewBoxToSvg } from "../camera/view-box/attributes.js";
import { writeViewBoxHomeMetadata } from "../camera/view-box/baseline.js";
import { viewBoxForMountedCubeCanvas } from "../layout/artboard-outline.js";
import { artboardPlaneToIsoGround } from "./diagram-user.js";
import { readIsometricOrientationFromCanvas, isometricCanvasMountHost } from "./orientation.js";
import { isoBoxSpecsOnArtboardGround } from "./plane-layout.js";
import {
  mountAnchoredFace,
  mountIsoBoxOnStageShell,
  mountNodeLabel,
} from "./cube/box-parts.js";
import {
  createLocalIsoPrismParts,
} from "./prism-parts.js";
import { ISO_CUBE_MOUNT_FACE_ORDER } from "./cube/cube-faces.js";
import { isoAnchorPaintDepth, isoFacePaintOrder } from "./cube/cube.js";
import { fitIsoCubeTopLabelFontSizePx, readIsoCubeLabelTheme, uniformIsoCubeTopLabelFontSizePx } from "./cube/canvas-text-style.js";
import { stackLayerPresentationByBoxId, elevateStackLayersAboveArtboardGround } from "./cube/stack-opacity.js";
import {
  addArtboardStageShell,
  createArtboardStageShell,
  DEFAULT_DIAGRAM_ARTBOARD_SHELL_CHROME,
  mountArtboardPlaneGridShellsOnCanvas,
  mountArtboardPlaneRowShellsOnCanvas,
  mountArtboardShellOnCanvas,
  type ArtboardStageShellChrome,
} from "./stage/stage-shell.js";
import type { PlaneRowColumnSpec, PlaneRowMountPlan } from "../stage/plane-row-mount.js";
import type { PlaneGridMountPlan } from "../stage/plane-grid-mount.js";

/** One deferred paint step on a cube canvas, ordered by `depth` then `layer`. */
export type IsoCanvasMountEntry = {
  depth: number;
  layer: number;
  mount: (canvas: IsometricCanvas) => void;
};

export type MountArtboardGroundOptions = {
  /** Split the ground into span×span cells with iso-aligned guides (default 3). */
  divisions?: number;
};

const FACE_LAYER: Record<IsoFaceId | "label", number> = {
  bottom: 0,
  back: 1,
  left: 2,
  side: 3,
  front: 4,
  top: 5,
  label: 6,
};

/** Bump when mount structure changes — check on `<svg data-ic-mount="…">` in devtools. */
export const IC_CUBE_MOUNT_PIPELINE = "stage-shell-v2";

/** Value for `data-diagram-renderer` on mounted cube-canvas SVG roots. */
export const DIAGRAM_RENDERER = "ic-cube-canvas";

/** Shift ic-canvas geometry from SVG center to viewBox top-left (matches dot grid). */
export function applyArtboardOriginToCubeSvg(
  svg: SVGSVGElement,
  userWidth: number,
  userHeight: number,
): void {
  if (svg.querySelector(":scope > g.ic-cube-canvas-origin")) {
    return;
  }
  const shift = document.createElementNS("http://www.w3.org/2000/svg", "g");
  shift.setAttribute("class", "ic-cube-canvas-origin");
  shift.setAttribute("transform", `translate(${-userWidth / 2}, ${-userHeight / 2})`);
  for (const node of Array.from(svg.childNodes)) {
    if (node instanceof SVGRectElement && node.classList.contains("ic-cube-canvas-bg")) {
      continue;
    }
    shift.appendChild(node);
  }
  svg.appendChild(shift);
}

function artboardStageMountEntries(stage: ArtboardPlaneStage): IsoCanvasMountEntry[] {
  return [
    {
      depth: 0,
      layer: 0,
      mount: (canvas) => {
        const orientation = readIsometricOrientationFromCanvas(canvas);
        addArtboardStageShell(canvas, createArtboardStageShell(stage, orientation, "full"), stage);
      },
    },
  ];
}

function isoBoxMountEntries(
  specs: readonly IsoBoxSpec[],
  colors: IsoCanvasColors,
  labelFontSizePx: number,
  orientation: IsometricOrientation,
  options?: { omitBottomFace?: boolean },
): IsoCanvasMountEntry[] {
  const specsSorted = [...specs].sort(
    (a, b) => isoAnchorPaintDepth(a) - isoAnchorPaintDepth(b),
  );
  const entries: IsoCanvasMountEntry[] = [];
  for (const spec of specsSorted) {
    const { faces, recessWalls, frontLight, topGloss, bottomRims, label } = createLocalIsoPrismParts(
      spec,
      colors,
      orientation,
      labelFontSizePx,
    );
    for (const id of ISO_CUBE_MOUNT_FACE_ORDER) {
      if (options?.omitBottomFace && id === "bottom") {
        continue;
      }
      if (recessWalls.length > 0 && (id === "back" || id === "left")) {
        if (id === "back") {
          recessWalls.forEach((wall, index) => {
            entries.push({
              depth: isoFacePaintOrder(spec, "back") + index * 0.00001,
              layer: FACE_LAYER.back,
              mount: (c) => mountAnchoredFace(c, spec, wall),
            });
          });
        }
        continue;
      }
      const rect = faces[id];
      entries.push({
        depth: isoFacePaintOrder(spec, id),
        layer: FACE_LAYER[id],
        mount: (c) => mountAnchoredFace(c, spec, rect),
      });
      if (id === "front") {
        entries.push({
          depth: isoFacePaintOrder(spec, "front") + 0.0005,
          layer: FACE_LAYER.front,
          mount: (c) => mountAnchoredFace(c, spec, frontLight),
        });
      }
      if (id === "top") {
        entries.push({
          depth: isoFacePaintOrder(spec, "top") + 0.001,
          layer: FACE_LAYER.top,
          mount: (c) => mountAnchoredFace(c, spec, topGloss),
        });
        entries.push({
          depth: isoFacePaintOrder(spec, "front") + 0.002,
          layer: FACE_LAYER.front,
          mount: (c) => mountAnchoredFace(c, spec, bottomRims.bottom),
        });
        entries.push({
          depth: isoFacePaintOrder(spec, "left") + 0.002,
          layer: FACE_LAYER.left,
          mount: (c) => mountAnchoredFace(c, spec, bottomRims.left),
        });
      }
    }
    entries.push({
      depth: isoFacePaintOrder(spec, "top"),
      layer: FACE_LAYER.label,
      mount: (c) => mountNodeLabel(c, spec, label),
    });
  }
  return entries;
}

/** Paint in entry order; do not globally interleave faces across boxes. */
function mountEntriesInPaintOrder(
  canvas: IsometricCanvas,
  entries: readonly IsoCanvasMountEntry[],
): void {
  for (const entry of entries) {
    entry.mount(canvas);
  }
}

/** Mount artboard outline + macro grid from overhead plane layout. */
export function mountArtboardPlaneStageOnCanvas(
  canvas: IsometricCanvas,
  stage: ArtboardPlaneStage,
): void {
  mountEntriesInPaintOrder(canvas, artboardStageMountEntries(stage));
}

export function mountArtboardGroundOnCanvas(
  canvas: IsometricCanvas,
  userSize: ArtboardUserSize,
  options: MountArtboardGroundOptions = {},
): void {
  mountArtboardPlaneStageOnCanvas(canvas, {
    x: 0,
    y: 0,
    width: userSize.width,
    height: userSize.height,
    ...(options.divisions !== undefined ? { divisions: options.divisions } : {}),
  });
}

export function decorateCubeCanvas(canvas: IsometricCanvas): SVGSVGElement {
  const svg = canvas.getElement() as SVGSVGElement;
  svg.setAttribute("data-diagram-renderer", DIAGRAM_RENDERER);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  setViewportCenteredMeet(svg);
  const bg = svg.querySelector(":scope > rect");
  bg?.classList.add("ic-cube-canvas-bg");
  canvas.backgroundColor = "transparent";
  const { width, height } = canvas.data;
  applyArtboardOriginToCubeSvg(svg, width, height);
  const viewBox = viewBoxForMountedCubeCanvas(svg, { width, height }, 24);
  writeViewBoxToSvg(svg, viewBox);
  svg.dataset.debugPlaneW = String(width);
  svg.dataset.debugPlaneH = String(height);
  writeViewBoxHomeMetadata(svg, viewBox);
  svg.dataset.icMount = IC_CUBE_MOUNT_PIPELINE;
  return svg;
}

/** Mount cubes from overhead plane specs (projects to iso inside). */
export function mountPlaneBoxesOnCanvas(
  canvas: IsometricCanvas,
  boxes: readonly PlaneBoxSpec[],
  colors: IsoCanvasColors,
  options: {
    stage: ArtboardPlaneStage;
    omitArtboardShell?: boolean;
    artboardShellChrome?: ArtboardStageShellChrome;
    planeRowMount?: PlaneRowMountPlan;
    planeGridMount?: PlaneGridMountPlan;
    artboardCollection?: PlaneRowColumnSpec;
  },
): void {
  const stage = options.stage;
  const orientation = readIsometricOrientationFromCanvas(canvas);
  const themeScope = isometricCanvasMountHost(canvas);
  const stageGround = artboardPlaneToIsoGround(stage.x, stage.y, orientation, stage);
  const planeBoxes = elevateStackLayersAboveArtboardGround(boxes);
  const stackLayers = stackLayerPresentationByBoxId(planeBoxes);
  const specs = isoBoxSpecsOnArtboardGround(planeBoxes, orientation, stage).sort((a, b) => {
    const depth = isoAnchorPaintDepth(a) - isoAnchorPaintDepth(b);
    if (depth !== 0) {
      return depth;
    }
    return (a.elevation ?? 0) - (b.elevation ?? 0);
  });
  const shellChrome =
    options.artboardShellChrome ?? DEFAULT_DIAGRAM_ARTBOARD_SHELL_CHROME;
  const planeRowMount = options.planeRowMount;
  const planeGridMount = options.planeGridMount;
  const mountTarget = options.omitArtboardShell
    ? (() => {
        const anchor = new IsometricGroup({
          left: stageGround.left,
          right: stageGround.right,
          top: 0,
        });
        canvas.addChild(anchor);
        return anchor;
      })()
    : planeGridMount && planeGridMount.cells.length > 0
      ? mountArtboardPlaneGridShellsOnCanvas(
          canvas,
          stage,
          planeGridMount,
          orientation,
          shellChrome,
        )
      : planeRowMount && planeRowMount.columns.length > 0
        ? mountArtboardPlaneRowShellsOnCanvas(
            canvas,
            stage,
            planeRowMount,
            orientation,
            shellChrome,
          )
        : mountArtboardShellOnCanvas(
            canvas,
            stage,
            orientation,
            shellChrome,
            options.artboardCollection,
          );
  for (const spec of specs) {
    const stackLayer = stackLayers.get(spec.id);
    const labelFontSizePx = spec.omitCubeLabel
      ? readIsoCubeLabelTheme(themeScope).fontSizePx
      : fitIsoCubeTopLabelFontSizePx({
          label: spec.label,
          widthIso: spec.width,
          depthIso: spec.depth,
          orientation,
          themeScope,
        });
    mountIsoBoxOnStageShell(mountTarget, spec, stageGround, colors, {
      omitBottomFace: true,
      orientation,
      labelFontSizePx,
      ...(stackLayer ? { stackLayer } : {}),
    });
  }
}

/** Low-level mount when anchors are already in ic-canvas ground space. */
export function mountIsoBoxesOnCanvas(
  canvas: IsometricCanvas,
  specs: readonly IsoBoxSpec[],
  colors: IsoCanvasColors,
  options?: { artboardUserSize?: ArtboardUserSize; artboardDivisions?: number },
): void {
  const orientation = readIsometricOrientationFromCanvas(canvas);
  const themeScope = isometricCanvasMountHost(canvas);
  const labelFontSizePx = uniformIsoCubeTopLabelFontSizePx(specs, { orientation, themeScope });
  const entries: IsoCanvasMountEntry[] = [];
  if (options?.artboardUserSize) {
    entries.push(
      ...artboardStageMountEntries({
        x: 0,
        y: 0,
        width: options.artboardUserSize.width,
        height: options.artboardUserSize.height,
        ...(options.artboardDivisions !== undefined
          ? { divisions: options.artboardDivisions }
          : {}),
      }),
    );
  }
  entries.push(...isoBoxMountEntries(specs, colors, labelFontSizePx, orientation));
  mountEntriesInPaintOrder(canvas, entries);
}

/** Iso edge between two anchors already projected from plane space. */
export function addIsoEdgeSegment(
  canvas: IsometricCanvas,
  from: { left: number; right: number },
  to: { left: number; right: number },
  colors: IsoCanvasColors,
  top = 0.05,
): void {
  const path = new IsometricPath({
    strokeColor: colors.edgeLine,
    strokeWidth: 2,
    fillColor: "transparent",
  });
  path.moveTo(from.right, from.left, top).lineTo(to.right, to.left, top);
  canvas.addChild(path);
}
