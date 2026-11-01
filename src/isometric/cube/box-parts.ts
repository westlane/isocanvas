// Copyright (C) 2026 West Lane - All Rights Reserved

import {
  type IsometricCanvas,
  IsometricGroup,
  IsometricRectangle,
  IsometricText,
  PlaneView,
} from "ic-canvas";
import type { IsoBoxSpec, IsoFaceId, IsometricOrientation } from "../../types/diagram.js";
import type { IsoCanvasColors } from "../../types/theme.js";
import { DEFAULT_ISOMETRIC_ORIENTATION } from "../orientation.js";
import {
  ISO_CUBE_MOUNT_FACE_ORDER,
  isoCubeFaceClassName,
  isoCubeFaceRectLayoutForPlaneTopLeft,
} from "./cube-faces.js";
import { themedCubeFaceColors } from "./cube.js";
import {
  CANVAS_TEXT_NO_STROKE,
  formatIsoCanvasLabelText,
  IC_ISO_CUBE_LABEL_CLASS,
  ISO_CUBE_FACE_NO_STROKE,
  isoBoxTopFaceLabelLayout,
  ISO_CANVAS_LABEL_FONT_FAMILY,
  ISO_CANVAS_LABEL_FONT_WEIGHT,
  ISO_CUBE_LABEL_FONT_SIZE_PX,
} from "./canvas-text-style.js";
import { stackFaceOpacity, stackLabelFontSizePx, stackLabelOpacity } from "./stack-opacity.js";
import type { StackLayerPresentation } from "../../types/diagram.js";

function faceRect(
  face: IsoFaceId,
  fill: string,
  layout: ReturnType<typeof isoCubeFaceRectLayoutForPlaneTopLeft>,
): IsometricRectangle {
  return new IsometricRectangle({
    planeView: layout.planeView,
    width: layout.width,
    height: layout.height,
    ...(layout.left !== undefined ? { left: layout.left } : {}),
    ...(layout.right !== undefined ? { right: layout.right } : {}),
    ...(layout.top !== undefined ? { top: layout.top } : {}),
    className: isoCubeFaceClassName(face),
    fillColor: fill,
    ...ISO_CUBE_FACE_NO_STROKE,
  });
}

function applyStackLayerPresentation(
  parts: { faces: Record<IsoFaceId, IsometricRectangle>; label: IsometricText },
  presentation: StackLayerPresentation,
): void {
  const faceOpacity = stackFaceOpacity(presentation);
  const labelOpacity = stackLabelOpacity(presentation);
  for (const id of ISO_CUBE_MOUNT_FACE_ORDER) {
    if (id === "bottom") {
      continue;
    }
    parts.faces[id].fillOpacity = faceOpacity;
  }
  parts.label.getElement().setAttribute("opacity", String(labelOpacity));
  parts.label.fontSize = stackLabelFontSizePx(ISO_CUBE_LABEL_FONT_SIZE_PX, presentation);
}

function paintStackLayerDataset(el: Element, presentation: StackLayerPresentation): void {
  el.setAttribute("data-stack-rank", String(presentation.rank));
  el.setAttribute("data-stack-size", String(presentation.size));
}

export function mountIsoBoxOnStageShell(
  shell: IsometricGroup,
  spec: IsoBoxSpec,
  stageGround: { left: number; right: number },
  colors: IsoCanvasColors,
  options?: {
    omitBottomFace?: boolean;
    orientation?: IsometricOrientation;
    stackLayer?: StackLayerPresentation;
  },
): void {
  const orientation = options?.orientation ?? DEFAULT_ISOMETRIC_ORIENTATION;
  const boxShell = new IsometricGroup({
    left: spec.left - stageGround.left,
    right: spec.right - stageGround.right,
    top: spec.elevation ?? 0,
  });
  const { faces, label } = createLocalIsoBoxParts(spec, colors, orientation);
  if (options?.stackLayer) {
    applyStackLayerPresentation({ faces, label }, options.stackLayer);
    paintStackLayerDataset(boxShell.getElement(), options.stackLayer);
  }
  for (const id of ISO_CUBE_MOUNT_FACE_ORDER) {
    if (options?.omitBottomFace && id === "bottom") {
      continue;
    }
    boxShell.addChild(faces[id]);
  }
  const node = new IsometricGroup({
    id: spec.id,
    left: 0,
    right: 0,
    top: 0,
  });
  const nodeEl = node.getElement();
  nodeEl.classList.add("node");
  nodeEl.setAttribute("data-object-id", spec.id);
  if (options?.stackLayer) {
    paintStackLayerDataset(nodeEl, options.stackLayer);
  }
  node.addChild(label);
  boxShell.addChild(node);
  shell.addChild(boxShell);
}

function createIsoBoxLabel(
  spec: Pick<IsoBoxSpec, "label" | "width" | "depth" | "height">,
  colors: IsoCanvasColors,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): IsometricText {
  const { width: w, depth: d, height: h } = spec;
  const layout = isoBoxTopFaceLabelLayout(w, d, h, orientation);
  return new IsometricText({
    planeView: PlaneView.TOP,
    text: formatIsoCanvasLabelText(spec.label),
    left: layout.left,
    right: layout.right,
    top: layout.top,
    fontSize: ISO_CUBE_LABEL_FONT_SIZE_PX,
    fontFamily: ISO_CANVAS_LABEL_FONT_FAMILY,
    fontStyle: "normal",
    fontWeight: ISO_CANVAS_LABEL_FONT_WEIGHT,
    fillColor: colors.isoLabelFill,
    ...CANVAS_TEXT_NO_STROKE,
    className: IC_ISO_CUBE_LABEL_CLASS,
    origin: ["center", "center"],
    rotation: layout.rotation,
    selectable: false,
  });
}

export function createLocalIsoBoxParts(
  spec: IsoBoxSpec,
  colors: IsoCanvasColors,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
): { faces: Record<IsoFaceId, IsometricRectangle>; label: IsometricText } {
  const { width: w, depth: d, height: h } = spec;
  const fills = themedCubeFaceColors(colors);
  const faces = {} as Record<IsoFaceId, IsometricRectangle>;

  for (const id of ISO_CUBE_MOUNT_FACE_ORDER) {
    faces[id] = faceRect(
      id,
      fills[id],
      isoCubeFaceRectLayoutForPlaneTopLeft(id, w, d, h, orientation),
    );
  }

  return { faces, label: createIsoBoxLabel(spec, colors, orientation) };
}

export function mountAnchoredFace(
  canvas: IsometricCanvas,
  spec: IsoBoxSpec,
  face: IsometricRectangle,
): void {
  const shell = new IsometricGroup({
    left: spec.left,
    right: spec.right,
    top: 0,
  });
  shell.addChild(face);
  canvas.addChild(shell);
}

export function mountNodeLabel(canvas: IsometricCanvas, spec: IsoBoxSpec, label: IsometricText): void {
  const node = new IsometricGroup({
    id: spec.id,
    left: spec.left,
    right: spec.right,
    top: 0,
  });
  const nodeEl = node.getElement();
  nodeEl.classList.add("node");
  nodeEl.setAttribute("data-object-id", spec.id);
  node.addChild(label);
  canvas.addChild(node);
}
