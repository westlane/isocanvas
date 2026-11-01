// Copyright (C) 2026 West Lane - All Rights Reserved

import {
  type IsometricCanvas,
  IsometricGroup,
  IsometricPath,
  IsometricRectangle,
} from "ic-canvas";
import type { ArtboardPlaneStage } from "../../types/artboard.js";
import type { IsometricOrientation } from "../../types/diagram.js";
import {
  artboardFaceClassName,
  ARTBOARD_SLAB_HEIGHT_USER_PX,
  artboardGroundElevationIso,
  IC_ARTBOARD_GUIDE_CLASS,
  IC_ARTBOARD_OUTLINE_CLASS,
  IC_ARTBOARD_OUTLINE_LAYER_CLASS,
  IC_ARTBOARD_SUBGUIDE_CLASS,
} from "../../layout/artboard-outline.js";
import { DEFAULT_ISOMETRIC_ORIENTATION } from "../orientation.js";
import {
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
  DEFAULT_ARTBOARD_GRID_SUBDIVISIONS,
} from "../../layout/artboard.js";
import { mountIsoGroundDotGrid } from "../../grid/svg.js";
import { artboardPlaneToIsoGround, isoSizeFromDiagramUser } from "../diagram-user.js";
import { isoCubeFaceRectLayoutForPlaneTopLeft } from "../cube/cube-faces.js";
import { userPxToIsoUnits } from "../cube/cube.js";
import { isoStageGroundLayout } from "./ground-local.js";
import type { IsoGroundAnchor } from "../../types/diagram.js";

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
 * Macro splits on the iso ground face (same local axes as the stage outline), with fainter
 * sub-guides inside each cell. Sub-guides mount first so macro guides paint over them.
 */
function mountArtboardIsoGroundDivisions(
  shell: IsometricGroup,
  footprintWidthIso: number,
  footprintDepthIso: number,
  grid: { divisions: number; subdivisions: number },
  slabTop: number,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): void {
  const lines = grid.divisions * grid.subdivisions;
  const macro: number[] = [];
  for (let i = 1; i < lines; i += 1) {
    if (i % grid.subdivisions === 0) {
      macro.push(i);
    } else {
      mountIsoGroundGuidePair(
        shell,
        footprintWidthIso,
        footprintDepthIso,
        i / lines,
        IC_ARTBOARD_SUBGUIDE_CLASS,
        slabTop,
        orientation,
      );
    }
  }
  for (const i of macro) {
    mountIsoGroundGuidePair(
      shell,
      footprintWidthIso,
      footprintDepthIso,
      i / lines,
      IC_ARTBOARD_GUIDE_CLASS,
      slabTop,
      orientation,
    );
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

/** Ground outline + guides; appearance comes from the artboard theme CSS, not mount props. */
export function createArtboardStageShell(
  stage: ArtboardPlaneStage,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
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
  mountArtboardSlabFace(shell, "front", footprintWidthIso, footprintDepthIso, slabHeightIso, orientation);
  mountArtboardSlabFace(shell, "side", footprintWidthIso, footprintDepthIso, slabHeightIso, orientation);
  const ground = new IsometricRectangle({
    planeView: groundLayout.planeView,
    width: groundLayout.width,
    height: groundLayout.height,
    left: groundLayout.left,
    right: groundLayout.right,
    top: slabTop,
    className: IC_ARTBOARD_OUTLINE_CLASS,
  });
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

/** Attach the stage shell, then lay the dot grid on its ground (outline path data exists once attached). */
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
  mountIsoGroundDotGrid(outline, {
    width: stage.width,
    height: stage.height,
    divisions: stage.divisions ?? DEFAULT_ARTBOARD_GRID_DIVISIONS,
  });
}
