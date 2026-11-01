// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { PersistenceAdapter } from "../types/plugins.js";

export type WebStoragePersistenceOptions<TSnapshot> = {
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  key: string;
  id?: string | undefined;
  parse: (raw: string) => TSnapshot | null;
  serialize?: (snapshot: TSnapshot) => string;
};

export function createWebStoragePersistenceAdapter<TSnapshot>(
  options: WebStoragePersistenceOptions<TSnapshot>,
): PersistenceAdapter<TSnapshot> {
  const id = options.id ?? `web-storage:${options.key}`;
  const serialize = options.serialize ?? ((snapshot: TSnapshot) => JSON.stringify(snapshot));

  return {
    id,
    load(): TSnapshot | null {
      const raw = options.storage.getItem(options.key);
      if (!raw) {
        return null;
      }
      return options.parse(raw);
    },
    save(snapshot: TSnapshot): void {
      try {
        options.storage.setItem(options.key, serialize(snapshot));
      } catch {
        // Quota or private mode.
      }
    },
    clear(): void {
      options.storage.removeItem(options.key);
    },
  };
}

export function createLocalStoragePersistenceAdapter<TSnapshot>(
  options: Omit<WebStoragePersistenceOptions<TSnapshot>, "storage">,
): PersistenceAdapter<TSnapshot> | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return createWebStoragePersistenceAdapter({
    ...options,
    storage: localStorage,
    id: options.id ?? "localStorage",
  });
}

export function createSessionStoragePersistenceAdapter<TSnapshot>(
  options: Omit<WebStoragePersistenceOptions<TSnapshot>, "storage">,
): PersistenceAdapter<TSnapshot> | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  return createWebStoragePersistenceAdapter({
    ...options,
    storage: sessionStorage,
    id: options.id ?? "sessionStorage",
  });
}
