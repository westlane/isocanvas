// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import {
  type IsometricCanvas,
  IsometricGroup,
  type IsometricPath,
  IsometricRectangle,
  IsometricText,
} from "@elchininet/isometric";
import type { IsoBoxSpec, IsoFaceId, IsometricOrientation, IsoPrismKind } from "../../types/diagram.js";
import { ISO_PRISM_CUBE } from "../../types/diagram.js";
import type { IsoCanvasColors } from "../../types/theme.js";
import { DEFAULT_ISOMETRIC_ORIENTATION } from "../orientation.js";
import {
  ISO_CUBE_MOUNT_FACE_ORDER,
  IC_ISO_CUBE_SHELL_CLASS,
  IC_ISO_CUBE_PRESS_BOTTOM_CLASS,
  IC_ISO_CUBE_FOOTPRINT_OCCLUDER_CLASS,
  IC_ISO_CUBE_VOLUME_CLASS,
  isoCubeFaceClassName,
  isoCubeFaceRectLayoutForPlaneTopLeft,
  isoFootprintMarginBottomLayout,
  ISO_CUBE_GROUND_SHADOW_MARGIN_ISO,
} from "./cube-faces.js";
import { faceFillsForBox, createIsoBoxLabel } from "./prism-shared.js";
import { ISO_CUBE_LABEL_FONT_SIZE_PX } from "./canvas-text-style.js";
import { stackFaceOpacity, stackLabelOpacity } from "./stack-opacity.js";
import type { StackLayerPresentation } from "../../types/diagram.js";
import { DIAGRAM_OBJECT_SELECTABLE_ATTR } from "../../types/diagram-interaction.js";
import { applyCategoryCubeThemeToShell } from "./category-cube-theme.js";
import { paintIsoCubeShellGeometryDataset } from "./extrusion-press.js";
import { registerIsoCubeShellLiveParts } from "./iso-cube-live-parts.js";
import { createIsoCubeTopGlossTriangle } from "./top-gloss.js";
import { createIsoCubeBottomRimPaths, isoCubeBottomRimPathList, type IsoCubeBottomRimPaths } from "./bottom-rim.js";
import { createIsoCubeCurvedTopFace, createIsoCubeCurvedBottomFace, createIsoCubeCurvedFootprintFromLayout } from "./top-face-curve.js";
import { createIsoCubeCurvedVerticalFace, createIsoCubeFrontLightOverlay, isIsoCurvedVerticalFace } from "./vertical-face-curve.js";
import { isIsoHexagonPrism, IC_ISO_PRISM_ATTR } from "../hexagon/hex.js";
import { createLocalIsoHexBoxParts } from "../hexagon/hex-box-parts.js";
import { createIsoHexCurvedFootprintFromLayout } from "../hexagon/hex-footprint-curve.js";
import { isoHexBottomRimPathList, type IsoHexBottomRimPaths } from "../hexagon/hex-bottom-rim.js";

function prismBottomRimPathList(
  prism: IsoPrismKind,
  paths: IsoCubeBottomRimPaths | IsoHexBottomRimPaths,
): IsometricPath[] {
  if (prism === "hexagon") {
    return isoHexBottomRimPathList(paths as IsoHexBottomRimPaths);
  }
  return isoCubeBottomRimPathList(paths as IsoCubeBottomRimPaths);
}

function applyStackLayerPresentation(
  parts: {
    faces: Record<IsoFaceId, IsometricRectangle | IsometricPath>;
    recessWalls?: IsometricPath[];
    recessOccluder?: IsometricPath;
    verticalShellOccluder?: IsometricPath | undefined;
    interiorCap?: IsometricPath;
    frontLight: IsometricPath;
    topGloss: IsometricPath;
    bottomRims: IsoCubeBottomRimPaths | IsoHexBottomRimPaths;
    label: IsometricText;
  },
  presentation: StackLayerPresentation,
  prism: IsoPrismKind,
): void {
  const faceOpacity = stackFaceOpacity(presentation);
  const labelOpacity = stackLabelOpacity(presentation);
  for (const id of ISO_CUBE_MOUNT_FACE_ORDER) {
    if (id === "bottom") {
      continue;
    }
    parts.faces[id].fillOpacity = faceOpacity;
  }
  for (const wall of parts.recessWalls ?? []) {
    wall.fillOpacity = faceOpacity;
  }
  if (parts.verticalShellOccluder) {
    parts.verticalShellOccluder.fillOpacity = faceOpacity;
  }
  if (parts.recessOccluder) {
    parts.recessOccluder.fillOpacity = faceOpacity;
  }
  if (parts.interiorCap) {
    parts.interiorCap.fillOpacity = faceOpacity;
  }
  parts.frontLight.fillOpacity = faceOpacity;
  parts.topGloss.fillOpacity = faceOpacity;
  for (const rim of prismBottomRimPathList(prism, parts.bottomRims)) {
    rim.getElement().setAttribute("opacity", String(faceOpacity));
  }
  parts.label.getElement().setAttribute("opacity", String(labelOpacity));
}

function paintStackLayerDataset(el: Element, presentation: StackLayerPresentation): void {
  el.setAttribute("data-stack-rank", String(presentation.rank));
  el.setAttribute("data-stack-size", String(presentation.size));
}

function isoPrismKindForSpec(spec: Pick<IsoBoxSpec, "isoPrism">): IsoPrismKind {
  return spec.isoPrism ?? ISO_PRISM_CUBE;
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
  const prismKind = isoPrismKindForSpec(spec);
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
  cubeShell.getElement().setAttribute(IC_ISO_PRISM_ATTR, prismKind);
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
  const hexParts = isIsoHexagonPrism(prismKind)
    ? createLocalIsoHexBoxParts(spec, colors, orientation, labelFontSizePx)
    : undefined;
  const cubeParts = hexParts ?? createLocalIsoBoxParts(spec, colors, orientation, labelFontSizePx);
  const { faces, frontLight, topGloss, bottomRims, label } = hexParts ?? cubeParts;
  const recessWalls = hexParts?.recessWalls ?? [];
  const verticalShellOccluder = hexParts?.verticalShellOccluder;
  registerIsoCubeShellLiveParts(cubeShell.getElement(), {
    faces,
    recessWalls,
    verticalShellOccluder,
    frontLight,
    topGloss,
    bottomRims,
    label,
    width: spec.width,
    depth: spec.depth,
    height: spec.height,
    extrusionHeight: spec.height,
    orientation,
    labelFontSizePx,
    labelText: spec.label,
    omitLabel: Boolean(spec.omitCubeLabel),
    isoPrism: prismKind,
  });
  const fills = faceFillsForBox(spec, colors);
  if (options?.stackLayer) {
    applyStackLayerPresentation(
      { faces, recessWalls, verticalShellOccluder, frontLight, topGloss, bottomRims, label },
      options.stackLayer,
      prismKind,
    );
    paintStackLayerDataset(boxShell.getElement(), options.stackLayer);
  }
  const volumeGroup = new IsometricGroup({ left: 0, right: 0, top: 0 });
  volumeGroup.getElement().classList.add(IC_ISO_CUBE_VOLUME_CLASS);
  if (hexParts && verticalShellOccluder) {
    volumeGroup.addChild(verticalShellOccluder);
  }
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
      const bottomLayout = isoCubeFaceRectLayoutForPlaneTopLeft(
        "bottom",
        w,
        d,
        h,
        orientation,
      );
      const createFootprint = prismKind === "hexagon" ? createIsoHexCurvedFootprintFromLayout : createIsoCubeCurvedFootprintFromLayout;
      const footprintOccluder = createFootprint(
        IC_ISO_CUBE_FOOTPRINT_OCCLUDER_CLASS,
        fills.bottom,
        bottomLayout,
        w,
        d,
      );
      if (options.stackLayer) {
        footprintOccluder.fillOpacity = stackFaceOpacity(options.stackLayer);
      }
      cubeShell.addChild(footprintOccluder);
      if (prismKind !== "hexagon") {
        const pressBottom = createFootprint(
          `${isoCubeFaceClassName("bottom")} ${IC_ISO_CUBE_PRESS_BOTTOM_CLASS}`,
          fills.bottom,
          footprintLayout,
          w,
          d,
        );
        if (options.stackLayer) {
          pressBottom.fillOpacity = stackFaceOpacity(options.stackLayer);
        }
        cubeShell.addChild(pressBottom);
      }
      continue;
    }
    if (hexParts && (id === "back" || id === "left")) {
      if (id === "back") {
        for (const wall of recessWalls) {
          volumeGroup.addChild(wall);
        }
      }
      continue;
    }
    volumeGroup.addChild(faces[id]);
    if (id === "front") {
      volumeGroup.addChild(frontLight);
    }
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
  for (const rim of prismBottomRimPathList(prismKind, bottomRims)) {
    volumeGroup.addChild(rim);
  }
  cubeShell.addChild(volumeGroup);
  boxShell.addChild(cubeShell);
  shell.addChild(boxShell);
}

export { faceFillsForBox, createIsoBoxLabel } from "./prism-shared.js";

export function createLocalIsoBoxParts(
  spec: IsoBoxSpec,
  colors: IsoCanvasColors,
  orientation: IsometricOrientation = DEFAULT_ISOMETRIC_ORIENTATION,
  labelFontSizePx: number = ISO_CUBE_LABEL_FONT_SIZE_PX,
): {
  faces: Record<IsoFaceId, IsometricRectangle | IsometricPath>;
  frontLight: IsometricPath;
  topGloss: IsometricPath;
  bottomRims: IsoCubeBottomRimPaths;
  label: IsometricText;
} {
  const { width: w, depth: d, height: h } = spec;
  const fills = faceFillsForBox(spec, colors);
  const faces = {} as Record<IsoFaceId, IsometricRectangle | IsometricPath>;

  for (const id of ISO_CUBE_MOUNT_FACE_ORDER) {
    if (id === "top") {
      faces.top = createIsoCubeCurvedTopFace(fills.top, w, d, h, orientation);
      continue;
    }
    if (id === "bottom") {
      faces.bottom = createIsoCubeCurvedBottomFace(fills.bottom, w, d, h, orientation);
      continue;
    }
    if (isIsoCurvedVerticalFace(id)) {
      faces[id] = createIsoCubeCurvedVerticalFace(id, fills[id], w, d, h, orientation);
      continue;
    }
    const _exhaustive: never = id;
    return _exhaustive;
  }

  const topGloss = createIsoCubeTopGlossTriangle(w, d, h, orientation);
  const frontLight = createIsoCubeFrontLightOverlay(w, d, h, orientation);

  const bottomRims = createIsoCubeBottomRimPaths(w, d, h, orientation);

  const labelSize = spec.compactLabel ? labelFontSizePx * 0.72 : labelFontSizePx;
  const labelColors =
    spec.cubeFaceColors?.labelFill !== undefined
      ? { ...colors, isoLabelFill: spec.cubeFaceColors.labelFill }
      : colors;
  return {
    faces,
    frontLight,
    topGloss,
    bottomRims,
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
