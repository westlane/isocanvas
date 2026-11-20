// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";
import {
  buildPlaneRowMountPlan,
  planeRowColumnLayoutFromMountPlan,
  planeRowMountPlanHasCollectionLabels,
} from "../src/stage/plane-row-mount.js";

describe("plane row mount plan", () => {
  it("derives column layout and detects collection labels", () => {
    const plan = buildPlaneRowMountPlan(
      { width: 100, height: 80 },
      56,
      [{ collectionLabel: "Organization" }, { collectionLabel: "Project" }],
    );
    expect(planeRowMountPlanHasCollectionLabels(plan)).toBe(true);
    expect(planeRowColumnLayoutFromMountPlan(plan)).toMatchObject({
      cellWidth: 100,
      cellHeight: 80,
      gapPx: 56,
      columnCount: 2,
      columnLabels: ["Organization", "Project"],
    });
  });
});
