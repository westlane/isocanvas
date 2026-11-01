# @westlane/isocanvas

Isometric diagram canvas for browser ESM: viewBox zoom math, phased dot grid + drag snap, SVG bbox helpers, portable `DiagramScene` data, and **cube mounting** via **`@elchininet/isometric`**.

See [docs/architecture.md](docs/architecture.md) for the full layer model.

## Demo

```bash
yarn demo
```

Open the URL Vite prints (default port **5174**). The demo imports **`src/`** directly (not `dist/`). Choose a **Theme** family from the dropdown; use the sun/moon control (or **L**) for light/dark. **T** cycles the family dropdown.

## Dot grid

1. **CSS** — import grid + spacing tokens:

```css
@import "@westlane/isocanvas/canvas-chrome.css";
/* or dot pattern only: @import "@westlane/isocanvas/dot-grid.css"; */
```

2. **DOM** — stage (100% panel) → artboard (dot grid + content):

```ts
import { createArtboard } from "@westlane/isocanvas";

const artboard = createArtboard({ contentId: "diagram-host" });
stage.replaceChildren(artboard.root);
artboard.content.appendChild(diagramHost);
```

Or markup:

```html
<div class="diagram-stage">
  <div class="ic-artboard" data-artboard-width="540" data-artboard-height="228">
    <div class="ic-dot-grid-surface">
      <div class="ic-dot-grid-plane" aria-hidden="true">
        <div class="ic-dot-grid"></div>
      </div>
      <div class="ic-artboard-content diagram-host"></div>
    </div>
  </div>
</div>
```

Flat surface (grid fills the viewport without an artboard frame):

```ts
import { createDotGridSurface } from "@westlane/isocanvas";

const { surface, grid } = createDotGridSurface({ sizePx: 18 });
viewport.replaceChildren(surface);
surface.appendChild(diagramHost);
```

## Stage (map-style)

One container owns the viewport camera and a registry of artboards (like a Mapbox / MapTiler map with layers):

```ts
import { createIsoCanvasStage, renderDiagramScene } from "@westlane/isocanvas";

const stage = createIsoCanvasStage({
  className: "ic-stage-viewport",
  artboards: [
    { id: "main", embedDotGrid: false, contentId: "diagram-host" },
    { id: "inset", embedDotGrid: false, userSize: { width: 520, height: 320 } },
  ],
  activeArtboardId: "main",
});

appViewport.replaceChildren(stage.container);
stage.attachPanZoom({ surface: appViewport });

const main = stage.getArtboard("main")!;
renderDiagramScene(main.host, scene);
stage.fitView();

stage.setActiveArtboard("inset");
stage.getArtboards(); // programmatic access to every artboard + host
```

Use `fitArtboard(id)` / `fitView()` for the default centered camera. Each artboard remembers its own view when you switch with `setActiveArtboard`.

3. **Tune** on a parent:

```css
.diagram-viewport {
  --ic-dot-grid-size: 18px;
  --ic-dot-grid-phase: calc(var(--ic-dot-grid-size) / 2);
  --ic-dot-grid-border: #94a3b8;
  --ic-dot-grid-extent: 600%;
  --ic-dot-grid-inset: -250%;
}
```

The grid layer is **larger than the clip** (`.ic-dot-grid-surface { overflow: hidden }`) so 3D tilt still shows dots; snap origin uses the surface box automatically.

4. **Snap** (optional, draggable overlays) — read metrics from the grid element after layout/scroll:

```ts
import { dotGridMetricsFromElement, snapAndClampDragOffset } from "@westlane/isocanvas";

const grid = dotGridMetricsFromElement({ gridElement: gridEl });
```

Put the dot layer on the **same pan/zoom transform** as the content so dots and snap stay aligned.

The **demo** (`yarn demo`) mounts the grid this way inside `#diagram-viewport`.

## CSS

```css
@import "@westlane/isocanvas/canvas-chrome.css";
/* or dot grid only: @import "@westlane/isocanvas/dot-grid.css"; */
```

Spacing tokens (`--ic-space-*`, `--ic-gap`, `--ic-pad`) align with snap when `--ic-gap` tracks `--ic-dot-grid-size`.

## Snap & guides

```ts
import {
  dotGridMetricsFromElement,
  snapAndClampDragOffset,
  snapClientPointToDotGrid,
  snapSvgUserPointToDotGrid,
} from "@westlane/isocanvas";
```

Optional magnet and half-cell snap: pass `axis: { magnetPx: 8, subdivision: 2 }` on snap options.

## Diagram scenes

Portable **`DiagramScene`** data (nodes + optional edges) lives in `src/types/diagram.ts`. Use `renderDiagramScene` from `@westlane/isocanvas`, or compose lower-level helpers (`mountPlaneBoxesOnCanvas`, `addIsoEdgeSegment`, `decorateCubeCanvas`, `defaultIsoArtboardStage`, `mountIsometricCanvasOnHost`). The demo’s card grid and stack live in `demo/scripts/samples/`.

## Build & test

```bash
yarn install
yarn check          # typecheck, build, test, neutral-policy
```

`yarn build` emits **`dist/`** (required for npm `exports`; `pretest` / `prepack` run it automatically). Published tarballs ship **`dist/` + `theme/`** only (no `src/`).

Demo-only: **`@westlane/pino-blanc`** is a dev **portal** on [`../pino-blanc`](../pino-blanc) (sibling checkout). CI clones the same repo beside this one.

## Consumers

| Need | Import | Also install |
| --- | --- | --- |
| Canvas, grid, snap, iso mount | `@westlane/isocanvas` | (includes `@elchininet/isometric`) |
| Artboard lattice layout only | `@westlane/isocanvas/layout` | — |
| Session / Loro adapters | `@westlane/isocanvas/persistence` | `loro.js` (peer; optional at install) |
| Full demo chrome CSS | `@westlane/isocanvas/canvas-chrome.css` | — |
| One palette | `@westlane/isocanvas/theme/schemes/dark/gruvbox.css` (etc.) | third-party palette CSS — not relicensed by isocanvas; prefer single imports over `theme/schemes.css` |

After `yarn add @westlane/isocanvas`, run **`yarn build`** inside the package if you install from git without a prebuilt `dist/`. Registry installs run `prepack` at publish time.

Local **`yarn demo`** resolves **`src/`** via Vite aliases (not package `exports`).

## License

MIT — see [LICENSE](LICENSE). Applies to isocanvas **TypeScript/JavaScript** sources (SPDX headers on `.ts`/`.mjs`). **CSS** in this repo carries no copyright comment headers; palette scheme sheets under `theme/schemes/` are generated from pino-blanc built-ins (third-party palette names).
