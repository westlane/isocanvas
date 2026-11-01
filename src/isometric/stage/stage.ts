// Copyright (C) 2026 West Lane - All Rights Reserved

import { IsometricCanvas } from "ic-canvas";
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

/** Clear host and attach a scaled isometric canvas at the default artboard size. */
export function mountIsometricCanvasOnHost(host: HTMLElement): IsometricCanvas {
  host.replaceChildren();
  const { width, height } = DEFAULT_ARTBOARD_USER_SIZE;
  return new IsometricCanvas({
    container: host,
    backgroundColor: "transparent",
    scale: DEFAULT_CUBE_CANVAS_SCALE,
    width,
    height,
  });
}
