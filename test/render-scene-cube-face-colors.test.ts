// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";
import { renderDiagramScene } from "../src/diagram/render-scene.js";

describe("renderDiagramScene cubeFaceColors", () => {
  it("applies per-node face fills at mount time", () => {
    const host = document.createElement("div");
    host.className = "diagram-host";
    renderDiagramScene(
      host,
      {
        viewBox: { x: 0, y: 0, w: 400, h: 400 },
        divisions: 5,
        nodes: [
          {
            id: "member",
            label: "Member",
            x: 40,
            y: 40,
            w: 80,
            h: 80,
            cubeFaceColors: {
              top: "#ede9fe",
              front: "#ddd6fe",
              right: "#c4b5fd",
              left: "#a78bfa",
              bottom: "#8b5cf6",
              labelFill: "#5b21b6",
            },
          },
        ],
      },
      undefined,
      { omitArtboardShell: true },
    );
    const top = host.querySelector(
      '[data-object-id="member"]',
    )?.parentElement?.querySelector("path.ic-iso-cube-face--top");
    expect(top?.getAttribute("fill")).toBe("#ede9fe");
    const shell = host
      .querySelector('[data-object-id="member"]')
      ?.closest(".ic-iso-cube-shell");
    expect(shell?.getAttribute("data-ic-cube-category-theme")).toBe("true");
    expect((shell as HTMLElement | null)?.style.getPropertyValue("--ic-iso-front-fill").trim()).toBe(
      "#ddd6fe",
    );
  });
});
