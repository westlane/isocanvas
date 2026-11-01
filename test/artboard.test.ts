// Copyright (C) 2026 West Lane - All Rights Reserved
// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import {
  applyWorldCameraToHost,
  artboardUserBox,
  artboardUserBoxFromElement,
  createArtboard,
  DEFAULT_ARTBOARD_USER_SIZE,
  IC_ARTBOARD_CLASS,
  viewBoxForArtboardPlaneIsoCanvas,
} from "@westlane/isocanvas";

describe("artboard", () => {
  it("createArtboard nests dot grid under content and records user size", () => {
    const artboard = createArtboard({ userSize: { width: 520, height: 320 } });
    expect(artboard.root.className).toBe(IC_ARTBOARD_CLASS);
    expect(artboard.grid?.className).toBe("ic-dot-grid");
    expect(artboard.content.parentElement).toBe(artboard.surface);
    expect(artboardUserBox(artboard.userSize)).toEqual({
      x: 0,
      y: 0,
      width: 520,
      height: 320,
    });
  });

  it("artboardUserBoxFromElement reads data attributes", () => {
    const { root } = createArtboard({ userSize: DEFAULT_ARTBOARD_USER_SIZE });
    expect(artboardUserBoxFromElement(root)).toEqual({
      x: 0,
      y: 0,
      width: DEFAULT_ARTBOARD_USER_SIZE.width,
      height: DEFAULT_ARTBOARD_USER_SIZE.height,
    });
  });

  it("viewBoxForArtboardPlaneIsoCanvas covers the iso footprint for a square artboard", () => {
    const vb = viewBoxForArtboardPlaneIsoCanvas(DEFAULT_ARTBOARD_USER_SIZE);
    expect(vb.x).toBeCloseTo(0, 4);
    expect(vb.y).toBeCloseTo(-1000 / Math.sqrt(3), 2);
    expect(vb.w).toBeCloseTo(2000, 4);
    expect(vb.h).toBeCloseTo((2000) / Math.sqrt(3), 2);
  });

  it("world camera resolves layers with artboard only (no embedded grid)", () => {
    const artboard = createArtboard({ embedDotGrid: false });
    document.body.appendChild(artboard.root);
    const host = artboard.content;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "1000");
    svg.setAttribute("height", "1000");
    host.appendChild(svg);
    const layoutRect = {
      x: 0,
      y: 0,
      width: 1000,
      height: 1000,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 1000,
    };
    for (const el of [artboard.root, host, svg]) {
      el.getBoundingClientRect = () => layoutRect as DOMRect;
    }
    expect(
      applyWorldCameraToHost(host, { x: 0, y: 0, w: 1000, h: 1000 }),
    ).toBe(true);
    expect(svg.querySelector(".ic-svg-dot-grid")).toBeNull();
    artboard.root.remove();
  });

  it("world camera resolves layers with artboard embedded dot grid", () => {
    const artboard = createArtboard({ embedDotGrid: true });
    document.body.appendChild(artboard.root);
    const host = artboard.content;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "540");
    svg.setAttribute("height", "228");
    host.appendChild(svg);
    const layoutRect = {
      x: 0,
      y: 0,
      width: 540,
      height: 228,
      top: 0,
      left: 0,
      right: 540,
      bottom: 228,
    };
    for (const el of [artboard.root, artboard.surface!, artboard.grid!, host, svg]) {
      el.getBoundingClientRect = () => layoutRect as DOMRect;
    }
    expect(
      applyWorldCameraToHost(host, { x: 0, y: 0, w: 540, h: 228 }),
    ).toBe(true);
    artboard.root.remove();
  });

  it("createArtboard can omit embedded grid", () => {
    const artboard = createArtboard({ embedDotGrid: false });
    expect(artboard.grid).toBeNull();
    expect(artboard.surface).toBeNull();
    expect(artboard.root.querySelector(".ic-dot-grid")).toBeNull();
    expect(artboard.root.dataset.icFrameOnly).toBe("true");
  });
});
