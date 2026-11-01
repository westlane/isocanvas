// Copyright (C) 2026 West Lane - All Rights Reserved

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  applyWireframeMode,
  applyGridLinesMode,
  IC_GRID_LINES_DATA_ATTR,
  IC_GRID_LINES_ON,
  IC_WIREFRAME_DATA_ATTR,
  IC_WIREFRAME_ON,
  readGridLinesMode,
  readWireframeMode,
  toggleGridLinesMode,
  toggleWireframeMode,
  wireframeBackFaceStrokeOnCanvas,
  wireframeTopFaceFillOnCanvas,
  wireframeFrontFaceFillOnCanvas,
  wireframeSideFaceFillOnCanvas,
  wireframeDotGridFillOnCanvas,
  wireframeLabelFillOnCanvas,
  wireframeIsoNodeStroke,
  isoCubeLabelInkOnFace,
  wireframeDarkCardFaceHex,
  WIREFRAME_DARK_CARD_BLACK,
  hexToRgba,
} from "@westlane/isocanvas";

function mockHost(): HTMLElement {
  const attrs = new Map<string, string>();
  return {
    getAttribute(name: string) {
      return attrs.get(name) ?? null;
    },
    setAttribute(name: string, value: string) {
      attrs.set(name, value);
    },
    removeAttribute(name: string) {
      attrs.delete(name);
    },
    hasAttribute(name: string) {
      return attrs.has(name);
    },
  } as unknown as HTMLElement;
}

describe("wireframe face fills", () => {
  it("uses iso stroke at per-face opacity on light canvas", () => {
    const surface = "#fdf6e3";
    const ink = "#073642";
    expect(wireframeTopFaceFillOnCanvas(surface, ink)).toMatch(/, 0\.14\)$/);
    expect(wireframeFrontFaceFillOnCanvas(surface, ink)).toMatch(/, 0\.08\)$/);
    expect(wireframeSideFaceFillOnCanvas(surface, ink)).toMatch(/, 0\.06\)$/);
    expect(wireframeBackFaceStrokeOnCanvas(surface, ink)).toMatch(/, 0\.28\)$/);
    expect(wireframeDotGridFillOnCanvas(surface, ink)).toMatch(/, 0\.3\)$/);
  });

  it("uses darkened solid card face hues on dark canvas", () => {
    const surface = "#002b36";
    const ink = "#eee8d5";
    const topFill = "#61b9b3";
    const frontFill = "#27978f";
    const sideFill = "#22817a";
    const leftFill = "#1d6d67";
    expect(wireframeTopFaceFillOnCanvas(surface, ink, topFill)).toBe(
      hexToRgba(wireframeDarkCardFaceHex(topFill, WIREFRAME_DARK_CARD_BLACK.top), 0.38),
    );
    expect(wireframeFrontFaceFillOnCanvas(surface, ink, frontFill)).toMatch(/, 0\.22\)$/);
    expect(wireframeSideFaceFillOnCanvas(surface, ink, sideFill)).toMatch(/, 0\.16\)$/);
    expect(wireframeBackFaceStrokeOnCanvas(surface, ink, leftFill)).toMatch(/, 0\.32\)$/);
  });

  it("uses iso stroke for wireframe labels on light canvas", () => {
    const surface = "#fdf6e3";
    const ink = "#073642";
    const topFill = "#61b9b3";
    const stroke = wireframeIsoNodeStroke(surface, ink);
    expect(wireframeLabelFillOnCanvas(surface, ink, topFill)).toBe(stroke);
  });

  it("uses iso stroke for wireframe labels on dark canvas", () => {
    const surface = "#002b36";
    const ink = "#eee8d5";
    const topFill = "#61b9b3";
    const stroke = wireframeIsoNodeStroke(surface, ink);
    expect(wireframeLabelFillOnCanvas(surface, ink, topFill)).toBe(stroke);
    expect(stroke).not.toBe(isoCubeLabelInkOnFace(topFill));
  });
});

describe("wireframe mode", () => {
  it("styles back and left faces with a lighter wireframe stroke token", () => {
    const cssPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../theme/wireframe.css",
    );
    const css = readFileSync(cssPath, "utf8");
    expect(css).toContain("--ic-wireframe-back-face-stroke");
    expect(css).toMatch(/ic-iso-cube-face--back[\s\S]*?ic-iso-cube-face--left[\s\S]*?stroke:/);
    expect(css).toMatch(/ic-iso-cube-face--bottom[\s\S]{0,120}display:\s*none/);
    expect(css).toMatch(
      /path\.ic-iso-cube-face--top[\s\S]*?--ic-wireframe-top-surface-fill[\s\S]*?fill:/,
    );
    expect(css).not.toMatch(/path\.ic-iso-cube-face--top[\s\S]{0,200}stroke:\s*none/);
    expect(css).toMatch(
      /path\.ic-artboard-guide[\s\S]*path\.ic-artboard-subguide[\s\S]*display:\s*block/,
    );
    expect(css).toMatch(/path\.ic-artboard-guide[\s\S]*--ic-grid-lines-stroke[\s\S]*stroke:/);
    expect(css).toContain("path.ic-artboard-outline");
    expect(css).toMatch(/path\.ic-artboard-outline[\s\S]*stroke:\s*none\s*!important/);
    expect(css).toMatch(/:not\(\.ic-artboard-outline\)/);
    expect(css).toMatch(/:not\(\.ic-artboard-guide\)/);
  });

  it("hides iso ground division guides until wireframe is enabled", () => {
    const cssPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../theme/layout/artboard.css",
    );
    const css = readFileSync(cssPath, "utf8");
    expect(css).toContain("--ic-artboard-guide-line: transparent");
    expect(css).toMatch(
      /path\.ic-artboard-guide[\s\S]*path\.ic-artboard-subguide[\s\S]*display:\s*none/,
    );
  });

  it("sets and reads data-ic-wireframe on a host", () => {
    const host = mockHost();
    expect(readWireframeMode(host)).toBe(false);
    applyWireframeMode(host, true);
    expect(host.getAttribute(IC_WIREFRAME_DATA_ATTR)).toBe(IC_WIREFRAME_ON);
    expect(readWireframeMode(host)).toBe(true);
    applyWireframeMode(host, false);
    expect(host.hasAttribute(IC_WIREFRAME_DATA_ATTR)).toBe(false);
  });

  it("toggles wireframe mode", () => {
    const host = mockHost();
    expect(toggleWireframeMode(host)).toBe(true);
    expect(readWireframeMode(host)).toBe(true);
    expect(toggleWireframeMode(host)).toBe(false);
    expect(readWireframeMode(host)).toBe(false);
  });

  it("sets and reads data-ic-grid-lines on a host", () => {
    const host = mockHost();
    expect(readGridLinesMode(host)).toBe(false);
    applyGridLinesMode(host, true);
    expect(host.getAttribute(IC_GRID_LINES_DATA_ATTR)).toBe(IC_GRID_LINES_ON);
    expect(readGridLinesMode(host)).toBe(true);
    applyGridLinesMode(host, false);
    expect(host.hasAttribute(IC_GRID_LINES_DATA_ATTR)).toBe(false);
  });

  it("shows iso ground division guides when grid lines mode is enabled", () => {
    const cssPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../theme/layout/artboard.css",
    );
    const css = readFileSync(cssPath, "utf8");
    expect(css).toMatch(
      /\[data-ic-grid-lines="on"\][\s\S]*path\.ic-artboard-guide[\s\S]*display:\s*block/,
    );
  });

  it("applies artboard grid + dot paint in CSS (theme sets ink only)", () => {
    const gridPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../theme/layout/artboard-grid.css",
    );
    const css = readFileSync(gridPath, "utf8");
    expect(css).toContain("--ic-grid-line-ink");
    expect(css).toMatch(
      /--ic-grid-lines-stroke:[\s\S]*var\(--ic-grid-line-ink\)/,
    );
    expect(css).toMatch(
      /:root:is\(\[data-ic-theme\$="-light"\][\s\S]*--ic-grid-lines-stroke-mix:\s*52%/,
    );
  });
});
