// Copyright (C) 2026 West Lane - All Rights Reserved

/** One cell placement in the demo card-grid lattice. */
export type CardGridCell = {
  id: string;
  label: string;
  col: number;
  row: number;
  /** Extrusion in diagram user pixels; default footprint ratio when omitted. */
  heightUserPx?: number;
};
