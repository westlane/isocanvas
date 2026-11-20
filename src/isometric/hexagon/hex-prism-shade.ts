// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { IsoFaceId } from "../../types/diagram.js";
import { normalizeHex } from "../../theme/color-math.js";

const ISO_HEX_RECESS_WALL_COUNT = 4;

export function blendHexPair(from: string, to: string, toWeight: number): string {
  const w = Math.max(0, Math.min(1, toWeight));
  const channels = (hex: string): [number, number, number] => {
    const clean = normalizeHex(hex).slice(1);
    return [
      Number.parseInt(clean.slice(0, 2), 16),
      Number.parseInt(clean.slice(2, 4), 16),
      Number.parseInt(clean.slice(4, 6), 16),
    ];
  };
  const [ar, ag, ab] = channels(from);
  const [br, bg, bb] = channels(to);
  const mix = (a: number, b: number) => Math.round(a * (1 - w) + b * w);
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(mix(ar, br))}${toHex(mix(ag, bg))}${toHex(mix(ab, bb))}`;
}

/** Idle: dark recess (left) → light front/right ridge; pressed CSS inverts. */
export function isoHexIdleVerticalShades(fills: Record<IsoFaceId, string>): {
  recessEdgeFills: string[];
  front: string;
  side: string;
} {
  const dark = fills.left;
  const mid = fills.front;
  const light = fills.top;
  const edgeCount = ISO_HEX_RECESS_WALL_COUNT;
  const recessEdgeFills = Array.from({ length: edgeCount }, (_, index) =>
    blendHexPair(dark, mid, edgeCount <= 1 ? 0 : index / (edgeCount - 1)),
  );
  return { recessEdgeFills, front: mid, side: light };
}
