// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it, vi } from "vitest";
import {
  createThemeManager,
  DEFAULT_ISO_CANVAS_THEME,
  mergeTheme,
  themeToCssCustomProperties,
  ZUI_THEME_CSS_VARS,
} from "@westlane/isocanvas";

describe("theme manager", () => {
  it("maps colors and radius to watch CSS variables", () => {
    const props = themeToCssCustomProperties(DEFAULT_ISO_CANVAS_THEME);
    expect(props[ZUI_THEME_CSS_VARS.accent]).toBe("#9333ea");
    expect(props[ZUI_THEME_CSS_VARS.clusterRx]).toBe("0px");
    expect(props[ZUI_THEME_CSS_VARS.isoShadowOpacity]).toBe("0.42");
    expect(props[ZUI_THEME_CSS_VARS.isoFaceStrokeWidth]).toBe("1px");
    expect(props[ZUI_THEME_CSS_VARS.isoFaceStrokeTop]).toMatch(/^color-mix\(in oklch,/);
    expect(props[ZUI_THEME_CSS_VARS.isoFaceStrokeRecess]).toMatch(/^color-mix\(in oklch,/);
  });

  it("applies theme to a host element", () => {
    const host = { style: { setProperty: vi.fn() } } as unknown as HTMLElement;
    const manager = createThemeManager({ target: host });
    manager.patchTheme({
      colors: { accent: "#2563eb" },
      radius: { clusterRx: 8 },
    });
    manager.apply();
    expect(host.style.setProperty).toHaveBeenCalledWith("--zui-accent", "#2563eb");
    expect(host.style.setProperty).toHaveBeenCalledWith("--ic-theme-cluster-rx", "8px");
  });

  it("mergeTheme preserves unspecified fields", () => {
    const next = mergeTheme(DEFAULT_ISO_CANVAS_THEME, {
      radius: { clusterRx: 4 },
    });
    expect(next.radius.clusterRx).toBe(4);
    expect(next.radius.isoFaceStrokeWidth).toBe(DEFAULT_ISO_CANVAS_THEME.radius.isoFaceStrokeWidth);
    expect(next.colors.accent).toBe(DEFAULT_ISO_CANVAS_THEME.colors.accent);
  });
});
