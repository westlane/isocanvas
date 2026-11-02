// SPDX-License-Identifier: MIT
// Copyright (c) 2026 West Lane
export function normalizeHex(hex) {
    const clean = hex.trim().replace("#", "");
    if (clean.length === 3) {
        return `#${clean
            .split("")
            .map((c) => c + c)
            .join("")}`;
    }
    return `#${clean}`;
}
export const SURFACE_INK_HEX = "#212121";
export const SURFACE_PAPER_HEX = "#f8fafc";
function rgbTripletFromHex(hex) {
    const clean = normalizeHex(hex).slice(1);
    return {
        r: Number.parseInt(clean.slice(0, 2), 16),
        g: Number.parseInt(clean.slice(2, 4), 16),
        b: Number.parseInt(clean.slice(4, 6), 16),
    };
}
export function relativeLuminanceFromHex(hex) {
    const { r, g, b } = rgbTripletFromHex(hex);
    const toLinear = (channel) => {
        const s = channel / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return (0.2126 * toLinear(r) +
        0.7152 * toLinear(g) +
        0.0722 * toLinear(b));
}
export function isLightHex(hex) {
    return relativeLuminanceFromHex(hex) > 0.5;
}
export function contrastRatio(fgHex, bgHex) {
    const l1 = relativeLuminanceFromHex(fgHex);
    const l2 = relativeLuminanceFromHex(bgHex);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}
const MIN_LABEL_CONTRAST_RATIO = 4.5;
function forBlendWeight(start, end, step, run) {
    const steps = Math.max(0, Math.round((end - start) / step));
    for (let i = 0; i <= steps; i += 1) {
        const weight = i === steps ? end : start + i * step;
        const picked = run(weight);
        if (picked) {
            return picked;
        }
    }
    return null;
}
function forNumericBlendWeight(start, end, step, run) {
    const steps = Math.max(0, Math.round((end - start) / step));
    for (let i = 0; i <= steps; i += 1) {
        const weight = i === steps ? end : start + i * step;
        const picked = run(weight);
        if (picked !== null) {
            return picked;
        }
    }
    return null;
}
function readableForegroundOnSameHue(identityHex) {
    const identity = normalizeHex(identityHex);
    if (!isLightHex(identity)) {
        return (forBlendWeight(0.35, 1, 0.05, (weight) => {
            const fg = blendHexWithWhite(identity, weight);
            return contrastRatio(fg, identity) >= MIN_LABEL_CONTRAST_RATIO ? fg : null;
        }) ?? blendHexWithWhite(identity, 1));
    }
    return (forBlendWeight(0.1, 0.95, 0.1, (weight) => {
        const fg = blendHexWithBlack(identity, weight);
        return contrastRatio(fg, identity) >= MIN_LABEL_CONTRAST_RATIO ? fg : null;
    }) ?? blendHexWithBlack(identity, 0.95));
}
/** Readable foreground on a surface (dark text on light cards, light text on dark cards). */
export function readableForeground(backgroundHex, identityHex) {
    const bg = normalizeHex(backgroundHex);
    const identity = normalizeHex(identityHex);
    if (bg === identity) {
        return readableForegroundOnSameHue(identity);
    }
    if (isLightHex(bg)) {
        if (contrastRatio(identity, bg) >= MIN_LABEL_CONTRAST_RATIO) {
            return identity;
        }
        for (let blackWeight = 0.1; blackWeight <= 1; blackWeight += 0.1) {
            const fg = blendHexWithBlack(identity, blackWeight);
            if (contrastRatio(fg, bg) >= MIN_LABEL_CONTRAST_RATIO) {
                return fg;
            }
        }
        return blendHexWithBlack(identity, 0.85);
    }
    let whiteWeight = 0.45;
    let fg = blendHexWithWhite(identity, whiteWeight);
    while (contrastRatio(fg, bg) < MIN_LABEL_CONTRAST_RATIO && whiteWeight < 1) {
        whiteWeight = Math.min(1, whiteWeight + 0.05);
        fg = blendHexWithWhite(identity, whiteWeight);
    }
    return fg;
}
export function readableTextOnSurface(surfaceHex, preferredHex) {
    const bg = normalizeHex(surfaceHex);
    const fallback = isLightHex(bg) ? SURFACE_INK_HEX : SURFACE_PAPER_HEX;
    return readableForeground(bg, normalizeHex(preferredHex ?? fallback));
}
/** Contrast-safe ink + muted gray on canvas `surface`, tinted from theme identity (e.g. log `roles.message`). */
export function themeInkShades(surfaceHex, identityHex) {
    const surface = normalizeHex(surfaceHex);
    const ink = readableTextOnSurface(surface, identityHex);
    const inkMuted = isLightHex(surface)
        ? blendHexWithWhite(ink, 0.38)
        : blendHexWithBlack(ink, 0.32);
    return { ink, inkMuted };
}
/** Black blend for wireframe grid lines on light artboard (subtle, same hue as top face). */
export const WIREFRAME_LIGHT_ARTBOARD_GRID_BLACK = 0.12;
/** Dots on light artboard — a touch darker than division lines. */
export const WIREFRAME_LIGHT_ARTBOARD_DOT_BLACK = 0.18;
/** Black blend for wireframe lines/dots on dark artboard panels (subtle, same hue as top face). */
export const WIREFRAME_DARK_ARTBOARD_STROKE_BLACK = 0.14;
/** Wireframe grid line ink — slightly darker than the artboard top (light and dark canvas). */
export function wireframeLineInkOnArtboard(canvasSurfaceHex, appearance) {
    const artboardBase = artboardSurfaceFillOnCanvas(canvasSurfaceHex, appearance);
    const blackWeight = appearance === "light"
        ? WIREFRAME_LIGHT_ARTBOARD_GRID_BLACK
        : WIREFRAME_DARK_ARTBOARD_STROKE_BLACK;
    return blendHexWithBlack(artboardBase, blackWeight);
}
function wireframeDotInkOnArtboard(canvasSurfaceHex, appearance) {
    const artboardBase = artboardSurfaceFillOnCanvas(canvasSurfaceHex, appearance);
    if (appearance === "light") {
        return blendHexWithBlack(artboardBase, WIREFRAME_LIGHT_ARTBOARD_DOT_BLACK);
    }
    return blendHexWithBlack(artboardBase, WIREFRAME_DARK_ARTBOARD_STROKE_BLACK);
}
/** Dot grid + layout guides — artboard-tinted (not iso card edges). */
export function wireframeGridStrokeOnCanvas(canvasSurfaceHex) {
    const appearance = isLightHex(canvasSurfaceHex) ? "light" : "dark";
    return wireframeLineInkOnArtboard(canvasSurfaceHex, appearance);
}
function wireframeIsoEdgeInk(surfaceHex, preferredInkHex) {
    const surface = normalizeHex(surfaceHex);
    if (isLightHex(surface)) {
        return readableTextOnSurface(surface, preferredInkHex ?? SURFACE_INK_HEX);
    }
    return readableTextOnSurface(surface, preferredInkHex ?? SURFACE_PAPER_HEX);
}
/** Flat node rects — readable on light canvas; artboard tint on dark. */
export function wireframeStrokeOnSurface(surfaceHex, preferredOutlineHex) {
    const surface = normalizeHex(surfaceHex);
    if (isLightHex(surface)) {
        return readableTextOnSurface(surface, preferredOutlineHex);
    }
    return wireframeGridStrokeOnCanvas(surface);
}
/** Iso cube/card outlines and labels — theme-readable ink (visible on card face washes). */
export function wireframeIsoNodeStroke(surfaceHex, preferredInkHex) {
    return wireframeIsoEdgeInk(surfaceHex, preferredInkHex);
}
/** Opaque paper front face in wireframe mode (covers extrusion strokes painted beneath). */
export function wireframeFrontSurfaceOnCanvas(surfaceHex, paperHex, cardFaceHex) {
    if (!isLightHex(surfaceHex)) {
        if (cardFaceHex) {
            return wireframeDarkCardFaceHex(cardFaceHex, WIREFRAME_DARK_CARD_BLACK.front);
        }
        return blendHexWithWhite(surfaceHex, 0.12);
    }
    if (paperHex) {
        return normalizeHex(paperHex);
    }
    return SURFACE_PAPER_HEX;
}
/** Alpha washes for visible iso faces in wireframe mode (stroke color — masks extrusion beneath). */
export const WIREFRAME_TOP_FACE_FILL_OPACITY = 0.14;
export const WIREFRAME_FRONT_FACE_FILL_OPACITY = 0.08;
export const WIREFRAME_SIDE_FACE_FILL_OPACITY = 0.06;
/** Rear faces (back / left) — softer outline in wireframe. */
export const WIREFRAME_BACK_FACE_STROKE_OPACITY = 0.28;
/** Face wash strength on dark canvas — same hue as solid cards, darkened. */
export const WIREFRAME_DARK_TOP_FACE_FILL_OPACITY = 0.38;
export const WIREFRAME_DARK_FRONT_FACE_FILL_OPACITY = 0.22;
export const WIREFRAME_DARK_SIDE_FACE_FILL_OPACITY = 0.16;
export const WIREFRAME_DARK_BACK_FACE_STROKE_OPACITY = 0.32;
/** Extra black blend per face — mirrors solid iso shading (top lightest, recess darkest). */
export const WIREFRAME_DARK_CARD_BLACK = {
    top: 0.28,
    front: 0.36,
    side: 0.44,
    back: 0.5,
};
/** Solid card face hue, darkened for wireframe on a dark canvas. */
export function wireframeDarkCardFaceHex(cardFaceHex, blackWeight = WIREFRAME_DARK_CARD_BLACK.top) {
    return blendHexWithBlack(normalizeHex(cardFaceHex), blackWeight);
}
/** Label ink — darker tint of the card top (matches card hue, not neutral black). */
export const ISO_CUBE_LABEL_FACE_BLACK = 0.64;
export function isoCubeLabelInkOnFace(topFaceHex) {
    return wireframeDarkCardFaceHex(topFaceHex, ISO_CUBE_LABEL_FACE_BLACK);
}
function wireframeDarkCardWash(cardFaceHex, opacity, blackWeight) {
    return hexToRgba(wireframeDarkCardFaceHex(cardFaceHex, blackWeight), opacity);
}
function wireframeIsoFaceFillOnCanvas(surfaceHex, preferredInkHex, opacity) {
    const stroke = wireframeIsoEdgeInk(surfaceHex, preferredInkHex);
    return hexToRgba(stroke, opacity);
}
/** TOP face fill in wireframe. */
export function wireframeTopFaceFillOnCanvas(surfaceHex, preferredInkHex, cardFaceHex) {
    if (!isLightHex(surfaceHex) && cardFaceHex) {
        return wireframeDarkCardWash(cardFaceHex, WIREFRAME_DARK_TOP_FACE_FILL_OPACITY, WIREFRAME_DARK_CARD_BLACK.top);
    }
    return wireframeIsoFaceFillOnCanvas(surfaceHex, preferredInkHex, WIREFRAME_TOP_FACE_FILL_OPACITY);
}
/** FRONT face fill in wireframe (slightly stronger — covers vertical extrusion). */
export function wireframeFrontFaceFillOnCanvas(surfaceHex, preferredInkHex, cardFaceHex) {
    if (!isLightHex(surfaceHex) && cardFaceHex) {
        return wireframeDarkCardWash(cardFaceHex, WIREFRAME_DARK_FRONT_FACE_FILL_OPACITY, WIREFRAME_DARK_CARD_BLACK.front);
    }
    return wireframeIsoFaceFillOnCanvas(surfaceHex, preferredInkHex, WIREFRAME_FRONT_FACE_FILL_OPACITY);
}
/** SIDE (right) face fill in wireframe. */
export function wireframeSideFaceFillOnCanvas(surfaceHex, preferredInkHex, cardFaceHex) {
    if (!isLightHex(surfaceHex) && cardFaceHex) {
        return wireframeDarkCardWash(cardFaceHex, WIREFRAME_DARK_SIDE_FACE_FILL_OPACITY, WIREFRAME_DARK_CARD_BLACK.side);
    }
    return wireframeIsoFaceFillOnCanvas(surfaceHex, preferredInkHex, WIREFRAME_SIDE_FACE_FILL_OPACITY);
}
/** BACK / LEFT face stroke in wireframe (lighter than facing edges). */
export function wireframeBackFaceStrokeOnCanvas(surfaceHex, preferredInkHex, cardFaceHex) {
    if (!isLightHex(surfaceHex) && cardFaceHex) {
        return wireframeDarkCardWash(cardFaceHex, WIREFRAME_DARK_BACK_FACE_STROKE_OPACITY, WIREFRAME_DARK_CARD_BLACK.back);
    }
    return wireframeIsoFaceFillOnCanvas(surfaceHex, preferredInkHex, WIREFRAME_BACK_FACE_STROKE_OPACITY);
}
/** Dot grid mark opacity in solid and wireframe modes. */
export const DOT_GRID_DOT_FILL_OPACITY = 0.3;
export function dotGridDotCssFromBorder(borderHex) {
    const pct = Math.round(DOT_GRID_DOT_FILL_OPACITY * 100);
    return `color-mix(in oklch, ${normalizeHex(borderHex)} ${pct}%, transparent)`;
}
/** Light canvases: dots share grid-line hue, slightly lifted toward white. */
export const LIGHT_DOT_GRID_LINE_WHITEN = 0.04;
export const LIGHT_DOT_GRID_DOT_OPACITY = 0.58;
export function dotGridDotCssFromGridLineInk(gridLineInkHex) {
    const lighter = blendHexWithWhite(normalizeHex(gridLineInkHex), LIGHT_DOT_GRID_LINE_WHITEN);
    const pct = Math.round(LIGHT_DOT_GRID_DOT_OPACITY * 100);
    return `color-mix(in oklch, ${lighter} ${pct}%, transparent)`;
}
/** Solid iso card edge — slightly darker than that face fill, at 50% opacity. */
export const ISO_SOLID_FACE_STROKE_DARKEN = 0.08;
export const ISO_SOLID_FACE_STROKE_OPACITY = 0.5;
export function isoSolidFaceStrokeCssFromFill(faceFillHex) {
    const tinted = blendHexWithBlack(normalizeHex(faceFillHex), ISO_SOLID_FACE_STROKE_DARKEN);
    const pct = Math.round(ISO_SOLID_FACE_STROKE_OPACITY * 100);
    return `color-mix(in oklch, ${tinted} ${pct}%, transparent)`;
}
/** Iso ground dot grid in wireframe (same opacity as solid, iso stroke ink). */
export const WIREFRAME_DOT_GRID_FILL_OPACITY = DOT_GRID_DOT_FILL_OPACITY;
export function wireframeDotGridFillOnCanvas(surfaceHex, _preferredInkHex) {
    const appearance = isLightHex(surfaceHex) ? "light" : "dark";
    return hexToRgba(wireframeDotInkOnArtboard(surfaceHex, appearance), WIREFRAME_DOT_GRID_FILL_OPACITY);
}
/** Diagram labels in wireframe — same ink as cube stroke on light and dark canvas. */
export function wireframeLabelFillOnCanvas(surfaceHex, preferredInkHex, _cardTopHex) {
    return wireframeIsoNodeStroke(surfaceHex, preferredInkHex);
}
/** Layout guides on the frosted artboard in wireframe mode (scheme fallback; CSS owns live values). */
export const WIREFRAME_ARTBOARD_GUIDE_LINE_OPACITY = 0.16;
export function wireframeArtboardGuideLineCss(canvasSurfaceHex, appearance) {
    const stroke = wireframeLineInkOnArtboard(canvasSurfaceHex, appearance);
    const pct = Math.round(WIREFRAME_ARTBOARD_GUIDE_LINE_OPACITY * 100);
    return `color-mix(in oklch, ${stroke} ${pct}%, transparent)`;
}
export function blendHexWithWhite(hex, whiteWeight = 0.5) {
    const clean = normalizeHex(hex).slice(1);
    const r = Number.parseInt(clean.slice(0, 2), 16);
    const g = Number.parseInt(clean.slice(2, 4), 16);
    const b = Number.parseInt(clean.slice(4, 6), 16);
    const mix = (channel) => Math.round(channel * (1 - whiteWeight) + 255 * whiteWeight);
    const toHex = (n) => n.toString(16).padStart(2, "0");
    return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}
export function blendHexWithBlack(hex, blackWeight = 0.5) {
    const clean = normalizeHex(hex).slice(1);
    const r = Number.parseInt(clean.slice(0, 2), 16);
    const g = Number.parseInt(clean.slice(2, 4), 16);
    const b = Number.parseInt(clean.slice(4, 6), 16);
    const mix = (channel) => Math.round(channel * (1 - blackWeight));
    const toHex = (n) => n.toString(16).padStart(2, "0");
    return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}
export function hexToRgba(hex, alpha) {
    const clean = normalizeHex(hex).slice(1);
    const r = Number.parseInt(clean.slice(0, 2), 16);
    const g = Number.parseInt(clean.slice(2, 4), 16);
    const b = Number.parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
/** Label on a shaded iso top face — darker card hue when contrast-safe, else ink or paper. */
export function isoCubeLabelFillOnFace(topFaceHex) {
    const top = normalizeHex(topFaceHex);
    const cardInk = isoCubeLabelInkOnFace(top);
    if (contrastRatio(cardInk, top) >= MIN_LABEL_CONTRAST_RATIO) {
        return cardInk;
    }
    const candidates = [SURFACE_INK_HEX, SURFACE_PAPER_HEX];
    let best = candidates[0];
    let bestRatio = 0;
    for (const candidate of candidates) {
        const ratio = contrastRatio(candidate, top);
        if (ratio >= MIN_LABEL_CONTRAST_RATIO) {
            return candidate;
        }
        if (ratio > bestRatio) {
            bestRatio = ratio;
            best = candidate;
        }
    }
    return best;
}
const ISO_SLAB_REFERENCE_ACCENT = "#808080";
function blackBlendWeightToReachLuminance(baseHex, targetLuminance) {
    const base = normalizeHex(baseHex);
    const baseLum = relativeLuminanceFromHex(base);
    if (targetLuminance >= baseLum) {
        return 0;
    }
    const picked = forNumericBlendWeight(0, 1, 0.005, (weight) => {
        const lum = relativeLuminanceFromHex(blendHexWithBlack(base, weight));
        return lum <= targetLuminance ? weight : null;
    });
    return picked ?? 1;
}
/** FRONT/SIDE slab fills from a TOP color using the same light model as {@link isoFaceFillsFromSchemeAccent}. */
export function isoSlabVisibleFacesFromTop(topHex, appearance) {
    const ref = isoFaceFillsFromSchemeAccent(ISO_SLAB_REFERENCE_ACCENT, appearance);
    const wFront = blackBlendWeightToReachLuminance(ref.top, relativeLuminanceFromHex(ref.front));
    const wSide = blackBlendWeightToReachLuminance(ref.top, relativeLuminanceFromHex(ref.side));
    const top = normalizeHex(topHex);
    return {
        front: blendHexWithBlack(top, wFront),
        side: blendHexWithBlack(top, wSide),
    };
}
/** Minimum contrast between canvas `--zui-surface` and the artboard panel top. */
export const MIN_ARTBOARD_CANVAS_CONTRAST_RATIO = 1.12;
/** Light canvas: panel reads as paper — slightly **darker** than the desk, never a white wash. */
const ARTBOARD_SURFACE_LIGHT_BLACK = 0.11;
/** Dark canvas: panel lifts **lighter** than the canvas. */
const ARTBOARD_SURFACE_DARK_WHITE = 0.14;
function artboardFillDistinctFromCanvas(surfaceHex, appearance) {
    const surface = normalizeHex(surfaceHex);
    if (appearance === "light") {
        const picked = forBlendWeight(ARTBOARD_SURFACE_LIGHT_BLACK, 0.48, 0.02, (weight) => {
            const next = blendHexWithBlack(surface, weight);
            return contrastRatio(next, surface) >= MIN_ARTBOARD_CANVAS_CONTRAST_RATIO
                ? next
                : null;
        }) ?? blendHexWithBlack(surface, 0.48);
        return picked;
    }
    const picked = forBlendWeight(ARTBOARD_SURFACE_DARK_WHITE, 0.58, 0.02, (weight) => {
        const next = blendHexWithWhite(surface, weight);
        return contrastRatio(next, surface) >= MIN_ARTBOARD_CANVAS_CONTRAST_RATIO ? next : null;
    }) ?? blendHexWithWhite(surface, 0.58);
    return picked;
}
/** Solid iso artboard top — always separated from canvas surface (darker paper / lighter panel). */
export function artboardSurfaceFillOnCanvas(surfaceHex, appearance) {
    return artboardFillDistinctFromCanvas(surfaceHex, appearance);
}
/** Lit rim on the artboard front slab silhouette (mix toward white from the panel top). */
export function artboardFrontEdgeLightCss(artboardTopFillHex) {
    return `color-mix(in oklch, ${normalizeHex(artboardTopFillHex)} 46%, white)`;
}
const ISO_FACE_SHADE_LIGHT = {
    topWhite: 0.56,
    frontWhite: 0.34,
    sideBlack: 0.09,
    recessBlack: 0.19,
};
const ISO_FACE_SHADE_DARK = {
    topWhite: 0.26,
    frontBlack: 0.06,
    sideBlack: 0.14,
    recessBlack: 0.28,
};
export function isoFaceFillsFromSchemeAccent(accentHex, appearance) {
    const accent = normalizeHex(accentHex);
    if (appearance === "light") {
        const top = blendHexWithWhite(accent, ISO_FACE_SHADE_LIGHT.topWhite);
        const front = blendHexWithWhite(accent, ISO_FACE_SHADE_LIGHT.frontWhite);
        const side = blendHexWithBlack(accent, ISO_FACE_SHADE_LIGHT.sideBlack);
        const recess = blendHexWithBlack(accent, ISO_FACE_SHADE_LIGHT.recessBlack);
        return { top, front, side, bottom: recess, left: recess, back: recess };
    }
    const top = blendHexWithWhite(accent, ISO_FACE_SHADE_DARK.topWhite);
    const front = blendHexWithBlack(accent, ISO_FACE_SHADE_DARK.frontBlack);
    const side = blendHexWithBlack(accent, ISO_FACE_SHADE_DARK.sideBlack);
    const recess = blendHexWithBlack(accent, ISO_FACE_SHADE_DARK.recessBlack);
    return { top, front, side, bottom: recess, left: recess, back: recess };
}
/** Box/card outline: darker tint of the face surface (not accent). */
export function darkerSurfaceBorderStroke(surfaceHex, background) {
    const weight = background === "light" ? 0.18 : 0.14;
    return blendHexWithBlack(normalizeHex(surfaceHex), weight);
}
//# sourceMappingURL=color-math.js.map