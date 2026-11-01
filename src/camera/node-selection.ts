// Copyright (C) 2026 West Lane - All Rights Reserved

import { IC_ISO_CUBE_SHELL_CLASS } from "../isometric/cube/cube-faces.js";

/** Applied to {@link IC_ISO_CUBE_SHELL_CLASS} when its object is toggled on (pressed latched). */
export const IC_NODE_SELECTED_CLASS = "ic-node--selected";

const TAP_DRAG_THRESHOLD_PX = 6;

export type DiagramNodeSelectionDetach = () => void;

export type AttachDiagramNodeSelectionOptions = {
  surface: HTMLElement;
  host: HTMLElement;
  /** Called after selection changes (including clear). */
  onSelectionChange?: (objectId: string | null) => void;
};

function objectIdFromTarget(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const onNode = target.closest("g.node[data-object-id]");
  const fromNode = onNode?.getAttribute("data-object-id")?.trim();
  if (fromNode) {
    return fromNode;
  }
  const shell = target.closest(`g.${IC_ISO_CUBE_SHELL_CLASS}`);
  const nested = shell?.querySelector("g.node[data-object-id]");
  const fromShell = nested?.getAttribute("data-object-id")?.trim();
  return fromShell || null;
}

function objectIdFromShell(shell: Element): string | null {
  const nested = shell.querySelector("g.node[data-object-id]");
  return nested?.getAttribute("data-object-id")?.trim() ?? null;
}

function readSelectionFromHost(host: HTMLElement): string | null {
  const selected = host.querySelector(
    `g.${IC_ISO_CUBE_SHELL_CLASS}.${IC_NODE_SELECTED_CLASS} g.node[data-object-id]`,
  );
  return selected?.getAttribute("data-object-id")?.trim() ?? null;
}

function syncCubeShellTogglePresentation(
  host: HTMLElement,
  objectId: string | null,
): void {
  for (const shell of host.querySelectorAll(`g.${IC_ISO_CUBE_SHELL_CLASS}`)) {
    const id = objectIdFromShell(shell);
    const pressed = Boolean(id && id === objectId);
    shell.classList.toggle(IC_NODE_SELECTED_CLASS, pressed);
    shell.setAttribute("role", "button");
    shell.setAttribute("aria-pressed", pressed ? "true" : "false");
    if (id) {
      shell.setAttribute("aria-label", id);
    }
  }
}

export function clearDiagramNodeSelection(host: HTMLElement): void {
  syncCubeShellTogglePresentation(host, null);
}

export function applyDiagramNodeSelection(
  host: HTMLElement,
  objectId: string | null,
): void {
  syncCubeShellTogglePresentation(host, objectId);
}

/** Tap-to-toggle diagram cubes; ignores drags used for pan. Returns detach. */
export function attachDiagramNodeSelection(
  options: AttachDiagramNodeSelectionOptions,
): DiagramNodeSelectionDetach {
  /** @type {{ x: number; y: number; objectId: string | null } | null} */
  let tapGesture: { x: number; y: number; objectId: string | null } | null = null;
  let selectedId: string | null = readSelectionFromHost(options.host);

  const setSelection = (objectId: string | null): void => {
    let next: string | null = objectId;
    if (objectId && objectId === selectedId) {
      next = null;
    } else if (!objectId) {
      next = null;
    }
    selectedId = next;
    applyDiagramNodeSelection(options.host, next);
    options.onSelectionChange?.(next);
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
      setSelection(tapGesture.objectId);
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
