// Copyright (C) 2026 West Lane - All Rights Reserved

import type { ViewBoxBaseline } from "../types/camera.js";
import type { Box2d } from "../types/core.js";
import type { ArtboardUserSize } from "../types/artboard.js";
import type { CreateDotGridSurfaceOptions } from "../types/grid.js";
import { createDotGridSurface, IC_DOT_GRID_CSS_VARS } from "../grid/surface.js";

/** DOM nodes for one artboard on a canvas; mount shapes inside `content`. */
export type ArtboardElements = {
  root: HTMLDivElement;
  surface: HTMLDivElement | null;
  grid: HTMLDivElement | null;
  content: HTMLDivElement;
  userSize: ArtboardUserSize;
};

/** Artboard frame: `.ic-artboard` with diagram host `.ic-artboard-content`. */
export type ArtboardDocument = {
  level: "artboard";
  rootClass: "ic-artboard";
  contentClass: "ic-artboard-content";
  userSize: ArtboardUserSize;
};

export const IC_ARTBOARD_CLASS = "ic-artboard";

export const IC_ARTBOARD_CONTENT_CLASS = "ic-artboard-content";

/** Demo stage: square artboard in plane/user pixels (3×3 guides on iso ground). */
export const DEFAULT_ARTBOARD_USER_SIZE: ArtboardUserSize = {
  width: 1000,
  height: 1000,
};

/** Iso artboard ground divisions (3×3 macro grid on the demo stage). */
export const DEFAULT_ARTBOARD_GRID_DIVISIONS = 3;

/** Fainter sub-guides splitting each macro cell (3×3 inside each of the 3×3). */
export const DEFAULT_ARTBOARD_GRID_SUBDIVISIONS = 3;

/** Dots per side inside each macro grid cell (centered, none on the guide lines). */
export const DEFAULT_ARTBOARD_DOTS_PER_CELL = 9;

export type CreateArtboardOptions = {
  userSize?: ArtboardUserSize;
  dotGrid?: CreateDotGridSurfaceOptions;
  contentId?: string;
  /** When false, artboard is a frame only; iso diagrams mount ground in the cube SVG. */
  embedDotGrid?: boolean;
};

/** One artboard on a canvas; shapes mount in `content` (diagram host). @see ArtboardDocument */
export function createArtboard(options: CreateArtboardOptions = {}): ArtboardElements {
  const userSize = options.userSize ?? DEFAULT_ARTBOARD_USER_SIZE;
  const embedDotGrid = options.embedDotGrid !== false;
  const root = document.createElement("div");
  root.className = IC_ARTBOARD_CLASS;
  root.dataset.artboardWidth = String(userSize.width);
  root.dataset.artboardHeight = String(userSize.height);
  root.style.setProperty("--ic-artboard-user-width", String(userSize.width));
  root.style.setProperty("--ic-artboard-user-height", String(userSize.height));
  root.style.setProperty("--ic-artboard-width", `${userSize.width}px`);
  root.style.setProperty("--ic-artboard-height", `${userSize.height}px`);
  const content = document.createElement("div");
  content.className = IC_ARTBOARD_CONTENT_CLASS;
  if (options.contentId) {
    content.id = options.contentId;
  }

  if (!embedDotGrid) {
    root.dataset.icFrameOnly = "true";
  }

  if (embedDotGrid) {
    const { surface, grid } = createDotGridSurface(options.dotGrid);
    if (options.dotGrid?.phasePx === undefined) {
      surface.style.setProperty(IC_DOT_GRID_CSS_VARS.phaseVar, "0px");
    }
    surface.appendChild(content);
    root.appendChild(surface);
    return { root, surface, grid, content, userSize };
  }

  root.appendChild(content);
  return { root, surface: null, grid: null, content, userSize };
}

/** Keep logical user size in sync after layout changes (camera baseline + CSS vars). */
export function applyArtboardUserSize(root: HTMLElement, userSize: ArtboardUserSize): void {
  root.dataset.artboardWidth = String(userSize.width);
  root.dataset.artboardHeight = String(userSize.height);
  root.style.setProperty("--ic-artboard-user-width", String(userSize.width));
  root.style.setProperty("--ic-artboard-user-height", String(userSize.height));
  root.style.setProperty("--ic-artboard-width", `${userSize.width}px`);
  root.style.setProperty("--ic-artboard-height", `${userSize.height}px`);
}

/** Plane-space bounds for camera/grid (viewBox top-left); see {@link artboardUserToPlane} for user coords. */
export function artboardUserBox(userSize: ArtboardUserSize): Box2d {
  return { x: 0, y: 0, width: userSize.width, height: userSize.height };
}

export function artboardUserBoxFromElement(artboardRoot: HTMLElement): Box2d | null {
  const width = Number(artboardRoot.dataset.artboardWidth);
  const height = Number(artboardRoot.dataset.artboardHeight);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return { x: 0, y: 0, width, height };
}

/** Baseline aspect for camera fit: logical artboard user width/height. */
export function artboardViewBoxBaselineFromElement(artboardRoot: HTMLElement): ViewBoxBaseline | null {
  const box = artboardUserBoxFromElement(artboardRoot);
  if (!box) {
    return null;
  }
  return { baseW: box.width, baseH: box.height };
}

export function findArtboardAncestor(element: HTMLElement | null): HTMLElement | null {
  return element?.closest(`.${IC_ARTBOARD_CLASS}`) ?? null;
}
