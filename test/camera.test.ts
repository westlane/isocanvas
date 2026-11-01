// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it } from "vitest";
import {
  urlFrameFromViewportCameras,
  viewBoxCenter,
  viewBoxFromZoomCenter,
  viewportCamerasFromParts,
  zoomFromViewBox,
} from "@westlane/isocanvas";

describe("camera model", () => {
  it("frames the canvas viewBox from zoom and center", () => {
    const cameras = viewportCamerasFromParts({
      zoom: 2,
      cx: 100,
      cy: 50,
      baselineWidth: 520,
      baselineHeight: 320,
    });
    expect(cameras.canvas.viewBox.w).toBe(260);
    expect(viewBoxCenter(cameras.canvas.viewBox)).toEqual({ cx: 100, cy: 50 });
  });

  it("round-trips zoom through viewBox", () => {
    const baselineW = 520;
    const viewBox = viewBoxFromZoomCenter(1.5, 200, 120, 520, 320);
    expect(zoomFromViewBox(viewBox, baselineW)).toBeCloseTo(1.5, 5);
    const frame = urlFrameFromViewportCameras(
      { canvas: { viewBox } },
      baselineW,
    );
    expect(frame.cx).toBeCloseTo(200, 5);
  });
});
