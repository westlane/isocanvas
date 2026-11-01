# Persistence

Generic snapshot persistence lives in **`src/persistence/`** and is exported from `@westlane/isocanvas` via **`src/index.ts`**.

## Types

- **`PersistenceAdapter<TSnapshot>`** — `load`, `save`, optional `clear`, plus a stable `id`.
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

- **`demo/scripts/session.ts`** — showcase snapshot shape, slice store, `hydrateDemoSession` / `persistDemoSession`; installs persistence via **`createLoroFieldPersistenceWithLocalDocBytes`** from `@westlane/isocanvas` (no direct `loro.js` in demo code).

Do not import demo modules from library consumers; copy the pattern and plug in your snapshot type.
