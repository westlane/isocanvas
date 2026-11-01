// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { LoroDoc } from "loro.js";
import type { PersistenceAdapter } from "../types/plugins.js";

/** Map-like store for tests or hosts that inject storage without a shared `LoroDoc`. */
export type LoroFieldMap = {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  delete(key: string): void;
};

export type LoroFieldPersistenceOptions<TSnapshot> = {
  doc?: LoroDoc;
  map?: LoroFieldMap;
  mapName?: string;
  fieldKey?: string;
  id?: string;
  parse: (value: unknown) => TSnapshot | null;
};

export type LoroFieldPersistenceAdapter<TSnapshot> = PersistenceAdapter<TSnapshot> & {
  doc: LoroDoc;
};
