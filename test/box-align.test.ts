// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import { alignBox, alignBoxes, boxesBounds } from "@westlane/isocanvas";

describe("box align drawing api", () => {
  const ref = { x: 100, y: 50, width: 200, height: 80 };
  const box = { x: 130, y: 70, width: 40, height: 20 };

  it("boxesBounds unions disjoint boxes", () => {
    expect(
      boxesBounds([
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 20, y: 5, width: 10, height: 10 },
      ]),
    ).toEqual({ x: 0, y: 0, width: 30, height: 15 });
  });

  it("alignBox left snaps x to reference min", () => {
    expect(alignBox(box, "left", ref).x).toBe(100);
  });

  it("alignBox right snaps x to reference max", () => {
    expect(alignBox(box, "right", ref).x).toBe(260);
  });

  it("alignBox top snaps y to reference min", () => {
    expect(alignBox(box, "top", ref).y).toBe(50);
  });

  it("alignBox bottom snaps y to reference max", () => {
    expect(alignBox(box, "bottom", ref).y).toBe(110);
  });

  it("alignBox center-horizontal centers on reference mid x", () => {
    expect(alignBox(box, "center-horizontal", ref).x).toBe(180);
  });

  it("alignBox center-vertical centers on reference mid y", () => {
    expect(alignBox(box, "center-vertical", ref).y).toBe(80);
  });

  it("alignBoxes uses selection hull when reference omitted", () => {
    const boxes = [
      { x: 10, y: 10, width: 30, height: 20 },
      { x: 80, y: 40, width: 50, height: 10 },
    ];
    const aligned = alignBoxes(boxes, "left");
    expect(aligned.every((entry) => entry.x === 10)).toBe(true);
  });
});
