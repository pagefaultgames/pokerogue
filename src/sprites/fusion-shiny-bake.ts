// IF ships only non-shiny pair sprites. Applying head + body variant palette
// mappings recolors matching pixels toward their shiny counterparts, leaving
// untouched pixels alone — the same partial-shiny trade-off IF itself makes.

import { globalScene } from "#app/global-scene";
import { getVariantData } from "#sprites/fusion-variant-data";
import { FusionSettingKeys, getFusionSettingValue, onFusionSettingChange } from "#system/settings/fusion-settings";
import { rgbHexToRgba } from "#utils/color-utils";

// Strength changes invalidate every shiny-baked texture. Non-shiny IF textures
// don't depend on the setting and are left in place.
onFusionSettingChange(key => {
  if (key !== FusionSettingKeys.Shiny_Strength) {
    return;
  }
  if (!globalScene?.textures) {
    return;
  }
  for (const texKey of Object.keys(globalScene.textures.list as Record<string, unknown>)) {
    if (/__shiny\d+$/.test(texKey)) {
      globalScene.textures.remove(texKey);
    }
  }
});

/**
 * Bake a shiny recolor of a source IF texture using head + body variant
 * palette mappings. Applying only head's mapping leaves body-derived pixels
 * unchanged; walking both covers the whole sprite.
 * @returns the output texture key, or null when no mapping is available or
 *   canvas access fails.
 */
export function bakeShinyFusionTexture(
  sourceKey: string,
  headSpeciesId: number,
  bodySpeciesId: number,
  variantIndex: number,
  outKey: string,
): string | null {
  if (globalScene.textures.exists(outKey)) {
    return outKey;
  }
  // Variant 0 has no JSON entry — vanilla uses a separate base sprite for it.
  // Fall back to variant 1's mapping at low intensity for a visible cue.
  const lookupVariant = variantIndex === 0 ? "1" : String(variantIndex);
  const headJson = getVariantData(headSpeciesId);
  const bodyJson = getVariantData(bodySpeciesId);
  const headMap = headJson?.[lookupVariant];
  const bodyMap = bodyJson?.[lookupVariant];
  if (!headMap && !bodyMap) {
    return null;
  }
  const tex = globalScene.textures.get(sourceKey);
  if (!tex || !tex.frames) {
    return null;
  }
  const frame = tex.frames[tex.firstFrame];
  if (!frame) {
    return null;
  }
  const img = tex.getSourceImage() as HTMLImageElement;

  // Parallel arrays for the fuzzy-match inner loop (faster than Map iteration).
  // Body ingested first, head second — head wins on exact-key collisions
  // (dominant-identity rule).
  const exactMap = new Map<number, [number, number, number]>();
  const srcR: number[] = [];
  const srcG: number[] = [];
  const srcB: number[] = [];
  const dstR: number[] = [];
  const dstG: number[] = [];
  const dstB: number[] = [];
  const ingest = (m: Record<string, string> | undefined): void => {
    if (!m) {
      return;
    }
    for (const [fromHex, toHex] of Object.entries(m)) {
      const from = rgbHexToRgba(fromHex);
      const to = rgbHexToRgba(toHex);
      const key = (from.r << 16) | (from.g << 8) | from.b;
      exactMap.set(key, [to.r, to.g, to.b]);
      srcR.push(from.r);
      srcG.push(from.g);
      srcB.push(from.b);
      dstR.push(to.r);
      dstG.push(to.g);
      dstB.push(to.b);
    }
  };
  ingest(bodyMap);
  ingest(headMap);
  const paletteSize = srcR.length;
  // Variant 0 uses a wider fuzzy threshold + higher intensity to compensate
  // for the variant-1 fallback. Variants 1/2 reduce intensity so vanilla's
  // bold deltas don't oversaturate the IF sprite's hand-drawn shading.
  const strength = getFusionSettingValue(FusionSettingKeys.Shiny_Strength);
  const strengthMul = strength === "SUBTLE" ? 0.5 : strength === "STRONG" ? 1.5 : 1.0;
  let fuzzyThresholdSq: number;
  let intensity: number;
  if (variantIndex === 0) {
    fuzzyThresholdSq = 70 * 70 * 3;
    intensity = 0.7 * strengthMul;
  } else {
    fuzzyThresholdSq = 30 * 30 * 3;
    intensity = 0.45 * strengthMul;
  }
  // >1 oversaturates; >2 wraps in the canvas pipeline.
  intensity = Math.min(1, Math.max(0, intensity));

  const canvas = document.createElement("canvas");
  canvas.width = frame.cutWidth;
  canvas.height = frame.cutHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  ctx.drawImage(img, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, frame.cutWidth, frame.cutHeight);
  const imageData = ctx.getImageData(0, 0, frame.cutWidth, frame.cutHeight);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) {
      continue;
    }
    const pr = data[i];
    const pg = data[i + 1];
    const pb = data[i + 2];

    // Apply the delta scaled by intensity (same as fuzzy path) so variant 0
    // still gets the visibility boost on exact-match pixels.
    const exactKey = (pr << 16) | (pg << 8) | pb;
    const exact = exactMap.get(exactKey);
    if (exact) {
      // Linear scan for the source index — exact-match hits are rare.
      let srcIdx = -1;
      for (let j = 0; j < paletteSize; j++) {
        if (srcR[j] === pr && srcG[j] === pg && srcB[j] === pb) {
          srcIdx = j;
          break;
        }
      }
      if (srcIdx >= 0) {
        const dr = (dstR[srcIdx] - srcR[srcIdx]) * intensity;
        const dg = (dstG[srcIdx] - srcG[srcIdx]) * intensity;
        const db = (dstB[srcIdx] - srcB[srcIdx]) * intensity;
        data[i] = Math.max(0, Math.min(255, Math.round(pr + dr)));
        data[i + 1] = Math.max(0, Math.min(255, Math.round(pg + dg)));
        data[i + 2] = Math.max(0, Math.min(255, Math.round(pb + db)));
      }
      continue;
    }

    // Closest palette color within threshold; preserves shading variation
    // while shifting hue.
    let bestIdx = -1;
    let bestDistSq = fuzzyThresholdSq;
    for (let j = 0; j < paletteSize; j++) {
      const dr = pr - srcR[j];
      const dg = pg - srcG[j];
      const db = pb - srcB[j];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDistSq) {
        bestDistSq = dist;
        bestIdx = j;
      }
    }
    if (bestIdx >= 0) {
      const dr = (dstR[bestIdx] - srcR[bestIdx]) * intensity;
      const dg = (dstG[bestIdx] - srcG[bestIdx]) * intensity;
      const db = (dstB[bestIdx] - srcB[bestIdx]) * intensity;
      data[i] = Math.max(0, Math.min(255, Math.round(pr + dr)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(pg + dg)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(pb + db)));
    }
  }
  ctx.putImageData(imageData, 0, 0);
  globalScene.textures.addCanvas(outKey, canvas);
  // Single-frame anim so `sprite.play(key)` works like vanilla's path.
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
