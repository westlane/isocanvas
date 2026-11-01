# Isocanvas architecture

Layered stack for portable `DiagramScene` data plus canvas/viewport infrastructure.

## Source layout (`src/`)

| Path | Role |
| --- | --- |
| `index.ts` | Public API: canvas, diagram, camera, grid, theme (no Loro persistence — use **`@westlane/isocanvas/persistence`**) |
| `stage/` | **Map-style stage** — `createIsoCanvasStage` owns viewport + artboard registry + camera |
| `viewport/` | Outer frame: world-camera DOM layers |
| `layout/` | **Artboard**, spacing, box align; **`layout/snap/`** point/axis/diagram/drag snap & smart guides |
| `grid/` | Dot grid surface, projection, SVG pattern, world-camera sync |
| `camera/` | ViewBox (`view-box/`), pointer pan/zoom (`interaction.ts`), world host (`world/`), fit (`fit/`), **`attachWorldCameraPanZoom`** (DOM pan/zoom wiring) |
| `isometric/` | **Shapes** (iso): `mount.ts` pipeline, orientation, plane layout; `cube/` faces, labels, stacking; `stage/` artboard ground shell |
| `diagram/` | **Shapes** (portable): `DiagramScene` types + `renderDiagramScene` |
| `svg/` | SVG user-space bbox helpers |
| `theme/` | Color tokens, theme manager, wireframe mode |
| `persistence/` | Reusable snapshot adapters (memory, web storage, Loro field + doc bytes) |
| `extensions/` | Optional `IsoCanvasExtension` host |
| `types/` | Shared types: `core`, `artboard`, `camera`, `diagram`, `grid`, `theme`, `plugins` |

**Demo app (`demo/`):** `index.html`, `styles/main.css`, `scripts/main.ts` (entry), `scripts/shell/` (shell DOM, chrome controls, viewport debug HUD), `scripts/viewport.ts`, `scripts/tools.ts`, `scripts/session.ts`, `scripts/theme.ts`, `scripts/samples/`; showcase CSS in `styles/showcase.css`. See [persistence.md](./persistence.md).

**Rendering:** Cube mounting via `@elchininet/isometric` lives in `src/isometric/` and is exported from `@westlane/isocanvas`.

## Layers

| Layer | Responsibility | Technology |
| --- | --- | --- |
| **Relationships** | Entities, edges, layout | Domain model (e.g. domainspec kernel) |
| **Diagram presentation** | Iso boxes, edges | `@elchininet/isometric` + `src/isometric/mount.ts` |
| **Camera** | Pan/zoom | SVG `viewBox`, optional world `translate`/`scale` |
| **Grid & snap** | Dot grid + drag snap | `src/grid/*`, `snap-axis`, `snap-point` |
| **Artboard** | Logical frame + optional DOM dot grid; iso diagrams use frame-only and mount ground in the cube SVG | `createDiagramArtboard()` / `createArtboard({ embedDotGrid: false })` |

## Document hierarchy

**Artboard → shape(s)** on a full-bleed stage element (demo: `#diagram-viewport`).

## Diagram mount

Use `mountPlaneBoxesOnCanvas` / `decorateCubeCanvas` (and optional `addIsoEdgeSegment`), `defaultIsoArtboardStage` / `mountIsometricCanvasOnHost`, or `renderDiagramScene` from `@westlane/isocanvas`. Demo-specific compositions live in `demo/scripts/samples/`.
