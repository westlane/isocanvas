// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import {
  ISO_PRISM_CUBE,
  ISO_PRISM_HEXAGON,
  type IsoPrismKind,
} from "../../types/diagram.js";

export { ISO_PRISM_CUBE, ISO_PRISM_HEXAGON, type IsoPrismKind };

export const IC_ISO_PRISM_ATTR = "data-ic-iso-prism";

/** Opaque floor inside the hex shell — blocks press-bottom / grid bleed through recess gaps. */
export const IC_ISO_HEX_INTERIOR_CAP_CLASS = "ic-iso-hex-interior-cap";

export function normalizeIsoPrismKind(value: string | null | undefined): IsoPrismKind {
  return value === ISO_PRISM_HEXAGON ? ISO_PRISM_HEXAGON : ISO_PRISM_CUBE;
}

export function isIsoHexagonPrism(kind: IsoPrismKind | undefined): boolean {
  return kind === ISO_PRISM_HEXAGON;
}
