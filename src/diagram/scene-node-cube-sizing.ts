// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { DiagramSceneNode } from "../types/diagram.js";
import type { IsometricOrientation } from "../types/diagram.js";
import { diagramUserFootprintPxForCubeLabel } from "../layout/diagram-node-label-footprint.js";
import { DIAGRAM_NODE_FOOTPRINT } from "../layout/diagram-node-footprint.js";
import {
  uniformIsoCubeTopLabelFontSizePx,
} from "../isometric/cube/canvas-text-style.js";
import { isoSizeFromDiagramUser } from "../isometric/diagram-user.js";
import type { PlaneBoxSpec } from "../types/artboard.js";

function sizeNodesForLabelFont(
  nodes: readonly DiagramSceneNode[],
  orientation: IsometricOrientation,
  labelFontSizePx: number,
): DiagramSceneNode[] {
  return nodes.map((node) => {
    const sized = diagramUserFootprintPxForCubeLabel({
      label: node.label,
      fontSizePx: labelFontSizePx,
      minWidthPx: node.w,
      minDepthPx: node.h,
      orientation,
    });
    if (sized.widthPx === node.w && sized.depthPx === node.h) {
      return node;
    }
    return { ...node, w: sized.widthPx, h: sized.depthPx };
  });
}

function provisionalLabelSpecs(
  nodes: readonly DiagramSceneNode[],
  planeBoxFromNode: (node: DiagramSceneNode) => PlaneBoxSpec,
): { label: string; width: number; depth: number; omitCubeLabel: false }[] {
  return nodes.flatMap((node) => {
    const box = planeBoxFromNode(node);
    const { width, depth } = isoSizeFromDiagramUser(box.width, box.depth);
    return [
      {
        label: node.label,
        width,
        depth,
        omitCubeLabel: false as const,
      },
    ];
  });
}

/** Grow scene node footprints so mounted cube top faces fit their labels at the shared font size. */
export function diagramSceneNodesSizedForCubeLabels(
  nodes: readonly DiagramSceneNode[],
  orientation: IsometricOrientation,
  planeBoxFromNode: (node: DiagramSceneNode) => PlaneBoxSpec,
): DiagramSceneNode[] {
  if (nodes.length === 0) {
    return [];
  }
  const labelFontSizePx = uniformIsoCubeTopLabelFontSizePx(
    provisionalLabelSpecs(nodes, planeBoxFromNode),
    { orientation },
  );
  const once = sizeNodesForLabelFont(nodes, orientation, labelFontSizePx);
  const refinedFontSizePx = uniformIsoCubeTopLabelFontSizePx(
    provisionalLabelSpecs(once, planeBoxFromNode),
    { orientation },
  );
  const sized =
    refinedFontSizePx === labelFontSizePx
      ? once
      : sizeNodesForLabelFont(once, orientation, refinedFontSizePx);
  return applyUniformCubeFootprintInScene(sized);
}

/** Same plane footprint for every cube — default lattice size (labels truncate / shrink font). */
function applyUniformCubeFootprintInScene(
  nodes: readonly DiagramSceneNode[],
): DiagramSceneNode[] {
  if (nodes.length === 0) {
    return [];
  }
  const { widthPx, depthPx } = DIAGRAM_NODE_FOOTPRINT;
  return nodes.map((node) => ({ ...node, w: widthPx, h: depthPx }));
}
