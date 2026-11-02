// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import { IsometricCanvas } from "@elchininet/isometric";
import {
  DEFAULT_CUBE_CANVAS_SCALE,
  DEFAULT_ISO_CANVAS_COLORS,
  ISO_PRISM_HEXAGON,
  createLocalIsoPrismParts,
  mountIsoBoxesOnCanvas,
  type IsoBoxSpec,
} from "@westlane/isocanvas";
import {
  isoHexBackLeftVerticalEdgeIndex,
  isoHexLeftVerticalEdgeIndices,
  isoHexSideVerticalEdgeIndex,
} from "../src/isometric/hexagon/hex-vertical-face.js";

describe("iso hexagon prism", () => {
  it("maps side and left vertical edges like the iso cube", () => {
    expect(isoHexSideVerticalEdgeIndex()).toBe(1);
    expect(isoHexBackLeftVerticalEdgeIndex()).toBe(0);
    expect(isoHexLeftVerticalEdgeIndices()).toEqual([0, 3, 4, 5]);
  });

  it("builds a six-edge curved top face path", () => {
    const spec: IsoBoxSpec = {
      id: "org-member",
      label: "Member",
      left: 2,
      right: 3,
      width: 2,
      depth: 1.25,
      height: 0.9,
      isoPrism: ISO_PRISM_HEXAGON,
    };
    const { faces } = createLocalIsoPrismParts(spec, DEFAULT_ISO_CANVAS_COLORS);
    expect(faces.top.getElement().classList.contains("ic-iso-cube-face--top")).toBe(true);
    expect(faces.bottom.getElement().classList.contains("ic-iso-cube-face--bottom")).toBe(true);
    expect(faces.front.getElement().tagName.toLowerCase()).toBe("path");
  });

  it("mounts hex faces on the canvas", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const canvas = new IsometricCanvas({
      container: host,
      backgroundColor: "transparent",
      scale: DEFAULT_CUBE_CANVAS_SCALE,
      width: 400,
      height: 300,
    });
    mountIsoBoxesOnCanvas(
      canvas,
      [
        {
          id: "org-member",
          label: "Member",
          left: 2,
          right: 3,
          width: 2,
          depth: 1.25,
          height: 0.9,
          isoPrism: ISO_PRISM_HEXAGON,
        },
      ],
      DEFAULT_ISO_CANVAS_COLORS,
    );
    expect(host.querySelector("path.ic-iso-cube-face--top")).toBeTruthy();
    expect(host.querySelector("path.ic-iso-cube-face--front")).toBeTruthy();
    expect(host.querySelector("path.ic-iso-cube-face--side")).toBeTruthy();
    expect(host.querySelectorAll("path.ic-iso-cube-face--left").length).toBe(4);
    expect(host.querySelector("path.ic-iso-cube-face--back")).toBeNull();
    host.remove();
  });
});
