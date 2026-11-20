// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { ViewBox } from "../types/core.js";
import type { DotGridProjection } from "../types/grid.js";
import { defaultDotGridPhase, DEFAULT_DOT_GRID_SIZE_PX } from "./surface.js";
import { isometricDotGridPlaneMatrix } from "./projection.js";
import { DEFAULT_ARTBOARD_DOTS_PER_CELL, DEFAULT_ARTBOARD_DOT_LATTICE_PHASE } from "../layout/artboard.js";
import { artboardDotLatticeOriginInCell } from "../layout/lattice-plane.js";
import { IC_ARTBOARD_OUTLINE_LAYER_CLASS } from "../layout/artboard-outline.js";
import { parseSvgPathMoveLinePoints } from "../layout/artboard-ground-path.js";

export type SyncSvgDotGridOptions = {
  cellSize?: number;
  phase?: number;
  dotRadius?: number;
  dotFill?: string;
  marginRatio?: number;
  projection?: DotGridProjection;
};

const SVG_NS = "http://www.w3.org/2000/svg";

export const IC_SVG_DOT_GRID_PATTERN_ID = "ic-world-dot-grid";
export const IC_SVG_DOT_GRID_RECT_CLASS = "ic-svg-dot-grid";

function rootDefs(svg: SVGSVGElement): SVGDefsElement {
  for (const child of Array.from(svg.children)) {
    if (child instanceof SVGDefsElement) {
      return child;
    }
  }
  const defs = document.createElementNS(SVG_NS, "defs");
  svg.insertBefore(defs, svg.firstChild);
  return defs;
}

function mountGridRectOnSvg(svg: SVGSVGElement, rect: SVGRectElement): void {
  const defs = rootDefs(svg);
  const insertBefore =
    defs.nextElementSibling instanceof Element ? defs.nextElementSibling : null;
  if (rect.parentNode === svg && rect.previousElementSibling === defs) {
    return;
  }
  svg.insertBefore(rect, insertBefore);
}

function upsertPattern(
  defs: SVGDefsElement,
  cell: number,
  phase: number,
  dotRadius: number,
  dotFill: string,
  projection: NonNullable<SyncSvgDotGridOptions["projection"]>,
): void {
  let pattern = defs.querySelector(`#${IC_SVG_DOT_GRID_PATTERN_ID}`);
  if (!(pattern instanceof SVGPatternElement)) {
    pattern = document.createElementNS(SVG_NS, "pattern");
    pattern.id = IC_SVG_DOT_GRID_PATTERN_ID;
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    defs.appendChild(pattern);
  }
  pattern.setAttribute("width", String(cell));
  pattern.setAttribute("height", String(cell));
  pattern.setAttribute("x", "0");
  pattern.setAttribute("y", "0");
  if (projection === "isometric") {
    pattern.setAttribute("patternTransform", isometricDotGridPlaneMatrix());
  } else {
    pattern.removeAttribute("patternTransform");
  }

  let mark = pattern.querySelector("rect");
  if (!(mark instanceof SVGRectElement)) {
    pattern.replaceChildren();
    mark = document.createElementNS(SVG_NS, "rect");
    pattern.appendChild(mark);
  }
  const side = dotRadius * 2;
  mark.setAttribute("x", String(phase - dotRadius));
  mark.setAttribute("y", String(phase - dotRadius));
  mark.setAttribute("width", String(side));
  mark.setAttribute("height", String(side));
  mark.setAttribute("fill", dotFill);
}

function upsertBackgroundRect(svg: SVGSVGElement, vb: ViewBox, marginRatio: number): SVGRectElement {
  const pad = Math.max(vb.w, vb.h) * marginRatio;
  const x = vb.x - pad;
  const y = vb.y - pad;
  const w = vb.w + pad * 2;
  const h = vb.h + pad * 2;

  let existing = svg.querySelector(`rect.${IC_SVG_DOT_GRID_RECT_CLASS}`);
  let rect: SVGRectElement;
  if (!(existing instanceof SVGRectElement)) {
    rect = document.createElementNS(SVG_NS, "rect");
    rect.classList.add(IC_SVG_DOT_GRID_RECT_CLASS);
    rect.setAttribute("pointer-events", "none");
    rect.setAttribute("aria-hidden", "true");
    mountGridRectOnSvg(svg, rect);
  } else {
    rect = existing;
    if (rect.parentNode !== svg) {
      rect.remove();
      mountGridRectOnSvg(svg, rect);
    }
  }
  rect.setAttribute("x", String(x));
  rect.setAttribute("y", String(y));
  rect.setAttribute("width", String(w));
  rect.setAttribute("height", String(h));
  rect.setAttribute("fill", `url(#${IC_SVG_DOT_GRID_PATTERN_ID})`);
  return rect;
}

/** Clip SVG dot grid to the camera viewBox (no overscan). */
export function syncSvgDotGridFromViewBox(
  svg: SVGSVGElement,
  vb: ViewBox,
  options: SyncSvgDotGridOptions = {},
): void {
  const cell = options.cellSize ?? DEFAULT_DOT_GRID_SIZE_PX;
  const phase = options.phase ?? defaultDotGridPhase(cell);
  const dotRadius = options.dotRadius ?? 1;
  const dotFill = options.dotFill ?? "rgba(148, 163, 184, 0.35)";
  const marginRatio = options.marginRatio ?? 2;
  const projection = options.projection ?? "orthogonal";

  const defs = rootDefs(svg);
  upsertPattern(defs, cell, phase, dotRadius, dotFill, projection);
  upsertBackgroundRect(svg, vb, marginRatio);
}

export function removeSvgDotGrid(svg: SVGSVGElement): void {
  svg.querySelector(`rect.${IC_SVG_DOT_GRID_RECT_CLASS}`)?.remove();
  for (const defs of Array.from(svg.querySelectorAll("defs"))) {
    defs.querySelector(`#${IC_SVG_DOT_GRID_PATTERN_ID}`)?.remove();
  }
}

export const IC_ARTBOARD_DOT_GRID_CLASS = "ic-artboard-dot-grid";
export const IC_ARTBOARD_DOT_CLASS = "ic-artboard-dot";
/** Pattern-filled rect; wireframe CSS must not blank its fill. */
export const IC_ARTBOARD_DOT_GRID_FILL_CLASS = "ic-artboard-dot-grid-fill";

let isoGroundDotGridCount = 0;

/**
 * Affine map plane → ground path coords from the artboard outline (TOP rect corners in order
 * plane (w,0) → (w,h) → (0,h) → (0,0)).
 */
function planeToGroundMatrix(
  outline: SVGPathElement,
  plane: { width: number; height: number },
): string {
  const pts = parseSvgPathMoveLinePoints(outline.getAttribute("d") ?? "");
  const [xEnd, , yEnd, origin] = pts;
  if (!xEnd || !yEnd || !origin) {
    throw new Error("Artboard outline path is missing ground corners");
  }
  const a = (xEnd.x - origin.x) / plane.width;
  const b = (xEnd.y - origin.y) / plane.width;
  const c = (yEnd.x - origin.x) / plane.height;
  const e = (yEnd.y - origin.y) / plane.height;
  return `matrix(${a}, ${b}, ${c}, ${e}, ${origin.x}, ${origin.y})`;
}

/** Dot lattice on the iso artboard ground: drawn in plane units, skewed onto the outline. */
export function mountIsoGroundDotGrid(
  outline: SVGPathElement,
  plane: { width: number; height: number; divisions: number },
  options: {
    dotsPerCell?: number;
    dotRadius?: number;
    themeHost?: HTMLElement;
    dotFill?: string;
  } = {},
): SVGGElement {
  const dotsPerSide = plane.divisions * (options.dotsPerCell ?? DEFAULT_ARTBOARD_DOTS_PER_CELL);
  const stepX = plane.width / dotsPerSide;
  const stepY = plane.height / dotsPerSide;
  const step = { xPx: stepX, yPx: stepY };
  const studOrigin = artboardDotLatticeOriginInCell(step, DEFAULT_ARTBOARD_DOT_LATTICE_PHASE);
  isoGroundDotGridCount += 1;
  const patternId = `ic-artboard-dot-grid-${isoGroundDotGridCount}`;

  const pattern = document.createElementNS(SVG_NS, "pattern");
  pattern.id = patternId;
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  pattern.setAttribute("width", String(stepX));
  pattern.setAttribute("height", String(stepY));
  const mark = document.createElementNS(SVG_NS, "circle");
  mark.classList.add(IC_ARTBOARD_DOT_CLASS);
  mark.setAttribute("cx", String(studOrigin.xPx));
  mark.setAttribute("cy", String(studOrigin.yPx));
  mark.setAttribute("r", String(options.dotRadius ?? 2));
  const resolvedFill =
    options.dotFill ??
    (options.themeHost ? resolveSvgFillFromThemeVar(options.themeHost) : undefined);
  if (resolvedFill) {
    mark.setAttribute("fill", resolvedFill);
  }
  pattern.appendChild(mark);

  const rect = document.createElementNS(SVG_NS, "rect");
  rect.classList.add(IC_ARTBOARD_DOT_GRID_FILL_CLASS);
  rect.setAttribute("width", String(plane.width));
  rect.setAttribute("height", String(plane.height));
  rect.setAttribute("fill", `url(#${patternId})`);

  const group = document.createElementNS(SVG_NS, "g");
  group.classList.add(IC_ARTBOARD_DOT_GRID_CLASS);
  group.setAttribute("aria-hidden", "true");
  group.setAttribute("transform", planeToGroundMatrix(outline, plane));
  const defs = document.createElementNS(SVG_NS, "defs");
  defs.appendChild(pattern);
  group.append(defs, rect);
  const dotAnchor =
    outline.parentElement?.querySelector(`path.${IC_ARTBOARD_OUTLINE_LAYER_CLASS}`) ?? outline;
  dotAnchor.after(group);
  return group;
}

export function readDotGridFillFromElement(element: HTMLElement): string {
  const raw = getComputedStyle(element).getPropertyValue("--ic-dot-grid-dot").trim();
  return raw || "rgba(148, 163, 184, 0.3)";
}

/** SVG `<pattern>` fills do not reliably inherit `color-mix()` from CSS; resolve on the host. */
export function resolveSvgFillFromThemeVar(
  host: HTMLElement,
  cssVar = "--ic-dot-grid-dot",
): string {
  if (typeof document === "undefined") {
    return readDotGridFillFromElement(host);
  }
  const anchor = host.closest(".ic-artboard") ?? host;
  const probe = document.createElement("span");
  probe.style.setProperty("color", `var(${cssVar})`);
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  anchor.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  if (resolved && resolved !== "rgba(0, 0, 0, 0)") {
    return resolved;
  }
  return readDotGridFillFromElement(host);
}
