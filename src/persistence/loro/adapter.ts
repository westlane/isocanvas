// Copyright (C) 2026 West Lane - All Rights Reserved

import { LoroDoc } from "loro.js";
import type {
  LoroFieldPersistenceAdapter,
  LoroFieldPersistenceOptions,
} from "../../types/plugins.js";

/** Persist one field on a Loro map (in-memory or host-provided doc). */
export function createLoroFieldPersistenceAdapter<TSnapshot>(
  options: LoroFieldPersistenceOptions<TSnapshot>,
): LoroFieldPersistenceAdapter<TSnapshot> {
  const doc = options.doc ?? new LoroDoc();
  const mapName = options.mapName ?? "isocanvasPersistence";
  const fieldKey = options.fieldKey ?? "session";
  const id = options.id ?? "loro";
  const map = options.map ?? doc.getMap(mapName);

  return {
    id,
    doc,
    load(): TSnapshot | null {
      return options.parse(map.get(fieldKey));
    },
    save(snapshot: TSnapshot): void {
      map.set(fieldKey, snapshot);
    },
    clear(): void {
      map.delete(fieldKey);
    },
  };
}

export function createLoroDoc(): LoroDoc {
  return new LoroDoc();
}
