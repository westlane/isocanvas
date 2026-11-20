// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import type { LoroDoc } from "loro.js";

const LORO_SNAPSHOT_SUFFIX = ":loro-bytes";

export function loroDocBytesStorageKey(sessionKey: string): string {
  return `${sessionKey}${LORO_SNAPSHOT_SUFFIX}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/** Hydrate a Loro doc from snapshot bytes in web `Storage`. */
export function importLoroDocFromStorage(
  doc: LoroDoc,
  storage: Pick<Storage, "getItem" | "removeItem">,
  sessionKey: string,
): void {
  const bytesKey = loroDocBytesStorageKey(sessionKey);
  const encoded = storage.getItem(bytesKey);
  if (!encoded) {
    return;
  }
  try {
    doc.import(base64ToBytes(encoded));
  } catch {
    storage.removeItem(bytesKey);
  }
}

/** Persist Loro doc snapshot bytes to web `Storage`. */
export function persistLoroDocToStorage(
  doc: LoroDoc,
  storage: Pick<Storage, "setItem" | "removeItem">,
  sessionKey: string,
): void {
  const bytesKey = loroDocBytesStorageKey(sessionKey);
  try {
    const bytes = doc.export({ mode: "snapshot" });
    storage.setItem(bytesKey, bytesToBase64(bytes));
  } catch {
    storage.removeItem(bytesKey);
  }
}

export function clearLoroDocStorage(
  storage: Pick<Storage, "removeItem">,
  sessionKey: string,
): void {
  storage.removeItem(loroDocBytesStorageKey(sessionKey));
}

export function importLoroDocFromLocalStorage(doc: LoroDoc, sessionKey: string): boolean {
  if (typeof localStorage === "undefined") {
    return false;
  }
  importLoroDocFromStorage(doc, localStorage, sessionKey);
  return true;
}

export function persistLoroDocToLocalStorage(doc: LoroDoc, sessionKey: string): boolean {
  if (typeof localStorage === "undefined") {
    return false;
  }
  persistLoroDocToStorage(doc, localStorage, sessionKey);
  return true;
}
