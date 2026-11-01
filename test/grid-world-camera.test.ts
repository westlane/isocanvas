// @vitest-environment happy-dom
// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it } from "vitest";
import { applyWorldCameraToHost, createArtboard } from "@westlane/isocanvas";

describe("grid world camera sync", () => {
  it("syncs pan/zoom to the artboard-embedded dot grid", () => {
    const artboard = createArtboard({
      embedDotGrid: true,
      dotGrid: { macroSpan: 3 },
    });
    document.body.appendChild(artboard.root);
    artboard.root.style.width = "400px";
    artboard.root.style.height = "300px";
    expect(artboard.grid).not.toBeNull();
    artboard.surface!.style.setProperty("--ic-dot-grid-size", "18px");
    artboard.surface!.style.setProperty("--ic-dot-grid-inset", "0");
    artboard.surface!.style.setProperty("--ic-dot-grid-extent", "100%");

    const host = artboard.content;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "400");
    svg.setAttribute("height", "300");
    host.appendChild(svg);

    const layoutRect = { x: 0, y: 0, width: 400, height: 300, top: 0, left: 0, right: 400, bottom: 300 };
    for (const el of [artboard.root, artboard.surface!, artboard.grid!, host, svg]) {
      el.getBoundingClientRect = () => layoutRect as DOMRect;
    }

    expect(applyWorldCameraToHost(host, { x: 0, y: 0, w: 400, h: 300 })).toBe(true);
    const planeAtOrigin = artboard.grid!.parentElement?.style.transform ?? "";
    const phaseAtOrigin = artboard.grid!.style.maskPosition || artboard.grid!.style.webkitMaskPosition;

    expect(applyWorldCameraToHost(host, { x: 40, y: 20, w: 400, h: 300 })).toBe(true);
    const planePanned = artboard.grid!.parentElement?.style.transform ?? "";

    expect(applyWorldCameraToHost(host, { x: 0, y: 0, w: 200, h: 150 })).toBe(true);
    const planeZoomed = artboard.grid!.parentElement?.style.transform ?? "";

    expect(planeAtOrigin).not.toBe(planePanned);
    expect(planePanned).toMatch(/^translate\(/);
    expect(planeZoomed).toMatch(/scale\(/);
    const x = Number.parseFloat(phaseAtOrigin.split(" ")[0] ?? "0");
    expect(x).toBeLessThan(400);
    expect(artboard.surface!.querySelector(".ic-dot-grid-macro")).not.toBeNull();
  });
});
