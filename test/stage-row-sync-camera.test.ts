// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it, vi } from "vitest";
import {
  applyWorldCameraViewBoxToHost,
  attachSyncedWorldCameraPanZoom,
  readViewBoxBaselineFromHost,
  readWorldCameraFromHost,
} from "@westlane/isocanvas";

function frameOnlyHost(): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "ic-artboard";
  root.dataset.icFrameOnly = "true";
  const content = document.createElement("div");
  content.className = "ic-artboard-content";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  content.appendChild(svg);
  root.appendChild(content);
  return content;
}

describe("synced row world camera", () => {
  it("applyWorldCameraViewBoxToHost skips redundant DOM writes", () => {
    const host = frameOnlyHost();
    const svg = host.querySelector("svg")!;
    const camera = { x: 10, y: 20, w: 400, h: 300 };
    applyWorldCameraViewBoxToHost(host, camera);
    const setAttr = vi.spyOn(svg, "setAttribute");
    setAttr.mockClear();
    expect(applyWorldCameraViewBoxToHost(host, camera)).toBe(true);
    expect(setAttr).not.toHaveBeenCalled();
    setAttr.mockRestore();
  });

  it("attachSyncedWorldCameraPanZoom updates peer viewBox during pan move", () => {
    const surface = document.createElement("div");
    document.body.appendChild(surface);
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
    surface.getBoundingClientRect = () => layout;

    const primaryHost = frameOnlyHost();
    const peerHost = frameOnlyHost();
    surface.appendChild(primaryHost.parentElement!);
    surface.appendChild(peerHost.parentElement!);

    applyWorldCameraViewBoxToHost(primaryHost, { x: 0, y: 0, w: 500, h: 400 });
    applyWorldCameraViewBoxToHost(peerHost, { x: 0, y: 0, w: 500, h: 400 });

    const rafCallbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    const detach = attachSyncedWorldCameraPanZoom({
      surface,
      host: primaryHost,
      hosts: [primaryHost, peerHost],
    });

    surface.dispatchEvent(
      new PointerEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, bubbles: true }),
    );
    surface.dispatchEvent(
      new PointerEvent("pointermove", { button: 0, clientX: 140, clientY: 120, bubbles: true }),
    );
    for (const cb of rafCallbacks) {
      cb(0);
    }

    const peerCam = readWorldCameraFromHost(peerHost);
    const primaryCam = readWorldCameraFromHost(primaryHost);
    expect(peerCam).toBeTruthy();
    expect(primaryCam).toBeTruthy();
    expect(primaryCam!.x).not.toBe(0);
    expect(peerCam!.w).toBeCloseTo(primaryCam!.w, 6);
    const primaryBaseline = readViewBoxBaselineFromHost(primaryHost);
    const peerBaseline = readViewBoxBaselineFromHost(peerHost);
    if (primaryBaseline && peerBaseline) {
      const primaryHome = { w: primaryBaseline.baseW, h: primaryBaseline.baseH };
      const scaleP = primaryCam!.w / primaryHome.w;
      const scalePeer = peerCam!.w / peerBaseline.baseW;
      expect(scalePeer).toBeCloseTo(scaleP, 4);
    }

    detach();
    vi.unstubAllGlobals();
    surface.remove();
  });
});
