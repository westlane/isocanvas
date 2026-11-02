// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  diagramUserFootprintPxForCubeLabel,
  ISO_CUBE_LABEL_FONT_SIZE_PX,
} from "@westlane/isocanvas";
import { DIAGRAM_NODE_FOOTPRINT } from "../src/layout/diagram-node-footprint.js";

describe("diagram node label footprint", () => {
  it("expands plane depth beyond the default footprint for a short wide title", () => {
    const sized = diagramUserFootprintPxForCubeLabel({
      label: "Organization",
      fontSizePx: ISO_CUBE_LABEL_FONT_SIZE_PX,
      minWidthPx: DIAGRAM_NODE_FOOTPRINT.widthPx,
      minDepthPx: DIAGRAM_NODE_FOOTPRINT.depthPx,
    });
    expect(sized.widthPx).toBeGreaterThan(DIAGRAM_NODE_FOOTPRINT.widthPx);
    expect(sized.depthPx).toBeGreaterThanOrEqual(DIAGRAM_NODE_FOOTPRINT.depthPx);
  });
});
