// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  loadDiagramViewportFromStorage,
  parseDiagramViewportStorageSnapshot,
  restoreDiagramViewportFromStorage,
  saveDiagramViewportToStorage,
  serializeDiagramViewportStorageSnapshot,
} from "../src/camera/diagram-viewport-persistence.js";
import { readWorldCameraFromHost } from "../src/camera/world/apply-world-camera.js";
import { createDiagramArtboard } from "../src/diagram/diagram-document.js";

describe("diagram viewport persistence", () => {
  it("round-trips viewBox JSON", () => {
    const viewBox = { x: 120, y: 80, w: 640, h: 480 };
    const raw = serializeDiagramViewportStorageSnapshot(viewBox);
    expect(parseDiagramViewportStorageSnapshot(raw)).toEqual(viewBox);
  });

  it("rejects invalid snapshots", () => {
    expect(parseDiagramViewportStorageSnapshot("")).toBeNull();
    expect(parseDiagramViewportStorageSnapshot('{"v":2,"viewBox":{"x":0,"y":0,"w":1,"h":1}}')).toBeNull();
    expect(parseDiagramViewportStorageSnapshot('{"v":1,"viewBox":{"x":0,"y":0,"w":0,"h":1}}')).toBeNull();
  });

  it("loads and restores camera on a diagram host", () => {
    const storage = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    };
    const key = "test:viewport";
    const saved = { x: 50, y: 40, w: 900, h: 900 };
    saveDiagramViewportToStorage(key, saved, mockStorage);
    expect(loadDiagramViewportFromStorage(key, mockStorage)).toEqual(saved);

    const artboard = createDiagramArtboard({ contentId: "diagram-host" });
    document.body.appendChild(artboard.root);
    artboard.root.style.width = "400px";
    artboard.root.style.height = "400px";
    const host = artboard.content;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "400");
    svg.setAttribute("height", "400");
    svg.setAttribute("viewBox", "0 0 1000 1000");
    host.appendChild(svg);

    const layoutRect = {
      x: 0,
      y: 0,
      width: 400,
      height: 400,
      top: 0,
      left: 0,
      right: 400,
      bottom: 400,
    };
    for (const el of [artboard.root, host, svg]) {
      el.getBoundingClientRect = () => layoutRect as DOMRect;
    }
    expect(restoreDiagramViewportFromStorage(host, key, mockStorage)).toBe(true);
    expect(readWorldCameraFromHost(host)).toEqual(saved);
  });
});
