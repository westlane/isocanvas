// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { CreateArtboardOptions } from "../layout/artboard.js";
import type { ArtboardUserSize } from "../types/artboard.js";
import type { DiagramScene, DiagramSceneEdge, DiagramSceneNode } from "../types/diagram.js";
import type { PlaneGridCellSlot } from "../types/stage.js";
import type { IsoCanvasArtboardId } from "../types/stage.js";

export type ArtboardInit = {
  id: IsoCanvasArtboardId;
  label?: string;
  scene?: DiagramScene;
  gridSlot?: PlaneGridCellSlot;
  collectionLabelFill?: string;
} & Partial<CreateArtboardOptions>;

/** One logical artboard: frame metadata, diagram scene (objects), optional stage grid slot. */
export class Artboard {
  readonly id: IsoCanvasArtboardId;

  label?: string;

  gridSlot?: PlaneGridCellSlot;

  collectionLabelFill?: string;

  readonly createOptions: CreateArtboardOptions;

  private _scene: DiagramScene | undefined;

  constructor(init: ArtboardInit) {
    const { id, label, scene, gridSlot, collectionLabelFill, ...createOptions } = init;
    this.id = id;
    if (label !== undefined) {
      this.label = label;
    }
    if (gridSlot !== undefined) {
      this.gridSlot = gridSlot;
    }
    if (collectionLabelFill !== undefined) {
      this.collectionLabelFill = collectionLabelFill;
    }
    this.createOptions = createOptions;
    this._scene = scene;
  }

  /** Domain / diagram objects mounted on this artboard plane. */
  get nodes(): readonly DiagramSceneNode[] {
    return this._scene?.nodes ?? [];
  }

  get edges(): readonly DiagramSceneEdge[] {
    return this._scene?.edges ?? [];
  }

  get scene(): DiagramScene | undefined {
    return this._scene;
  }

  setScene(scene: DiagramScene | undefined): void {
    this._scene = scene;
  }

  /** Replace object list while preserving edges and view metadata when present. */
  setNodes(nodes: readonly DiagramSceneNode[]): void {
    if (!this._scene) {
      this._scene = { nodes: [...nodes] };
      return;
    }
    this._scene = { ...this._scene, nodes: [...nodes] };
  }

  toStageSpec(): {
    id: IsoCanvasArtboardId;
    label?: string;
    collectionLabelFill?: string;
    gridSlot?: PlaneGridCellSlot;
    scene?: DiagramScene;
  } & CreateArtboardOptions {
    return {
      id: this.id,
      ...(this.label !== undefined ? { label: this.label } : {}),
      ...(this.collectionLabelFill !== undefined
        ? { collectionLabelFill: this.collectionLabelFill }
        : {}),
      ...(this.gridSlot !== undefined ? { gridSlot: this.gridSlot } : {}),
      ...(this._scene !== undefined ? { scene: this._scene } : {}),
      ...this.createOptions,
    };
  }
}

export type ArtboardUserSizeSource = {
  userSize: ArtboardUserSize;
};
