// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import { IsometricCanvas } from "@elchininet/isometric";
import {
  DEFAULT_CUBE_CANVAS_SCALE,
  DEFAULT_ISO_CANVAS_COLORS,
  ISO_PRISM_HEXAGON,
  mountIsoBoxesOnCanvas,
  type IsoBoxSpec,
} from "@westlane/isocanvas";
import { isoHexIdleVerticalShades } from "../src/isometric/hexagon/hex-prism-shade.js";

const ORG_PALETTE = {
  top: "#e0f2fe",
  front: "#bfdbfe",
  right: "#93c5fd",
  left: "#60a5fa",
  bottom: "#1d4ed8",
  labelFill: "#1e3a8a",
} as const;

function mountSpec(): HTMLElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const canvas = new IsometricCanvas({
    container: host,
    backgroundColor: "transparent",
    scale: DEFAULT_CUBE_CANVAS_SCALE,
    width: 400,
    height: 300,
  });
  const base: IsoBoxSpec = {
    id: "node",
    label: "VEHICLE",
    left: 2,
    right: 3,
    width: 2,
    depth: 1.25,
    height: 0.9,
    cubeFaceColors: { ...ORG_PALETTE },
    isoPrism: ISO_PRISM_HEXAGON,
  };
  mountIsoBoxesOnCanvas(canvas, [base], DEFAULT_ISO_CANVAS_COLORS);
  return host;
}

describe("hex prism face fills", () => {
  it("ramps recess dark→light left to right and lightest side ridge when idle", () => {
    const host = mountSpec();
    const shades = isoHexIdleVerticalShades({
      ...ORG_PALETTE,
      side: ORG_PALETTE.right,
      back: ORG_PALETTE.left,
    });

    const front = host.querySelector("path.ic-iso-cube-face--front");
    const side = host.querySelector("path.ic-iso-cube-face--side");
    const leftPaths = host.querySelectorAll("path.ic-iso-cube-face--left");
    expect(leftPaths.length).toBe(4);
    expect(front?.getAttribute("fill")).toBe(shades.front);
    expect(side?.getAttribute("fill")).toBe(shades.side);
    const paintedEdges = [...leftPaths].map((path) => path.getAttribute("data-ic-hex-recess-edge"));
    expect(paintedEdges).toEqual(["0", "5", "4", "3"]);
    const recessEdges = ["0", "3", "4", "5"];
    leftPaths.forEach((path) => {
      const edge = path.getAttribute("data-ic-hex-recess-edge")!;
      expect(path.getAttribute("fill")).toBe(shades.recessEdgeFills[recessEdges.indexOf(edge)]);
      expect(path.getAttribute("d")?.length ?? 0).toBeGreaterThan(8);
    });
    expect(shades.recessEdgeFills[0]).toBe(ORG_PALETTE.left);
    expect(shades.side).toBe(ORG_PALETTE.top);
    host.remove();
  });
});
