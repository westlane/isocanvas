// Copyright (C) 2026 West Lane - All Rights Reserved

import type { LoroDoc } from "loro.js";

/** Context passed to extensions after a diagram SVG is mounted. */
export type DiagramMountContext = {
  host: HTMLElement;
  svg: SVGSVGElement;
  viewport: HTMLElement | null;
};

/** Pluggable hooks; keep handlers small and composable. */
export type IsoCanvasExtension = {
  id: string;
  onDiagramMounted?: (ctx: DiagramMountContext) => void | (() => void);
};

/** Pluggable load/save for a versioned or opaque app snapshot. */
export type PersistenceAdapter<TSnapshot> = {
  readonly id: string;
  load: () => TSnapshot | null;
  save: (snapshot: TSnapshot) => void;
  clear?: () => void;
};

/** Map-like store for tests or hosts that inject storage without a shared `LoroDoc`. */
export type LoroFieldMap = {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  delete(key: string): void;
};

export type LoroFieldPersistenceOptions<TSnapshot> = {
  doc?: LoroDoc;
  map?: LoroFieldMap;
  mapName?: string;
  fieldKey?: string;
  id?: string;
  parse: (value: unknown) => TSnapshot | null;
};

export type LoroFieldPersistenceAdapter<TSnapshot> = PersistenceAdapter<TSnapshot> & {
  doc: LoroDoc;
};
