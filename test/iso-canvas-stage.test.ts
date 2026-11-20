// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

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

  it("row layout keeps every artboard visible side by side", () => {
    const stage = createIsoCanvasStage({
      layout: "row",
      artboards: [
        { id: "a", embedDotGrid: false, label: "Alpha" },
        { id: "b", embedDotGrid: false, label: "Beta" },
      ],
    });
    document.body.appendChild(stage.container);
    expect(stage.layout).toBe("row");
    expect(stage.container.querySelector(".ic-canvas-stage-row")).toBeTruthy();
    expect(stage.getArtboard("a")!.artboard.root.hidden).toBe(false);
    expect(stage.getArtboard("b")!.artboard.root.hidden).toBe(false);
    stage.removeArtboard("a");
    expect(stage.artboardIds()).toEqual(["b"]);
    stage.addArtboard({ id: "c", embedDotGrid: false, label: "Gamma" });
    expect(stage.artboardIds()).toEqual(["b", "c"]);
    stage.destroy();
  });

  it("setArtboardVisible hides row columns without removing content", () => {
    const stage = createIsoCanvasStage({
      layout: "row",
      artboards: [
        { id: "a", embedDotGrid: false },
        { id: "b", embedDotGrid: false },
      ],
    });
    document.body.appendChild(stage.container);
    const hostA = stage.getArtboard("a")!.host;
    hostA.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));

    expect(stage.setArtboardVisible("a", false)).toBe(true);
    expect(stage.isArtboardVisible("a")).toBe(false);
    expect(stage.getArtboard("a")!.artboard.root.hidden).toBe(true);
    expect(hostA.querySelector("svg")).toBeTruthy();

    expect(stage.setArtboardVisible("a", true)).toBe(true);
    expect(stage.getArtboard("a")!.artboard.root.hidden).toBe(false);

    stage.destroy();
  });

  it("continuous row uses plane-row host and column count", () => {
    const stage = createIsoCanvasStage({
      layout: "row",
      row: { continuous: true, gapPx: 6 },
      artboards: [
        { id: "a", embedDotGrid: false, userSize: { width: 200, height: 100 } },
        { id: "b", embedDotGrid: false, userSize: { width: 300, height: 100 } },
        { id: "c", embedDotGrid: false, userSize: { width: 250, height: 100 } },
      ],
    });
    document.body.appendChild(stage.container);
    stage.relayoutArtboards();
    expect(stage.container.style.getPropertyValue("--ic-row-column-count")).toBe("3");
    expect(stage.getArtboard("a")!.artboard.root.getAttribute("data-ic-row-column")).toBe("0");
    expect(stage.getArtboard("c")!.artboard.root.getAttribute("data-ic-row-column")).toBe("2");
    expect(stage.getArtboard("b")!.artboard.root.style.getPropertyValue("--ic-row-column-index")).toBe(
      "1",
    );
    stage.destroy();
  });

  it("setArtboardVisible on single layout switches active when hiding active board", () => {
    const stage = createIsoCanvasStage({
      artboards: [
        { id: "one", embedDotGrid: false },
        { id: "two", embedDotGrid: false },
      ],
      activeArtboardId: "one",
    });
    document.body.appendChild(stage.container);

    expect(stage.setArtboardVisible("one", false)).toBe(true);
    expect(stage.activeArtboardId).toBe("two");
    expect(stage.getArtboard("one")!.artboard.root.hidden).toBe(true);
    expect(stage.setActiveArtboard("one")).toBe(false);

    stage.destroy();
  });

  it("row layout syncCamera applies one viewBox to every visible host", () => {
    const stage = createIsoCanvasStage({
      layout: "row",
      artboards: [
        { id: "a", embedDotGrid: false, userSize: { width: 400, height: 300 } },
        { id: "b", embedDotGrid: false, userSize: { width: 400, height: 300 } },
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
    for (const el of [stage.container, ...stage.getArtboards().map((e) => e.host)]) {
      el.getBoundingClientRect = () => layout;
    }
    const hostA = stage.getArtboard("a")!.host;
    const hostB = stage.getArtboard("b")!.host;
    const svgA = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const svgB = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgA.dataset.debugBaseW = "400";
    svgA.dataset.debugBaseH = "300";
    svgB.dataset.debugBaseW = "400";
    svgB.dataset.debugBaseH = "300";
    hostA.appendChild(svgA);
    hostB.appendChild(svgB);
    svgA.getBoundingClientRect = () => layout;
    svgB.getBoundingClientRect = () => layout;

    stage.fitView();
    const camA = readWorldCameraFromHost(hostA);
    const camB = readWorldCameraFromHost(hostB);
    expect(camA).toBeTruthy();
    expect(camB).toBeTruthy();
    expect(camB!.w).toBeCloseTo(camA!.w, 6);
    expect(camB!.x).toBeCloseTo(camA!.x, 6);

    stage.destroy();
  });

  it("stack layout keeps three artboards in a vertical iso column", () => {
    const stage = createIsoCanvasStage({
      layout: "stack",
      artboards: [
        { id: "a", embedDotGrid: false, label: "A" },
        { id: "b", embedDotGrid: false, label: "B" },
      ],
    });
    document.body.appendChild(stage.container);
    expect(stage.layout).toBe("stack");
    expect(stage.container.classList.contains("ic-canvas-stage--layout-stack")).toBe(true);
    expect(stage.getArtboard("a")!.artboard.root.hidden).toBe(false);
    stage.destroy();
  });
});
