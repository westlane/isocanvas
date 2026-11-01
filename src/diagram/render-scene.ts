// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricText, PlaneView, type IsometricCanvas } from "@elchininet/isometric";
import type { DiagramScene, DiagramSceneNode } from "../types/diagram.js";
import {
  CANVAS_TEXT_NO_STROKE,
  formatIsoCanvasLabelText,
  IC_ISO_CUBE_LABEL_CLASS,
  ISO_CANVAS_LABEL_FONT_FAMILY,
  ISO_CANVAS_LABEL_FONT_WEIGHT,
  ISO_EDGE_LABEL_FONT_SIZE_PX,
  IC_FOUNDATION_SLAB_CAPTION_CLASS,
  FOUNDATION_SLAB_CAPTION_FONT_SIZE_PX,
} from "../isometric/cube/canvas-text-style.js";
import { artboardPlaneToIsoGround, isoSizeFromDiagramUser } from "../isometric/diagram-user.js";
import { extrusionHeightForFootprint, userPxToIsoUnits } from "../isometric/cube/cube.js";
import { ISO_STACK_ARTBOARD_CLEARANCE_ISO } from "../isometric/cube/stack-opacity.js";
import {
  addIsoEdgeSegment,
  decorateCubeCanvas,
  mountPlaneBoxesOnCanvas,
} from "../isometric/mount.js";
import {
  DEFAULT_DIAGRAM_ARTBOARD_SHELL_CHROME,
  type ArtboardStageShellChrome,
} from "../isometric/stage/stage-shell.js";
import type { IsoCanvasColors } from "../types/theme.js";
import { DEFAULT_ISO_CANVAS_COLORS } from "../theme/defaults.js";
import type { PlaneBoxSpec } from "../types/artboard.js";
import type { ArtboardPlaneStage } from "../types/artboard.js";
import { DEFAULT_ARTBOARD_GRID_DIVISIONS } from "../layout/artboard.js";
import { enforcePlaneBoxOnArtboardLattice } from "../layout/lattice.js";
import { defaultIsoArtboardStage, mountIsometricCanvasOnHost } from "../isometric/stage/stage.js";
import { frameDiagramSceneCamera } from "./diagram-document.js";

const MIN_EXTRUSION = 0.35;
const MAX_EXTRUSION = 1.1;
/** Pedestal extrusion under the domain cube (iso units). */
const FOUNDATION_SLAB_HEIGHT_ISO = userPxToIsoUnits(20);
/** Extra footprint depth (+y on artboard) so tier color reads below the cube. */
const FOUNDATION_SLAB_DEPTH_EXTENSION_PX = 40;
const FOUNDATION_SLAB_VIEWBOX_PAD_PX = FOUNDATION_SLAB_DEPTH_EXTENSION_PX + 8;

function nodeCenter(node: DiagramSceneNode): { x: number; y: number } {
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 };
}

function planeBoxFromNode(node: DiagramSceneNode, overrides?: Partial<PlaneBoxSpec>): PlaneBoxSpec {
  const { width, depth } = isoSizeFromDiagramUser(node.w, node.h);
  const height = Math.min(
    MAX_EXTRUSION,
    Math.max(MIN_EXTRUSION, extrusionHeightForFootprint(width, depth, 0.65)),
  );
  return {
    id: node.id,
    label: node.label,
    x: node.x,
    y: node.y,
    width: node.w,
    depth: node.h,
    height,
    planeBoxRole: "domain",
    ...overrides,
  };
}

function planeBoxesForSceneNode(node: DiagramSceneNode): PlaneBoxSpec[] {
  const slab = node.foundationSlab;
  if (!slab) {
    return [planeBoxFromNode(node)];
  }
  const slabHeight = FOUNDATION_SLAB_HEIGHT_ISO;
  const slabElevation = ISO_STACK_ARTBOARD_CLEARANCE_ISO;
  const domainElevation = slabElevation + slabHeight;
  return [
    planeBoxFromNode(node, {
      id: `${node.id}__foundationSlab`,
      label: "",
      depth: node.h + FOUNDATION_SLAB_DEPTH_EXTENSION_PX,
      height: slabHeight,
      elevation: slabElevation,
      planeBoxRole: "foundationSlab",
      monoFaceFill: slab.fill,
      omitCubeLabel: true,
    }),
    planeBoxFromNode(node, {
      elevation: domainElevation,
    }),
  ];
}

function mountFoundationSlabCaptions(
  canvas: IsometricCanvas,
  scene: DiagramScene,
  stage: ArtboardPlaneStage,
): void {
  for (const node of scene.nodes) {
    const slab = node.foundationSlab;
    if (!slab?.label.trim()) {
      continue;
    }
    const captionPlaneY =
      node.y + node.h + FOUNDATION_SLAB_DEPTH_EXTENSION_PX / 2;
    const captionPlaneX = node.x + node.w / 2;
    const ground = artboardPlaneToIsoGround(captionPlaneX, captionPlaneY, undefined, stage);
    canvas.addChild(
      new IsometricText({
        planeView: PlaneView.TOP,
        text: formatIsoCanvasLabelText(slab.label),
        left: ground.left,
        right: ground.right,
        top: 0.06,
        fontSize: FOUNDATION_SLAB_CAPTION_FONT_SIZE_PX,
        fontFamily: ISO_CANVAS_LABEL_FONT_FAMILY,
        fontWeight: ISO_CANVAS_LABEL_FONT_WEIGHT,
        fontStyle: "normal",
        fillColor: slab.stroke,
        ...CANVAS_TEXT_NO_STROKE,
        className: `${IC_FOUNDATION_SLAB_CAPTION_CLASS} ${IC_ISO_CUBE_LABEL_CLASS}`,
        origin: ["center", "center"],
        selectable: false,
      }),
    );
  }
}

function artboardStageWithFoundationSlabPad(scene: DiagramScene, stage: ArtboardPlaneStage): ArtboardPlaneStage {
  const needsPad = scene.nodes.some((node) => node.foundationSlab);
  if (!needsPad) {
    return stage;
  }
  return {
    ...stage,
    height: stage.height + FOUNDATION_SLAB_VIEWBOX_PAD_PX,
  };
}

export type RenderDiagramSceneOptions = {
  /** Skip artboard shell entirely; mount cubes only. */
  omitArtboardShell?: boolean;
  /** Override default {@link DEFAULT_DIAGRAM_ARTBOARD_SHELL_CHROME} (use `"full"` for demo-style guides). */
  artboardShellChrome?: ArtboardStageShellChrome;
};

function artboardStageFromScene(scene: DiagramScene): ArtboardPlaneStage {
  const viewBox = scene.viewBox;
  let stage: ArtboardPlaneStage;
  if (viewBox && viewBox.w > 0 && viewBox.h > 0) {
    stage = {
      x: viewBox.x,
      y: viewBox.y,
      width: viewBox.w,
      height: viewBox.h,
      divisions: scene.divisions ?? DEFAULT_ARTBOARD_GRID_DIVISIONS,
    };
  } else {
    stage = defaultIsoArtboardStage();
  }
  return artboardStageWithFoundationSlabPad(scene, stage);
}

/** Mount a portable {@link DiagramScene} on an iso artboard stage (scene viewBox when present). */
export function renderDiagramScene(
  host: HTMLElement,
  scene: DiagramScene,
  colors: IsoCanvasColors = DEFAULT_ISO_CANVAS_COLORS,
  options: RenderDiagramSceneOptions = {},
): SVGSVGElement {
  const stage = artboardStageFromScene(scene);
  const canvas = mountIsometricCanvasOnHost(host, stage);

  for (const edge of scene.edges ?? []) {
    const fromNode = scene.nodes.find((node) => node.id === edge.from);
    const toNode = scene.nodes.find((node) => node.id === edge.to);
    if (!fromNode || !toNode) {
      continue;
    }
    const fromCenter = nodeCenter(fromNode);
    const toCenter = nodeCenter(toNode);
    const from = artboardPlaneToIsoGround(fromCenter.x, fromCenter.y);
    const to = artboardPlaneToIsoGround(toCenter.x, toCenter.y);
    addIsoEdgeSegment(canvas, from, to, colors);
    if (edge.label) {
      const midPlane = {
        x: (fromCenter.x + toCenter.x) / 2,
        y: (fromCenter.y + toCenter.y) / 2,
      };
      const mid = artboardPlaneToIsoGround(midPlane.x, midPlane.y);
      canvas.addChild(
        new IsometricText({
          planeView: PlaneView.TOP,
          text: formatIsoCanvasLabelText(edge.label),
          left: mid.left,
          right: mid.right,
          top: 0.12,
          fontSize: ISO_EDGE_LABEL_FONT_SIZE_PX,
          fontFamily: ISO_CANVAS_LABEL_FONT_FAMILY,
          fontWeight: ISO_CANVAS_LABEL_FONT_WEIGHT,
          fontStyle: "normal",
          fillColor: colors.edgeLabel,
          ...CANVAS_TEXT_NO_STROKE,
          className: IC_ISO_CUBE_LABEL_CLASS,
          origin: ["center", "center"],
          selectable: false,
        }),
      );
    }
  }

  mountPlaneBoxesOnCanvas(
    canvas,
    scene.nodes.flatMap((node) =>
      planeBoxesForSceneNode(node).map((box) =>
        enforcePlaneBoxOnArtboardLattice(box, stage),
      ),
    ),
    colors,
    {
    stage,
    ...(options.omitArtboardShell
      ? { omitArtboardShell: true }
      : {
          artboardShellChrome:
            options.artboardShellChrome ?? DEFAULT_DIAGRAM_ARTBOARD_SHELL_CHROME,
        }),
  });

  mountFoundationSlabCaptions(canvas, scene, stage);

  const svg = decorateCubeCanvas(canvas);
  frameDiagramSceneCamera(host);
  return svg;
}
