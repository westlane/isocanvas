// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  applyWorldCameraToHost,
  centeredArtboardHomeView,
  createArtboard,
  DEFAULT_ARTBOARD_USER_SIZE,
  readViewBoxBaselineFromSvg,
  readWorldCameraFromHost,
} from "@westlane/isocanvas";
import { setDemoCanvasCamera } from "../demo/scripts/session.js";
import {
  restoreDemoViewportAfterToolMount,
} from "../demo/scripts/viewport.js";
import { demoThemeManager, initDemoTheme } from "../demo/scripts/theme.js";
import { mountCardGrid } from "./fixtures/card-grid.js";

async function flushAnimationFrames(count = 8): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

function mountDemoHost(): { host: HTMLElement; home: NonNullable<ReturnType<typeof centeredArtboardHomeView>> } {
  initDemoTheme(document.documentElement);
  const artboard = createArtboard({
    embedDotGrid: false,
    userSize: DEFAULT_ARTBOARD_USER_SIZE,
  });
  document.body.appendChild(artboard.root);
  artboard.root.style.width = "800px";
  artboard.root.style.height = "600px";
  const host = artboard.content;
  mountCardGrid(host, demoThemeManager().getTheme().colors);
  const svg = host.querySelector("svg")!;
  const layout = { x: 0, y: 0, width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600 };
  for (const el of [artboard.root, host, svg]) {
    el.getBoundingClientRect = () => layout as DOMRect;
  }
  const baseline = readViewBoxBaselineFromSvg(svg);
  const home = centeredArtboardHomeView(host, baseline);
  expect(home).not.toBeNull();
  return { host, home: home! };
}

describe("restoreDemoViewportAfterToolMount", () => {
  it("restores stored camera on same-route remount when hash has no view", async () => {
    const { host, home } = mountDemoHost();
    const panned = { ...home, x: home.x - 520, y: home.y - 460 };
    setDemoCanvasCamera({ viewBox: panned });

    restoreDemoViewportAfterToolMount(host, { pendingView: null, sameRouteRemount: true });
    await flushAnimationFrames();

    const camera = readWorldCameraFromHost(host)!;
    expect(camera.x).toBeCloseTo(panned.x, 0);
    expect(camera.y).toBeCloseTo(panned.y, 0);
  });

  it("uses home on cross-route mount when hash has no view", async () => {
    const { host, home } = mountDemoHost();
    expect(applyWorldCameraToHost(host, { ...home, x: home.x - 520, y: home.y - 460 })).toBe(true);
    setDemoCanvasCamera({ viewBox: { ...home, x: home.x - 520, y: home.y - 460 } });

    restoreDemoViewportAfterToolMount(host, { pendingView: null, sameRouteRemount: false });
    await flushAnimationFrames();

    const camera = readWorldCameraFromHost(host)!;
    expect(camera.x).toBeCloseTo(home.x, 0);
    expect(camera.y).toBeCloseTo(home.y, 0);
  });
});
