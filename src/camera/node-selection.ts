// Copyright (C) 2026 West Lane - All Rights Reserved

import { IC_ISO_CUBE_SHELL_CLASS } from "../isometric/cube/cube-faces.js";

/** Applied to {@link IC_ISO_CUBE_SHELL_CLASS} when its object is selected. */
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

function cubeShellForObjectId(host: HTMLElement, objectId: string): Element | null {
  const node = host.querySelector(
    `g.node[data-object-id="${CSS.escape(objectId)}"]`,
  );
  if (!node) {
    return null;
  }
  return node.closest(`g.${IC_ISO_CUBE_SHELL_CLASS}`) ?? node;
}

export function clearDiagramNodeSelection(host: HTMLElement): void {
  for (const shell of host.querySelectorAll(
    `g.${IC_ISO_CUBE_SHELL_CLASS}.${IC_NODE_SELECTED_CLASS}`,
  )) {
    shell.classList.remove(IC_NODE_SELECTED_CLASS);
  }
}

export function applyDiagramNodeSelection(
  host: HTMLElement,
  objectId: string | null,
): void {
  clearDiagramNodeSelection(host);
  if (!objectId) {
    return;
  }
  const shell = cubeShellForObjectId(host, objectId);
  shell?.classList.add(IC_NODE_SELECTED_CLASS);
}

/** Tap-to-select diagram cubes; ignores drags used for pan. Returns detach. */
export function attachDiagramNodeSelection(
  options: AttachDiagramNodeSelectionOptions,
): DiagramNodeSelectionDetach {
  /** @type {{ x: number; y: number; objectId: string | null } | null} */
  let tapGesture: { x: number; y: number; objectId: string | null } | null = null;

  const setSelection = (objectId: string | null): void => {
    applyDiagramNodeSelection(options.host, objectId);
    options.onSelectionChange?.(objectId);
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
