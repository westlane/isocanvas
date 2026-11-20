// @vitest-environment happy-dom
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  baselineDotGridPolicyInUserSpace,
  gridSnapPolicyForBoxEdges,
  snapUserRectToDotGrid,
} from "@westlane/isocanvas";

describe("diagram grid snap", () => {
  const edgePolicy = gridSnapPolicyForBoxEdges(18);
  const centerPolicy = baselineDotGridPolicyInUserSpace(18);

  it("gridSnapPolicyForBoxEdges aligns edges to cell boundaries", () => {
    const box = snapUserRectToDotGrid({ x: 7, y: 13, w: 88, h: 44 }, edgePolicy, edgePolicy);
    expect(box).toEqual({ x: 0, y: 18, w: 90, h: 36 });
  });

  it("baselineDotGridPolicyInUserSpace uses half-cell phase for pointer snap", () => {
    const box = snapUserRectToDotGrid({ x: 7, y: 13, w: 88, h: 44 }, centerPolicy, centerPolicy);
    expect(box).toEqual({ x: 9, y: 9, w: 90, h: 54 });
  });

  it("snapUserRectToDotGrid snaps opposite edges independently", () => {
    const box = snapUserRectToDotGrid(
      { x: -16, y: -4, w: 192, h: 108 },
      edgePolicy,
      edgePolicy,
    );
    expect(box).toEqual({ x: -18, y: 0, w: 198, h: 108 });
  });
});
