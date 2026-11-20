// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

export * from "./lattice-plane.js";

import { artboardPlaneToIsoGround } from "../isometric/diagram-user.js";
import type { ArtboardLatticeFootprintUser, ArtboardLatticeOrigin, ArtboardLatticePitch } from "./lattice-plane.js";
import { artboardPlaneCellOrigin } from "./lattice-plane.js";

/** Iso ground anchor for a lattice cell (plane layout → {@link artboardPlaneToIsoGround}). */
export function artboardLatticeCellIsoGround(
  col: number,
  row: number,
  pitch: ArtboardLatticePitch,
  options?: {
    origin?: ArtboardLatticeOrigin;
    artboardHeight?: number;
    /** Center this footprint in the macro cell (requires pitch = division cell size). */
    footprintUser?: ArtboardLatticeFootprintUser;
  },
): { left: number; right: number } {
  const plane = artboardPlaneCellOrigin(col, row, pitch, options);
  if (options?.footprintUser) {
    plane.x += (pitch.xPx - options.footprintUser.widthPx) / 2;
    plane.y += (pitch.yPx - options.footprintUser.depthPx) / 2;
  }
  return artboardPlaneToIsoGround(plane.x, plane.y);
}
