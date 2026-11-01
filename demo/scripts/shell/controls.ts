// Copyright (C) 2026 West Lane - All Rights Reserved
/** Theme / orientation chrome controls and keyboard shortcuts. */

import { getDemoLogger, refreshDemoLoggers } from "../log.js";
import { getDemoIsometricOrientation } from "../session.js";
import {
  currentDemoAppearance,
  currentDemoFamilyLabel,
  currentDemoGridLines,
  currentDemoWireframe,
  cycleDemoThemeFamily,
  toggleDemoAppearance,
  toggleDemoGridLines,
  toggleDemoWireframe,
} from "../theme.js";
import { createFeatherIcon, type DemoShellElements } from "./elements.js";

export type DemoChromeControls = {
  syncThemeControls: () => void;
  syncIsoOrientationControl: () => void;
  applyThemeToShowcase: (focusEl?: HTMLElement | null) => void;
};

export function wireDemoChromeControls(
  shell: DemoShellElements,
  options: {
    onThemeChanged: () => void;
    onIsoOrientationToggle: () => void;
  },
): DemoChromeControls {
  const { themeFamily, themeAppearance, themeGridLines, themeWireframe, isoOrientationFlip } = shell;

  function syncThemeControls(): void {
    const family = currentDemoFamilyLabel();
    themeFamily.replaceChildren(createFeatherIcon("droplet"));
    themeFamily.setAttribute("aria-label", `Palette: ${family}. Cycle palette`);
    themeFamily.title = `${family} — cycle palette (T)`;

    const mode = currentDemoAppearance();
    themeAppearance.dataset.appearance = mode;
    themeAppearance.replaceChildren(createFeatherIcon(mode === "dark" ? "sun" : "moon"));
    themeAppearance.setAttribute(
      "aria-label",
      mode === "dark" ? "Switch to light mode" : "Switch to dark mode",
    );
    themeAppearance.title =
      mode === "dark" ? "Switch to light mode (L)" : "Switch to dark mode (L)";

    const on = currentDemoWireframe();
    themeWireframe.setAttribute("aria-pressed", on ? "true" : "false");
    themeWireframe.replaceChildren(createFeatherIcon("hexagon"));
    themeWireframe.setAttribute("aria-label", on ? "Wireframe mode on" : "Wireframe mode off");
    themeWireframe.title = on ? "Disable wireframe (W)" : "Enable wireframe (W)";

    const gridOn = currentDemoGridLines();
    themeGridLines.setAttribute("aria-pressed", gridOn ? "true" : "false");
    themeGridLines.replaceChildren(createFeatherIcon("grid"));
    themeGridLines.setAttribute(
      "aria-label",
      gridOn ? "Layout grid lines on" : "Layout grid lines off",
    );
    themeGridLines.title = gridOn
      ? "Hide layout grid lines (G)"
      : "Show layout grid lines (G)";
  }

  function syncIsoOrientationControl(): void {
    const rotated = getDemoIsometricOrientation() === "rotated";
    isoOrientationFlip.setAttribute("aria-pressed", rotated ? "true" : "false");
    const icon = createFeatherIcon("layout");
    if (rotated) {
      icon.classList.add("demo-tool-icon--rotate-90");
    }
    isoOrientationFlip.replaceChildren(icon);
    isoOrientationFlip.setAttribute(
      "aria-label",
      rotated ? "Iso view rotated right (active)" : "Rotate iso view 90° clockwise",
    );
    isoOrientationFlip.title = rotated
      ? "Restore default iso angle (O)"
      : "Rotate view 90° clockwise — text faces you (O)";
  }

  function applyThemeToShowcase(focusEl?: HTMLElement | null): void {
    refreshDemoLoggers();
    syncThemeControls();
    options.onThemeChanged();
    focusEl?.focus();
  }

  themeFamily.addEventListener("click", () => {
    const next = cycleDemoThemeFamily();
    applyThemeToShowcase(themeFamily);
    getDemoLogger("theme").info("Palette cycled", {
      family: next.label,
      appearance: currentDemoAppearance(),
      themeId: next.id,
    });
  });

  themeAppearance.addEventListener("click", () => {
    const next = toggleDemoAppearance();
    applyThemeToShowcase(themeAppearance);
    getDemoLogger("theme").info("Appearance toggled", {
      appearance: next.appearance,
      themeId: next.id,
    });
  });

  themeWireframe.addEventListener("click", () => {
    const on = toggleDemoWireframe();
    syncThemeControls();
    themeWireframe.focus();
    getDemoLogger("theme").info("Wireframe toggled", { wireframe: on });
  });

  themeGridLines.addEventListener("click", () => {
    const on = toggleDemoGridLines();
    syncThemeControls();
    themeGridLines.focus();
    getDemoLogger("theme").info("Grid lines toggled", { gridLines: on });
  });

  isoOrientationFlip.addEventListener("click", () => {
    options.onIsoOrientationToggle();
    syncIsoOrientationControl();
    isoOrientationFlip.focus();
  });

  syncThemeControls();
  syncIsoOrientationControl();

  return { syncThemeControls, syncIsoOrientationControl, applyThemeToShowcase };
}

export function bindDemoKeyboardShortcuts(handlers: {
  cycleTheme: () => void;
  toggleAppearance: () => void;
  toggleGridLines: () => void;
  toggleWireframe: () => void;
  toggleIsoOrientation: () => void;
}): void {
  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        target.closest("input, textarea, select, [contenteditable='true']"))
    ) {
      return;
    }
    if (event.key === "t" || event.key === "T") {
      event.preventDefault();
      handlers.cycleTheme();
      return;
    }
    if (event.key === "l" || event.key === "L") {
      event.preventDefault();
      handlers.toggleAppearance();
      return;
    }
    if (event.key === "w" || event.key === "W") {
      event.preventDefault();
      handlers.toggleWireframe();
      return;
    }
    if (event.key === "g" || event.key === "G") {
      event.preventDefault();
      handlers.toggleGridLines();
      return;
    }
    if (event.key === "o" || event.key === "O") {
      event.preventDefault();
      handlers.toggleIsoOrientation();
    }
  });
}
