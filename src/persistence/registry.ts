// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { PersistenceAdapter } from "../types/plugins.js";

export type PersistenceRegistry<TSnapshot> = {
  getAdapter: () => PersistenceAdapter<TSnapshot>;
  setAdapter: (adapter: PersistenceAdapter<TSnapshot> | null) => void;
  setAfterSave: (fn: (() => void) | undefined) => void;
  runAfterSave: () => void;
};

export function createPersistenceRegistry<TSnapshot>(): PersistenceRegistry<TSnapshot> {
  const noopAdapter: PersistenceAdapter<TSnapshot> = {
    id: "noop",
    load: () => null,
    save: () => {},
  };

  let activeAdapter: PersistenceAdapter<TSnapshot> = noopAdapter;
  let afterSave: (() => void) | undefined;

  return {
    getAdapter: () => activeAdapter,
    setAdapter: (adapter) => {
      activeAdapter = adapter ?? noopAdapter;
    },
    setAfterSave: (fn) => {
      afterSave = fn;
    },
    runAfterSave: () => {
      afterSave?.();
    },
  };
}
