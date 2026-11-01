// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { bindDemoKeyboardShortcuts, wireDemoChromeControls } from "./shell/controls.js";
import {
  bindDemoSidebarOffset,
  createDemoToolButton,
  formatMountError,
  itemFeatherIcon,
  mountDemoShell,
  showDiagramError,
} from "./shell/elements.js";
import { attachViewportDebug } from "./shell/viewport-debug.js";
import { getDemoLogger } from "./log.js";
import {
  applyDemoIsometricOrientationToHost,
  demoWorldCameraLayerOptions,
  getArtboardSlice,
  getDemoSessionPersistenceAdapter,
  hydrateDemoSession,
  installDemoSessionPersistence,
  persistDemoSession,
  canvasRouteKey,
  captureDemoCanvasCameraFromDom,
  resetDemoBaseline,
  setArtboardSlice,
  toggleDemoIsometricOrientation,
} from "./session.js";
import {
  bootstrapDemoChromeFromStorage,
  currentDemoGridLines,
  initDemoTheme,
  toggleDemoAppearance,
  toggleDemoGridLines,
  toggleDemoWireframe,
  cycleDemoThemeFamily,
} from "./theme.js";
import {
  ALL_DEMO_TOOLS,
  defaultToolRoute,
  findToolRoute,
  parseToolRouteHash,
  toolRouteForToolId,
  toolRouteHash,
  type DemoToolRoute,
} from "./tools.js";
import {
  applyDemoHomeView,
  applyViewportFromHash,
  applyViewportFromUrlFrame,
  attachDemoIsoStageViewport,
  bindViewportUrlSync,
  parseViewportUrlFrame,
  syncRouteHashForTool,
} from "./viewport.js";
import {
  applyGridLinesMode,
  createIsoCanvasStage,
  DEFAULT_ARTBOARD_USER_SIZE,
} from "@westlane/isocanvas";

bootstrapDemoChromeFromStorage();

const shell = mountDemoShell();
bindDemoSidebarOffset(shell.sidebar);

const {
  viewport: viewportEl,
  frame: frameEl,
  tools: toolsEl,
  toolbar: toolbarEl,
  toolbarOptions: toolbarOptionsEl,
  viewTitle: viewTitleEl,
} = shell;

const isoStage = createIsoCanvasStage({
  className: "ic-stage-viewport",
  worldCamera: demoWorldCameraLayerOptions(),
  artboards: [
    {
      id: "main",
      userSize: DEFAULT_ARTBOARD_USER_SIZE,
      contentId: "diagram-host",
      embedDotGrid: false,
    },
  ],
});
viewportEl.replaceChildren(isoStage.container);
const hostEl = isoStage.getArtboard("main")!.host;
hostEl.classList.add("diagram-host");
const log = getDemoLogger("demo");

initDemoTheme(document.documentElement);
applyGridLinesMode(hostEl, currentDemoGridLines());
applyGridLinesMode(hostEl.closest(".ic-artboard") ?? hostEl, currentDemoGridLines());
installDemoSessionPersistence();
hydrateDemoSession();
applyDemoIsometricOrientationToHost(hostEl);
log.info("Demo shell ready", {
  persistence: getDemoSessionPersistenceAdapter().id,
});

let activeRoute = parseToolRouteHash(window.location.hash) ?? defaultToolRoute();
let mountToken = 0;

const chrome = wireDemoChromeControls(shell, {
  onThemeChanged: () => {
    void selectToolRoute(activeRoute);
  },
  onIsoOrientationToggle: () => {
    toggleDemoIsometricOrientation(hostEl);
    persistDemoSession();
    void selectToolRoute(activeRoute);
  },
});

bindDemoKeyboardShortcuts({
  cycleTheme: () => {
    cycleDemoThemeFamily();
    chrome.applyThemeToShowcase(shell.themeFamily);
  },
  toggleAppearance: () => {
    toggleDemoAppearance();
    chrome.applyThemeToShowcase(shell.themeAppearance);
  },
  toggleWireframe: () => {
    toggleDemoWireframe();
    chrome.syncThemeControls();
    shell.themeWireframe.focus();
  },
  toggleGridLines: () => {
    toggleDemoGridLines();
    chrome.syncThemeControls();
    shell.themeGridLines.focus();
  },
  toggleIsoOrientation: () => {
    toggleDemoIsometricOrientation(hostEl);
    persistDemoSession();
    chrome.syncIsoOrientationControl();
    void selectToolRoute(activeRoute);
    shell.isoOrientationFlip.focus();
  },
});

const viewportDebug = attachViewportDebug(hostEl);
attachDemoIsoStageViewport({
  stage: isoStage,
  surface: frameEl,
  notifyHost: hostEl,
});
bindViewportUrlSync({
  host: hostEl,
  viewport: viewportEl,
  routeHash: () => toolRouteHash(activeRoute),
});

function routesEqual(a: DemoToolRoute, b: DemoToolRoute): boolean {
  return a.groupId === b.groupId && a.itemId === b.itemId;
}

function renderToolNav(): void {
  toolsEl.replaceChildren();
  for (const tool of ALL_DEMO_TOOLS) {
    const selected = tool.id === activeRoute.itemId;
    const button = createDemoToolButton({
      label: tool.label,
      icon: itemFeatherIcon(tool.id),
      selected,
      dataset: { toolId: tool.id },
    });
    button.addEventListener("click", () => {
      if (tool.id === activeRoute.itemId) {
        return;
      }
      const route = toolRouteForToolId(tool.id);
      if (route) {
        void selectToolRoute(route);
      }
    });
    toolsEl.appendChild(button);
  }
}

function syncViewTitle(label: string): void {
  viewTitleEl.textContent = label.toUpperCase();
  viewTitleEl.hidden = false;
}

async function selectToolRoute(route: DemoToolRoute): Promise<void> {
  const tool = findToolRoute(route);
  if (!tool) {
    return;
  }
  const canvasKey = canvasRouteKey(route);
  const departingRoute = activeRoute;
  const departingKey = canvasRouteKey(departingRoute);
  const departingTool = findToolRoute(departingRoute);
  const toolbarCtx = {
    host: hostEl,
    viewport: viewportEl,
    optionsPanel: toolbarOptionsEl,
  };
  if (departingTool?.captureArtboardState) {
    const slice = departingTool.captureArtboardState(toolbarCtx);
    if (slice !== undefined) {
      setArtboardSlice(departingKey, slice);
    }
  }
  captureDemoCanvasCameraFromDom(hostEl);
  hostEl.dataset.artboardRoute = canvasKey;
  activeRoute = route;
  getDemoLogger("demo").debug("Selecting tool route", {
    route: canvasKey,
    departing: departingKey,
  });
  const pendingView = parseViewportUrlFrame(window.location.hash);
  syncRouteHashForTool(route);
  renderToolNav();
  document.title = `isocanvas — ${tool.label}`;
  syncViewTitle(tool.label);
  const token = ++mountToken;
  resetDemoBaseline();
  hostEl.replaceChildren();
  hostEl.classList.remove("diagram-host--align-demo");
  applyDemoIsometricOrientationToHost(hostEl);
  toolbarOptionsEl.replaceChildren();
  toolbarOptionsEl.hidden = !tool.usesOptionsPanel;
  toolbarEl.classList.toggle("demo-sidebar-options--active", Boolean(tool.usesOptionsPanel));
  try {
    await tool.mount({
      host: hostEl,
      viewport: viewportEl,
      optionsPanel: toolbarOptionsEl,
      artboardState: getArtboardSlice(canvasKey),
    });
    if (token !== mountToken) {
      return;
    }
    viewportDebug.refresh();
    if (pendingView) {
      applyViewportFromUrlFrame(hostEl, pendingView);
    } else {
      applyDemoHomeView(hostEl);
    }
    hostEl.dispatchEvent(new CustomEvent("viewport-debug-tick", { bubbles: true }));
    persistDemoSession();
    getDemoLogger("demo").info("Tool mounted", { route: canvasKey, toolId: tool.id });
    toolsEl.querySelector<HTMLButtonElement>(`[data-tool-id="${tool.id}"]`)?.focus();
  } catch (error) {
    if (token !== mountToken) {
      return;
    }
    const message = formatMountError(error);
    showDiagramError(hostEl, message);
    getDemoLogger("demo").error("Tool mount failed", {
      toolId: tool.id,
      route: canvasKey,
      error: message,
    });
  }
}

toolsEl.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
    return;
  }
  const ids = ALL_DEMO_TOOLS.map((tool) => tool.id);
  const index = ids.indexOf(activeRoute.itemId);
  if (index < 0) {
    return;
  }
  const nextIndex =
    (index + (event.key === "ArrowDown" ? 1 : -1) + ids.length) % ids.length;
  const nextId = ids[nextIndex];
  if (nextId) {
    const route = toolRouteForToolId(nextId);
    if (route) {
      void selectToolRoute(route);
    }
  }
});

window.addEventListener("hashchange", () => {
  const parsed = parseToolRouteHash(window.location.hash);
  if (parsed && !routesEqual(parsed, activeRoute)) {
    void selectToolRoute(parsed);
    return;
  }
  const frame = parseViewportUrlFrame(window.location.hash);
  if (!frame) {
    return;
  }
  applyViewportFromHash(hostEl, window.location.hash);
  viewportDebug.refresh();
});

renderToolNav();
void selectToolRoute(activeRoute).catch((error: unknown) => {
  getDemoLogger("demo").error("Initial tool mount failed", {
    error: error instanceof Error ? error.message : String(error),
  });
});

if (import.meta.hot) {
  import.meta.hot.accept(
    [
      "./tools.js",
      "./samples/card-grid.ts",
      "./samples/card-stack.ts",
      "../../src/diagram/render-scene.ts",
      "../../src/isometric/mount.ts",
      "../../src/isometric/cube/cube.ts",
      "../../src/isometric/cube/box-parts.ts",
      "../../src/isometric/stage/stage-shell.ts",
      "../../src/layout/artboard-outline.ts",
      "./viewport.ts",
    ],
    () => {
      void selectToolRoute(activeRoute);
    },
  );
}
