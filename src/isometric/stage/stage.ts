// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricCanvas } from "@elchininet/isometric";
import {
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
  DEFAULT_ARTBOARD_USER_SIZE,
} from "../../layout/artboard.js";
import { DEFAULT_CUBE_CANVAS_SCALE } from "../cube/cube.js";
import type { ArtboardPlaneStage } from "../../types/artboard.js";

/** Default full-bleed artboard plane for iso shape mounts. */
export function defaultIsoArtboardStage(): ArtboardPlaneStage {
  const { width, height } = DEFAULT_ARTBOARD_USER_SIZE;
  return {
    x: 0,
    y: 0,
    width,
    height,
    divisions: DEFAULT_ARTBOARD_GRID_DIVISIONS,
  };
}

/** Clear host and attach a scaled isometric canvas sized to `stage` or the default artboard. */
export function mountIsometricCanvasOnHost(
  host: HTMLElement,
  stage: ArtboardPlaneStage = defaultIsoArtboardStage(),
): IsometricCanvas {
  host.replaceChildren();
  return new IsometricCanvas({
    container: host,
    backgroundColor: "transparent",
    scale: DEFAULT_CUBE_CANVAS_SCALE,
    width: stage.width,
    height: stage.height,
  });
}
