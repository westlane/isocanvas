// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IC_ISO_CUBE_SHELL_CLASS } from "../isometric/cube/cube-faces.js";
import { DIAGRAM_OBJECT_SELECTABLE_ATTR } from "../types/diagram-interaction.js";

/** Applied to {@link IC_ISO_CUBE_SHELL_CLASS} when its object is toggled on (pressed latched). */
export const IC_NODE_SELECTED_CLASS = "ic-node--selected";

const TAP_DRAG_THRESHOLD_PX = 6;

export type DiagramNodeSelectionDetach = () => void;

export type DiagramNodeSelectionState = ReadonlySet<string>;

export type AttachDiagramNodeSelectionOptions = {
  surface: HTMLElement;
  host: HTMLElement;
  /** Called after selection changes (including clear). */
  onSelectionChange?: (selectedIds: readonly string[]) => void;
};

/** When `"false"`, cube is decorative (e.g. companion foundation slab) — no tap selection or button chrome. */
export { DIAGRAM_OBJECT_SELECTABLE_ATTR } from "../types/diagram-interaction.js";

function diagramObjectSelectable(node: Element | null): boolean {
  return node?.getAttribute(DIAGRAM_OBJECT_SELECTABLE_ATTR) !== "false";
}

function selectableNodeFromShell(shell: Element): Element | null {
  const nested = shell.querySelector("g.node[data-object-id]");
  if (!nested || !diagramObjectSelectable(nested)) {
    return null;
  }
  return nested;
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

function objectIdFromShell(shell: Element): string | null {
  const nested = selectableNodeFromShell(shell);
  return nested?.getAttribute("data-object-id")?.trim() ?? null;
}

function selectionIdsSorted(ids: ReadonlySet<string>): readonly string[] {
  return [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function normalizeDiagramNodeSelection(
  selection: string | null | Iterable<string> | DiagramNodeSelectionState,
): Set<string> {
  if (selection === null) {
    return new Set();
  }
  if (typeof selection === "string") {
    const id = selection.trim();
    return id ? new Set([id]) : new Set();
  }
  if (selection instanceof Set) {
    return new Set(selection);
  }
  return new Set(selection);
}

function readSelectionFromHost(host: HTMLElement): Set<string> {
  const ids = new Set<string>();
  for (const shell of Array.from(
    host.querySelectorAll(`g.${IC_ISO_CUBE_SHELL_CLASS}.${IC_NODE_SELECTED_CLASS}`),
  )) {
    const id = objectIdFromShell(shell);
    if (id) {
      ids.add(id);
    }
  }
  return ids;
}

function syncCubeShellTogglePresentation(
  host: HTMLElement,
  selectedIds: ReadonlySet<string>,
): void {
  for (const shell of Array.from(host.querySelectorAll(`g.${IC_ISO_CUBE_SHELL_CLASS}`))) {
    const id = objectIdFromShell(shell);
    if (!id) {
      shell.classList.remove(IC_NODE_SELECTED_CLASS);
      shell.removeAttribute("role");
      shell.removeAttribute("aria-pressed");
      shell.removeAttribute("aria-label");
      continue;
    }
    const pressed = selectedIds.has(id);
    shell.classList.toggle(IC_NODE_SELECTED_CLASS, pressed);
    shell.setAttribute("role", "button");
    shell.setAttribute("aria-pressed", pressed ? "true" : "false");
    shell.setAttribute("aria-label", id);
  }
}

export function clearDiagramNodeSelection(host: HTMLElement): void {
  syncCubeShellTogglePresentation(host, new Set());
}

export function applyDiagramNodeSelection(
  host: HTMLElement,
  selection: string | null | Iterable<string> | DiagramNodeSelectionState,
): void {
  syncCubeShellTogglePresentation(host, normalizeDiagramNodeSelection(selection));
}

/** Tap-to-toggle diagram cubes independently; ignores drags used for pan. Returns detach. */
export function attachDiagramNodeSelection(
  options: AttachDiagramNodeSelectionOptions,
): DiagramNodeSelectionDetach {
  /** @type {{ x: number; y: number; objectId: string | null } | null} */
  let tapGesture: { x: number; y: number; objectId: string | null } | null = null;
  let selectedIds = readSelectionFromHost(options.host);

  const notify = (): void => {
    options.onSelectionChange?.(selectionIdsSorted(selectedIds));
  };

  const applySelection = (): void => {
    applyDiagramNodeSelection(options.host, selectedIds);
    notify();
  };

  const toggleObject = (objectId: string | null): void => {
    if (!objectId) {
      selectedIds = new Set();
      applySelection();
      return;
    }
    const next = new Set(selectedIds);
    if (next.has(objectId)) {
      next.delete(objectId);
    } else {
      next.add(objectId);
    }
    selectedIds = next;
    applySelection();
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }
    tapGesture = {
      x: event.clientX,
      y: event.clientY,
      objectId: objectIdFromTarget(event.target),
    };
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
    const isTap =
      dx * dx + dy * dy < TAP_DRAG_THRESHOLD_PX * TAP_DRAG_THRESHOLD_PX;
    if (isTap) {
      toggleObject(tapGesture.objectId);
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
