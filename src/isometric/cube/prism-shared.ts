// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricText, PlaneView } from "@elchininet/isometric";
import type { IsoBoxSpec, IsoFaceId, IsometricOrientation } from "../../types/diagram.js";
import type { IsoCanvasColors } from "../../types/theme.js";
import {
  CANVAS_TEXT_NO_STROKE,
  displayIsoCubeTopLabelText,
  IC_ISO_CUBE_LABEL_CLASS,
  isoBoxTopFaceLabelLayout,
  ISO_CANVAS_LABEL_FONT_FAMILY,
  ISO_CANVAS_LABEL_FONT_WEIGHT,
  preserveSvgTextWhitespace,
} from "./canvas-text-style.js";
import { themedCubeFaceColors } from "./cube.js";

export function faceFillsForBox(
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

export function createIsoBoxLabel(
  spec: Pick<IsoBoxSpec, "label" | "width" | "depth" | "height">,
  colors: IsoCanvasColors,
  orientation: IsometricOrientation,
  labelFontSizePx: number,
): IsometricText {
  const { width: w, depth: d, height: h } = spec;
  const layout = isoBoxTopFaceLabelLayout(w, d, h, orientation);
  const label = new IsometricText({
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
  preserveSvgTextWhitespace(label);
  return label;
}
