// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { IsometricText, PlaneView, type IsometricCanvas } from "@elchininet/isometric";
import type { DiagramScene, DiagramSceneNode } from "../types/diagram.js";
import {
  CANVAS_TEXT_NO_STROKE,
  formatIsoCanvasLabelText,
  truncateIsoCanvasLabelText,
  isoCubeTopFaceLabelMaxWidthPx,
  IC_ISO_CUBE_LABEL_CLASS,
  ISO_CANVAS_LABEL_FONT_FAMILY,
  ISO_CANVAS_LABEL_FONT_WEIGHT,
  ISO_EDGE_LABEL_FONT_SIZE_PX,
  IC_FOUNDATION_SLAB_CAPTION_CLASS,
  FOUNDATION_SLAB_CAPTION_FONT_SIZE_PX,
} from "../isometric/cube/canvas-text-style.js";
import { artboardPlaneToIsoGround, isoSizeFromDiagramUser } from "../isometric/diagram-user.js";
import { extrusionHeightForFootprint, userPxToIsoUnits } from "../isometric/cube/cube.js";
import { ISO_STACK_ARTBOARD_CLEARANCE_ISO } from "../isometric/cube/stack-opacity.js";
import {
  addIsoEdgeSegment,
  decorateCubeCanvas,
  mountPlaneBoxesOnCanvas,
} from "../isometric/mount.js";
import {
  DEFAULT_DIAGRAM_ARTBOARD_SHELL_CHROME,
  type ArtboardStageShellChrome,
} from "../isometric/stage/stage-shell.js";
import type { IsoCanvasColors } from "../types/theme.js";
import { DEFAULT_ISO_CANVAS_COLORS } from "../theme/defaults.js";
import type { ArtboardUserSize } from "../types/artboard.js";
import type { PlaneBoxSpec } from "../types/artboard.js";
import type { ArtboardPlaneStage } from "../types/artboard.js";
import { DEFAULT_ARTBOARD_GRID_DIVISIONS } from "../layout/artboard.js";
import { enforcePlaneBoxOnArtboardLattice } from "../layout/lattice.js";
import {
  DEFAULT_ARTBOARD_LAYOUT_DOT_INSET,
  DEFAULT_ARTBOARD_LAYOUT_DOT_INSET_TRAILING,
  DIAGRAM_SCENE_ROW_GRID_COLS,
  relayoutDiagramSceneNodesInPackedRows,
  shiftDiagramSceneNodesDownDots,
} from "./scene-lattice-layout.js";
import { DIAGRAM_NODE_FOOTPRINT } from "../layout/diagram-node-footprint.js";
import { defaultIsoArtboardStage, mountIsometricCanvasOnHost } from "../isometric/stage/stage.js";
import {
  artboardLatticeStageForPlaneBoxInRow,
  type PlaneRowColumnLayout,
} from "../stage/stage-plane-row-scene.js";
import { artboardLatticeStageForPlaneBoxInGrid } from "../stage/stage-plane-grid-scene.js";
import type { PlaneGridMountPlan } from "../stage/plane-grid-mount.js";
import {
  planeRowColumnLayoutFromMountPlan,
  planeRowMountPlanWithCollectionContentExtents,
  type PlaneRowMountPlan,
} from "../stage/plane-row-mount.js";
import { setViewportLeftBottomMeet } from "../camera/view-box/attributes.js";
import { frameDiagramSceneCamera } from "./diagram-document.js";
import { diagramSceneNodesSizedForCubeLabels } from "./scene-node-cube-sizing.js";
import { readIsometricOrientationFromCanvas } from "../isometric/orientation.js";

const MIN_DOMAIN_EXTRUSION = 0.55;
const MAX_DOMAIN_EXTRUSION = 1.45;
const DOMAIN_EXTRUSION_FOOTPRINT_RATIO = 0.88;
/** Pedestal extrusion under the domain cube (iso units). */
const FOUNDATION_SLAB_HEIGHT_ISO = userPxToIsoUnits(20);
/** Extra footprint depth (+y on artboard) so tier color reads below the cube. */
const FOUNDATION_SLAB_DEPTH_EXTENSION_PX = 40;
const FOUNDATION_SLAB_VIEWBOX_PAD_PX = FOUNDATION_SLAB_DEPTH_EXTENSION_PX + 8;

const ROW_Y_CLUSTER_EPSILON_PX = 2;

function nodeCenter(node: DiagramSceneNode): { x: number; y: number } {
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 };
}

function clusterRowCountFromNodes(nodes: readonly DiagramSceneNode[]): number {
  if (nodes.length === 0) {
    return 1;
  }
  const sorted = [...nodes].sort((a, b) => a.y - b.y);
  let count = 1;
  let rowY = sorted[0]!.y;
  for (const node of sorted.slice(1)) {
    if (Math.abs(node.y - rowY) > ROW_Y_CLUSTER_EPSILON_PX) {
      count += 1;
      rowY = node.y;
    }
  }
  return count;
}

function planeBoxFromNode(node: DiagramSceneNode, overrides?: Partial<PlaneBoxSpec>): PlaneBoxSpec {
  const { width, depth } = isoSizeFromDiagramUser(node.w, node.h);
  const height = Math.min(
    MAX_DOMAIN_EXTRUSION,
    Math.max(
      MIN_DOMAIN_EXTRUSION,
      extrusionHeightForFootprint(width, depth, DOMAIN_EXTRUSION_FOOTPRINT_RATIO),
    ),
  );
  return {
    id: node.id,
    label: node.label,
    x: node.x,
    y: node.y,
    width: node.w,
    depth: node.h,
    height,
    planeBoxRole: "domain",
    ...(node.cubeFaceColors !== undefined ? { cubeFaceColors: node.cubeFaceColors } : {}),
    ...overrides,
  };
}

function planeBoxesForSceneNode(node: DiagramSceneNode): PlaneBoxSpec[] {
  const slab = node.foundationSlab;
  if (!slab) {
    return [planeBoxFromNode(node)];
  }
  const slabHeight = FOUNDATION_SLAB_HEIGHT_ISO;
  const slabElevation = ISO_STACK_ARTBOARD_CLEARANCE_ISO;
  const domainElevation = slabElevation + slabHeight;
  return [
    planeBoxFromNode(node, {
      id: `${node.id}__foundationSlab`,
      label: "",
      depth: node.h + FOUNDATION_SLAB_DEPTH_EXTENSION_PX,
      height: slabHeight,
      elevation: slabElevation,
      planeBoxRole: "foundationSlab",
      monoFaceFill: slab.fill,
      omitCubeLabel: true,
    }),
    planeBoxFromNode(node, {
      elevation: domainElevation,
    }),
  ];
}

function mountFoundationSlabCaptions(
  canvas: IsometricCanvas,
  scene: DiagramScene,
  stage: ArtboardPlaneStage,
): void {
  for (const node of scene.nodes) {
    const slab = node.foundationSlab;
    if (!slab?.label.trim()) {
      continue;
    }
    const captionPlaneY =
      node.y + node.h + FOUNDATION_SLAB_DEPTH_EXTENSION_PX / 2;
    const captionPlaneX = node.x + node.w / 2;
    const ground = artboardPlaneToIsoGround(captionPlaneX, captionPlaneY, undefined, stage);
    const { width: widthIso, depth: depthIso } = isoSizeFromDiagramUser(node.w, node.h);
    const captionText = truncateIsoCanvasLabelText(
      formatIsoCanvasLabelText(slab.label),
      isoCubeTopFaceLabelMaxWidthPx(widthIso, depthIso),
      FOUNDATION_SLAB_CAPTION_FONT_SIZE_PX,
    );
    canvas.addChild(
      new IsometricText({
        planeView: PlaneView.TOP,
        text: captionText,
        left: ground.left,
        right: ground.right,
        top: 0.06,
        fontSize: FOUNDATION_SLAB_CAPTION_FONT_SIZE_PX,
        fontFamily: ISO_CANVAS_LABEL_FONT_FAMILY,
        fontWeight: ISO_CANVAS_LABEL_FONT_WEIGHT,
        fontStyle: "normal",
        fillColor: slab.stroke,
        ...CANVAS_TEXT_NO_STROKE,
        className: `${IC_FOUNDATION_SLAB_CAPTION_CLASS} ${IC_ISO_CUBE_LABEL_CLASS}`,
        origin: ["center", "center"],
        selectable: false,
      }),
    );
  }
}

function artboardStageWithFoundationSlabPad(scene: DiagramScene, stage: ArtboardPlaneStage): ArtboardPlaneStage {
  const needsPad = scene.nodes.some((node) => node.foundationSlab);
  if (!needsPad) {
    return stage;
  }
  return {
    ...stage,
    height: stage.height + FOUNDATION_SLAB_VIEWBOX_PAD_PX,
  };
}

export type RenderDiagramSceneOptions = {
  /** Skip artboard shell entirely; mount cubes only. */
  omitArtboardShell?: boolean;
  /** Override default {@link DEFAULT_DIAGRAM_ARTBOARD_SHELL_CHROME} (use `"full"` for demo-style guides). */
  artboardShellChrome?: ArtboardStageShellChrome;
  /** Iso ground / shell size (independent of scene content viewBox). */
  artboardUserSize?: ArtboardUserSize;
  /** Meet alignment for SVG in host (`min` = left/top in host, one plane row). */
  viewportMeetAlign?: "min" | "mid";
  /** Merged iso strip (Organization + Project columns, etc.). */
  planeRowMount?: PlaneRowMountPlan;
  /** Merged iso grid (Resource above Organization + Project, etc.). */
  planeGridMount?: PlaneGridMountPlan;
  /** Collection title on a single artboard shell (non plane-row). */
  artboardCollection?: import("../stage/plane-row-mount.js").PlaneRowColumnSpec;
  /** Extra +plane y shift for domain cubes (fine dots; default when a collection label is set). */
  contentPlaneDownDots?: number;
};

function artboardStageFromScene(
  scene: DiagramScene,
  userSizeOverride?: ArtboardUserSize,
): ArtboardPlaneStage {
  if (userSizeOverride && userSizeOverride.width > 0 && userSizeOverride.height > 0) {
    const stage: ArtboardPlaneStage = {
      x: 0,
      y: 0,
      width: userSizeOverride.width,
      height: userSizeOverride.height,
      divisions: scene.divisions ?? DEFAULT_ARTBOARD_GRID_DIVISIONS,
    };
    return artboardStageWithFoundationSlabPad(scene, stage);
  }
  const viewBox = scene.viewBox;
  let stage: ArtboardPlaneStage;
  if (viewBox && viewBox.w > 0 && viewBox.h > 0) {
    stage = {
      x: viewBox.x,
      y: viewBox.y,
      width: viewBox.w,
      height: viewBox.h,
      divisions: scene.divisions ?? DEFAULT_ARTBOARD_GRID_DIVISIONS,
    };
  } else {
    stage = defaultIsoArtboardStage();
  }
  return artboardStageWithFoundationSlabPad(scene, stage);
}

function latticeStageForPlaneBox(
  box: PlaneBoxSpec,
  stage: ArtboardPlaneStage,
  planeRow?: PlaneRowColumnLayout,
  planeGrid?: PlaneGridMountPlan,
): ArtboardPlaneStage {
  if (planeGrid) {
    return artboardLatticeStageForPlaneBoxInGrid(
      box,
      stage,
      planeGrid.layout,
      planeGrid.cells,
    );
  }
  if (planeRow) {
    return artboardLatticeStageForPlaneBoxInRow(box, stage, planeRow);
  }
  return stage;
}

/** Mount a portable {@link DiagramScene} on an iso artboard stage (scene viewBox when present). */
export function renderDiagramScene(
  host: HTMLElement,
  scene: DiagramScene,
  colors: IsoCanvasColors = DEFAULT_ISO_CANVAS_COLORS,
  options: RenderDiagramSceneOptions = {},
): SVGSVGElement {
  const stage = artboardStageFromScene(scene, options.artboardUserSize);
  const canvas = mountIsometricCanvasOnHost(host, stage);

  const orientation = readIsometricOrientationFromCanvas(canvas);
  const labelSizedNodes = diagramSceneNodesSizedForCubeLabels(scene.nodes, orientation, (node) =>
    planeBoxFromNode(node),
  );
  const rowCount = Math.max(
    1,
    clusterRowCountFromNodes(labelSizedNodes),
  );
  const planeRowColumns = options.planeRowMount
    ? planeRowColumnLayoutFromMountPlan(options.planeRowMount)
    : undefined;
  let layoutNodes = relayoutDiagramSceneNodesInPackedRows(labelSizedNodes, stage, {
    footprintUser: DIAGRAM_NODE_FOOTPRINT,
    dotInset: DEFAULT_ARTBOARD_LAYOUT_DOT_INSET,
    dotInsetTrailing: DEFAULT_ARTBOARD_LAYOUT_DOT_INSET_TRAILING,
    rowCount,
    rowSpan: stage.divisions ?? rowCount,
    gridCols: DIAGRAM_SCENE_ROW_GRID_COLS,
    ...(planeRowColumns ? { planeRowColumns } : {}),
    ...(options.planeGridMount ? { planeGridMount: options.planeGridMount } : {}),
  });
  const downDots = options.contentPlaneDownDots ?? 0;
  layoutNodes = shiftDiagramSceneNodesDownDots(layoutNodes, stage, downDots);

  for (const edge of scene.edges ?? []) {
    const fromNode = layoutNodes.find((node) => node.id === edge.from);
    const toNode = layoutNodes.find((node) => node.id === edge.to);
    if (!fromNode || !toNode) {
      continue;
    }
    const fromCenter = nodeCenter(fromNode);
    const toCenter = nodeCenter(toNode);
    const from = artboardPlaneToIsoGround(fromCenter.x, fromCenter.y);
    const to = artboardPlaneToIsoGround(toCenter.x, toCenter.y);
    addIsoEdgeSegment(canvas, from, to, colors);
    if (edge.label) {
      const midPlane = {
        x: (fromCenter.x + toCenter.x) / 2,
        y: (fromCenter.y + toCenter.y) / 2,
      };
      const mid = artboardPlaneToIsoGround(midPlane.x, midPlane.y);
      canvas.addChild(
        new IsometricText({
          planeView: PlaneView.TOP,
          text: formatIsoCanvasLabelText(edge.label),
          left: mid.left,
          right: mid.right,
          top: 0.12,
          fontSize: ISO_EDGE_LABEL_FONT_SIZE_PX,
          fontFamily: ISO_CANVAS_LABEL_FONT_FAMILY,
          fontWeight: ISO_CANVAS_LABEL_FONT_WEIGHT,
          fontStyle: "normal",
          fillColor: colors.edgeLabel,
          ...CANVAS_TEXT_NO_STROKE,
          className: IC_ISO_CUBE_LABEL_CLASS,
          origin: ["center", "center"],
          selectable: false,
        }),
      );
    }
  }

  let planeRowMount = options.planeRowMount;
  if (planeRowMount && planeRowColumns) {
    planeRowMount = planeRowMountPlanWithCollectionContentExtents(
      planeRowMount,
      layoutNodes,
      planeRowColumns,
    );
  }
  const artboardCollection = options.artboardCollection;

  mountPlaneBoxesOnCanvas(
    canvas,
    layoutNodes.flatMap((node) =>
      planeBoxesForSceneNode(node).map((box) =>
        enforcePlaneBoxOnArtboardLattice(
          box,
          latticeStageForPlaneBox(box, stage, planeRowColumns, options.planeGridMount),
        ),
      ),
    ),
    colors,
    {
      stage,
      ...(planeRowMount ? { planeRowMount } : {}),
      ...(options.planeGridMount ? { planeGridMount: options.planeGridMount } : {}),
      ...(options.omitArtboardShell
        ? { omitArtboardShell: true }
        : {
            artboardShellChrome:
              options.artboardShellChrome ?? DEFAULT_DIAGRAM_ARTBOARD_SHELL_CHROME,
          }),
      ...(artboardCollection ? { artboardCollection } : {}),
    },
  );

  mountFoundationSlabCaptions(canvas, { ...scene, nodes: layoutNodes }, stage);

  const svg = decorateCubeCanvas(canvas);
  if (options.viewportMeetAlign === "min") {
    svg.dataset.icViewportMeet = "min";
    setViewportLeftBottomMeet(svg);
  } else {
    svg.removeAttribute("data-ic-viewport-meet");
  }
  frameDiagramSceneCamera(host);
  return svg;
}
