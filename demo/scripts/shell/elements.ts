// Copyright (C) 2026 West Lane - All Rights Reserved
/** Demo shell DOM, icons, buttons, and mount error display. */

import feather from "feather-icons";

export type DemoShellElements = {
  stage: HTMLElement;
  viewTitle: HTMLHeadingElement;
  frame: HTMLElement;
  viewport: HTMLElement;
  sidebar: HTMLElement;
  tools: HTMLElement;
  toolbar: HTMLElement;
  toolbarOptions: HTMLElement;
  isoOrientationFlip: HTMLButtonElement;
  themeFamily: HTMLButtonElement;
  themeGridLines: HTMLButtonElement;
  themeWireframe: HTMLButtonElement;
  themeAppearance: HTMLButtonElement;
};

export type FeatherIconName = keyof typeof feather.icons;

const ITEM_ICONS: Record<string, FeatherIconName> = {
  "card-grid": "grid",
  "card-stack": "layers",
};

const FALLBACK_ICON: FeatherIconName = "circle";

export function itemFeatherIcon(itemId: string): FeatherIconName {
  return ITEM_ICONS[itemId] ?? FALLBACK_ICON;
}

export function createFeatherIcon(name: FeatherIconName, sizePx = 20): SVGSVGElement {
  const icon = feather.icons[name] ?? feather.icons[FALLBACK_ICON];
  const markup = icon.toSvg({
    width: sizePx,
    height: sizePx,
    "stroke-width": 2,
  });
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  const svg = template.content.firstElementChild;
  if (!(svg instanceof SVGSVGElement)) {
    throw new Error(`Feather icon failed to render: ${name}`);
  }
  svg.classList.add("demo-tool-icon");
  svg.setAttribute("aria-hidden", "true");
  return svg;
}

export function createDemoToolButton(options: {
  label: string;
  icon: FeatherIconName;
  selected: boolean;
  dataset: Record<string, string>;
}): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "demo-tool-btn";
  button.role = "tab";
  button.title = options.label;
  button.setAttribute("aria-label", options.label);
  button.setAttribute("aria-selected", options.selected ? "true" : "false");
  button.tabIndex = options.selected ? 0 : -1;
  for (const [key, value] of Object.entries(options.dataset)) {
    button.dataset[key] = value;
  }
  button.appendChild(createFeatherIcon(options.icon));
  return button;
}

export function createDemoIconButton(options: {
  label: string;
  icon: FeatherIconName;
  className?: string;
  iconSizePx?: number;
}): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = options.className ?? "demo-tool-btn";
  button.title = options.label;
  button.setAttribute("aria-label", options.label);
  const icon = createFeatherIcon(options.icon, options.iconSizePx);
  button.appendChild(icon);
  return button;
}

type MermaidErrorShape = {
  message?: string;
  str?: string;
  hash?: string;
  error?: unknown;
};

export function formatMountError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object") {
    const shaped = error as MermaidErrorShape;
    if (typeof shaped.message === "string" && shaped.message.length > 0) {
      return shaped.message;
    }
    if (typeof shaped.str === "string" && shaped.str.length > 0) {
      return shaped.str;
    }
    if (shaped.error instanceof Error) {
      return shaped.error.message;
    }
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Diagram failed to render";
  }
}

export function showDiagramError(host: HTMLElement, message: string): void {
  host.replaceChildren();
  const pre = document.createElement("pre");
  pre.className = "diagram-error";
  pre.textContent = message;
  host.appendChild(pre);
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  id?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (id) {
    node.id = id;
  }
  return node;
}

function toolBtn(className: string, id: string): HTMLButtonElement {
  const button = el("button", `demo-tool-btn ${className}`, id);
  button.type = "button";
  return button;
}

export function mountDemoShell(): DemoShellElements {
  document.body.classList.add("demo-app");

  const stage = el("main", "ic-showcase-stage", "showcase-stage");
  const viewTitle = el("h1", "showcase-view-title", "showcase-view-title") as HTMLHeadingElement;
  viewTitle.hidden = true;
  viewTitle.setAttribute("aria-live", "polite");

  const frame = el("div", "ic-showcase-frame", "diagram-frame");
  const viewport = el("div", "ic-stage-viewport", "diagram-viewport");
  frame.appendChild(viewport);
  stage.append(viewTitle, frame);

  const sidebar = el("aside", "demo-sidebar", "demo-sidebar");
  sidebar.setAttribute("aria-label", "Showcase tools");

  const sidebarBody = el("div", "demo-sidebar-body");
  const tools = el("nav", "demo-tool-rail demo-tool-rail--tools", "showcase-tools");
  tools.setAttribute("role", "tablist");
  tools.setAttribute("aria-label", "Showcase tools");

  const toolbar = el("div", "demo-sidebar-options", "showcase-toolbar");
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Tool options");

  const toolbarOptions = el("div", "demo-toolbar-options", "showcase-toolbar-options");
  toolbarOptions.hidden = true;
  toolbar.append(toolbarOptions);

  sidebarBody.append(tools, toolbar);

  const isoOrientationFlip = toolBtn("demo-iso-orientation-flip", "iso-orientation-flip");
  isoOrientationFlip.setAttribute("aria-pressed", "false");
  isoOrientationFlip.setAttribute("aria-label", "Rotate iso view 90° clockwise");
  isoOrientationFlip.title = "Rotate view 90° clockwise — text faces you (O)";

  const sidebarFooter = el("footer", "demo-sidebar-footer");
  const themeToggles = el("div", "demo-theme-toggles");
  const themeFamily = toolBtn("demo-theme-family", "theme-family");
  themeFamily.setAttribute("aria-label", "Cycle palette");
  themeFamily.title = "Cycle palette (T)";
  const themeGridLines = toolBtn("demo-theme-grid-lines", "theme-grid-lines");
  themeGridLines.setAttribute("aria-pressed", "true");
  themeGridLines.setAttribute("aria-label", "Layout grid lines on");
  themeGridLines.title = "Toggle layout grid lines (G)";
  const themeWireframe = toolBtn("demo-theme-wireframe", "theme-wireframe");
  themeWireframe.setAttribute("aria-pressed", "false");
  themeWireframe.setAttribute("aria-label", "Wireframe mode off");
  themeWireframe.title = "Toggle wireframe (W)";
  const themeAppearance = toolBtn("demo-theme-appearance", "theme-appearance");
  themeAppearance.dataset.appearance = "dark";
  themeAppearance.setAttribute("aria-label", "Switch to light mode");
  themeAppearance.title = "Toggle light/dark (L)";
  themeToggles.append(themeFamily, themeGridLines, themeWireframe, themeAppearance);
  sidebarFooter.append(themeToggles, isoOrientationFlip);

  sidebar.append(sidebarBody, sidebarFooter);
  document.body.append(stage, sidebar);

  return {
    stage,
    viewTitle,
    frame,
    viewport,
    sidebar,
    tools,
    toolbar,
    toolbarOptions,
    isoOrientationFlip,
    themeFamily,
    themeGridLines,
    themeWireframe,
    themeAppearance,
  };
}

export function bindDemoSidebarOffset(sidebar: HTMLElement): void {
  const sync = (): void => {
    const rect = sidebar.getBoundingClientRect();
    document.documentElement.style.setProperty(
      "--demo-sidebar-offset",
      `${Math.ceil(rect.right + 12)}px`,
    );
  };
  sync();
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(sync);
    observer.observe(sidebar);
  }
  window.addEventListener("resize", sync);
}
