// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import {
  artboardDivisionPitch,
  artboardDotStep,
} from "./lattice-plane.js";
import {
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
  DEFAULT_ARTBOARD_USER_SIZE,
} from "./artboard.js";
import { ISO_DIAGRAM_PX_PER_UNIT } from "../isometric/cube/cube.js";

const DEFAULT_MACRO_PITCH = artboardDivisionPitch(
  DEFAULT_ARTBOARD_USER_SIZE,
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
);
const DEFAULT_DOT_STEP = artboardDotStep(DEFAULT_MACRO_PITCH);

/** Standard domain cube width on the default artboard dot lattice (was 5; +3 dots). */
export const DIAGRAM_NODE_FOOTPRINT_WIDTH_DOT_SPAN = 8;

/** Plane footprint width for diagram nodes and iso mounts (diagram user px). */
export const DIAGRAM_NODE_FOOTPRINT_WIDTH_PX =
  DIAGRAM_NODE_FOOTPRINT_WIDTH_DOT_SPAN * DEFAULT_DOT_STEP.xPx;

/** Plane footprint depth: was 1.25 iso; +1 iso longer along +y. */
export const DIAGRAM_NODE_FOOTPRINT_DEPTH_PX = 2.25 * ISO_DIAGRAM_PX_PER_UNIT;

/** {@link DiagramSceneNode} `w` / `h` and lattice row packing. */
export const DIAGRAM_NODE_FOOTPRINT = {
  widthPx: DIAGRAM_NODE_FOOTPRINT_WIDTH_PX,
  depthPx: DIAGRAM_NODE_FOOTPRINT_DEPTH_PX,
} as const;
