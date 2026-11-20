// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import { canStartWorldCameraPan } from "@westlane/isocanvas";

function pointerEvent(partial: Partial<PointerEvent> & { button: number }): PointerEvent {
  return {
    altKey: false,
    ctrlKey: false,
    ...partial,
  } as PointerEvent;
}

describe("canStartWorldCameraPan", () => {
  it("accepts primary and middle drag", () => {
    expect(canStartWorldCameraPan(pointerEvent({ button: 0 }))).toBe(true);
    expect(canStartWorldCameraPan(pointerEvent({ button: 1 }))).toBe(true);
  });

  it("rejects secondary button", () => {
    expect(canStartWorldCameraPan(pointerEvent({ button: 2 }))).toBe(false);
  });

  it("still pans with modifier keys held", () => {
    expect(canStartWorldCameraPan(pointerEvent({ button: 0, altKey: true }))).toBe(true);
    expect(canStartWorldCameraPan(pointerEvent({ button: 0, ctrlKey: true }))).toBe(true);
  });
});
