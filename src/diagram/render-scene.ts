// Copyright (C) 2026 West Lane - All Rights Reserved

import { IsometricText, PlaneView } from "ic-canvas";
import type { DiagramScene, DiagramSceneNode } from "../types/diagram.js";
import {
  CANVAS_TEXT_NO_STROKE,
  formatIsoCanvasLabelText,
  IC_ISO_CUBE_LABEL_CLASS,
  ISO_CANVAS_LABEL_FONT_FAMILY,
  ISO_CANVAS_LABEL_FONT_WEIGHT,
  ISO_EDGE_LABEL_FONT_SIZE_PX,
} from "../isometric/cube/canvas-text-style.js";
import { artboardPlaneToIsoGround, isoSizeFromDiagramUser } from "../isometric/diagram-user.js";
import { extrusionHeightForFootprint } from "../isometric/cube/cube.js";
import {
  addIsoEdgeSegment,
  decorateCubeCanvas,
  mountPlaneBoxesOnCanvas,
} from "../isometric/mount.js";
import type { IsoCanvasColors } from "../types/theme.js";
import type { PlaneBoxSpec } from "../types/artboard.js";
import { defaultIsoArtboardStage, mountIsometricCanvasOnHost } from "../isometric/stage/stage.js";

const MIN_EXTRUSION = 0.35;
const MAX_EXTRUSION = 1.1;

function nodeCenter(node: DiagramSceneNode): { x: number; y: number } {
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 };
}

function planeBoxFromNode(node: DiagramSceneNode): PlaneBoxSpec {
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
  };
}

/** Mount a portable {@link DiagramScene} on the default iso artboard stage. */
export function renderDiagramScene(
  host: HTMLElement,
  scene: DiagramScene,
  colors: IsoCanvasColors,
): SVGSVGElement {
  const canvas = mountIsometricCanvasOnHost(host);
  const stage = defaultIsoArtboardStage();
  const { width: artboardW, height: artboardH } = stage;

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

  mountPlaneBoxesOnCanvas(canvas, scene.nodes.map(planeBoxFromNode), colors, { stage });

  const svg = decorateCubeCanvas(canvas);
  svg.dataset.debugBaseW = String(artboardW);
  svg.dataset.debugBaseH = String(artboardH);
  return svg;
}
