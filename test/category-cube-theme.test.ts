// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";
import {
  applyCategoryCubeThemeToShell,
  IC_CUBE_CATEGORY_THEME_ATTR,
} from "../src/isometric/cube/category-cube-theme.js";
import {
  isoSolidFaceStrokeCssFromFill,
} from "../src/theme/color-math.js";

describe("applyCategoryCubeThemeToShell", () => {
  it("sets ic face vars from category colors", () => {
    const shell = document.createElement("g");
    applyCategoryCubeThemeToShell(shell, {
      top: "#ede9fe",
      front: "#ddd6fe",
      right: "#c4b5fd",
      left: "#a78bfa",
      bottom: "#8b5cf6",
      labelFill: "#5b21b6",
    });
    expect(shell.getAttribute(IC_CUBE_CATEGORY_THEME_ATTR)).toBe("true");
    expect(shell.style.getPropertyValue("--ic-iso-top-fill").trim()).toBe("#ede9fe");
    expect(shell.style.getPropertyValue("--ic-iso-selected-front-fill").trim()).toBe("#ddd6fe");
    expect(shell.style.getPropertyValue("--ic-iso-face-stroke-top").trim()).toBe(
      isoSolidFaceStrokeCssFromFill("#ede9fe"),
    );
    expect(shell.style.getPropertyValue("--ic-iso-face-stroke-front").trim()).toBe(
      isoSolidFaceStrokeCssFromFill("#ddd6fe"),
    );
    expect(shell.style.getPropertyValue("--ic-iso-edge-stroke").trim()).not.toBe("#7c3aed");
    expect(shell.style.getPropertyValue("--ic-iso-edge-stroke").trim()).toMatch(/^#/);
  });
});
