// Sprite-agnostic duplicate of `Pokemon.updateFusionPalette` — kept as a copy
// rather than a refactor so the fallback render paths (starter-select icons,
// big-preview palette-swap) don't churn against upstream's fusion code.

import { globalScene } from "#app/global-scene";
import { argbFromRgba, deltaRgb, rgbaFromArgb, rgbToHsv } from "#utils/color-utils";
import { randSeedFloat } from "#utils/common";
import { QuantizerCelebi } from "@material/material-color-utilities";

export type Rgba = [number, number, number, number];

export interface FusionPaletteResult {
  spriteColors: Rgba[];
  /** Same length as `spriteColors`; entry `i` replaces `spriteColors[i]`. */
  fusionSpriteColors: Rgba[];
}

/**
 * Raw RGBA bytes for a texture frame. For atlas textures (e.g.
 * `pokemon_icons_1`) the caller MUST pass an explicit frame name.
 */
function extractFramePixels(
  textureKey: string,
  frameName?: string | number,
): { data: Uint8ClampedArray; width: number; height: number } | null {
  const tex = globalScene.textures.get(textureKey);
  if (!tex || !tex.frames) {
    return null;
  }
  const frame = frameName === undefined ? tex.frames[tex.firstFrame] : tex.frames[frameName];
  if (!frame) {
    return null;
  }
  const img = tex.getSourceImage() as HTMLImageElement;
  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  ctx.drawImage(img, frame.cutX, frame.cutY, frame.width, frame.height, 0, 0, frame.width, frame.height);
  const imageData = ctx.getImageData(0, 0, frame.width, frame.height);
  return { data: imageData.data, width: frame.width, height: frame.height };
}

/**
 * Mirrors `Pokemon.updateFusionPalette` step-for-step: unique-color extraction,
 * Celebi quantize to 4 colors per side, HSV-merge similar hues, blend each
 * sprite color toward its closest fusion-palette match.
 * @param displayTextureKey source palette (what we display)
 * @param paletteTextureKey target palette (what we recolor toward)
 */
export function computeFusionPaletteMapping(
  displayTextureKey: string,
  paletteTextureKey: string,
  displayFrame?: string | number,
  paletteFrame?: string | number,
): FusionPaletteResult | null {
  const displayPx = extractFramePixels(displayTextureKey, displayFrame);
  const palettePx = extractFramePixels(paletteTextureKey, paletteFrame);
  if (!displayPx || !palettePx) {
    return null;
  }

  const spriteColors: Rgba[] = [];
  for (let i = 0; i < displayPx.data.length; i += 4) {
    const a = displayPx.data[i + 3];
    if (!a) {
      continue;
    }
    const r = displayPx.data[i];
    const g = displayPx.data[i + 1];
    const b = displayPx.data[i + 2];
    if (!spriteColors.find(c => c[0] === r && c[1] === g && c[2] === b)) {
      spriteColors.push([r, g, b, a]);
    }
  }
  if (spriteColors.length === 0) {
    return null;
  }
  const fusionSpriteColors: Rgba[] = spriteColors.map(c => [...c] as Rgba);

  const collect = (px: Uint8ClampedArray): number[] => {
    const out: number[] = [];
    for (let i = 0; i < px.length; i += 4) {
      const total = px[i] + px[i + 1] + px[i + 2];
      if (!total) {
        continue;
      }
      out.push(argbFromRgba({ r: px[i], g: px[i + 1], b: px[i + 2], a: px[i + 3] }));
    }
    return out;
  };
  const pixelColors = collect(displayPx.data);
  const fusionPixelColors = collect(palettePx.data);
  if (fusionPixelColors.length === 0) {
    return null;
  }

  // Celebi quantize, seeded for determinism.
  let paletteColors!: Map<number, number>;
  let fusionPaletteColors!: Map<number, number>;
  const originalRandom = Math.random;
  Math.random = () => randSeedFloat();
  try {
    globalScene.executeWithSeedOffset(
      () => {
        paletteColors = QuantizerCelebi.quantize(pixelColors, 4);
        fusionPaletteColors = QuantizerCelebi.quantize(fusionPixelColors, 4);
      },
      0,
      "This result should not vary",
    );
  } finally {
    Math.random = originalRandom;
  }

  const reducePalette = (initial: Map<number, number>): Rgba[] => {
    let keys = Array.from(initial.keys()).sort((a, b) => (initial.get(a)! < initial.get(b)! ? 1 : -1));
    const working = new Map(initial);
    let rgbaColors: Map<number, number[]>;
    let hsvColors: Map<number, number[]>;
    const mappedColors = new Map<number, number[]>();
    do {
      mappedColors.clear();
      rgbaColors = keys.reduce((m, k) => {
        m.set(k, Object.values(rgbaFromArgb(k)));
        return m;
      }, new Map<number, number[]>());
      hsvColors = Array.from(rgbaColors.keys()).reduce((m, k) => {
        const rgb = rgbaColors.get(k)!.slice(0, 3);
        m.set(k, rgbToHsv(rgb[0], rgb[1], rgb[2]));
        return m;
      }, new Map<number, number[]>());

      for (let c = keys.length - 1; c >= 0; c--) {
        const hsv = hsvColors.get(keys[c])!;
        for (let c2 = 0; c2 < c; c2++) {
          const hsv2 = hsvColors.get(keys[c2])!;
          const diff = Math.abs(hsv[0] - hsv2[0]);
          if (diff < 30 || diff >= 330) {
            if (mappedColors.has(keys[c])) {
              mappedColors.get(keys[c])!.push(keys[c2]);
            } else {
              mappedColors.set(keys[c], [keys[c2]]);
            }
            break;
          }
        }
      }

      mappedColors.forEach((values, key) => {
        const keyColor = rgbaColors.get(key)!;
        const valueColors = values.map(v => rgbaColors.get(v)!);
        const color = keyColor.slice(0);
        let count = working.get(key)!;
        for (const value of values) {
          const valueCount = working.get(value);
          if (!valueCount) {
            continue;
          }
          count += valueCount;
        }
        for (let c = 0; c < 3; c++) {
          color[c] *= working.get(key)! / count;
          values.forEach((value, i) => {
            if (working.has(value)) {
              const valueCount = working.get(value)!;
              color[c] += valueColors[i][c] * (valueCount / count);
            }
          });
          color[c] = Math.round(color[c]);
        }
        working.delete(key);
        for (const value of values) {
          working.delete(value);
          if (mappedColors.has(value)) {
            mappedColors.delete(value);
          }
        }
        working.set(argbFromRgba({ r: color[0], g: color[1], b: color[2], a: color[3] }), count);
      });
      keys = Array.from(working.keys()).sort((a, b) => (working.get(a)! < working.get(b)! ? 1 : -1));
    } while (mappedColors.size > 0);
    return keys.map(c => Object.values(rgbaFromArgb(c)) as Rgba);
  };

  const palette = reducePalette(paletteColors);
  const fusionPalette = reducePalette(fusionPaletteColors);

  const paletteDeltas: number[][] = [];
  spriteColors.forEach((sc, i) => {
    paletteDeltas.push([]);
    for (const p of palette) {
      paletteDeltas[i].push(deltaRgb(sc, p));
    }
  });
  const easeFunc = Phaser.Tweens.Builders.GetEaseFunction("Cubic.easeIn");
  for (let sc = 0; sc < spriteColors.length; sc++) {
    const delta = Math.min(...paletteDeltas[sc]);
    const paletteIndex = Math.min(paletteDeltas[sc].indexOf(delta), fusionPalette.length - 1);
    if (delta < 255) {
      const ratio = easeFunc(delta / 255);
      const color: Rgba = [0, 0, 0, fusionSpriteColors[sc][3]];
      for (let c = 0; c < 3; c++) {
        color[c] = Math.round(fusionSpriteColors[sc][c] * ratio + fusionPalette[paletteIndex][c] * (1 - ratio));
      }
      fusionSpriteColors[sc] = color;
    }
  }

  return { spriteColors, fusionSpriteColors };
}

/**
 * Apply a palette mapping to a source texture's pixels and register the result
 * with Phaser under `outKey`. Idempotent.
 * @returns the registered texture key, or null on failure.
 */
export function bakePaletteSwappedTexture(
  sourceTextureKey: string,
  mapping: FusionPaletteResult,
  outKey: string,
  sourceFrame?: string | number,
): string | null {
  if (globalScene.textures.exists(outKey)) {
    return outKey;
  }
  const tex = globalScene.textures.get(sourceTextureKey);
  if (!tex || !tex.frames) {
    return null;
  }
  const frame = sourceFrame === undefined ? tex.frames[tex.firstFrame] : tex.frames[sourceFrame];
  if (!frame) {
    return null;
  }
  const img = tex.getSourceImage() as HTMLImageElement;
  // Canvas sized to the un-trimmed source — using `frame.width` (trimmed)
  // clips pixels when the trim offset pushes them past the trimmed bounds.
  const sourceSize = (frame as unknown as { data?: { sourceSize?: { w: number; h: number } } }).data?.sourceSize;
  const fullW = sourceSize?.w ?? frame.width;
  const fullH = sourceSize?.h ?? frame.height;
  const offsetX = frame.x ?? 0;
  const offsetY = frame.y ?? 0;
  const canvas = document.createElement("canvas");
  canvas.width = fullW;
  canvas.height = fullH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  ctx.drawImage(
    img,
    frame.cutX,
    frame.cutY,
    frame.cutWidth,
    frame.cutHeight,
    offsetX,
    offsetY,
    frame.cutWidth,
    frame.cutHeight,
  );
  const imageData = ctx.getImageData(0, 0, fullW, fullH);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) {
      continue;
    }
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const idx = mapping.spriteColors.findIndex(c => c[0] === r && c[1] === g && c[2] === b);
    if (idx === -1) {
      continue;
    }
    const target = mapping.fusionSpriteColors[idx];
    data[i] = target[0];
    data[i + 1] = target[1];
    data[i + 2] = target[2];
  }
  ctx.putImageData(imageData, 0, 0);
  globalScene.textures.addCanvas(outKey, canvas);

  // Single-frame anim so `sprite.play(key)` (vanilla pattern) doesn't error.
  if (!globalScene.anims.exists(outKey)) {
    globalScene.anims.create({
      key: outKey,
      frames: [{ key: outKey, frame: "__BASE" }],
      frameRate: 1,
      repeat: -1,
    });
  }

  return outKey;
}
