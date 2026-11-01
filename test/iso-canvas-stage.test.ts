// @vitest-environment happy-dom
// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it } from "vitest";
import {
  createIsoCanvasStage,
  IC_ARTBOARD_ID_ATTR,
  readWorldCameraFromHost,
} from "@westlane/isocanvas";

describe("IsoCanvasStage", () => {
  it("registers artboards by id and exposes host mount targets", () => {
    const stage = createIsoCanvasStage({
      artboards: [
        { id: "a", embedDotGrid: false, userSize: { width: 400, height: 300 } },
        { id: "b", embedDotGrid: false, userSize: { width: 520, height: 320 } },
      ],
      activeArtboardId: "a",
    });
    document.body.appendChild(stage.container);

    expect(stage.artboardIds()).toEqual(["a", "b"]);
    expect(stage.getArtboard("a")?.host).toBeInstanceOf(HTMLDivElement);
    expect(stage.getArtboard("missing")).toBeUndefined();
    expect(stage.getArtboards()).toHaveLength(2);
    expect(stage.getActiveArtboard()?.id).toBe("a");
    const boardB = stage.container.querySelector(`[${IC_ARTBOARD_ID_ATTR}="b"]`);
    expect(boardB instanceof HTMLElement && boardB.hidden).toBe(true);

    stage.destroy();
  });

  it("switches active artboard and keeps separate camera state", () => {
    const stage = createIsoCanvasStage({
      artboards: [
        { id: "one", embedDotGrid: false },
        { id: "two", embedDotGrid: false },
      ],
    });
    document.body.appendChild(stage.container);
    const layout = {
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
    } as DOMRect;
    const hostOne = stage.getArtboard("one")!.host;
    const hostTwo = stage.getArtboard("two")!.host;
    for (const el of [
      stage.container,
      hostOne,
      hostTwo,
      hostOne.parentElement!,
      hostTwo.parentElement!,
    ]) {
      el.getBoundingClientRect = () => layout;
    }

    const svgOne = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgOne.dataset.debugBaseW = "1000";
    svgOne.dataset.debugBaseH = "1000";
    hostOne.appendChild(svgOne);
    svgOne.getBoundingClientRect = () => layout;

    const svgTwo = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgTwo.dataset.debugBaseW = "800";
    svgTwo.dataset.debugBaseH = "600";
    hostTwo.appendChild(svgTwo);
    svgTwo.getBoundingClientRect = () => layout;

    stage.fitArtboard("one");
    const camOne = readWorldCameraFromHost(hostOne);
    expect(camOne).toBeTruthy();

    stage.setActiveArtboard("two");
    expect(stage.activeArtboardId).toBe("two");
    expect(stage.getArtboard("two")!.artboard.root.hidden).toBe(false);
    expect(stage.getArtboard("one")!.artboard.root.hidden).toBe(true);

    stage.fitArtboard("two");
    const camTwo = readWorldCameraFromHost(hostTwo);
    expect(camTwo).toBeTruthy();
    expect(camTwo!.w).not.toBeCloseTo(camOne!.w, 0);

    stage.setActiveArtboard("one");
    const restored = readWorldCameraFromHost(hostOne);
    expect(restored!.w).toBeCloseTo(camOne!.w, 0);

    stage.destroy();
  });

  it("addArtboard throws on duplicate ids", () => {
    const stage = createIsoCanvasStage();
    stage.addArtboard({ id: "x", embedDotGrid: false });
    expect(() => stage.addArtboard({ id: "x", embedDotGrid: false })).toThrow(/already registered/);
    stage.destroy();
  });
});
