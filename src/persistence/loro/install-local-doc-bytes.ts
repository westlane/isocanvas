// Copyright (C) 2026 West Lane - All Rights Reserved

import { createLoroFieldPersistenceAdapter } from "./adapter.js";
import {
  importLoroDocFromLocalStorage,
  persistLoroDocToLocalStorage,
} from "./doc-bytes-storage.js";
import type { LoroFieldPersistenceOptions } from "../../types/plugins.js";
import type { LoroFieldPersistenceAdapter } from "../../types/plugins.js";

export type LoroFieldPersistenceWithLocalDocBytesOptions<TSnapshot> =
  LoroFieldPersistenceOptions<TSnapshot> & {
    /** Web storage key for the session field (doc bytes use `{key}:loro-bytes`). */
    localSessionKey: string;
  };

export type LoroFieldPersistenceInstall<TSnapshot> = {
  adapter: LoroFieldPersistenceAdapter<TSnapshot>;
  afterSave?: () => void;
};

/**
 * Loro field adapter plus optional localStorage doc-byte hydrate/persist
 * (same behavior as the showcase demo install path).
 */
export function createLoroFieldPersistenceWithLocalDocBytes<TSnapshot>(
  options: LoroFieldPersistenceWithLocalDocBytesOptions<TSnapshot>,
): LoroFieldPersistenceInstall<TSnapshot> {
  const adapter = createLoroFieldPersistenceAdapter(options);
  if (typeof localStorage === "undefined") {
    return { adapter };
  }
  const hadDocBytes = importLoroDocFromLocalStorage(adapter.doc, options.localSessionKey);
  if (!hadDocBytes) {
    return { adapter };
  }
  return {
    adapter,
    afterSave: () => {
      persistLoroDocToLocalStorage(adapter.doc, options.localSessionKey);
    },
  };
}
