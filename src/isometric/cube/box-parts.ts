// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import {
  type IsometricCanvas,
  IsometricGroup,
  type IsometricPath,
  IsometricRectangle,
  IsometricText,
  PlaneView,
} from "@elchininet/isometric";
import type { IsoBoxSpec, IsoFaceId, IsometricOrientation } from "../../types/diagram.js";
import type { IsoCanvasColors } from "../../types/theme.js";
import { DEFAULT_ISOMETRIC_ORIENTATION } from "../orientation.js";
import {
  ISO_CUBE_MOUNT_FACE_ORDER,
  IC_ISO_CUBE_SHELL_CLASS,
  IC_ISO_CUBE_PRESS_BOTTOM_CLASS,
  IC_ISO_CUBE_VOLUME_CLASS,
  isoCubeFaceClassName,
  isoCubeFaceRectLayoutForPlaneTopLeft,
  isoFootprintMarginBottomLayout,
  ISO_CUBE_GROUND_SHADOW_MARGIN_ISO,
} from "./cube-faces.js";
import { themedCubeFaceColors } from "./cube.js";
import {
  CANVAS_TEXT_NO_STROKE,
  displayIsoCubeTopLabelText,
  IC_ISO_CUBE_LABEL_CLASS,
  ISO_CUBE_FACE_NO_STROKE,
  isoBoxTopFaceLabelLayout,
  ISO_CANVAS_LABEL_FONT_FAMILY,
  ISO_CANVAS_LABEL_FONT_WEIGHT,
  ISO_CUBE_LABEL_FONT_SIZE_PX,
} from "./canvas-text-style.js";
import { stackFaceOpacity, stackLabelOpacity } from "./stack-opacity.js";
import type { StackLayerPresentation } from "../../types/diagram.js";
import { DIAGRAM_OBJECT_SELECTABLE_ATTR } from "../../types/diagram-interaction.js";
import { applyCategoryCubeThemeToShell } from "./category-cube-theme.js";
import { paintIsoCubeShellGeometryDataset } from "./extrusion-press.js";
import { registerIsoCubeShellLiveParts } from "./iso-cube-live-parts.js";
import { createIsoCubeBottomRimPaths } from "./bottom-rim.js";
import { createIsoCubeTopGlossTriangle } from "./top-gloss.js";

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
  parts: {
    faces: Record<IsoFaceId, IsometricRectangle>;
    topGloss: IsometricPath;
    bottomRimFront: IsometricPath;
    bottomRimSide: IsometricPath;
    label: IsometricText;
  },
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
  parts.topGloss.fillOpacity = faceOpacity;
  parts.bottomRimFront.getElement().setAttribute("opacity", String(faceOpacity));
  parts.bottomRimSide.getElement().setAttribute("opacity", String(faceOpacity));
  parts.label.getElement().setAttribute("opacity", String(labelOpacity));
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
    labelFontSizePx?: number;
  },
): void {
  const orientation = options?.orientation ?? DEFAULT_ISOMETRIC_ORIENTATION;
  const labelFontSizePx = options?.labelFontSizePx ?? ISO_CUBE_LABEL_FONT_SIZE_PX;
  const boxShell = new IsometricGroup({
    left: spec.left - stageGround.left,
    right: spec.right - stageGround.right,
    top: spec.elevation ?? 0,
  });
  const cubeShell = new IsometricGroup({
    left: 0,
    right: 0,
    top: 0,
  });
  cubeShell.getElement().classList.add(IC_ISO_CUBE_SHELL_CLASS);
  paintIsoCubeShellGeometryDataset(cubeShell.getElement(), {
    width: spec.width,
    depth: spec.depth,
    height: spec.height,
    orientation,
    labelFontSizePx,
  });
  if (spec.cubeFaceColors) {
    applyCategoryCubeThemeToShell(cubeShell.getElement(), spec.cubeFaceColors);
  }
  if (spec.planeBoxRole === "foundationSlab") {
    cubeShell.getElement().setAttribute(DIAGRAM_OBJECT_SELECTABLE_ATTR, "false");
  }
  const { faces, topGloss, bottomRimFront, bottomRimSide, label } = createLocalIsoBoxParts(
    spec,
    colors,
    orientation,
    labelFontSizePx,
  );
  registerIsoCubeShellLiveParts(cubeShell.getElement(), {
    faces,
    topGloss,
    label,
    width: spec.width,
    depth: spec.depth,
    height: spec.height,
    orientation,
    labelFontSizePx,
    labelText: spec.label,
    omitLabel: Boolean(spec.omitCubeLabel),
  });
  const fills = faceFillsForBox(spec, colors);
  if (options?.stackLayer) {
    applyStackLayerPresentation({ faces, topGloss, bottomRimFront, bottomRimSide, label }, options.stackLayer);
    paintStackLayerDataset(boxShell.getElement(), options.stackLayer);
  }
  const volumeGroup = new IsometricGroup({ left: 0, right: 0, top: 0 });
  volumeGroup.getElement().classList.add(IC_ISO_CUBE_VOLUME_CLASS);
  for (const id of ISO_CUBE_MOUNT_FACE_ORDER) {
    if (options?.omitBottomFace && id === "bottom") {
      const { width: w, depth: d, height: h } = spec;
      const footprintLayout = isoFootprintMarginBottomLayout(
        w,
        d,
        h,
        orientation,
        ISO_CUBE_GROUND_SHADOW_MARGIN_ISO,
      );
      const pressBottom = faceRect("bottom", fills.bottom, footprintLayout);
      pressBottom.getElement().classList.add(IC_ISO_CUBE_PRESS_BOTTOM_CLASS);
      if (options.stackLayer) {
        pressBottom.fillOpacity = stackFaceOpacity(options.stackLayer);
      }
      cubeShell.addChild(pressBottom);
      continue;
    }
    volumeGroup.addChild(faces[id]);
    if (id === "top") {
      volumeGroup.addChild(topGloss);
    }
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
  if (spec.planeBoxRole === "foundationSlab") {
    nodeEl.setAttribute(DIAGRAM_OBJECT_SELECTABLE_ATTR, "false");
  }
  if (options?.stackLayer) {
    paintStackLayerDataset(nodeEl, options.stackLayer);
  }
  if (!spec.omitCubeLabel && spec.label.trim()) {
    node.addChild(label);
  }
  volumeGroup.addChild(node);
  volumeGroup.addChild(bottomRimFront);
  volumeGroup.addChild(bottomRimSide);
  cubeShell.addChild(volumeGroup);
  boxShell.addChild(cubeShell);
  shell.addChild(boxShell);
}

function createIsoBoxLabel(
  spec: Pick<IsoBoxSpec, "label" | "width" | "depth" | "height">,
  colors: IsoCanvasColors,
  orientation: IsometricOrientation,
  labelFontSizePx: number,
): IsometricText {
  const { width: w, depth: d, height: h } = spec;
  const layout = isoBoxTopFaceLabelLayout(w, d, h, orientation);
  return new IsometricText({
    planeView: PlaneView.TOP,
    text: displayIsoCubeTopLabelText({
      label: spec.label,
      widthIso: w,
      depthIso: d,
      fontSizePx: labelFontSizePx,
      orientation,
    }),
    left: layout.left,
    right: layout.right,
    top: layout.top,
    fontSize: labelFontSizePx,
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

function faceFillsForBox(
  spec: Pick<IsoBoxSpec, "monoFaceFill" | "cubeFaceColors">,
  colors: IsoCanvasColors,
): Record<IsoFaceId, string> {
  const themed = themedCubeFaceColors(colors);
  if (spec.monoFaceFill) {
    const mono = spec.monoFaceFill;
    return {
      bottom: mono,
      back: mono,
      left: mono,
      side: mono,
      front: mono,
      top: mono,
    };
  }
  const custom = spec.cubeFaceColors;
  if (!custom) {
    return themed;
  }
  return {
    top: custom.top,
    front: custom.front,
    side: custom.right,
    left: custom.left,
    bottom: custom.bottom,
    back: custom.left,
  };
}

export function createLocalIsoBoxParts(
  spec: IsoBoxSpec,
  colors: IsoCanvasColors,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
  labelFontSizePx: number = ISO_CUBE_LABEL_FONT_SIZE_PX,
): {
  faces: Record<IsoFaceId, IsometricRectangle>;
  topGloss: IsometricPath;
  bottomRimFront: IsometricPath;
  bottomRimSide: IsometricPath;
  label: IsometricText;
} {
  const { width: w, depth: d, height: h } = spec;
  const fills = faceFillsForBox(spec, colors);
  const faces = {} as Record<IsoFaceId, IsometricRectangle>;

  for (const id of ISO_CUBE_MOUNT_FACE_ORDER) {
    faces[id] = faceRect(
      id,
      fills[id],
      isoCubeFaceRectLayoutForPlaneTopLeft(id, w, d, h, orientation),
    );
  }

  const topGloss = createIsoCubeTopGlossTriangle(w, d, h, orientation);
  const { front: bottomRimFront, side: bottomRimSide } = createIsoCubeBottomRimPaths(
    w,
    d,
    h,
    orientation,
  );

  const labelSize = spec.compactLabel ? labelFontSizePx * 0.72 : labelFontSizePx;
  const labelColors =
    spec.cubeFaceColors?.labelFill !== undefined
      ? { ...colors, isoLabelFill: spec.cubeFaceColors.labelFill }
      : colors;
  return {
    faces,
    topGloss,
    bottomRimFront,
    bottomRimSide,
    label: createIsoBoxLabel(spec, labelColors, orientation, labelSize),
  };
}

export function mountAnchoredFace(
  canvas: IsometricCanvas,
  spec: IsoBoxSpec,
  face: IsometricRectangle | IsometricPath,
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
