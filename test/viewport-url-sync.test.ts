// Copyright (C) 2026 West Lane - All Rights Reserved
// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import {
  buildViewHashSuffixFromCameras,
  mergeRouteHash,
  parseViewportUrlFrame,
  stripViewFromHashFragment,
  syncRouteHashForTool,
} from "../demo/scripts/viewport.js";

describe("viewport url sync", () => {
  it("parseViewportUrlFrame reads zoom/center and rejects extra segments", () => {
    expect(parseViewportUrlFrame("#showcase/card-grid&view=1.25/260/160")).toEqual({
      zoom: 1.25,
      cx: 260,
      cy: 160,
    });
    expect(parseViewportUrlFrame("#showcase/card-stack&view=1.25/260/160/30/45")).toBeNull();
  });

  it("buildViewHashSuffixFromCameras writes zoom/center", () => {
    const suffix = buildViewHashSuffixFromCameras(
      {
        canvas: { viewBox: { x: 0, y: 0, w: 509.8, h: 313.6 } },
      },
      520,
    );
    expect(suffix).toBe("&view=1.02/254.9/156.8");
  });

  it("stripViewFromHashFragment preserves route segment", () => {
    expect(stripViewFromHashFragment("#showcase/card-grid&view=2/100/50")).toBe(
      "showcase/card-grid",
    );
  });

  it("mergeRouteHash appends view suffix", () => {
    const hash = mergeRouteHash(
      "#showcase/card-stack",
      {
        canvas: { viewBox: { x: 50, y: 30, w: 260, h: 160 } },
      },
      520,
    );
    expect(hash).toBe("#showcase/card-stack&view=2/180/110");
  });

  it("syncRouteHashForTool keeps view suffix on reload", () => {
    window.location.hash =
      "#showcase/card-stack&view=1.25/260/160";
    syncRouteHashForTool({ groupId: "showcase", itemId: "card-stack" });
    expect(window.location.hash).toBe("#showcase/card-stack&view=1.25/260/160");
  });
});
