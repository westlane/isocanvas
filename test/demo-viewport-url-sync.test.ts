// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  applyWorldCameraToHost,
  bindViewportUrlSync,
  centeredArtboardHomeView,
  createArtboard,
  DEFAULT_ARTBOARD_USER_SIZE,
  readViewBoxBaselineFromSvg,
} from "@westlane/isocanvas";
import {
  bindViewportUrlSync as bindDemoViewportUrlSync,
  flushDemoViewportUrlSync,
  scheduleDemoViewportUrlSync,
} from "../demo/scripts/viewport.js";
import { setDemoCanvasCamera } from "../demo/scripts/session.js";
import { toolRouteHash, type DemoToolRoute } from "../demo/scripts/tools.js";
import { demoThemeManager, initDemoTheme } from "../demo/scripts/theme.js";
import { mountCardGrid } from "./fixtures/card-grid.js";

const route: DemoToolRoute = { groupId: "showcase", itemId: "card-grid" };

describe("bindViewportUrlSync (library)", () => {
  it("writes &view= to the hash when the camera changes", () => {
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

    window.location.hash = toolRouteHash(route);
    const handle = bindViewportUrlSync({
      host,
      baseHash: () => toolRouteHash(route),
    });

    const baseline = readViewBoxBaselineFromSvg(svg);
    const home = centeredArtboardHomeView(host, baseline)!;
    const panned = { ...home, x: home.x - 240, y: home.y - 180 };
    expect(applyWorldCameraToHost(host, panned)).toBe(true);

    handle.schedule();
    handle.flush();

    expect(window.location.hash).toContain("&view=");
    expect(window.location.hash).not.toBe(toolRouteHash(route));
    handle.unbind();
  });
});

describe("bindViewportUrlSync (demo wrapper)", () => {
  it("commits hash via demo schedule + flush helpers", () => {
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

    window.location.hash = toolRouteHash(route);
    bindDemoViewportUrlSync({
      host,
      viewport: artboard.root,
      routeHash: () => toolRouteHash(route),
    });

    const baseline = readViewBoxBaselineFromSvg(svg);
    const home = centeredArtboardHomeView(host, baseline)!;
    setDemoCanvasCamera({ viewBox: { ...home, x: home.x - 120, y: home.y - 80 } });
    scheduleDemoViewportUrlSync();
    flushDemoViewportUrlSync();

    expect(window.location.hash).toContain("&view=");
  });
});
