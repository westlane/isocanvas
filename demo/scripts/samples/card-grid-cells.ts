// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ArtboardLatticeDotPinOffset } from "@westlane/isocanvas";
import {
  DIAGRAM_NODE_FOOTPRINT,
  DIAGRAM_NODE_FOOTPRINT_DEPTH_PX,
  DIAGRAM_NODE_FOOTPRINT_WIDTH_DOT_SPAN,
  DIAGRAM_NODE_FOOTPRINT_WIDTH_PX,
  userPxToIsoUnits,
  type IsometricOrientation,
} from "@westlane/isocanvas";
import type { CardGridCell } from "./types.js";

/** One dot step of margin inside each macro cell when centering grid cards. */
export const DEMO_CARD_GRID_DOT_INSET = 1;

/** @deprecated Use {@link DIAGRAM_NODE_FOOTPRINT_WIDTH_DOT_SPAN} */
export const DEMO_CARD_FOOTPRINT_WIDTH_DOT_SPAN = DIAGRAM_NODE_FOOTPRINT_WIDTH_DOT_SPAN;

/** @deprecated Use {@link DIAGRAM_NODE_FOOTPRINT_WIDTH_PX} */
export const DEMO_CARD_USER_WIDTH_PX = DIAGRAM_NODE_FOOTPRINT_WIDTH_PX;

/** @deprecated Use {@link DIAGRAM_NODE_FOOTPRINT_DEPTH_PX} */
export const DEMO_CARD_USER_DEPTH_PX = DIAGRAM_NODE_FOOTPRINT_DEPTH_PX;

/** Default extrusion for grid cards without an explicit height (diagram user px). */
export const DEMO_CARD_DEFAULT_HEIGHT_USER_PX = 72;

export const DEMO_CARD_GRID: readonly CardGridCell[] = [
  { id: "card-1", label: "Card 1", col: 0, row: 0, heightUserPx: 28 },
  { id: "card-2", label: "Card 2", col: 1, row: 0, heightUserPx: 56 },
  { id: "card-3", label: "Card 3", col: 2, row: 0, heightUserPx: 112 },
  { id: "card-4", label: "Card 4", col: 0, row: 1, heightUserPx: 40 },
  { id: "card-5", label: "Card 5", col: 1, row: 1, heightUserPx: 72 },
  { id: "card-6", label: "Card 6", col: 2, row: 1, heightUserPx: 128 },
  { id: "card-7", label: "Card 7", col: 0, row: 2, heightUserPx: 96 },
  { id: "card-8", label: "Card 8", col: 1, row: 2, heightUserPx: 36 },
  { id: "card-9", label: "Card 9", col: 2, row: 2, heightUserPx: 144 },
];

/** Default iso: nudge south on the dot lattice (both orientations share plane pin). */
export const DEMO_CARD_DOT_OFFSET_BY_ORIENTATION: Record<
  IsometricOrientation,
  ArtboardLatticeDotPinOffset
> = {
  default: { leftDots: 0, downDots: 0 },
  rotated: { leftDots: 0, downDots: 0 },
};

/** @deprecated Use {@link demoCardPlaneDotOffset} */
export const DEMO_CARD_BACK_LEFT_DOT_OFFSET = DEMO_CARD_DOT_OFFSET_BY_ORIENTATION.default;

export function demoCardPlaneDotOffset(
  orientation: IsometricOrientation = "default",
): ArtboardLatticeDotPinOffset {
  return DEMO_CARD_DOT_OFFSET_BY_ORIENTATION[orientation];
}

export function demoCardFootprintIso(): { width: number; depth: number } {
  return {
    width: userPxToIsoUnits(DIAGRAM_NODE_FOOTPRINT.widthPx),
    depth: userPxToIsoUnits(DIAGRAM_NODE_FOOTPRINT.depthPx),
  };
}
