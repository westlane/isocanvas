// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  applyDiagramNodeSelection,
  attachDiagramNodeSelection,
  clearDiagramNodeSelection,
  IC_NODE_SELECTED_CLASS,
} from "../src/camera/node-selection.js";
import { IC_ISO_CUBE_SHELL_CLASS } from "../src/isometric/cube/cube-faces.js";
import { isoCubeFaceClassName } from "../src/isometric/cube/cube-faces.js";

describe("diagram node selection", () => {
  it("marks the cube shell for a selected object id", () => {
    const host = document.createElement("div");
    host.innerHTML = `
      <svg>
        <g class="${IC_ISO_CUBE_SHELL_CLASS}">
          <g class="node" data-object-id="story">
            <text>Story</text>
          </g>
        </g>
        <g class="${IC_ISO_CUBE_SHELL_CLASS}">
          <g class="node" data-object-id="map">
            <text>Map</text>
          </g>
        </g>
      </svg>
    `;
    applyDiagramNodeSelection(host, "map");
    const shells = host.querySelectorAll(`g.${IC_ISO_CUBE_SHELL_CLASS}`);
    expect(shells[0]?.classList.contains(IC_NODE_SELECTED_CLASS)).toBe(false);
    expect(shells[0]?.getAttribute("aria-pressed")).toBe("false");
    expect(shells[1]?.classList.contains(IC_NODE_SELECTED_CLASS)).toBe(true);
    expect(shells[1]?.getAttribute("aria-pressed")).toBe("true");
    clearDiagramNodeSelection(host);
    expect(shells[1]?.classList.contains(IC_NODE_SELECTED_CLASS)).toBe(false);
    expect(shells[1]?.getAttribute("aria-pressed")).toBe("false");
  });

  it("selects when tapping a cube face path", () => {
    const host = document.createElement("div");
    const surface = document.createElement("div");
    const faceClass = isoCubeFaceClassName("top");
    host.innerHTML = `
      <svg>
        <g class="${IC_ISO_CUBE_SHELL_CLASS}">
          <path class="${faceClass}" />
          <g class="node" data-object-id="story">
            <text>Story</text>
          </g>
        </g>
      </svg>
    `;
    surface.append(host);
    let selected: readonly string[] = [];
    attachDiagramNodeSelection({
      surface,
      host,
      onSelectionChange: (objectIds) => {
        selected = objectIds;
      },
    });
    const face = host.querySelector("path");
    expect(face).toBeTruthy();
    const rect = { left: 10, top: 10, width: 20, height: 20 };
    face!.getBoundingClientRect = () =>
      ({
        ...rect,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        x: rect.left,
        y: rect.top,
        toJSON: () => ({}),
      }) as DOMRect;
    const base = {
      bubbles: true,
      clientX: 15,
      clientY: 15,
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
    };
    face!.dispatchEvent(new PointerEvent("pointerdown", base));
    face!.dispatchEvent(new PointerEvent("pointerup", base));
    expect(selected).toEqual(["story"]);
    expect(
      host.querySelector(`g.${IC_ISO_CUBE_SHELL_CLASS}.${IC_NODE_SELECTED_CLASS}`),
    ).toBeTruthy();

    face!.dispatchEvent(new PointerEvent("pointerdown", base));
    face!.dispatchEvent(new PointerEvent("pointerup", base));
    expect(selected).toEqual([]);
    expect(
      host.querySelector(`g.${IC_ISO_CUBE_SHELL_CLASS}.${IC_NODE_SELECTED_CLASS}`),
    ).toBeFalsy();
  });

  it("keeps other cubes pressed when toggling a second cube on", () => {
    const host = document.createElement("div");
    const surface = document.createElement("div");
    host.innerHTML = `
      <svg>
        <g class="${IC_ISO_CUBE_SHELL_CLASS}">
          <g class="node" data-object-id="story"><text>S</text></g>
        </g>
        <g class="${IC_ISO_CUBE_SHELL_CLASS}">
          <g class="node" data-object-id="map"><text>M</text></g>
        </g>
      </svg>
    `;
    surface.append(host);
    let selected: readonly string[] = [];
    attachDiagramNodeSelection({ surface, host, onSelectionChange: (ids) => { selected = ids; } });
    const tap = (objectId: string) => {
      const node = host.querySelector(`g.node[data-object-id="${objectId}"]`);
      const target = node ?? host;
      const base = {
        bubbles: true,
        clientX: 15,
        clientY: 15,
        button: 0,
        pointerId: 1,
        pointerType: "mouse",
      };
      target.dispatchEvent(new PointerEvent("pointerdown", base));
      target.dispatchEvent(new PointerEvent("pointerup", base));
    };
    tap("story");
    tap("map");
    expect(selected).toEqual(["map", "story"]);
    expect(host.querySelectorAll(`g.${IC_NODE_SELECTED_CLASS}`).length).toBe(2);
  });
});
