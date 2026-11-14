import * as THREE from "three";
import type { LedTextBitmap } from "../toolbox/PostFX";
import { FONT_5X7, LED_FONTS, forEachPixel, textWidth, type LedFont, type LedFontId } from "./font5x7";

export interface LedTextLayout {
  lines: string[];
  /** Lamps per font pixel. */
  scale: number;
  font: LedFont;
  /** Height of the text block in CSS px. */
  height: number;
}

function heightOf(lines: string[], font: LedFont, scale: number, pitch: number) {
  return (lines.length * font.h + (lines.length - 1) * font.leading) * scale * pitch;
}

/** Greedy word wrap so that no line is wider than `maxCols` font pixels. */
export function wrap(text: string, maxCols: number, font: LedFont): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (line && textWidth(next, font) > maxCols) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

/** Fixed scale; lines are split on "\n", and word-wrapped when `maxWidth` (CSS px) is given. */
export function fixedLedText(
  text: string,
  pitch: number,
  scale = 1,
  fontId: LedFontId = "5x7",
  maxWidth?: number,
): LedTextLayout {
  const font = LED_FONTS[fontId];
  const lines = maxWidth ? wrap(text, Math.floor(maxWidth / (pitch * scale)), font) : text.split("\n");
  return { lines, scale, font, height: heightOf(lines, font, scale, pitch) };
}

/**
 * Picks the largest whole-lamp scale that fits `width`. Prefers one line;
 * breaks into words when one line would be tiny.
 */
export function layoutLedText(text: string, width: number, pitch: number, maxScale = 4): LedTextLayout {
  const font = FONT_5X7;
  const fit = (lines: string[]) =>
    Math.min(maxScale, Math.floor(width / (Math.max(...lines.map((l) => textWidth(l, font))) * pitch)));
  let lines = [text];
  let scale = fit(lines);
  const words = text.split(" ");
  if (scale < 2 && words.length > 1) {
    lines = words;
    scale = fit(lines);
  }
  scale = Math.max(1, scale);
  return { lines, scale, font, height: heightOf(lines, font, scale, pitch) };
}

export interface PlacedLedText {
  layout: LedTextLayout;
  /** Top-left of the block relative to the grid, CSS px. Snapped to whole lamps. */
  left: number;
  top: number;
}

/** Channels of the lamp bitmap. */
export const CH = { text: 0, select: 1, cursor: 2 } as const;

/**
 * One texel per lamp of a grid covering `gridW × gridH` CSS px.
 * RGBA: R = text, G = selection highlight, B = cursor. Rows run bottom-up, like gl_FragCoord.
 */
export interface LedGrid extends LedTextBitmap {
  data: Uint8Array;
}

export function createLedGrid(gridW: number, gridH: number, pitch: number): LedGrid {
  const cols = Math.ceil(gridW / pitch);
  const rows = Math.ceil(gridH / pitch);
  const data = new Uint8Array(cols * rows * 4);
  for (let k = 3; k < data.length; k += 4) data[k] = 255;
  const texture = new THREE.DataTexture(data, cols, rows, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return { texture, data, cols, rows, firstCol: cols, lastCol: 0 };
}

/** Lights a rectangle of lamps (top-left origin, in lamps) on one channel. */
export function fillLamps(g: LedGrid, col: number, rowTop: number, w: number, h: number, ch: number) {
  for (let i = 0; i < w; i++)
    for (let j = 0; j < h; j++) {
      const c = col + i;
      const r = rowTop + j;
      if (c < 0 || c >= g.cols || r < 0 || r >= g.rows) continue;
      g.data[((g.rows - 1 - r) * g.cols + c) * 4 + ch] = 255;
      g.firstCol = Math.min(g.firstCol, c);
      g.lastCol = Math.max(g.lastCol, c);
    }
}

/** Draws one line of text; every font pixel becomes `scale × scale` lamps. */
export function drawLedLine(g: LedGrid, text: string, font: LedFont, scale: number, col0: number, rowTop: number, ch: number = CH.text) {
  forEachPixel(text, (x, y) => fillLamps(g, col0 + x * scale, rowTop + y * scale, scale, scale, ch), font);
}

/** Column (in font pixels) where character `k` of `text` starts. */
export function charStart(text: string, k: number, font: LedFont): number {
  return k <= 0 ? 0 : textWidth(text.slice(0, k), font) + font.tracking;
}

/** Rasterises static text blocks into a new grid. */
export function makeLedTextBitmap(
  blocks: PlacedLedText[],
  opts: { gridW: number; gridH: number; pitch: number },
): LedGrid {
  const g = createLedGrid(opts.gridW, opts.gridH, opts.pitch);
  for (const { layout, left, top } of blocks) {
    const { font, scale: s } = layout;
    const col0 = Math.round(left / opts.pitch);
    const row0 = Math.round(top / opts.pitch);
    layout.lines.forEach((line, li) => drawLedLine(g, line, font, s, col0, row0 + li * (font.h + font.leading) * s));
  }
  return g;
}
