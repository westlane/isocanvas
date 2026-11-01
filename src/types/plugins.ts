// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

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
