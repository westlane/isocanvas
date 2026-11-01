// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it } from "vitest";
import {
  blendHexWithWhite,
  contrastRatio,
  darkerSurfaceBorderStroke,
  isoCanvasThemeFromLogTheme,
  isoFaceFillsFromSchemeAccent,
  isoSlabVisibleFacesFromTop,
  PINO_BLANC_THEME_SURFACE,
  relativeLuminanceFromHex,
  type LogThemeLike,
} from "@westlane/isocanvas";

const solarizedDark: LogThemeLike = {
  id: "solarized-dark",
  background: "dark",
  levels: {
    info: "#b58900",
    error: "#dc322f",
  },
  tintRamp: [
    "#268bd2",
    "#2aa198",
    "#859900",
    "#b58900",
    "#cb4b16",
    "#dc322f",
    "#6c71c4",
    "#d33682",
  ],
  roles: {
    accent: "#2aa198",
    meta: "#839496",
    message: "#eee8d5",
  },
};

describe("isoFaceFillsFromSchemeAccent", () => {
  it("shades a single accent for top, front, and side faces", () => {
    const accent = "#2aa198";
    const light = isoFaceFillsFromSchemeAccent(accent, "light");
    expect(relativeLuminanceFromHex(light.top)).toBeGreaterThan(
      relativeLuminanceFromHex(light.front),
    );
    expect(relativeLuminanceFromHex(light.front)).toBeGreaterThan(
      relativeLuminanceFromHex(light.side),
    );
    const dark = isoFaceFillsFromSchemeAccent(accent, "dark");
    expect(relativeLuminanceFromHex(dark.top)).toBeGreaterThan(
      relativeLuminanceFromHex(dark.front),
    );
    expect(relativeLuminanceFromHex(dark.front)).toBeGreaterThan(
      relativeLuminanceFromHex(dark.side),
    );
  });
});

describe("isoSlabVisibleFacesFromTop", () => {
  it("uses the same top → front → side light order as iso boxes", () => {
    const top = "#e8eef2";
    for (const appearance of ["light", "dark"] as const) {
      const slab = isoSlabVisibleFacesFromTop(top, appearance);
      expect(relativeLuminanceFromHex(top)).toBeGreaterThan(
        relativeLuminanceFromHex(slab.front),
      );
      expect(relativeLuminanceFromHex(slab.front)).toBeGreaterThan(
        relativeLuminanceFromHex(slab.side),
      );
    }
  });
});

describe("isoCanvasThemeFromLogTheme", () => {
  it("maps accent and surface from pino-blanc shape", () => {
    const theme = isoCanvasThemeFromLogTheme(solarizedDark);
    expect(theme.id).toBe("pino:solarized-dark");
    expect(theme.colors.accent).toBe("#2aa198");
    expect(theme.colors.isoFrontFill).not.toBe(
      blendHexWithWhite(PINO_BLANC_THEME_SURFACE["solarized-dark"]!, 0.1),
    );
    expect(theme.colors.isoEdgeStroke).toBe(
      darkerSurfaceBorderStroke(theme.colors.isoFrontFill, "dark"),
    );
    expect(theme.colors.isoEdgeStroke).not.toBe(theme.colors.accent);
    expect(contrastRatio(theme.colors.isoLabelFill, theme.colors.isoTopFill)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(PINO_BLANC_THEME_SURFACE["solarized-dark"]).toBe("#002b36");
  });
});
