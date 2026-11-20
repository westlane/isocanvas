// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { createLoroFieldPersistenceAdapter } from "./adapter.js";
import {
  importLoroDocFromLocalStorage,
  persistLoroDocToLocalStorage,
} from "./doc-bytes-storage.js";
import type {
  LoroFieldPersistenceAdapter,
  LoroFieldPersistenceOptions,
} from "../loro-types.js";

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
