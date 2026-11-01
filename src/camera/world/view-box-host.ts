// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ViewBox } from "../../types/core.js";
import { writeViewBoxToSvg, viewBoxesNearlyEqual } from "../view-box/attributes.js";
import { readWorldCameraFromHost, writeWorldCameraOnHost } from "./apply-world-camera.js";

function hostSvg(host: HTMLElement): SVGSVGElement | null {
  const svg = host.querySelector("svg");
  return svg instanceof SVGSVGElement ? svg : null;
}

/** ViewBox + host attr only (for synced peer artboards during pan). */
export function applyWorldCameraViewBoxToHost(host: HTMLElement, camera: ViewBox): boolean {
  const current = readWorldCameraFromHost(host);
  if (current && viewBoxesNearlyEqual(current, camera)) {
    return true;
  }
  const svg = hostSvg(host);
  if (!svg) {
    return false;
  }
  writeViewBoxToSvg(svg, camera);
  writeWorldCameraOnHost(host, camera);
  return true;
}
