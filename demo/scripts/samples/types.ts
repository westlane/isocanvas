// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

/** One cell placement in the demo card-grid lattice. */
export type CardGridCell = {
  id: string;
  label: string;
  col: number;
  row: number;
  /** Extrusion in diagram user pixels; default footprint ratio when omitted. */
  heightUserPx?: number;
};
