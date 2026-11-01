// Copyright (C) 2026 West Lane - All Rights Reserved

import {
  applyGridLinesMode,
  applyWireframeMode,
  blendHexWithWhite,
  createThemeManager,
  isoCanvasThemeFromLogTheme,
  readableTextOnSurface,
  type IsoCanvasTheme,
  type LogThemeLike,
  type ThemeManager,
} from "@westlane/isocanvas";
import { BUILT_IN_THEMES, BUILT_IN_THEME_PAIRS } from "@westlane/pino-blanc/themes";

export type DemoAppearance = "dark" | "light";

function formatThemeLabel(themeId: string): string {
  return themeId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatFamilyLabel(familyIndex: number): string {
  const pair = BUILT_IN_THEME_PAIRS[familyIndex];
  if (!pair) {
    return "Unknown";
  }
  const darkId = pair[0];
  const base = darkId.replace(/-dark$/, "");
  return formatThemeLabel(base);
}

function themeIdForPair(familyIndex: number, appearance: DemoAppearance): string {
  const pair = BUILT_IN_THEME_PAIRS[familyIndex];
  if (!pair) {
    throw new Error(`Missing theme family at index ${familyIndex}`);
  }
  return appearance === "dark" ? pair[0] : pair[1];
}

function isoThemeForId(id: string): IsoCanvasTheme {
  const log = BUILT_IN_THEMES[id] as LogThemeLike | undefined;
  if (!log) {
    throw new Error(`Missing pino-blanc theme: ${id}`);
  }
  return isoCanvasThemeFromLogTheme(log);
}

let active: ThemeManager | null = null;
let familyIndex = 0;
let appearance: DemoAppearance = "dark";
let wireframe = false;
let gridLines = true;

const DEMO_CHROME_BG = "--demo-chrome-bg";
const DEMO_CHROME_FG = "--demo-chrome-fg";
const DEMO_CHROME_FG_MUTED = "--demo-chrome-fg-muted";
const DEMO_CHROME_CONTROL_BG = "--demo-chrome-control-bg";
const DEMO_CHROME_DIVIDER = "--demo-chrome-divider";
const DEMO_GLASS_BG = "--demo-glass-bg";
const DEMO_GLASS_BORDER = "--demo-glass-border";

function syncPageChrome(manager: ThemeManager): void {
  const root = manager.target;
  const { colors } = manager.getTheme();
  document.documentElement.dataset.demoAppearance = appearance;
  document.documentElement.dataset.icTheme = themeIdForPair(familyIndex, appearance);
  applyWireframeMode(document.documentElement, wireframe);
  applyGridLinesMode(document.documentElement, gridLines);
  const artboard = manager.target.querySelector(".ic-artboard");
  if (artboard instanceof HTMLElement) {
    applyGridLinesMode(artboard, gridLines);
  }
  document.documentElement.style.colorScheme = appearance;

  const chromeBg = colors.surface;
  const chromeFg = readableTextOnSurface(chromeBg, colors.isoLabelFill);
  const chromeFgMuted = readableTextOnSurface(
    chromeBg,
    blendHexWithWhite(chromeFg, appearance === "dark" ? 0.35 : 0.45),
  );
  const controlBg =
    appearance === "dark"
      ? blendHexWithWhite(chromeBg, 0.08)
      : blendHexWithWhite(chromeBg, 0.55);

  root.style.setProperty(DEMO_CHROME_BG, chromeBg);
  root.style.setProperty(DEMO_CHROME_FG, chromeFg);
  root.style.setProperty(DEMO_CHROME_FG_MUTED, chromeFgMuted);
  root.style.setProperty(DEMO_CHROME_CONTROL_BG, controlBg);
  root.style.setProperty(DEMO_CHROME_DIVIDER,
    appearance === "dark"
      ? "color-mix(in oklch, var(--demo-chrome-fg) 24%, transparent)"
      : "color-mix(in oklch, var(--demo-chrome-fg) 16%, transparent)",
  );
  root.style.setProperty(
    DEMO_GLASS_BG,
    appearance === "dark"
      ? "color-mix(in oklch, var(--demo-chrome-fg) 10%, transparent)"
      : "color-mix(in oklch, var(--demo-chrome-fg) 7%, transparent)",
  );
  root.style.setProperty(
    DEMO_GLASS_BORDER,
    appearance === "dark"
      ? "1px solid color-mix(in oklch, var(--demo-chrome-fg) 16%, transparent)"
      : "1px solid color-mix(in oklch, var(--demo-chrome-fg) 12%, transparent)",
  );

  document.documentElement.style.backgroundColor = chromeBg;
  document.documentElement.style.color = chromeFg;
  if (typeof document !== "undefined") {
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor instanceof HTMLMetaElement) {
      themeColor.content = chromeBg;
    }
  }

  root.style.setProperty("--ic-dot-grid-surface", "transparent");
  root.style.setProperty("--ic-dot-grid-surface-fallback", chromeBg);
  persistDemoChromePrefs(chromeBg, chromeFg);
}

const DEMO_CHROME_STORAGE_KEY = "isocanvas-demo-chrome";

type StoredDemoChrome = {
  familyIndex?: unknown;
  appearance?: unknown;
  wireframe?: unknown;
  gridLines?: unknown;
  themeId?: unknown;
  surface?: unknown;
  fg?: unknown;
};

function readStoredDemoChrome(): StoredDemoChrome | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(DEMO_CHROME_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredDemoChrome;
  } catch {
    return null;
  }
}

function familyIndexFromThemeId(themeId: string): number {
  const idx = BUILT_IN_THEME_PAIRS.findIndex(
    (pair) => pair[0] === themeId || pair[1] === themeId,
  );
  return idx >= 0 ? idx : 0;
}

function applyStoredDemoChrome(stored: StoredDemoChrome | null): void {
  if (!stored) {
    return;
  }

  if (
    typeof stored.familyIndex === "number" &&
    stored.familyIndex >= 0 &&
    stored.familyIndex < BUILT_IN_THEME_PAIRS.length
  ) {
    familyIndex = stored.familyIndex;
  } else if (typeof stored.themeId === "string" && stored.themeId.length > 0) {
    familyIndex = familyIndexFromThemeId(stored.themeId);
  }

  if (stored.appearance === "light" || stored.appearance === "dark") {
    appearance = stored.appearance;
  } else if (typeof stored.themeId === "string") {
    if (stored.themeId.endsWith("-light")) {
      appearance = "light";
    } else if (stored.themeId.endsWith("-dark")) {
      appearance = "dark";
    }
  }

  wireframe = stored.wireframe === true;
  if (stored.gridLines === false) {
    gridLines = false;
  } else if (stored.gridLines === true) {
    gridLines = true;
  }

  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const themeId =
    typeof stored.themeId === "string" && stored.themeId.length > 0
      ? stored.themeId
      : themeIdForPair(familyIndex, appearance);
  root.dataset.demoAppearance = appearance;
  root.dataset.icTheme = themeId;
  if (wireframe) {
    root.dataset.icWireframe = "on";
  } else {
    delete root.dataset.icWireframe;
  }
  if (gridLines) {
    root.dataset.icGridLines = "on";
  } else {
    delete root.dataset.icGridLines;
  }
  root.style.colorScheme = appearance;

  const fallbackSurface = appearance === "light" ? "#fdf6e3" : "#002b36";
  const fallbackFg = appearance === "light" ? "#002b36" : "#eee8d5";
  const surface =
    typeof stored.surface === "string" && stored.surface.startsWith("#")
      ? stored.surface
      : fallbackSurface;
  const fg =
    typeof stored.fg === "string" && stored.fg.startsWith("#") ? stored.fg : fallbackFg;
  root.style.backgroundColor = surface;
  root.style.color = fg;
}

export function bootstrapDemoChromeFromStorage(): void {
  applyStoredDemoChrome(readStoredDemoChrome());
}

function persistDemoChromePrefs(surface: string, fg: string): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(
      DEMO_CHROME_STORAGE_KEY,
      JSON.stringify({
        familyIndex,
        appearance,
        wireframe,
        gridLines,
        themeId: themeIdForPair(familyIndex, appearance),
        surface,
        fg,
      }),
    );
  } catch {
    // Private mode / quota.
  }
}

function applyDemoThemeSelection(): { id: string; family: string; appearance: DemoAppearance } {
  if (!active) {
    throw new Error("initDemoTheme(root) must run before changing themes");
  }
  const id = themeIdForPair(familyIndex, appearance);
  active.setTheme(isoThemeForId(id));
  active.apply();
  syncPageChrome(active);
  return { id, family: formatFamilyLabel(familyIndex), appearance };
}

export function initDemoTheme(root: HTMLElement): ThemeManager {
  active = createThemeManager({
    target: root,
    theme: isoThemeForId(themeIdForPair(familyIndex, appearance)),
  });
  active.apply();
  syncPageChrome(active);
  return active;
}

export function demoThemeManager(): ThemeManager {
  if (!active) {
    throw new Error("initDemoTheme(root) must run before mounting diagrams");
  }
  return active;
}

export function currentDemoThemeLabel(): string {
  return formatFamilyLabel(familyIndex);
}

export function currentDemoAppearance(): DemoAppearance {
  return appearance;
}

export function currentDemoAppearanceLabel(): string {
  return appearance === "dark" ? "Dark" : "Light";
}

export function currentDemoFamilyIndex(): number {
  return familyIndex;
}

export function currentDemoFamilyLabel(): string {
  return formatFamilyLabel(familyIndex);
}

/** Active pino-blanc palette id (matches diagram chrome). */
export function currentDemoLogThemeId(): string {
  return themeIdForPair(familyIndex, appearance);
}

export function demoThemeFamilyOptions(): { index: number; label: string }[] {
  return BUILT_IN_THEME_PAIRS.map((_, index) => ({
    index,
    label: formatFamilyLabel(index),
  }));
}

export function setDemoThemeFamily(index: number): { id: string; label: string } {
  if (index < 0 || index >= BUILT_IN_THEME_PAIRS.length) {
    throw new Error(`Theme family index out of range: ${index}`);
  }
  familyIndex = index;
  const { id, family } = applyDemoThemeSelection();
  return { id, label: family };
}

export function cycleDemoThemeFamily(): { id: string; label: string } {
  familyIndex = (familyIndex + 1) % BUILT_IN_THEME_PAIRS.length;
  const { id, family } = applyDemoThemeSelection();
  return { id, label: family };
}

export function cycleDemoTheme(): { id: string; label: string } {
  return cycleDemoThemeFamily();
}

export function toggleDemoAppearance(): { id: string; appearance: DemoAppearance } {
  appearance = appearance === "dark" ? "light" : "dark";
  const { id } = applyDemoThemeSelection();
  return { id, appearance };
}

export function currentDemoWireframe(): boolean {
  return wireframe;
}

export function toggleDemoWireframe(): boolean {
  wireframe = !wireframe;
  if (active) {
    syncPageChrome(active);
  }
  return wireframe;
}

export function currentDemoGridLines(): boolean {
  return gridLines;
}

export function toggleDemoGridLines(): boolean {
  gridLines = !gridLines;
  if (active) {
    syncPageChrome(active);
  }
  return gridLines;
}
