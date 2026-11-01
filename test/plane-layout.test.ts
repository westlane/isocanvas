// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it } from "vitest";
import {
  applyArtboardGroundElevation,
  artboardGroundElevationIso,
  artboardPlaneToIsoGround,
  isoBoxSpecFromPlaneBox,
} from "@westlane/isocanvas";

describe("plane layout → iso mount", () => {
  it("projects box anchor from plane cell top-left", () => {
    const spec = isoBoxSpecFromPlaneBox({
      id: "a",
      label: "A",
      x: 333,
      y: 0,
      width: 168,
      depth: 105,
    });
    const ground = artboardPlaneToIsoGround(333, 0);
    expect(spec.left).toBeCloseTo(ground.left, 6);
    expect(spec.right).toBeCloseTo(ground.right, 6);
  });

  it("passes elevation through to iso spec", () => {
    const spec = isoBoxSpecFromPlaneBox({
      id: "c",
      label: "C",
      x: 0,
      y: 0,
      width: 168,
      depth: 105,
      elevation: 0.12,
    });
    expect(spec.elevation).toBe(0.12);
  });

  it("lifts specs onto the artboard ground plane for dot-grid alignment", () => {
    const base = isoBoxSpecFromPlaneBox({
      id: "g",
      label: "G",
      x: 0,
      y: 0,
      width: 168,
      depth: 105,
    });
    const lifted = applyArtboardGroundElevation(base);
    expect(lifted.elevation).toBe(artboardGroundElevationIso());
    const stacked = applyArtboardGroundElevation({ ...base, elevation: 0.12 });
    expect(stacked.elevation).toBeCloseTo(artboardGroundElevationIso() + 0.12, 9);
  });

  it("matches direct projection at plane top-left", () => {
    const anchor = artboardPlaneToIsoGround(100, 50);
    const spec = isoBoxSpecFromPlaneBox({
      id: "b",
      label: "B",
      x: 100,
      y: 50,
      width: 168,
      depth: 105,
    });
    expect(spec.left).toBeCloseTo(anchor.left, 6);
    expect(spec.right).toBeCloseTo(anchor.right, 6);
  });

  it("projects ic anchor from back-left footprint pin", () => {
    const box = {
      id: "bl",
      label: "BL",
      x: 20,
      y: 30,
      width: 168,
      depth: 105,
      footprintAnchor: "back-left" as const,
    };
    const icAnchor = artboardPlaneToIsoGround(box.x, box.y);
    const spec = isoBoxSpecFromPlaneBox(box);
    expect(spec.left).toBeCloseTo(icAnchor.left, 6);
    expect(spec.right).toBeCloseTo(icAnchor.right, 6);
  });

  it("matches plane-top-left projection for back-left pin", () => {
    const box = {
      id: "same",
      label: "S",
      x: 40,
      y: 55,
      width: 168,
      depth: 105,
    };
    const topLeft = isoBoxSpecFromPlaneBox(box);
    const backLeft = isoBoxSpecFromPlaneBox({ ...box, footprintAnchor: "back-left" });
    expect(backLeft.left).toBeCloseTo(topLeft.left, 9);
    expect(backLeft.right).toBeCloseTo(topLeft.right, 9);
  });

  it("swaps footprint iso width and depth when rotated (cube turned 90° on ground)", () => {
    const box = {
      id: "r",
      label: "R",
      x: 0,
      y: 0,
      width: 168,
      depth: 105,
    };
    const stage = { width: 1000, height: 1000 };
    const defaultSpec = isoBoxSpecFromPlaneBox(box, "default", stage);
    const rotatedSpec = isoBoxSpecFromPlaneBox(box, "rotated", stage);
    expect(rotatedSpec.width).toBeCloseTo(defaultSpec.depth, 6);
    expect(rotatedSpec.depth).toBeCloseTo(defaultSpec.width, 6);
  });
});
