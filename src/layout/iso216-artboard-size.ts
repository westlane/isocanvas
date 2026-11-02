// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ArtboardUserSize } from "../types/artboard.js";

/** ISO 216 A0 portrait width in millimetres. */
export const ISO216_A0_WIDTH_MM = 841;

const SQRT2 = Math.sqrt(2);

/** Portrait width × height in mm for ISO series n (A0 = 0, A1 = 1, …, A17 = 17). */
export function iso216ArtboardSizeMm(series: number): { widthMm: number; heightMm: number } {
  if (!Number.isFinite(series) || series < 0) {
    throw new RangeError(`iso216 series must be a non-negative number, got ${series}`);
  }
  const widthMm = ISO216_A0_WIDTH_MM * 2 ** (-series / 2);
  const heightMm = widthMm * SQRT2;
  return { widthMm, heightMm };
}

export type ArtboardUserSizeFromIso216Options = {
  /** When true, the long edge is horizontal (+x). Default true for class diagrams. */
  landscape?: boolean;
  /** Scale so the long edge of the sheet matches this many user pixels. */
  longEdgePx: number;
};

/** Map an ISO A-series sheet to logical artboard user units (preserves √2 aspect). */
export function artboardUserSizeFromIso216Series(
  series: number,
  options: ArtboardUserSizeFromIso216Options,
): ArtboardUserSize {
  const { widthMm, heightMm } = iso216ArtboardSizeMm(series);
  const longMm = Math.max(widthMm, heightMm);
  const shortMm = Math.min(widthMm, heightMm);
  const scale = options.longEdgePx / longMm;
  const longPx = options.longEdgePx;
  const shortPx = shortMm * scale;
  const landscape = options.landscape !== false;
  return landscape ? { width: longPx, height: shortPx } : { width: shortPx, height: longPx };
}
