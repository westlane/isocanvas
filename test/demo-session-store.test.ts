// Copyright (C) 2026 West Lane - All Rights Reserved
// @vitest-environment happy-dom

import { describe, expect, it, beforeEach } from "vitest";
import { LoroDoc } from "loro.js";
import {
  createLoroDoc,
  createLoroFieldPersistenceAdapter,
  importLoroDocFromStorage,
  loroDocBytesStorageKey,
  persistLoroDocToStorage,
} from "@westlane/isocanvas";
import {
  applyDemoSessionSnapshot,
  buildDemoSessionSnapshot,
  DEFAULT_DEMO_SESSION_STORAGE_KEY,
  DEMO_LORO_FIELD_KEY,
  demoSessionSnapshotFromValue,
  getArtboardSlice,
  hydrateDemoSession,
  persistDemoSession,
  setArtboardSlice,
  setDemoSessionPersistenceAdapter,
  setDemoSessionPersistenceAfterSave,
  createMemoryDemoSessionPersistenceAdapter,
  getDemoCanvasCamera,
  setDemoCanvasCamera,
} from "../demo/scripts/session.js";

const SHOWCASE_LORO_MAP = "isocanvasShowcase";

function createShowcaseLoroAdapter(doc: LoroDoc) {
  return createLoroFieldPersistenceAdapter({
    doc,
    mapName: SHOWCASE_LORO_MAP,
    fieldKey: DEMO_LORO_FIELD_KEY,
    parse: demoSessionSnapshotFromValue,
  });
}

describe("demo session store", () => {
  beforeEach(() => {
    localStorage.clear();
    setDemoSessionPersistenceAdapter(createMemoryDemoSessionPersistenceAdapter());
    setDemoSessionPersistenceAfterSave(undefined);
  });

  it("applyDemoSessionSnapshot restores in-memory state", () => {
    applyDemoSessionSnapshot({
      v: 2,
      canvas: { viewBox: { x: 0, y: 0, w: 520, h: 320 } },
      slices: { "showcase/card-grid": { foo: "bar" } },
    });
    expect(getDemoCanvasCamera()?.viewBox).toEqual({ x: 0, y: 0, w: 520, h: 320 });
    expect(buildDemoSessionSnapshot().slices["showcase/card-grid"]).toEqual({ foo: "bar" });
  });
});

describe("loro persistence adapter", () => {
  beforeEach(() => {
    setDemoSessionPersistenceAfterSave(undefined);
  });

  it("round-trips session through LoroDoc only", () => {
    setDemoSessionPersistenceAdapter(createShowcaseLoroAdapter(new LoroDoc()));

    setDemoCanvasCamera({
      viewBox: { x: 1, y: 2, w: 520, h: 320 },
    });
    setArtboardSlice("showcase/card-stack", {
      nodes: [{ id: "a", box: { x: 10, y: 10, width: 40, height: 20 } }],
      selected: ["a"],
    });
    persistDemoSession();

    setDemoCanvasCamera({
      viewBox: { x: 0, y: 0, w: 100, h: 100 },
    });

    hydrateDemoSession();

    expect(getDemoCanvasCamera()?.viewBox).toEqual({
      x: 1,
      y: 2,
      w: 520,
      h: 320,
    });
    expect(getArtboardSlice("showcase/card-stack")).toEqual({
      nodes: [{ id: "a", box: { x: 10, y: 10, width: 40, height: 20 } }],
      selected: ["a"],
    });
  });
});

describe("loro doc localStorage bytes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips session with loro adapter and separate doc bytes in localStorage", () => {
    const doc = createLoroDoc();
    setDemoSessionPersistenceAdapter(createShowcaseLoroAdapter(doc));
    setDemoSessionPersistenceAfterSave(() =>
      persistLoroDocToStorage(doc, localStorage, DEFAULT_DEMO_SESSION_STORAGE_KEY),
    );

    setDemoCanvasCamera({
      viewBox: { x: 1, y: 2, w: 520, h: 320 },
    });
    setArtboardSlice("showcase/card-stack", {
      nodes: [{ id: "a", box: { x: 10, y: 10, width: 40, height: 20 } }],
      selected: ["a"],
    });
    persistDemoSession();

    expect(
      localStorage.getItem(loroDocBytesStorageKey(DEFAULT_DEMO_SESSION_STORAGE_KEY)),
    ).toBeTruthy();

    setDemoCanvasCamera({
      viewBox: { x: 0, y: 0, w: 100, h: 100 },
    });

    const reloadedDoc = createLoroDoc();
    importLoroDocFromStorage(reloadedDoc, localStorage, DEFAULT_DEMO_SESSION_STORAGE_KEY);
    setDemoSessionPersistenceAdapter(createShowcaseLoroAdapter(reloadedDoc));
    setDemoSessionPersistenceAfterSave(() =>
      persistLoroDocToStorage(reloadedDoc, localStorage, DEFAULT_DEMO_SESSION_STORAGE_KEY),
    );
    hydrateDemoSession();

    expect(getDemoCanvasCamera()?.viewBox).toEqual({
      x: 1,
      y: 2,
      w: 520,
      h: 320,
    });
    expect(getArtboardSlice("showcase/card-stack")).toEqual({
      nodes: [{ id: "a", box: { x: 10, y: 10, width: 40, height: 20 } }],
      selected: ["a"],
    });
  });
});
