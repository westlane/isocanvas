// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

/** Node-safe artboard lattice layout (no isometric canvas dependency). */
export {
  DEFAULT_ARTBOARD_DOTS_PER_CELL,
  DEFAULT_ARTBOARD_DOT_LATTICE_PHASE,
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
  DEFAULT_ARTBOARD_USER_SIZE,
} from "./layout/artboard.js";
export * from "./layout/iso216-artboard-size.js";
export * from "./layout/lattice-plane.js";
export * from "./diagram/scene-lattice-layout.js";
export * from "./layout/diagram-node-footprint.js";
export * from "./layout/diagram-node-label-footprint.js";
export { ISO_CUBE_LABEL_FONT_SIZE_PX } from "./isometric/cube/label-text.js";
