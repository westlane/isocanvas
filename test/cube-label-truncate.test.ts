// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  ISO_CUBE_LABEL_TRUNCATE_AFTER_CHARS,
  ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS,
  truncateIsoCanvasLabelText,
} from "../src/isometric/cube/canvas-text-style.js";

describe("truncateIsoCanvasLabelText", () => {
  it("does not truncate when formatted length is at most the char threshold", () => {
    const text = "A".repeat(ISO_CUBE_LABEL_TRUNCATE_AFTER_CHARS);
    expect(truncateIsoCanvasLabelText(text, 1, 50)).toBe(text);
    expect(text).not.toContain(ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS);
  });

  it("truncates with ellipsis when length exceeds the threshold and width is tight", () => {
    const text = "A".repeat(ISO_CUBE_LABEL_TRUNCATE_AFTER_CHARS + 8);
    const result = truncateIsoCanvasLabelText(text, 120, 50);
    expect(result.endsWith(ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS)).toBe(true);
    expect(result.length).toBeLessThan(text.length);
  });
});
