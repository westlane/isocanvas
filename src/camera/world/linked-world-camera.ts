// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ViewBox } from "../../types/core.js";
import type { ViewBoxBaseline, WorldCameraLayerOptions } from "../../types/camera.js";
import {
  readViewBoxBaselineFromSvg,
  viewBoxBaselineHome,
  viewBoxOffsetFromHome,
} from "../view-box/baseline.js";
import { readLogicalViewBoxFromHost } from "../world-pan-zoom.js";
import { applyWorldCameraToHost } from "./apply-world-camera.js";

/** One global zoom + pan delta, expressed in each host's own home framing. */
export function linkedWorldCameraForBaseline(
  primaryCamera: ViewBox,
  primaryBaseline: ViewBoxBaseline,
  peerBaseline: ViewBoxBaseline,
): ViewBox {
  const primaryHome = viewBoxBaselineHome(primaryBaseline);
  const peerHome = viewBoxBaselineHome(peerBaseline);
  const scaleW = primaryHome.w > 0 ? primaryCamera.w / primaryHome.w : 1;
  const scaleH = primaryHome.h > 0 ? primaryCamera.h / primaryHome.h : scaleW;
  const scale = (scaleW + scaleH) / 2;
  const offset = viewBoxOffsetFromHome(primaryCamera, primaryBaseline);
  return {
    x: (peerBaseline.homeX ?? 0) + offset.x,
    y: (peerBaseline.homeY ?? 0) + offset.y,
    w: peerHome.w * scale,
    h: peerHome.h * scale,
  };
}

export function readViewBoxBaselineFromHost(host: HTMLElement): ViewBoxBaseline | null {
  const svg = host.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) {
    return null;
  }
  return readViewBoxBaselineFromSvg(svg);
}

/** Apply primary pan/zoom to every peer using that host's home baseline (not a raw viewBox paste). */
export function syncLinkedWorldCameraAcrossHosts(
  hosts: readonly HTMLElement[],
  worldCamera?: WorldCameraLayerOptions,
): boolean {
  const primary = hosts[0];
  if (!primary) {
    return false;
  }
  const primarySvg = primary.querySelector("svg");
  if (!(primarySvg instanceof SVGSVGElement)) {
    return false;
  }
  const primaryBaseline = readViewBoxBaselineFromSvg(primarySvg);
  const primaryCamera = readLogicalViewBoxFromHost(primary, primarySvg);
  let ok = false;
  for (const host of hosts) {
    const svg = host.querySelector("svg");
    if (!(svg instanceof SVGSVGElement)) {
      continue;
    }
    const camera =
      host === primary
        ? primaryCamera
        : linkedWorldCameraForBaseline(
            primaryCamera,
            primaryBaseline,
            readViewBoxBaselineFromSvg(svg),
          );
    ok = applyWorldCameraToHost(host, camera, worldCamera ?? {}) || ok;
  }
  return ok;
}
