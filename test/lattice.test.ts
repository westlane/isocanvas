// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane

import { describe, expect, it } from "vitest";
import {
  artboardDivisionPitch,
  artboardLatticeCellIsoGround,
  artboardPlaneBottomLeftInsetPoint,
  artboardPlaneCollectionLabelBottomLeftFloatAnchor,
  artboardDotStep,
  artboardPlaneCellFirstDot,
  artboardPlaneCellFootprintAtTopLeftDot,
  artboardPlaneCellOrigin,
  artboardSnapFootprintToDots,
  enforcePlaneBoxOnArtboardLattice,
  artboardPlaneGridLineStep,
  defaultLatticeStage,
  DEFAULT_ARTBOARD_DOTS_PER_CELL,
  artboardUserSizeForLattice,
  artboardUserToPlane,
  compareArtboardLatticeCells,
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
  DEFAULT_ARTBOARD_USER_SIZE,
  DEFAULT_DOT_GRID_SIZE_PX,
  isoGroundFromArtboardUser,
} from "@westlane/isocanvas";
import { DEMO_CARD_USER_DEPTH_PX, DEMO_CARD_USER_WIDTH_PX } from "./fixtures/card-grid.js";

describe("artboard lattice layout", () => {
  const pitch = {
    xPx: DEMO_CARD_USER_WIDTH_PX + DEFAULT_DOT_GRID_SIZE_PX,
    yPx: DEMO_CARD_USER_DEPTH_PX + DEFAULT_DOT_GRID_SIZE_PX,
  };

  const macroPitch = artboardDivisionPitch(
    DEFAULT_ARTBOARD_USER_SIZE,
    DEFAULT_ARTBOARD_GRID_DIVISIONS,
  );

  it("macro cell (1,0) starts at one third of artboard width", () => {
    expect(artboardPlaneCellOrigin(1, 0, macroPitch).x).toBeCloseTo(
      DEFAULT_ARTBOARD_USER_SIZE.width / DEFAULT_ARTBOARD_GRID_DIVISIONS,
      5,
    );
    expect(artboardPlaneCellOrigin(0, 1, macroPitch).y).toBeCloseTo(
      DEFAULT_ARTBOARD_USER_SIZE.height / DEFAULT_ARTBOARD_GRID_DIVISIONS,
      5,
    );
  });

  it("centers footprint in a macro cell", () => {
    const corner = artboardLatticeCellIsoGround(1, 0, macroPitch);
    const centered = artboardLatticeCellIsoGround(1, 0, macroPitch, {
      footprintUser: { widthPx: DEMO_CARD_USER_WIDTH_PX, depthPx: DEMO_CARD_USER_DEPTH_PX },
    });
    expect(centered.left + centered.right).not.toBeCloseTo(corner.left + corner.right, 4);
    expect(centered.left + centered.right).toBeGreaterThan(corner.left + corner.right);
  });

  it("first dot sits half a dot step inside the cell corner", () => {
    const step = macroPitch.xPx / DEFAULT_ARTBOARD_DOTS_PER_CELL;
    const corner = artboardPlaneCellOrigin(1, 2, macroPitch);
    const dot = artboardPlaneCellFirstDot(1, 2, macroPitch);
    expect(dot.x).toBeCloseTo(corner.x + step / 2, 9);
    expect(dot.y).toBeCloseTo(corner.y + step / 2, 9);
  });

  it("intersection phase pins studs on cell corners", () => {
    const corner = artboardPlaneCellOrigin(1, 2, macroPitch);
    const dot = artboardPlaneCellFirstDot(1, 2, macroPitch, DEFAULT_ARTBOARD_DOTS_PER_CELL, "intersection");
    expect(dot.x).toBeCloseTo(corner.x, 9);
    expect(dot.y).toBeCloseTo(corner.y, 9);
  });

  it("shifts top-left dot pin by whole dot steps", () => {
    const step = artboardDotStep(macroPitch);
    const base = artboardPlaneCellFootprintAtTopLeftDot(1, 1, macroPitch);
    const shifted = artboardPlaneCellFootprintAtTopLeftDot(1, 1, macroPitch, DEFAULT_ARTBOARD_DOTS_PER_CELL, {
      leftDots: 2,
      downDots: 1,
    });
    expect(shifted.x).toBeCloseTo(base.x - 2 * step.xPx, 9);
    expect(shifted.y).toBeCloseTo(base.y + step.yPx, 9);
  });

  it("snaps a footprint to whole dot steps", () => {
    const step = artboardDotStep(macroPitch);
    const snapped = artboardSnapFootprintToDots(
      { widthPx: DEMO_CARD_USER_WIDTH_PX, depthPx: DEMO_CARD_USER_DEPTH_PX },
      macroPitch,
    );
    expect(snapped.widthPx).toBeCloseTo(8 * step.xPx, 9);
    expect(snapped.depthPx).toBeCloseTo(5 * step.yPx, 9);
    expect(artboardSnapFootprintToDots({ widthPx: 1, depthPx: 1 }, macroPitch).widthPx).toBeCloseTo(
      step.xPx,
      9,
    );
  });

  it("places cell (0,0) at plane top-left", () => {
    expect(artboardPlaneCellOrigin(0, 0, pitch)).toEqual({ x: 0, y: 0 });
  });

  it("steps rows downward in plane space (+y)", () => {
    expect(artboardPlaneCellOrigin(0, 1, pitch).y).toBe(pitch.yPx);
    expect(artboardPlaneCellOrigin(2, 0, pitch).x).toBe(2 * pitch.xPx);
  });

  it("bottom-left origin mode matches user (0,0) cell anchor", () => {
    const h = DEFAULT_ARTBOARD_USER_SIZE.height;
    const fromLattice = artboardLatticeCellIsoGround(0, 0, pitch, {
      origin: "bottom-left",
      artboardHeight: h,
    });
    const fromUser = isoGroundFromArtboardUser(0, 0, h);
    expect(fromLattice.left).toBeCloseTo(fromUser.left, 6);
    expect(fromLattice.right).toBeCloseTo(fromUser.right, 6);
    expect(artboardPlaneCellOrigin(0, 0, pitch, { origin: "bottom-left", artboardHeight: h })).toEqual(
      artboardUserToPlane(0, 0, h),
    );
  });

  it("collection label anchor uses each artboard column SW pin", () => {
    const stage = { x: 500, y: 0, width: 400, height: 300, divisions: 3 };
    const inset = artboardPlaneBottomLeftInsetPoint(stage, 2);
    const anchor = artboardPlaneCollectionLabelBottomLeftFloatAnchor(stage, {
      marginDots: 2,
      floatBelowPx: 16,
    });
    expect(anchor.x).toBeCloseTo(500 + inset.x, 6);
    expect(anchor.y).toBeCloseTo(inset.y + 16, 6);
    expect(inset.x).toBeLessThan(stage.width * 0.1);
  });

  it("orders back row before front row for iso paint", () => {
    const back = artboardLatticeCellIsoGround(0, 0, pitch);
    const front = artboardLatticeCellIsoGround(0, 1, pitch);
    expect(back.left + back.right).toBeLessThan(front.left + front.right);
  });

  it("sizes artboard for a 3×2 card lattice", () => {
    const expected = {
      width: 3 * DEMO_CARD_USER_WIDTH_PX + 2 * DEFAULT_DOT_GRID_SIZE_PX,
      height: 2 * DEMO_CARD_USER_DEPTH_PX + DEFAULT_DOT_GRID_SIZE_PX,
    };
    expect(
      artboardUserSizeForLattice(
        3,
        2,
        { widthPx: DEMO_CARD_USER_WIDTH_PX, depthPx: DEMO_CARD_USER_DEPTH_PX },
        DEFAULT_DOT_GRID_SIZE_PX,
      ),
    ).toEqual(expected);
  });

  it("compareArtboardLatticeCells sorts row-major from top-left", () => {
    const cells = [
      { col: 1, row: 1 },
      { col: 0, row: 0 },
      { col: 2, row: 0 },
    ];
    cells.sort(compareArtboardLatticeCells);
    expect(cells).toEqual([
      { col: 0, row: 0 },
      { col: 2, row: 0 },
      { col: 1, row: 1 },
    ]);
  });

  it("enforcePlaneBoxOnArtboardLattice is idempotent on the default stage", () => {
    const stage = defaultLatticeStage();
    const lineStep = artboardPlaneGridLineStep(stage).xPx;
    const box = {
      id: "n",
      label: "n",
      x: 41.2,
      y: 88.7,
      width: 170,
      depth: 58,
      height: 0.5,
      footprintAnchor: "back-left" as const,
    };
    const once = enforcePlaneBoxOnArtboardLattice(box, stage);
    const twice = enforcePlaneBoxOnArtboardLattice(once, stage);
    expect(twice).toEqual(once);
    expect(once.x % lineStep).toBeCloseTo(0, 9);
    expect(once.y % lineStep).toBeCloseTo(0, 9);
    expect(once.width % lineStep).toBeCloseTo(0, 9);
    expect(once.depth % lineStep).toBeCloseTo(0, 9);
  });
});
