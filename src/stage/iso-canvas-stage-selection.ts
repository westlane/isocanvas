// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import {
  applyDiagramNodeSelection,
  type DiagramNodeSelectionDetach,
} from "../camera/node-selection.js";
import {
  applyIsoCubePointerPressToHost,
  restoreIsoCubeExtrusionOnHost,
} from "../isometric/cube/extrusion-press.js";
import { IC_ISO_CUBE_SHELL_CLASS } from "../isometric/cube/cube-faces.js";
import { DIAGRAM_OBJECT_SELECTABLE_ATTR } from "../types/diagram-interaction.js";
import type { IsoCanvasStage } from "../types/stage.js";

const TAP_DRAG_THRESHOLD_PX = 6;

export type IsoCanvasStageNodeSelectionMode = "toggle" | "single";

export type AttachIsoCanvasStageNodeSelectionOptions = {
  stage: IsoCanvasStage;
  surface: HTMLElement;
  initialSelection?: readonly string[];
  /** `toggle` = independent latches (demo); `single` = one inspected object at a time. */
  selectionMode?: IsoCanvasStageNodeSelectionMode;
  /** When false, skip `onSelectionChange` on the first sync (restored selection). */
  emitInitialSelection?: boolean;
  /** @deprecated Ignored — pan chrome is applied after pointerdown; do not gate taps on it. */
  panningClass?: string;
  onSelectionChange?: (selectedIds: readonly string[]) => void;
};

function diagramObjectSelectable(node: Element | null): boolean {
  return node?.getAttribute(DIAGRAM_OBJECT_SELECTABLE_ATTR) !== "false";
}

function selectableNodeFromShell(shell: Element): Element | null {
  for (const nested of Array.from(shell.querySelectorAll("g.node[data-object-id]"))) {
    if (diagramObjectSelectable(nested)) {
      return nested;
    }
  }
  return null;
}

function objectIdFromTarget(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const onNode = target.closest("g.node[data-object-id]");
  if (onNode && diagramObjectSelectable(onNode)) {
    return onNode.getAttribute("data-object-id")?.trim() || null;
  }
  const shell = target.closest(`g.${IC_ISO_CUBE_SHELL_CLASS}`);
  if (!shell) {
    return null;
  }
  const nested = selectableNodeFromShell(shell);
  return nested?.getAttribute("data-object-id")?.trim() ?? null;
}

/** One pointer surface for every artboard on a stage (avoids duplicate move handlers). */
export function attachIsoCanvasStageNodeSelection(
  options: AttachIsoCanvasStageNodeSelectionOptions,
): DiagramNodeSelectionDetach {
  let selectedIds = new Set(options.initialSelection ?? []);
  let tapGesture: { x: number; y: number; objectId: string | null } | null = null;
  const selectionMode = options.selectionMode ?? "toggle";
  let initialSyncPending = options.emitInitialSelection === false;

  const notify = (): void => {
    if (initialSyncPending) {
      initialSyncPending = false;
      return;
    }
    const sorted = [...selectedIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    options.onSelectionChange?.(sorted);
  };

  const applyAll = (): void => {
    for (const entry of options.stage.getArtboards()) {
      applyDiagramNodeSelection(entry.host, selectedIds);
    }
    notify();
  };

  const toggleObject = (objectId: string | null): void => {
    if (!objectId) {
      selectedIds = new Set();
      applyAll();
      return;
    }
    if (selectionMode === "single") {
      selectedIds =
        selectedIds.size === 1 && selectedIds.has(objectId) ? new Set() : new Set([objectId]);
      applyAll();
      return;
    }
    const next = new Set(selectedIds);
    if (next.has(objectId)) {
      next.delete(objectId);
    } else {
      next.add(objectId);
    }
    selectedIds = next;
    applyAll();
  };

  applyAll();

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }
    const objectId = objectIdFromTarget(event.target);
    tapGesture = {
      x: event.clientX,
      y: event.clientY,
      objectId,
    };
    if (objectId) {
      for (const entry of options.stage.getArtboards()) {
        applyIsoCubePointerPressToHost(entry.host, objectId, selectedIds);
      }
    }
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!tapGesture) {
      return;
    }
    const dx = event.clientX - tapGesture.x;
    const dy = event.clientY - tapGesture.y;
    if (dx * dx + dy * dy >= TAP_DRAG_THRESHOLD_PX * TAP_DRAG_THRESHOLD_PX) {
      tapGesture = null;
    }
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (!tapGesture || event.button !== 0) {
      return;
    }
    const dx = event.clientX - tapGesture.x;
    const dy = event.clientY - tapGesture.y;
    const isTap = dx * dx + dy * dy < TAP_DRAG_THRESHOLD_PX * TAP_DRAG_THRESHOLD_PX;
    if (isTap) {
      toggleObject(tapGesture.objectId);
    } else {
      for (const entry of options.stage.getArtboards()) {
        restoreIsoCubeExtrusionOnHost(entry.host, selectedIds);
      }
    }
    tapGesture = null;
  };

  const capture = { capture: true };
  options.surface.addEventListener("pointerdown", onPointerDown, capture);
  options.surface.addEventListener("pointermove", onPointerMove, capture);
  options.surface.addEventListener("pointerup", onPointerUp, capture);
  options.surface.addEventListener("pointercancel", onPointerUp, capture);

  return () => {
    options.surface.removeEventListener("pointerdown", onPointerDown, capture);
    options.surface.removeEventListener("pointermove", onPointerMove, capture);
    options.surface.removeEventListener("pointerup", onPointerUp, capture);
    options.surface.removeEventListener("pointercancel", onPointerUp, capture);
    tapGesture = null;
  };
}
