// Copyright (C) 2026 West Lane - All Rights Reserved

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
