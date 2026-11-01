// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  isLightHex,
  isoCanvasThemeFromLogTheme,
  isoSolidFaceStrokeCssFromFill,
  ISO_SOLID_FACE_STROKE_DARKEN,
  MIN_ARTBOARD_CANVAS_CONTRAST_RATIO,
  artboardSurfaceFillOnCanvas,
  blendHexWithBlack,
  relativeLuminanceFromHex,
  readableTextOnSurface,
  wireframeIsoNodeStroke,
  wireframeGridStrokeOnCanvas,
  wireframeStrokeOnSurface,
  themeToCssCustomProperties,
} from "@westlane/isocanvas";
import { BUILT_IN_THEMES } from "@westlane/pino-blanc/themes";

describe("readableTextOnSurface", () => {
  it("uses dark text on light card faces", () => {
    const fg = readableTextOnSurface("#fdf6e3", "#586e75");
    expect(isLightHex("#fdf6e3")).toBe(true);
    expect(isLightHex(fg)).toBe(false);
    expect(contrastRatio(fg, "#fdf6e3")).toBeGreaterThanOrEqual(4.5);
  });

  it("uses light text on dark card faces", () => {
    const face = "#002b36";
    const fg = readableTextOnSurface(face);
    expect(isLightHex(face)).toBe(false);
    expect(isLightHex(fg)).toBe(true);
    expect(contrastRatio(fg, face)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("wireframeIsoNodeStroke", () => {
  it("uses theme ink on light canvas surfaces", () => {
    const iso = isoCanvasThemeFromLogTheme(BUILT_IN_THEMES["gruvbox-light"]!);
    expect(wireframeIsoNodeStroke(iso.colors.surface, iso.colors.ink)).toBe(iso.colors.ink);
    const artboard = artboardSurfaceFillOnCanvas(iso.colors.surface, "light");
    expect(relativeLuminanceFromHex(iso.colors.ink)).toBeLessThan(
      relativeLuminanceFromHex(artboard),
    );
  });

  it("uses readable theme ink on dark canvas surfaces", () => {
    for (const [id, logTheme] of Object.entries(BUILT_IN_THEMES)) {
      const iso = isoCanvasThemeFromLogTheme(logTheme);
      if (id.endsWith("-light")) {
        continue;
      }
      const stroke = wireframeIsoNodeStroke(iso.colors.surface, iso.colors.ink);
      expect(contrastRatio(stroke, iso.colors.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("wireframeGridStrokeOnCanvas", () => {
  it("uses darker artboard tint on light canvas surfaces", () => {
    for (const [id, logTheme] of Object.entries(BUILT_IN_THEMES)) {
      if (!id.endsWith("-light")) {
        continue;
      }
      const iso = isoCanvasThemeFromLogTheme(logTheme);
      const artboard = artboardSurfaceFillOnCanvas(iso.colors.surface, "light");
      const stroke = wireframeGridStrokeOnCanvas(iso.colors.surface);
      expect(relativeLuminanceFromHex(stroke)).toBeLessThan(
        relativeLuminanceFromHex(artboard),
      );
    }
  });

  it("uses darker artboard tint on dark canvas surfaces", () => {
    for (const [id, logTheme] of Object.entries(BUILT_IN_THEMES)) {
      const iso = isoCanvasThemeFromLogTheme(logTheme);
      if (id.endsWith("-light")) {
        continue;
      }
      const artboard = artboardSurfaceFillOnCanvas(iso.colors.surface, "dark");
      const stroke = wireframeGridStrokeOnCanvas(iso.colors.surface);
      expect(relativeLuminanceFromHex(stroke)).toBeLessThan(
        relativeLuminanceFromHex(artboard),
      );
      expect(contrastRatio(stroke, artboard)).toBeGreaterThan(1.04);
    }
  });
});

describe("wireframeStrokeOnSurface", () => {
  it("is readable on light canvas and artboard-tinted on dark", () => {
    for (const [id, logTheme] of Object.entries(BUILT_IN_THEMES)) {
      const iso = isoCanvasThemeFromLogTheme(logTheme);
      const appearance = id.endsWith("-light") ? "light" : "dark";
      const artboard = artboardSurfaceFillOnCanvas(iso.colors.surface, appearance);
      const stroke = wireframeStrokeOnSurface(iso.colors.surface, iso.colors.isoEdgeStroke);
      const strokeLum = relativeLuminanceFromHex(stroke);
      const artboardLum = relativeLuminanceFromHex(artboard);
      if (appearance === "light") {
        expect(strokeLum, `wireframe stroke on ${id}`).toBeLessThan(artboardLum);
      } else {
        expect(strokeLum, `wireframe stroke on ${id}`).toBeLessThan(artboardLum);
      }
    }
  });
});

describe("artboardSurfaceFillOnCanvas", () => {
  it("contrasts with canvas surface on every built-in theme", () => {
    for (const [id, logTheme] of Object.entries(BUILT_IN_THEMES)) {
      const iso = isoCanvasThemeFromLogTheme(logTheme);
      const appearance = id.endsWith("-light") ? "light" : "dark";
      const artboard = artboardSurfaceFillOnCanvas(iso.colors.surface, appearance);
      expect(
        contrastRatio(artboard, iso.colors.surface),
        `artboard vs surface on ${id}`,
      ).toBeGreaterThanOrEqual(MIN_ARTBOARD_CANVAS_CONTRAST_RATIO);
    }
  });

  it("is darker than canvas on light themes and lighter on dark themes", () => {
    for (const [id, logTheme] of Object.entries(BUILT_IN_THEMES)) {
      const iso = isoCanvasThemeFromLogTheme(logTheme);
      const appearance = id.endsWith("-light") ? "light" : "dark";
      const artboard = artboardSurfaceFillOnCanvas(iso.colors.surface, appearance);
      const surfaceLum = relativeLuminanceFromHex(iso.colors.surface);
      const artboardLum = relativeLuminanceFromHex(artboard);
      if (appearance === "light") {
        expect(artboardLum, id).toBeLessThan(surfaceLum);
      } else {
        expect(artboardLum, id).toBeGreaterThan(surfaceLum);
      }
    }
  });
});

describe("isoSolidFaceStrokeCssFromFill", () => {
  it("light themes derive dot fill in CSS from grid-line ink (see theme/layout/artboard-grid.css)", () => {
    const iso = isoCanvasThemeFromLogTheme(BUILT_IN_THEMES["gruvbox-light"]!);
    const props = themeToCssCustomProperties(iso);
    expect(props["--ic-wireframe-grid-stroke"]).toBeTruthy();
    expect(props["--ic-dot-grid-dot"]).toBeUndefined();
  });

  it("is a slightly darkened face fill at 50% opacity", () => {
    const iso = isoCanvasThemeFromLogTheme(BUILT_IN_THEMES["solarized-dark"]!);
    const fill = iso.colors.isoRightFill;
    const tinted = blendHexWithBlack(fill, ISO_SOLID_FACE_STROKE_DARKEN);
    expect(isoSolidFaceStrokeCssFromFill(fill)).toBe(
      `color-mix(in oklch, ${tinted} 50%, transparent)`,
    );
    expect(relativeLuminanceFromHex(tinted)).toBeLessThan(relativeLuminanceFromHex(fill));
  });
});
