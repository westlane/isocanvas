// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  ISO_CUBE_LABEL_TRUNCATE_AFTER_CHARS,
  ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS,
  measureIsoCanvasLabelTextWidthPx,
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

  it("truncates each line independently for multi-line labels", () => {
    const longLine = "A".repeat(ISO_CUBE_LABEL_TRUNCATE_AFTER_CHARS + 8);
    const text = `OK\n${longLine}`;
    const result = truncateIsoCanvasLabelText(text, 120, 50);
    const lines = result.split("\n");
    expect(lines[0]).toBe("OK");
    expect(lines[1]?.endsWith(ISO_CUBE_LABEL_TRUNCATION_ELLIPSIS)).toBe(true);
  });

  it("measures multi-line width as the max line width", () => {
    const wShort = measureIsoCanvasLabelTextWidthPx("HI", 40);
    const wLong = measureIsoCanvasLabelTextWidthPx("INTERNATIONAL", 40);
    const combined = measureIsoCanvasLabelTextWidthPx("HI\nINTERNATIONAL", 40);
    expect(combined).toBe(Math.max(wShort, wLong));
  });
});
