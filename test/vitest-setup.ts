// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane
/** Node 22+ can run Vitest without a full happy-dom window; provide Web Storage for persistence tests. */

import { Window } from "happy-dom";

if (typeof globalThis.localStorage === "undefined") {
  const window = new Window();
  globalThis.localStorage = window.localStorage;
  globalThis.sessionStorage = window.sessionStorage;
}