// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane
/** Floating viewport debug HUD (viewBox, zoom, home reset). */

import { applyDemoHomeView } from "../viewport.js";
import { persistDemoSession } from "../session.js";
import {
  readViewBoxBaselineFromSvg,
  readWorldCameraFromHost,
  readViewBoxFromSvg,
  viewBoxOffsetFromHome,
} from "@westlane/isocanvas";
import { createDemoIconButton } from "./elements.js";

export type ViewportDebugHandle = {
  refresh: () => void;
};

export function attachViewportDebug(host: HTMLElement): ViewportDebugHandle {
  const PANEL_MARGIN_PX = 12;

  const panel = document.createElement("div");
  panel.className = "viewport-debug";
  panel.setAttribute("aria-label", "Viewport debug");
  document.body.appendChild(panel);

  const clampPanelPosition = (): void => {
    const rect = panel.getBoundingClientRect();
    const maxLeft = Math.max(PANEL_MARGIN_PX, window.innerWidth - rect.width - PANEL_MARGIN_PX);
    const maxTop = Math.max(PANEL_MARGIN_PX, window.innerHeight - rect.height - PANEL_MARGIN_PX);
    const left = Number.parseFloat(panel.style.left);
    const top = Number.parseFloat(panel.style.top);
    if (Number.isFinite(left)) {
      panel.style.left = `${Math.min(Math.max(left, PANEL_MARGIN_PX), maxLeft)}px`;
    }
    if (Number.isFinite(top)) {
      panel.style.top = `${Math.min(Math.max(top, PANEL_MARGIN_PX), maxTop)}px`;
    }
  };

  let dragging = false;
  let pointerId = -1;
  let startX = 0;
  let startY = 0;
  let originLeft = 0;
  let originTop = 0;

  panel.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }
    if (event.target instanceof Element && event.target.closest(".viewport-debug-reset")) {
      return;
    }
    dragging = true;
    pointerId = event.pointerId;
    panel.setPointerCapture(pointerId);
    panel.classList.add("viewport-debug--dragging");
    const rect = panel.getBoundingClientRect();
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    originLeft = rect.left;
    originTop = rect.top;
    panel.style.left = `${originLeft}px`;
    panel.style.top = `${originTop}px`;
    startX = event.clientX;
    startY = event.clientY;
    event.preventDefault();
  });

  panel.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== pointerId) {
      return;
    }
    panel.style.left = `${originLeft + event.clientX - startX}px`;
    panel.style.top = `${originTop + event.clientY - startY}px`;
  });

  const endDrag = (event: PointerEvent): void => {
    if (!dragging || event.pointerId !== pointerId) {
      return;
    }
    dragging = false;
    panel.releasePointerCapture(pointerId);
    panel.classList.remove("viewport-debug--dragging");
    clampPanelPosition();
  };

  panel.addEventListener("pointerup", endDrag);
  panel.addEventListener("pointercancel", endDrag);

  type DebugRow = "zoom" | "x" | "y";
  const values: Record<DebugRow, HTMLElement> = {
    zoom: document.createElement("dd"),
    x: document.createElement("dd"),
    y: document.createElement("dd"),
  };

  const list = document.createElement("dl");
  list.className = "viewport-debug-list";
  for (const row of [
    { key: "zoom" as const, label: "zoom" },
    { key: "x" as const, label: "x" },
    { key: "y" as const, label: "y" },
  ]) {
    const item = document.createElement("div");
    item.className = "viewport-debug-item";
    const keyEl = document.createElement("dt");
    keyEl.textContent = row.label;
    item.append(keyEl, values[row.key]);
    list.appendChild(item);
  }

  const refresh = (): void => {
    const svg = host.querySelector("svg");
    let x = 0;
    let y = 0;
    let zoom = 1;
    if (svg) {
      const base = readViewBoxBaselineFromSvg(svg);
      const camera = readWorldCameraFromHost(host) ?? readViewBoxFromSvg(svg);
      const pan = viewBoxOffsetFromHome(camera, base);
      x = pan.x;
      y = pan.y;
      zoom = base.baseW / Math.max(camera.w, 1e-6);
    }
    values.zoom.textContent = `${zoom.toFixed(2)}×`;
    values.x.textContent = x.toFixed(2);
    values.y.textContent = y.toFixed(2);
  };

  const resetBtn = createDemoIconButton({
    label: "Snap view to home",
    icon: "crosshair",
    iconSizePx: 16,
    className: "demo-tool-btn viewport-debug-reset",
  });
  resetBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    event.preventDefault();
    applyDemoHomeView(host);
    refresh();
    persistDemoSession();
  });

  panel.append(resetBtn, list);

  const observer = new MutationObserver(refresh);
  observer.observe(host, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["viewBox", "style"],
  });

  host.addEventListener("viewport-debug-tick", refresh);
  window.addEventListener("resize", clampPanelPosition);
  refresh();

  return { refresh };
}
