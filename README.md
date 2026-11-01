# @westlane/isocanvas

Isometric diagram canvas for browser ESM: viewBox zoom math, phased dot grid + drag snap, SVG bbox helpers, portable `DiagramScene` data, and **cube mounting** via the `ic-canvas` dependency (same package entry).

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

Flat surface (grid fills the stage without an artboard frame):

```ts
import { createDotGridSurface } from "@westlane/isocanvas";

const { surface, grid } = createDotGridSurface({ sizePx: 18 });
viewport.replaceChildren(surface);
surface.appendChild(diagramHost);
```

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
yarn typecheck
yarn test
yarn build
```

`@westlane/pino-blanc` is a **portal** dependency on [`../pino-blanc`](../pino-blanc) (Yarn 4). Clone both repos as siblings under `westlane/`, or after [pino-blanc](https://github.com/westlane/pino-blanc) **0.1.4+** is on GitHub, switch to `github:westlane/pino-blanc#v0.1.4` or `npm:@westlane/pino-blanc@^0.1.4` with [GitHub Packages auth](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) in `.npmrc`.

## Consumers

Local apps and `yarn demo` resolve the package entry to **`src/index.ts`**. Run `yarn build` only when you need emitted `dist/`.
