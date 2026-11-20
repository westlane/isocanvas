// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  VIEWPORT_CENTERED_MEET,
  VIEWPORT_LEFT_BOTTOM_MEET,
  applyArtboardHomeCamera,
  writeViewBoxToSvg,
} from "@westlane/isocanvas";

describe("applyArtboardHomeCamera", () => {
  it("clears plane-grid min meet so viewBox writes stay centered", () => {
    const artboard = document.createElement("div");
    artboard.className = "ic-artboard";
    artboard.dataset.icFrameOnly = "true";
    artboard.dataset.artboardWidth = "800";
    artboard.dataset.artboardHeight = "600";
    artboard.style.setProperty("--ic-artboard-width", "800");
    artboard.style.setProperty("--ic-artboard-height", "600");

    const host = document.createElement("div");
    /** Inner host must look like the artboard outline so {@link findArtboardAncestor} can clear plane-grid meet. */
    host.className = "ic-artboard-content diagram-host";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 800 600");
    svg.setAttribute("data-viewbox-baseline-w", "800");
    svg.setAttribute("data-viewbox-baseline-h", "600");
    svg.dataset.icViewportMeet = "min";
    svg.setAttribute("preserveAspectRatio", VIEWPORT_LEFT_BOTTOM_MEET);
    Object.defineProperty(svg, "clientWidth", { value: 640, configurable: true });
    Object.defineProperty(svg, "clientHeight", { value: 480, configurable: true });
    host.appendChild(svg);
    artboard.appendChild(host);
    document.body.appendChild(artboard);

    const br = { width: 640, height: 480, top: 0, left: 0, bottom: 480, right: 640, x: 0, y: 0 } as DOMRect;
    host.getBoundingClientRect = () => br;
    svg.getBoundingClientRect = () => br;

    expect(applyArtboardHomeCamera(host, { artboardPaddingPx: 16 })).toBe(true);
    writeViewBoxToSvg(svg, { x: 1, y: 2, w: 400, h: 300 });

    expect(svg.dataset.icViewportMeet).toBeUndefined();
    expect(svg.getAttribute("preserveAspectRatio")).toBe(VIEWPORT_CENTERED_MEET);
  });
});
