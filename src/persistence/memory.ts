// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { PersistenceAdapter } from "../types/plugins.js";

export function createMemoryPersistenceAdapter<TSnapshot>(
  initial: TSnapshot | null = null,
): PersistenceAdapter<TSnapshot> & { snapshot: () => TSnapshot | null } {
  let stored = initial;
  return {
    id: "memory",
    load: () => (stored ? structuredClone(stored) : null),
    save: (snapshot) => {
      stored = structuredClone(snapshot);
    },
    clear: () => {
      stored = null;
    },
    snapshot: () => (stored ? structuredClone(stored) : null),
  };
}
