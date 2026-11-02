// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import { springStep } from "../src/motion/spring-step.js";

describe("springStep", () => {
  it("settles on the target from a displaced value", () => {
    const config = { stiffness: 420, damping: 32 };
    let value = 1;
    let velocity = 0;
    const target = 0.88;
    for (let i = 0; i < 400; i += 1) {
      const step = springStep(value, velocity, target, 1 / 60, config);
      value = step.value;
      velocity = step.velocity;
      if (step.settled) {
        break;
      }
    }
    expect(value).toBeCloseTo(target, 3);
    expect(velocity).toBe(0);
  });
});
