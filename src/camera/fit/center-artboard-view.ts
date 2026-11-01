// Copyright (C) 2026 West Lane - All Rights Reserved

import { DIAGRAM_RENDERER } from "../../isometric/mount.js";
import {
  artboardUserBoxFromElement,
  artboardViewBoxBaselineFromElement,
  findArtboardAncestor,
} from "../../layout/artboard.js";
import { artboardUserToPlane, viewBoxForArtboardPlaneIsoCanvas } from "../../layout/artboard-coords.js";
import type { Box2d, ViewBox } from "../../types/core.js";
import type { ViewBoxBaseline } from "../../types/camera.js";
import {
  viewBoxFitArtboardUserBox,
  viewBoxFitSvgContent,
  type ViewBoxFitContentOptions,
} from "./fit-content.js";
import { setViewportCenteredMeet } from "../view-box/attributes.js";
import { viewBoxBaselineHome } from "../view-box/baseline.js";

export type ViewBoxCenterArtboardOptions = {
  minWidthRatio?: number;
  /** Padding around artboard bounds in camera user units. */
  artboardPaddingPx?: number;
  /** Padding ratio for hosts without an artboard (see {@link viewBoxFitSvgContent}). */
  contentPaddingRatio?: number;
};

export { VIEWPORT_CENTERED_MEET, setViewportCenteredMeet } from "../view-box/attributes.js";
export {
  readViewBoxBaselineFromSvg,
  viewBoxBaselineHome,
  viewBoxOffsetFromHome,
  writeViewBoxHomeMetadata,
} from "../view-box/baseline.js";

function fitOptionsForArtboard(
  content: Box2d,
  options: ViewBoxCenterArtboardOptions,
): ViewBoxFitContentOptions {
  const fit: ViewBoxFitContentOptions = {};
  if (options.minWidthRatio !== undefined) {
    fit.minWidthRatio = options.minWidthRatio;
  }
  const paddingPx = options.artboardPaddingPx ?? 0;
  if (paddingPx > 0) {
    fit.paddingRatio = paddingPx / Math.max(content.width, content.height, 1);
  }
  return fit;
}

function fitOptionsForDiagramContent(
  options: ViewBoxCenterArtboardOptions,
): ViewBoxFitContentOptions {
  const fit: ViewBoxFitContentOptions = {};
  if (options.minWidthRatio !== undefined) {
    fit.minWidthRatio = options.minWidthRatio;
  }
  if (options.contentPaddingRatio !== undefined) {
    fit.paddingRatio = options.contentPaddingRatio;
  }
  return fit;
}

function artboardCameraContentBox(
  svg: SVGSVGElement,
  userBox: Box2d,
): Box2d {
  if (svg.getAttribute("data-diagram-renderer") !== DIAGRAM_RENDERER) {
    return userBox;
  }
  const userSize = { width: userBox.width, height: userBox.height };
  const frame = viewBoxForArtboardPlaneIsoCanvas(userSize, 0);
  const planeCenter = artboardUserToPlane(userBox.width / 2, userBox.height / 2, userBox.height);
  return {
    x: planeCenter.x - frame.w / 2,
    y: planeCenter.y - frame.h / 2,
    width: frame.w,
    height: frame.h,
  };
}

/**
 * Camera viewBox that frames the host artboard (or diagram content when no artboard)
 * at baseline aspect, centered on the content bounds.
 */
export function viewBoxCenterArtboardInCamera(
  host: HTMLElement,
  baseline: ViewBoxBaseline,
  options: ViewBoxCenterArtboardOptions = {},
): ViewBox | null {
  const svg = host.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) {
    return null;
  }

  const artboardRoot = findArtboardAncestor(host);
  const userBox = artboardRoot ? artboardUserBoxFromElement(artboardRoot) : null;
  if (userBox) {
    const fitBaseline =
      artboardRoot != null
        ? (artboardViewBoxBaselineFromElement(artboardRoot) ?? baseline)
        : baseline;
    const contentBox = artboardCameraContentBox(svg, userBox);
    return viewBoxFitArtboardUserBox(
      contentBox,
      fitBaseline,
      fitOptionsForArtboard(contentBox, options),
    );
  }

  return viewBoxFitSvgContent(svg, baseline, fitOptionsForDiagramContent(options));
}

/** 1× home camera from baseline metadata; sets centered SVG meet on artboard hosts. */
export function centeredArtboardHomeView(
  host: HTMLElement,
  baseline: ViewBoxBaseline,
): ViewBox | null {
  const svg = host.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) {
    return null;
  }
  if (findArtboardAncestor(host)) {
    setViewportCenteredMeet(svg);
  }
  return viewBoxBaselineHome(baseline);
}
