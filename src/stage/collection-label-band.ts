// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

/** Keep in sync with collection badge layout in `isometric/stage/stage-shell.ts`. */
const COLLECTION_LABEL_FLOAT_OFF_PX = 40;
const COLLECTION_LABEL_NUDGE_PLANE_Y_PX = 10;
const COLLECTION_BADGE_PAD_Y_PX = 22;
const COLLECTION_LABEL_FONT_SIZE_PX = 72;

/** Reserve +y plane space below each artboard row so collection badges clear the next row. */
export function artboardCollectionLabelBandPx(): number {
  return (
    COLLECTION_LABEL_FLOAT_OFF_PX +
    COLLECTION_LABEL_NUDGE_PLANE_Y_PX +
    COLLECTION_LABEL_FONT_SIZE_PX +
    COLLECTION_BADGE_PAD_Y_PX * 2 +
    20
  );
}
