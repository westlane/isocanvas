// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  artboardPlaneToIsoGround,
  DEFAULT_ARTBOARD_USER_SIZE,
  isometricCanvasMountHost,
  ISO_BOX_LABEL_ROTATION_DEG,
  isoBoxTopFaceLabelLayout,
  paintIsometricOrientation,
  readIsometricOrientationFromElement,
  toggleIsometricOrientation,
} from "@westlane/isocanvas";

describe("isometric orientation", () => {
  it("toggleIsometricOrientation alternates default and rotated", () => {
    expect(toggleIsometricOrientation("default")).toBe("rotated");
    expect(toggleIsometricOrientation("rotated")).toBe("default");
  });

  it("treats unknown orientation attribute values as default", () => {
    const host = document.createElement("div");
    host.setAttribute("data-ic-isometric-orientation", "flipped");
    expect(readIsometricOrientationFromElement(host)).toBe("default");
  });

  it("isometricCanvasMountHost reads ic-canvas props.container", () => {
    const host = document.createElement("div");
    paintIsometricOrientation(host, "rotated");
    const canvas = { props: { container: host } };
    expect(isometricCanvasMountHost(canvas)).toBe(host);
    expect(readIsometricOrientationFromElement(isometricCanvasMountHost(canvas)!)).toBe(
      "rotated",
    );
  });

  it("anchors plane (0,0) at the diamond top when rotated", () => {
    const stage = DEFAULT_ARTBOARD_USER_SIZE;
    const top = artboardPlaneToIsoGround(0, 0, "rotated", stage);
    const bottomLeft = artboardPlaneToIsoGround(0, stage.height, "rotated", stage);
    expect(top.left).toBeLessThan(bottomLeft.left);
    expect(top.right).toBe(bottomLeft.right);
  });

  it("anchors cube labels at the TOP face center (rotation only changes label spin)", () => {
    const center = {
      left: -1,
      right: 1.5,
      top: 1,
    };
    expect(isoBoxTopFaceLabelLayout(2, 3, 1, "default")).toEqual({
      ...center,
      rotation: ISO_BOX_LABEL_ROTATION_DEG.default,
    });
    expect(isoBoxTopFaceLabelLayout(2, 3, 1, "rotated")).toEqual({
      left: 1,
      right: 1.5,
      top: 1,
      rotation: ISO_BOX_LABEL_ROTATION_DEG.rotated,
    });
  });
});
