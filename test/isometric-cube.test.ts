// @vitest-environment happy-dom
// Copyright (C) 2026 West Lane - All Rights Reserved

import { describe, expect, it, beforeEach } from "vitest";
import { IsometricCanvas, PlaneView } from "ic-canvas";
import {
  DEFAULT_ISO_CANVAS_COLORS,
  DEFAULT_CUBE_CANVAS_SCALE,
  DEFAULT_ARTBOARD_USER_SIZE,
  artboardDivisionPitch,
  artboardLatticeCellIsoGround,
  artboardPlaneToIsoGround,
  artboardPlaneTopLeftIsoGround,
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
  ISO_DIAGRAM_PX_PER_UNIT,
  DIAGRAM_RENDERER,
  scaleForFootprintWidth,
  extrusionHeightForFootprint,
  isoAnchorPaintDepth,
  isoFacePaintOrder,
  isoBoxSpecFromPlaneBox,
  isoCubeFaceRectLayout,
  isoCubeFaceRectLayoutForPlaneTopLeft,
  ISO_CUBE_MOUNT_FACE_ORDER,
  ISO_GRID_AXIS_X,
  mountIsoBoxesOnCanvas,
  paintIsometricOrientation,
  themedCubeFaceColors,
  userPxToIsoUnits,
  renderDiagramScene,
  type DiagramScene,
  type IsoBoxSpec,
} from "@westlane/isocanvas";
import {
  DEMO_CARD_GRID,
  mountCardGrid,
  DEMO_CARD_USER_DEPTH_PX,
  DEMO_CARD_USER_WIDTH_PX,
  demoCardFootprintIso,
} from "./fixtures/card-grid.js";
import { initDemoTheme, demoThemeManager } from "../demo/scripts/theme.js";

const DIAGRAM_SCENE_FIXTURE: DiagramScene = {
  viewBox: { x: 0, y: 0, w: 232, h: 280 },
  nodes: [
    { id: "library", label: "Library", x: 32, y: 32, w: 168, h: 56 },
    { id: "book", label: "Book", x: 32, y: 112, w: 168, h: 56 },
    { id: "author", label: "Author", x: 32, y: 192, w: 168, h: 56 },
  ],
  edges: [
    { id: "library->book", from: "library", to: "book", label: "contains" },
    { id: "book->author", from: "book", to: "author", label: "author" },
  ],
};

function pathPoints(d: string): { x: number; y: number }[] {
  const re = /[ML]\s*(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g;
  const points: { x: number; y: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    points.push({ x: Number(m[1]), y: Number(m[2]) });
  }
  return points;
}

describe("isometric cube (library shape)", () => {
  beforeEach(() => {
    initDemoTheme(document.documentElement);
  });

  function activeShowcaseColors() {
    return demoThemeManager().getTheme().colors;
  }

  it("maps 168px diagram width to 2 iso units", () => {
    expect(userPxToIsoUnits(DEMO_CARD_USER_WIDTH_PX)).toBe(2);
    expect(userPxToIsoUnits(DEMO_CARD_USER_DEPTH_PX)).toBe(1.25);
    expect(demoCardFootprintIso()).toEqual({ width: 2, depth: 1.25 });
    expect(ISO_DIAGRAM_PX_PER_UNIT).toBe(84);
  });

  it("scale projects front face width to diagram pixels", () => {
    const scale = scaleForFootprintWidth(DEMO_CARD_USER_WIDTH_PX, 2);
    expect(scale).toBeCloseTo(DEMO_CARD_USER_WIDTH_PX / (2 * ISO_GRID_AXIS_X), 5);
    expect(DEFAULT_CUBE_CANVAS_SCALE).toBeCloseTo(scale, 5);
    expect(2 * ISO_GRID_AXIS_X * DEFAULT_CUBE_CANVAS_SCALE).toBeCloseTo(
      DEMO_CARD_USER_WIDTH_PX,
      4,
    );
  });

  it("orders faces bottom through top at the same anchor", () => {
    const box: IsoBoxSpec = { left: 1, right: 2, width: 2, depth: 1.25, height: 1, id: "a", label: "" };
    expect(isoFacePaintOrder(box, "bottom")).toBeLessThan(isoFacePaintOrder(box, "side"));
    expect(isoFacePaintOrder(box, "side")).toBeLessThan(isoFacePaintOrder(box, "front"));
    expect(isoFacePaintOrder(box, "front")).toBeLessThan(isoFacePaintOrder(box, "top"));
  });

  it("steps +plane x along the −left ground axis and paints receding columns first", () => {
    const pitch = artboardDivisionPitch(
      DEFAULT_ARTBOARD_USER_SIZE,
      DEFAULT_ARTBOARD_GRID_DIVISIONS,
    );
    const leftCell = isoBoxSpecFromPlaneBox({
      id: "a",
      label: "",
      x: 0,
      y: 0,
      width: DEMO_CARD_USER_WIDTH_PX,
      depth: DEMO_CARD_USER_DEPTH_PX,
    });
    const rightCell = isoBoxSpecFromPlaneBox({
      id: "b",
      label: "",
      x: pitch.xPx,
      y: 0,
      width: DEMO_CARD_USER_WIDTH_PX,
      depth: DEMO_CARD_USER_DEPTH_PX,
    });
    expect(rightCell.right).toBeCloseTo(leftCell.right, 5);
    expect(rightCell.left).toBeCloseTo(leftCell.left - userPxToIsoUnits(pitch.xPx), 5);
    expect(isoAnchorPaintDepth(rightCell)).toBeLessThan(isoAnchorPaintDepth(leftCell));
    expect(isoFacePaintOrder(rightCell, "top")).toBeLessThan(isoFacePaintOrder(leftCell, "top"));
  });

  it("extrusion scales with footprint", () => {
    expect(extrusionHeightForFootprint(2, 1.25)).toBeCloseTo(0.9, 5);
  });

  it("themed faces map all six sides to theme tokens", () => {
    const face = themedCubeFaceColors(DEFAULT_ISO_CANVAS_COLORS);
    expect(face.top).toBe(DEFAULT_ISO_CANVAS_COLORS.isoTopFill);
    expect(face.front).toBe(DEFAULT_ISO_CANVAS_COLORS.isoFrontFill);
    expect(face.side).toBe(DEFAULT_ISO_CANVAS_COLORS.isoRightFill);
    expect(face.bottom).toBe(DEFAULT_ISO_CANVAS_COLORS.isoBottomFill);
    expect(face.back).toBe(DEFAULT_ISO_CANVAS_COLORS.isoLeftFill);
    expect(face.left).toBe(DEFAULT_ISO_CANVAS_COLORS.isoLeftFill);
  });

  it("paints artboard ground before cubes and back boxes before front boxes", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    mountCardGrid(host, activeShowcaseColors());
    expect(host.querySelector("svg")?.dataset.icMount).toBe("stage-shell-v2");
    const paths = [...host.querySelectorAll("svg path[d]")];
    const outlineIndex = paths.findIndex((p) => p.classList.contains("ic-artboard-outline"));
    const firstFaceIndex = paths.findIndex((p) => p.classList.contains("ic-iso-cube-face"));
    expect(outlineIndex).toBeGreaterThanOrEqual(0);
    const guideIndices = paths
      .map((p, index) => (p.classList.contains("ic-artboard-guide") ? index : -1))
      .filter((index) => index >= 0);
    const maxGuideIndex = Math.max(...guideIndices);
    expect(maxGuideIndex).toBeLessThan(firstFaceIndex);
    host.remove();
  });

  it("mounts card grid with nine nodes and forty-five face paths (no shared ground bottoms)", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const svg = mountCardGrid(host, activeShowcaseColors());
    expect(svg.getAttribute("data-diagram-renderer")).toBe(DIAGRAM_RENDERER);
    expect(host.querySelectorAll("g.node[data-object-id]")).toHaveLength(9);
    expect(host.querySelectorAll("svg path.ic-iso-cube-face[d]")).toHaveLength(45);
    expect(host.querySelectorAll("svg path.ic-iso-cube-face--top[d]")).toHaveLength(9);
    expect(host.querySelectorAll("svg path.ic-iso-cube-face--bottom[d]")).toHaveLength(0);
    expect(host.querySelectorAll("svg path.ic-artboard-outline[d]")).toHaveLength(1);
    expect(host.querySelectorAll("path.ic-artboard-outline-layer[d]")).toHaveLength(1);
    expect(host.querySelectorAll("path.ic-artboard-guide[d]")).toHaveLength(4);
    host.remove();
  });

  it("paints the thin canvas outline layer under cube content", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    mountCardGrid(host, activeShowcaseColors());
    const layer = host.querySelector("path.ic-artboard-outline-layer[d]");
    expect(layer).toBeTruthy();
    const paths = [...host.querySelectorAll("svg path[d]")];
    const layerIndex = paths.indexOf(layer as SVGPathElement);
    const firstFaceIndex = paths.findIndex((path) => path.classList.contains("ic-iso-cube-face"));
    expect(layerIndex).toBeGreaterThanOrEqual(0);
    expect(firstFaceIndex).toBeGreaterThan(layerIndex);
    host.remove();
  });

  it("rotated orientation mounts full cube shells (same face count as default)", () => {
    const host = document.createElement("div");
    paintIsometricOrientation(host, "rotated");
    document.body.appendChild(host);
    mountCardGrid(host, activeShowcaseColors());
    expect(host.querySelectorAll("svg path.ic-iso-cube-face[d]")).toHaveLength(45);
    expect(host.querySelectorAll("svg path.ic-iso-cube-face--front[d]")).toHaveLength(9);
    expect(host.querySelectorAll("svg path.ic-iso-cube-face--side[d]")).toHaveLength(9);
    expect(host.querySelectorAll("svg path.ic-iso-cube-face--top[d]")).toHaveLength(9);
    host.remove();
  });

  it("keeps cube labels centered on the top face (default and rotated)", () => {
    const bboxCenter = (el: SVGGraphicsElement): { x: number; y: number } => {
      const b = el.getBBox();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    };
    for (const orientation of ["default", "rotated"] as const) {
      const host = document.createElement("div");
      if (orientation === "rotated") {
        paintIsometricOrientation(host, "rotated");
      }
      document.body.appendChild(host);
      mountCardGrid(host, activeShowcaseColors());
      const node = host.querySelector('g.node[data-object-id="card-5"]');
      const boxShell = node?.parentElement;
      const topFace = boxShell?.querySelector("path.ic-iso-cube-face--top");
      const text = node?.querySelector("text");
      expect(topFace).toBeInstanceOf(SVGGraphicsElement);
      expect(text).toBeInstanceOf(SVGGraphicsElement);
      const faceCenter = bboxCenter(topFace as SVGGraphicsElement);
      const labelCenter = bboxCenter(text as SVGGraphicsElement);
      expect(labelCenter.x).toBeCloseTo(faceCenter.x, 0);
      expect(labelCenter.y).toBeCloseTo(faceCenter.y, 0);
      host.remove();
    }
  });

  it("demo card grid assigns a distinct extrusion height per cell", () => {
    const heights = new Set(DEMO_CARD_GRID.map((cell) => cell.heightUserPx));
    expect(heights.size).toBe(DEMO_CARD_GRID.length);
  });

  it("places card grid cubes at distinct iso anchors", () => {
    const macroPitch = artboardDivisionPitch(
      DEFAULT_ARTBOARD_USER_SIZE,
      DEFAULT_ARTBOARD_GRID_DIVISIONS,
    );
    const keys = new Set<string>();
    for (const cell of DEMO_CARD_GRID) {
      const { left, right } = artboardLatticeCellIsoGround(cell.col, cell.row, macroPitch);
      keys.add(`${left.toFixed(5)},${right.toFixed(5)}`);
    }
    expect(keys.size).toBe(DEMO_CARD_GRID.length);
  });

  it("stage ground anchor is plane (0, 0)", () => {
    expect(artboardPlaneTopLeftIsoGround()).toEqual(artboardPlaneToIsoGround(0, 0));
  });

  it("artboard iso guides are single diagonal strokes", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    mountCardGrid(host, activeShowcaseColors());
    const guides = [...host.querySelectorAll("path.ic-artboard-guide[d]")];
    expect(guides.length).toBe(4);
    for (const guide of guides) {
      const pts = pathPoints(guide.getAttribute("d") ?? "");
      expect(pts).toHaveLength(2);
      expect(Math.abs(pts[1]!.x - pts[0]!.x)).toBeGreaterThan(1);
      expect(Math.abs(pts[1]!.y - pts[0]!.y)).toBeGreaterThan(1);
    }
    host.remove();
  });

  it("artboard ground outline is an isometric parallelogram, not an axis-aligned rect", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const svg = mountCardGrid(host, activeShowcaseColors());
    const outline = svg.querySelector("path.ic-artboard-outline");
    expect(outline).toBeTruthy();
    const pts = pathPoints(outline!.getAttribute("d") ?? "");
    expect(pts.length).toBeGreaterThanOrEqual(4);
    const xs = new Set(pts.map((p) => p.x.toFixed(2)));
    const ys = new Set(pts.map((p) => p.y.toFixed(2)));
    const axisAlignedBox = xs.size === 2 && ys.size === 2;
    expect(axisAlignedBox).toBe(false);
    const cardTop = svg.querySelector("path.ic-iso-cube-face--top");
    expect(cardTop).toBeTruthy();
    const topPts = pathPoints(cardTop!.getAttribute("d") ?? "");
    expect(topPts.length).toBeGreaterThanOrEqual(4);
    host.remove();
  });

  it("aligns six face paths around one cube anchor", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const canvas = new IsometricCanvas({
      container: host,
      backgroundColor: "transparent",
      scale: DEFAULT_CUBE_CANVAS_SCALE,
      width: 400,
      height: 300,
    });
    const spec: IsoBoxSpec = {
      id: "cube-a",
      label: "A",
      left: 2,
      right: 3,
      width: 2,
      depth: 1.25,
      height: 0.9,
    };
    mountIsoBoxesOnCanvas(canvas, [spec], DEFAULT_ISO_CANVAS_COLORS);
    const paths = [...host.querySelectorAll("path.ic-iso-cube-face[d]")];
    expect(paths).toHaveLength(6);
    const top = paths.find((p) => p.classList.contains("ic-iso-cube-face--top"));
    const bottom = paths.find((p) => p.classList.contains("ic-iso-cube-face--bottom"));
    expect(top).toBeTruthy();
    expect(bottom).toBeTruthy();
    const topPts = pathPoints(top!.getAttribute("d") ?? "");
    const bottomPts = pathPoints(bottom!.getAttribute("d") ?? "");
    expect(topPts.length).toBeGreaterThan(0);
    expect(bottomPts.length).toBeGreaterThan(0);
    host.remove();
  });

  it("isoCubeFaceRectLayout assigns positive dimensions for each face", () => {
    const w = 2;
    const d = 1.25;
    const h = 0.9;
    for (const face of ["bottom", "back", "left", "side", "front", "top"] as const) {
      const layout = isoCubeFaceRectLayout(face, w, d, h);
      expect(layout.width).toBeGreaterThan(0);
      expect(layout.height).toBeGreaterThan(0);
    }
  });

  it("keeps every plane-top-left face on the box footprint (l ∈ [−w, 0], r ∈ [0, d])", () => {
    const w = 2;
    const d = 1.25;
    const h = 0.9;
    const eps = 1e-9;
    for (const face of ISO_CUBE_MOUNT_FACE_ORDER) {
      const layout = isoCubeFaceRectLayoutForPlaneTopLeft(face, w, d, h);
      const r0 = layout.right ?? 0;
      const l0 = layout.left ?? 0;
      const t0 = layout.top ?? 0;
      const corners =
        layout.planeView === PlaneView.FRONT
          ? [{ r: r0, l: l0 }, { r: r0, l: l0 + layout.width }]
          : layout.planeView === PlaneView.SIDE
            ? [{ r: r0, l: l0 }, { r: r0 + layout.width, l: l0 }]
            : [{ r: r0, l: l0 }, { r: r0 + layout.width, l: l0 + layout.height }];
      for (const { r, l } of corners) {
        expect(l, face).toBeGreaterThanOrEqual(-w - eps);
        expect(l, face).toBeLessThanOrEqual(eps);
        expect(r, face).toBeGreaterThanOrEqual(-eps);
        expect(r, face).toBeLessThanOrEqual(d + eps);
      }
      expect(t0, face).toBeLessThanOrEqual(h + eps);
    }
  });

  it("keeps rotated plane-top-left faces on l ∈ [0, w], r ∈ [0, d]", () => {
    const w = 2;
    const d = 1.25;
    const h = 0.9;
    const eps = 1e-9;
    for (const face of ISO_CUBE_MOUNT_FACE_ORDER) {
      const layout = isoCubeFaceRectLayoutForPlaneTopLeft(face, w, d, h, "rotated");
      const r0 = layout.right ?? 0;
      const l0 = layout.left ?? 0;
      const corners =
        layout.planeView === PlaneView.FRONT
          ? [{ r: r0, l: l0 }, { r: r0, l: l0 + layout.width }]
          : layout.planeView === PlaneView.SIDE
            ? [{ r: r0, l: l0 }, { r: r0 + layout.width, l: l0 }]
            : [{ r: r0, l: l0 }, { r: r0 + layout.width, l: l0 + layout.height }];
      for (const { r, l } of corners) {
        expect(l, face).toBeGreaterThanOrEqual(-eps);
        expect(l, face).toBeLessThanOrEqual(w + eps);
        expect(r, face).toBeGreaterThanOrEqual(-eps);
        expect(r, face).toBeLessThanOrEqual(d + eps);
      }
      expect(layout.top ?? 0, face).toBeLessThanOrEqual(h + eps);
    }
  });

  it("renders diagram scene nodes", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const svg = renderDiagramScene(host, DIAGRAM_SCENE_FIXTURE, activeShowcaseColors());
    expect(svg.getAttribute("data-diagram-renderer")).toBe(DIAGRAM_RENDERER);
    expect(host.querySelectorAll("g.node[data-object-id]")).toHaveLength(3);
    host.remove();
  });
});
