// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

/** Parse a stored value when snapshots use a numeric `v` field. */
export function snapshotFromVersionedValue<TSnapshot extends { v: number }>(
  value: unknown,
  version: TSnapshot["v"],
): TSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as TSnapshot;
  if (record.v !== version) {
    return null;
  }
  return record;
}
