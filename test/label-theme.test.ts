import { describe, expect, it } from "vitest";
import {
  IC_ISO_CUBE_LABEL_THEME_VARS,
  ISO_CUBE_LABEL_THEME_DEFAULTS,
  readIsoCubeLabelTheme,
} from "../src/isometric/cube/label-theme.js";

describe("readIsoCubeLabelTheme", () => {
  it("returns defaults when scope is missing", () => {
    expect(readIsoCubeLabelTheme(null)).toEqual(ISO_CUBE_LABEL_THEME_DEFAULTS);
  });

  it("reads numeric tokens from inline style", () => {
    const el = document.createElement("div");
    el.style.setProperty(IC_ISO_CUBE_LABEL_THEME_VARS.fontSizePx, "44");
    el.style.setProperty(IC_ISO_CUBE_LABEL_THEME_VARS.fontSizeMinPx, "12");
    el.style.setProperty(IC_ISO_CUBE_LABEL_THEME_VARS.edgeInset, "0.8");
    el.style.setProperty(IC_ISO_CUBE_LABEL_THEME_VARS.lineHeightEm, "1.2");
    el.style.setProperty(IC_ISO_CUBE_LABEL_THEME_VARS.truncateAfterChars, "18");
    document.body.appendChild(el);
    try {
      const theme = readIsoCubeLabelTheme(el);
      expect(theme.fontSizePx).toBe(44);
      expect(theme.fontSizeMinPx).toBe(12);
      expect(theme.edgeInset).toBe(0.8);
      expect(theme.lineHeightEm).toBe(1.2);
      expect(theme.truncateAfterChars).toBe(18);
      expect(theme.fontFamily).toBe(ISO_CUBE_LABEL_THEME_DEFAULTS.fontFamily);
    } finally {
      el.remove();
    }
  });
});
