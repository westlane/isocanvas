// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { DiagramCubeFaceColors } from "../../types/diagram.js";
import {
  darkerSurfaceBorderStroke,
  isoSolidFaceStrokeCssFromFill,
  isLightHex,
} from "../../theme/color-math.js";
import { IC_THEME_CSS_VARS } from "../../theme/css-vars.js";

/** Shell carries category face tokens; pressed/hover CSS reads these instead of scheme defaults. */
export const IC_CUBE_CATEGORY_THEME_ATTR = "data-ic-cube-category-theme";

type CategoryThemeShell = {
  setAttribute(name: string, value: string): void;
  style: { setProperty(name: string, value: string): void };
};

const IC_FACE_VARS: readonly Exclude<keyof DiagramCubeFaceColors, "edgeStroke">[] = [
  "top",
  "front",
  "right",
  "left",
  "bottom",
  "labelFill",
];

const IC_VAR_BY_KEY: Record<
  Exclude<keyof DiagramCubeFaceColors, "edgeStroke">,
  `--ic-iso-${string}`
> = {
  top: "--ic-iso-top-fill",
  front: "--ic-iso-front-fill",
  right: "--ic-iso-right-fill",
  left: "--ic-iso-left-fill",
  bottom: "--ic-iso-bottom-fill",
  labelFill: "--ic-iso-label-fill",
};

const FACE_STROKE_VAR_BY_FILL: Readonly<
  Record<
    "top" | "front" | "right" | "left" | "bottom",
    (typeof IC_THEME_CSS_VARS)[
      | "isoFaceStrokeTop"
      | "isoFaceStrokeFront"
      | "isoFaceStrokeSide"
      | "isoFaceStrokeRecess"
      | "isoFaceStrokeBottom"]
  >
> = {
  top: IC_THEME_CSS_VARS.isoFaceStrokeTop,
  front: IC_THEME_CSS_VARS.isoFaceStrokeFront,
  right: IC_THEME_CSS_VARS.isoFaceStrokeSide,
  left: IC_THEME_CSS_VARS.isoFaceStrokeRecess,
  bottom: IC_THEME_CSS_VARS.isoFaceStrokeBottom,
};

function applyCategoryFaceStrokesFromFills(
  shell: CategoryThemeShell,
  colors: DiagramCubeFaceColors,
): void {
  for (const key of Object.keys(FACE_STROKE_VAR_BY_FILL) as (keyof typeof FACE_STROKE_VAR_BY_FILL)[]) {
    const fill = colors[key];
    if (fill === undefined) {
      continue;
    }
    shell.style.setProperty(
      FACE_STROKE_VAR_BY_FILL[key],
      isoSolidFaceStrokeCssFromFill(fill),
    );
  }
  const front = colors.front;
  if (front !== undefined) {
    const appearance = isLightHex(front) ? "light" : "dark";
    shell.style.setProperty(
      IC_THEME_CSS_VARS.isoEdgeStroke,
      darkerSurfaceBorderStroke(front, appearance),
    );
  }
}

/** Paint pressed/selected/hover from {@link DiagramCubeFaceColors} (continuous-row category columns). */
export function applyCategoryCubeThemeToShell(
  shell: CategoryThemeShell,
  colors: DiagramCubeFaceColors,
): void {
  shell.setAttribute(IC_CUBE_CATEGORY_THEME_ATTR, "true");
  for (const key of IC_FACE_VARS) {
    const value = colors[key];
    if (value === undefined) {
      continue;
    }
    shell.style.setProperty(IC_VAR_BY_KEY[key], value);
  }
  applyCategoryFaceStrokesFromFills(shell, colors);
  shell.style.setProperty("--ic-iso-selected-top-fill", colors.top);
  shell.style.setProperty("--ic-iso-selected-front-fill", colors.front);
}
