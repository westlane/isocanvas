// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { IsoCanvasColors } from "../types/theme.js";
import type {
  CreateIsoCanvasStageOptions,
  IsoCanvasArtboardId,
  IsoCanvasStage,
  IsoCanvasStageAddArtboardOptions,
  IsoCanvasStageFitOptions,
  IsoCanvasStagePanZoomOptions,
} from "../types/stage.js";
import { Artboard, type ArtboardInit } from "./artboard-handle.js";
import { createIsoCanvasStage } from "./iso-canvas-stage.js";
import {
  mountDiagramScenesOnIsoCanvasStage,
  type IsoCanvasStageArtboardSpec,
  type RenderDiagramScenesOnIsoCanvasStageOptions,
  type SyncIsoCanvasStageArtboardRegistryOptions,
} from "./stage-artboard-sync.js";

export type StageMountOptions = RenderDiagramScenesOnIsoCanvasStageOptions & {
  registry?: SyncIsoCanvasStageArtboardRegistryOptions;
};

/**
 * Viewport that owns zero or more {@link Artboard} instances (DOM + camera registry).
 * Prefer this over calling `createIsoCanvasStage` directly in product code.
 */
export class Stage {
  readonly #handle: IsoCanvasStage;

  readonly #artboards = new Map<IsoCanvasArtboardId, Artboard>();

  private constructor(handle: IsoCanvasStage) {
    this.#handle = handle;
  }

  static create(options: CreateIsoCanvasStageOptions = {}): Stage {
    const { artboards: seedArtboards, activeArtboardId, ...stageOptions } = options;
    const stage = new Stage(createIsoCanvasStage(stageOptions));
    for (const seed of seedArtboards ?? []) {
      stage.addArtboard(seed);
    }
    if (activeArtboardId) {
      stage.setActiveArtboard(activeArtboardId);
    }
    return stage;
  }

  /** Escape hatch for legacy callers (`attachIsoCanvasStageNodeSelection`, etc.). */
  get handle(): IsoCanvasStage {
    return this.#handle;
  }

  get layout(): IsoCanvasStage["layout"] {
    return this.#handle.layout;
  }

  get container(): HTMLDivElement {
    return this.#handle.container;
  }

  get activeArtboardId(): IsoCanvasArtboardId | null {
    return this.#handle.activeArtboardId;
  }

  artboards(): readonly Artboard[] {
    return [...this.#artboards.values()];
  }

  getArtboard(id: IsoCanvasArtboardId): Artboard | undefined {
    return this.#artboards.get(id);
  }

  addArtboard(init: ArtboardInit | IsoCanvasStageAddArtboardOptions): Artboard {
    const board = new Artboard(init as ArtboardInit);
    this.#artboards.set(board.id, board);
    this.#handle.addArtboard(board.toStageSpec());
    return board;
  }

  removeArtboard(id: IsoCanvasArtboardId): boolean {
    if (!this.#artboards.delete(id)) {
      return this.#handle.removeArtboard(id);
    }
    return this.#handle.removeArtboard(id);
  }

  setActiveArtboard(id: IsoCanvasArtboardId): boolean {
    return this.#handle.setActiveArtboard(id);
  }

  setArtboardVisible(id: IsoCanvasArtboardId, visible: boolean): boolean {
    return this.#handle.setArtboardVisible(id, visible);
  }

  /** Sync registry + diagram SVG for `specs` (typical dash refresh). */
  mount(
    specs: readonly IsoCanvasStageArtboardSpec[],
    options: StageMountOptions,
  ): void {
    const { registry, ...renderOptions } = options;
    this.#syncArtboardModels(specs);
    mountDiagramScenesOnIsoCanvasStage(this.#handle, specs, renderOptions, registry);
  }

  #syncArtboardModels(specs: readonly IsoCanvasStageArtboardSpec[]): void {
    const specIds = new Set(specs.map((spec) => spec.id));
    for (const id of [...this.#artboards.keys()]) {
      if (!specIds.has(id)) {
        this.#artboards.delete(id);
      }
    }
    for (const spec of specs) {
      const existing = this.#artboards.get(spec.id);
      if (existing) {
        if (spec.scene !== undefined) {
          existing.setScene(spec.scene);
        }
        if (spec.label !== undefined) {
          existing.label = spec.label;
        }
        if (spec.gridSlot !== undefined) {
          existing.gridSlot = spec.gridSlot;
        }
        continue;
      }
      this.#artboards.set(spec.id, new Artboard(spec as ArtboardInit));
    }
  }

  relayoutArtboards(): void {
    this.#handle.relayoutArtboards();
  }

  fitView(options?: IsoCanvasStageFitOptions): boolean {
    return this.#handle.fitView(options);
  }

  fitArtboard(id?: IsoCanvasArtboardId, options?: IsoCanvasStageFitOptions): boolean {
    return this.#handle.fitArtboard(id, options);
  }

  attachPanZoom(options?: IsoCanvasStagePanZoomOptions): () => void {
    return this.#handle.attachPanZoom(options);
  }

  syncRowWorldCamera(): boolean {
    return this.#handle.syncRowWorldCamera();
  }

  destroy(): void {
    this.#artboards.clear();
    this.#handle.destroy();
  }
}

export type { IsoCanvasColors };
