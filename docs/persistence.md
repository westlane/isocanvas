# Persistence

Generic snapshot persistence lives in **`src/persistence/`** and is exported from **`@westlane/isocanvas/persistence`** (not the root entry — keeps browser/diagram imports free of `loro.js`).

Install **`loro.js`** when you use Loro adapters (`peerDependencies`, optional at install). Memory and `localStorage` JSON adapters do not require it.

## Types

- **`PersistenceAdapter<TSnapshot>`** — `load`, `save`, optional `clear`, plus a stable `id` (exported from root and `./persistence`).
- Loro-specific types (`LoroFieldPersistenceOptions`, …) — **`@westlane/isocanvas/persistence`** only.
- **`PersistenceRegistry<TSnapshot>`** — `getAdapter`, `setAdapter`, optional `setAfterSave` / `runAfterSave`.

Apps define their own snapshot shape (`TSnapshot`); the library does not embed demo session fields.

## Adapters

| Factory | Use |
| --- | --- |
| `createMemoryPersistenceAdapter` | Tests and ephemeral sessions |
| `createWebStoragePersistenceAdapter` / `createLocalStoragePersistenceAdapter` / `createSessionStoragePersistenceAdapter` | JSON in `Storage` |
| `createLoroFieldPersistenceAdapter` | Loro map field + optional binary doc bytes in storage |
| `createLoroFieldPersistenceWithLocalDocBytes` | Same adapter; hydrates/persists doc bytes in `localStorage` when bytes already exist |

Loro doc byte helpers (`importLoroDocFromStorage`, `persistLoroDocToStorage`, `loroDocBytesStorageKey`) are exported for apps that store CRDT bytes beside JSON snapshots.

## Demo wiring

The Vite demo binds **`DemoSessionSnapshot`** in:

- **`demo/scripts/session.ts`** — showcase snapshot shape, slice store, `hydrateDemoSession` / `persistDemoSession`; installs persistence via **`createLoroFieldPersistenceWithLocalDocBytes`** from `@westlane/isocanvas/persistence` (no direct `loro.js` in demo code).

Do not import demo modules from library consumers; copy the pattern and plug in your snapshot type.
