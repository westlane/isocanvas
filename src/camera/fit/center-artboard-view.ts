// Copyright (C) 2026 West Lane - All Rights Reserved

import { DIAGRAM_RENDERER } from "../../isometric/mount.js";
import {
  artboardUserBoxFromElement,
  findArtboardAncestor,
} from "../../layout/artboard.js";
import { IC_ARTBOARD_OUTLINE_CLASS } from "../../layout/artboard-outline.js";
import { readArtboardOutlineEdgeFitBox } from "../../layout/artboard-ground-path.js";
import {
  artboardPlaneIsoContentBox,
  artboardUserToPlane,
  viewBoxForArtboardPlaneIsoCanvas,
} from "../../layout/artboard-coords.js";
import type { Box2d, ViewBox } from "../../types/core.js";
import type { ViewBoxBaseline } from "../../types/camera.js";
import {
  viewBoxFitArtboardUserBox,
  viewBoxFitSvgContent,
  type ViewBoxFitContentOptions,
} from "./fit-content.js";
import { setViewportCenteredMeet } from "../view-box/attributes.js";
import { readViewBoxBaselineFromSvg, viewBoxBaselineHome, writeViewBoxHomeMetadata } from "../view-box/baseline.js";
import { applyWorldCameraToHost } from "../world/apply-world-camera.js";
import { elementUserBBox, svgHasPaintLayout } from "../../svg/svg-bbox.js";

export type ViewBoxCenterArtboardOptions = {
  minWidthRatio?: number;
  /** Padding around artboard bounds in camera user units. */
  artboardPaddingPx?: number;
  /** Padding ratio for hosts without an artboard (see {@link viewBoxFitSvgContent}). */
  contentPaddingRatio?: number;
};

/** Default launch / “home” camera: centered artboard with breathing room. */
export const DEFAULT_VIEWBOX_CENTER_ARTBOARD_OPTIONS: ViewBoxCenterArtboardOptions = {
  artboardPaddingPx: 32,
  minWidthRatio: 0,
  contentPaddingRatio: 0.12,
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
  isoMounted: boolean,
): ViewBoxFitContentOptions {
  const fit: ViewBoxFitContentOptions = {
    matchContentAspect: isoMounted,
  };
  if (options.minWidthRatio !== undefined) {
    fit.minWidthRatio = options.minWidthRatio;
  }
  const paddingPx = options.artboardPaddingPx ?? 0;
  if (paddingPx > 0) {
    fit.paddingPx = paddingPx;
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

function graphicsBBoxInSvg(element: SVGGraphicsElement, svg: SVGSVGElement): Box2d | null {
  try {
    const box = elementUserBBox(element, svg);
    if (box.width > 0 && box.height > 0) {
      return box;
    }
  } catch {
    return null;
  }
  return null;
}

/** Center of rendered artboard content in SVG user space (matches what the browser draws). */
export function artboardRenderedCenterInSvg(
  svg: SVGSVGElement,
  userSize?: { width: number; height: number },
): { x: number; y: number } | null {
  const bounds = isoCubeCanvasRenderedContentBox(svg, userSize);
  if (!bounds) {
    return null;
  }
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

function artboardCameraContentBox(
  svg: SVGSVGElement,
  userBox: Box2d,
): Box2d {
  if (svg.getAttribute("data-diagram-renderer") !== DIAGRAM_RENDERER) {
    return userBox;
  }
  const rendered = isoCubeCanvasRenderedContentBox(svg, {
    width: userBox.width,
    height: userBox.height,
  });
  if (rendered) {
    return rendered;
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

/** Measured diagram bounds in SVG user space (post ic-cube-canvas origin shift). */
export function isoCubeCanvasRenderedContentBox(
  svg: SVGSVGElement,
  userSize?: { width: number; height: number },
): Box2d | null {
  const footprint =
    userSize !== undefined ? artboardPlaneIsoContentBox(userSize) : null;
  const outline = svg.querySelector(`path.${IC_ARTBOARD_OUTLINE_CLASS}`);
  const origin = svg.querySelector(":scope > g.ic-cube-canvas-origin");

  let outlineBox: Box2d | null = null;
  if (outline instanceof SVGGraphicsElement) {
    outlineBox = graphicsBBoxInSvg(outline, svg);
  }
  let originBox: Box2d | null = null;
  if (origin instanceof SVGGraphicsElement) {
    originBox = graphicsBBoxInSvg(origin, svg);
  }

  if (outlineBox && originBox) {
    const minY = Math.min(outlineBox.y, originBox.y);
    const maxY = Math.max(outlineBox.y + outlineBox.height, originBox.y + originBox.height);
    return {
      x: outlineBox.x,
      y: minY,
      width: outlineBox.width,
      height: maxY - minY,
    };
  }
  if (outlineBox) {
    return outlineBox;
  }
  if (originBox) {
    return originBox;
  }
  if (footprint && !svgHasPaintLayout(svg)) {
    return footprint;
  }
  return readArtboardOutlineEdgeFitBox(svg) ?? footprint;
}

/**
 * Camera viewBox that frames the host artboard at baseline aspect,
 * centered on the rendered artboard center (aligned to the viewport via xMidYMid meet).
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
    const contentBox = artboardCameraContentBox(svg, userBox);
    const isoMounted = svg.getAttribute("data-diagram-renderer") === DIAGRAM_RENDERER;
    return viewBoxFitArtboardUserBox(
      contentBox,
      baseline,
      fitOptionsForArtboard(contentBox, options, isoMounted),
    );
  }

  return viewBoxFitSvgContent(svg, baseline, fitOptionsForDiagramContent(options));
}

/**
 * Default camera for artboard hosts: center the logical artboard (iso footprint when mounted)
 * and zoom so it is fully visible with {@link DEFAULT_VIEWBOX_CENTER_ARTBOARD_OPTIONS} padding.
 */
export function centeredArtboardHomeView(
  host: HTMLElement,
  baseline: ViewBoxBaseline,
  options: ViewBoxCenterArtboardOptions = DEFAULT_VIEWBOX_CENTER_ARTBOARD_OPTIONS,
): ViewBox | null {
  const svg = host.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) {
    return null;
  }
  if (findArtboardAncestor(host)) {
    setViewportCenteredMeet(svg);
  }
  return (
    viewBoxCenterArtboardInCamera(host, baseline, options) ?? viewBoxBaselineHome(baseline)
  );
}

/** Apply {@link centeredArtboardHomeView} to a diagram host (world camera + centered SVG meet). */
export function applyArtboardHomeCamera(
  host: HTMLElement,
  options: ViewBoxCenterArtboardOptions = DEFAULT_VIEWBOX_CENTER_ARTBOARD_OPTIONS,
): boolean {
  const svg = host.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) {
    return false;
  }
  const applyOnce = (): boolean => {
    const baseline = readViewBoxBaselineFromSvg(svg);
    const viewBox = centeredArtboardHomeView(host, baseline, options);
    if (!viewBox) {
      return false;
    }
    writeViewBoxHomeMetadata(svg, viewBox);
    return applyWorldCameraToHost(host, viewBox);
  };
  if (applyOnce()) {
    return true;
  }
  if (!svgHasPaintLayout(svg) && typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      applyOnce();
    });
    return true;
  }
  return false;
}
