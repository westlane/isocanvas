export declare function normalizeHex(hex: string): string;
export declare const SURFACE_INK_HEX = "#212121";
export declare const SURFACE_PAPER_HEX = "#f8fafc";
export declare function relativeLuminanceFromHex(hex: string): number;
export declare function isLightHex(hex: string): boolean;
export declare function contrastRatio(fgHex: string, bgHex: string): number;
/** Readable foreground on a surface (dark text on light cards, light text on dark cards). */
export declare function readableForeground(backgroundHex: string, identityHex: string): string;
export declare function readableTextOnSurface(surfaceHex: string, preferredHex?: string): string;
/** Contrast-safe ink + muted gray on canvas `surface`, tinted from theme identity (e.g. log `roles.message`). */
export declare function themeInkShades(surfaceHex: string, identityHex: string): {
    ink: string;
    inkMuted: string;
};
/** Black blend for wireframe grid lines on light artboard (subtle, same hue as top face). */
export declare const WIREFRAME_LIGHT_ARTBOARD_GRID_BLACK = 0.12;
/** Dots on light artboard — a touch darker than division lines. */
export declare const WIREFRAME_LIGHT_ARTBOARD_DOT_BLACK = 0.18;
/** Black blend for wireframe lines/dots on dark artboard panels (subtle, same hue as top face). */
export declare const WIREFRAME_DARK_ARTBOARD_STROKE_BLACK = 0.14;
/** Wireframe grid line ink — slightly darker than the artboard top (light and dark canvas). */
export declare function wireframeLineInkOnArtboard(canvasSurfaceHex: string, appearance: "light" | "dark"): string;
/** Dot grid + layout guides — artboard-tinted (not iso card edges). */
export declare function wireframeGridStrokeOnCanvas(canvasSurfaceHex: string): string;
/** Flat node rects — readable on light canvas; artboard tint on dark. */
export declare function wireframeStrokeOnSurface(surfaceHex: string, preferredOutlineHex: string): string;
/** Iso cube/card outlines and labels — theme-readable ink (visible on card face washes). */
export declare function wireframeIsoNodeStroke(surfaceHex: string, preferredInkHex?: string): string;
/** Opaque paper front face in wireframe mode (covers extrusion strokes painted beneath). */
export declare function wireframeFrontSurfaceOnCanvas(surfaceHex: string, paperHex?: string, cardFaceHex?: string): string;
/** Alpha washes for visible iso faces in wireframe mode (stroke color — masks extrusion beneath). */
export declare const WIREFRAME_TOP_FACE_FILL_OPACITY = 0.14;
export declare const WIREFRAME_FRONT_FACE_FILL_OPACITY = 0.08;
export declare const WIREFRAME_SIDE_FACE_FILL_OPACITY = 0.06;
/** Rear faces (back / left) — softer outline in wireframe. */
export declare const WIREFRAME_BACK_FACE_STROKE_OPACITY = 0.28;
/** Face wash strength on dark canvas — same hue as solid cards, darkened. */
export declare const WIREFRAME_DARK_TOP_FACE_FILL_OPACITY = 0.38;
export declare const WIREFRAME_DARK_FRONT_FACE_FILL_OPACITY = 0.22;
export declare const WIREFRAME_DARK_SIDE_FACE_FILL_OPACITY = 0.16;
export declare const WIREFRAME_DARK_BACK_FACE_STROKE_OPACITY = 0.32;
/** Extra black blend per face — mirrors solid iso shading (top lightest, recess darkest). */
export declare const WIREFRAME_DARK_CARD_BLACK: {
    readonly top: 0.28;
    readonly front: 0.36;
    readonly side: 0.44;
    readonly back: 0.5;
};
/** Solid card face hue, darkened for wireframe on a dark canvas. */
export declare function wireframeDarkCardFaceHex(cardFaceHex: string, blackWeight?: number): string;
/** Label ink — darker tint of the card top (matches card hue, not neutral black). */
export declare const ISO_CUBE_LABEL_FACE_BLACK = 0.64;
export declare function isoCubeLabelInkOnFace(topFaceHex: string): string;
/** TOP face fill in wireframe. */
export declare function wireframeTopFaceFillOnCanvas(surfaceHex: string, preferredInkHex?: string, cardFaceHex?: string): string;
/** FRONT face fill in wireframe (slightly stronger — covers vertical extrusion). */
export declare function wireframeFrontFaceFillOnCanvas(surfaceHex: string, preferredInkHex?: string, cardFaceHex?: string): string;
/** SIDE (right) face fill in wireframe. */
export declare function wireframeSideFaceFillOnCanvas(surfaceHex: string, preferredInkHex?: string, cardFaceHex?: string): string;
/** BACK / LEFT face stroke in wireframe (lighter than facing edges). */
export declare function wireframeBackFaceStrokeOnCanvas(surfaceHex: string, preferredInkHex?: string, cardFaceHex?: string): string;
/** Dot grid mark opacity in solid and wireframe modes. */
export declare const DOT_GRID_DOT_FILL_OPACITY = 0.3;
export declare function dotGridDotCssFromBorder(borderHex: string): string;
/** Light canvases: dots share grid-line hue, slightly lifted toward white. */
export declare const LIGHT_DOT_GRID_LINE_WHITEN = 0.04;
export declare const LIGHT_DOT_GRID_DOT_OPACITY = 0.58;
export declare function dotGridDotCssFromGridLineInk(gridLineInkHex: string): string;
/** Solid iso card edge — slightly darker than that face fill, at 50% opacity. */
export declare const ISO_SOLID_FACE_STROKE_DARKEN = 0.08;
export declare const ISO_SOLID_FACE_STROKE_OPACITY = 0.5;
export declare function isoSolidFaceStrokeCssFromFill(faceFillHex: string): string;
/** Iso ground dot grid in wireframe (same opacity as solid, iso stroke ink). */
export declare const WIREFRAME_DOT_GRID_FILL_OPACITY = 0.3;
export declare function wireframeDotGridFillOnCanvas(surfaceHex: string, _preferredInkHex?: string): string;
/** Diagram labels in wireframe — same ink as cube stroke on light and dark canvas. */
export declare function wireframeLabelFillOnCanvas(surfaceHex: string, preferredInkHex?: string, _cardTopHex?: string): string;
/** Layout guides on the frosted artboard in wireframe mode (scheme fallback; CSS owns live values). */
export declare const WIREFRAME_ARTBOARD_GUIDE_LINE_OPACITY = 0.16;
export declare function wireframeArtboardGuideLineCss(canvasSurfaceHex: string, appearance: "light" | "dark"): string;
export declare function blendHexWithWhite(hex: string, whiteWeight?: number): string;
export declare function blendHexWithBlack(hex: string, blackWeight?: number): string;
export declare function hexToRgba(hex: string, alpha: number): string;
/** Label on a shaded iso top face — darker card hue when contrast-safe, else ink or paper. */
export declare function isoCubeLabelFillOnFace(topFaceHex: string): string;
/** FRONT/SIDE slab fills from a TOP color using the same light model as {@link isoFaceFillsFromSchemeAccent}. */
export declare function isoSlabVisibleFacesFromTop(topHex: string, appearance: "light" | "dark"): {
    front: string;
    side: string;
};
/** Minimum contrast between canvas `--zui-surface` and the artboard panel top. */
export declare const MIN_ARTBOARD_CANVAS_CONTRAST_RATIO = 1.12;
/** Solid iso artboard top — always separated from canvas surface (darker paper / lighter panel). */
export declare function artboardSurfaceFillOnCanvas(surfaceHex: string, appearance: "light" | "dark"): string;
/** Lit rim on the artboard front slab silhouette (mix toward white from the panel top). */
export declare function artboardFrontEdgeLightCss(artboardTopFillHex: string): string;
/** Visible iso box faces derived from one scheme accent via light/dark shading only. */
export type IsoFaceFillSet = {
    top: string;
    front: string;
    side: string;
    bottom: string;
    left: string;
    back: string;
};
export declare function isoFaceFillsFromSchemeAccent(accentHex: string, appearance: "light" | "dark"): IsoFaceFillSet;
/** Box/card outline: darker tint of the face surface (not accent). */
export declare function darkerSurfaceBorderStroke(surfaceHex: string, background: "dark" | "light"): string;
//# sourceMappingURL=color-math.d.ts.map