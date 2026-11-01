// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it } from "vitest";
import {
  artboardIsoGroundToPlane,
  artboardPlaneToIsoGround,
  artboardUserToPlane,
  DEFAULT_ARTBOARD_USER_SIZE,
  dotGridMacroHomeArtboardUser,
  dotGridMacroHomeOriginUser,
  isoGroundFromArtboardUser,
  planeToArtboardUser,
} from "@westlane/isocanvas";

describe("artboard plane ↔ iso ground", () => {
  it("maps plane origin to iso ground origin", () => {
    const origin = artboardPlaneToIsoGround(0, 0);
    expect(origin.left).toBeCloseTo(0, 9);
    expect(origin.right).toBeCloseTo(0, 9);
  });

  it("round-trips axis-aligned plane steps when rotated 90°", () => {
    const h = DEFAULT_ARTBOARD_USER_SIZE.height;
    const stage = { width: DEFAULT_ARTBOARD_USER_SIZE.width, height: h };
    for (const [px, py] of [
      [18, 0],
      [0, 18],
      [54, 108],
    ] as const) {
      const ground = artboardPlaneToIsoGround(px, py, "rotated", stage);
      const back = artboardIsoGroundToPlane(ground.left, ground.right, "rotated", stage);
      expect(back.x).toBeCloseTo(px, 4);
      expect(back.y).toBeCloseTo(py, 4);
    }
    const top = artboardPlaneToIsoGround(0, 0, "rotated", stage);
    const southWest = artboardPlaneToIsoGround(0, h, "rotated", stage);
    expect(top.left).toBeLessThan(southWest.left);
  });

  it("round-trips axis-aligned plane steps", () => {
    for (const [px, py] of [
      [18, 0],
      [0, 18],
      [54, 108],
      [186, 126],
    ] as const) {
      const ground = artboardPlaneToIsoGround(px, py);
      const back = artboardIsoGroundToPlane(ground.left, ground.right);
      expect(back.x).toBeCloseTo(px, 4);
      expect(back.y).toBeCloseTo(py, 4);
    }
  });

  it("maps artboard user (0,0) to plane bottom-left", () => {
    const h = DEFAULT_ARTBOARD_USER_SIZE.height;
    expect(artboardUserToPlane(0, 0, h)).toEqual({ x: 0, y: h });
    expect(planeToArtboardUser(0, h, h)).toEqual({ x: 0, y: 0 });
  });

  it("maps artboard user origin through iso ground to plane bottom-left", () => {
    const h = DEFAULT_ARTBOARD_USER_SIZE.height;
    const ground = isoGroundFromArtboardUser(0, 0, h);
    const plane = artboardIsoGroundToPlane(ground.left, ground.right);
    expect(plane.x).toBeCloseTo(0, 4);
    expect(plane.y).toBeCloseTo(h, 4);
  });

  it("places macro home in artboard user space above the origin", () => {
    const h = DEFAULT_ARTBOARD_USER_SIZE.height;
    const planeHome = dotGridMacroHomeOriginUser();
    const userHome = dotGridMacroHomeArtboardUser(h);
    expect(artboardUserToPlane(userHome.x, userHome.y, h)).toEqual(planeHome);
  });
});
