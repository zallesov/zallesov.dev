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
function wrap(text: string, maxCols: number, font: LedFont): string[] {
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

/**
 * Rasterises text blocks into a bitmap with one texel per lamp of a grid
 * covering `gridW × gridH` CSS px, so every font pixel lands exactly on
 * `scale × scale` lamps.
 */
export function makeLedTextBitmap(
  blocks: PlacedLedText[],
  opts: { gridW: number; gridH: number; pitch: number },
): LedTextBitmap {
  const { gridW, gridH, pitch } = opts;
  const cols = Math.ceil(gridW / pitch);
  const rows = Math.ceil(gridH / pitch);
  const data = new Uint8Array(cols * rows);
  let firstCol = cols;
  let lastCol = 0;

  for (const { layout, left, top } of blocks) {
    const { font, scale: s } = layout;
    const col0 = Math.round(left / pitch);
    const row0 = Math.round(top / pitch);
    layout.lines.forEach((line, li) => {
      const lineTop = row0 + li * (font.h + font.leading) * s;
      forEachPixel(
        line,
        (x, y) => {
          for (let i = 0; i < s; i++)
            for (let j = 0; j < s; j++) {
              const c = col0 + x * s + i;
              const rTop = lineTop + y * s + j;
              if (c < 0 || c >= cols || rTop < 0 || rTop >= rows) continue;
              // texture rows run bottom-up, like gl_FragCoord
              data[(rows - 1 - rTop) * cols + c] = 255;
              firstCol = Math.min(firstCol, c);
              lastCol = Math.max(lastCol, c);
            }
        },
        font,
      );
    });
  }

  const texture = new THREE.DataTexture(data, cols, rows, THREE.RedFormat, THREE.UnsignedByteType);
  texture.unpackAlignment = 1; // rows are `cols` bytes long, not padded to 4
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return { texture, cols, rows, firstCol, lastCol };
}
