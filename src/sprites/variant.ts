import { globalScene } from "#app/global-scene";
import { VariantTier } from "#enums/variant-tier";
import type { Pokemon } from "#field/pokemon";
import { hasExpSprite } from "#sprites/sprite-utils";
import { isNullOrUndefined } from "#utils/common";

export type Variant = 0 | 1 | 2;

export type VariantSet = [Variant, Variant, Variant];

export const variantData: any = {};

/** Caches variant colors that have been generated */
export const variantColorCache = {};

export function getVariantTint(variant: Variant): number {
  switch (variant) {
    case 0:
      return 0xf8c020;
    case 1:
      return 0x20f8f0;
    case 2:
      return 0xe81048;
  }
}

export function getVariantIcon(variant: Variant): number {
  switch (variant) {
    case 0:
      return VariantTier.STANDARD;
    case 1:
      return VariantTier.RARE;
    case 2:
      return VariantTier.EPIC;
  }
}

/** Delete all of the keys in variantData */
export function clearVariantData(): void {
  for (const key in variantData) {
    delete variantData[key];
  }
}

/** Update the variant data to use experiment sprite files for variants that have experimental sprites. */
export async function mergeExperimentalData(mainData: any, expData: any): Promise<void> {
  if (!expData) {
    return;
  }

  for (const key of Object.keys(expData)) {
    if (typeof expData[key] === "object" && !Array.isArray(expData[key])) {
      // If the value is an object, recursively merge.
      if (!mainData[key]) {
        mainData[key] = {};
      }
      mergeExperimentalData(mainData[key], expData[key]);
    } else {
      // Otherwise, replace the value
      mainData[key] = expData[key];
    }
  }
}

/**
 * Populate the variant color cache with the variant colors for this pokemon.
 * The global scene must be initialized before this function is called.
 */
export async function populateVariantColors(
  pokemon: Pokemon,
  isBackSprite = false,
  ignoreOverride = true,
): Promise<void> {
  const battleSpritePath = pokemon
    .getBattleSpriteAtlasPath(isBackSprite, ignoreOverride)
    .replace("variant/", "")
    .replace(/_[1-3]$/, "");
  let config = variantData;
  const useExpSprite =
    globalScene.experimentalSprites && hasExpSprite(pokemon.getBattleSpriteKey(isBackSprite, ignoreOverride));
  battleSpritePath.split("/").map(p => (config ? (config = config[p]) : null));
  const variantSet: VariantSet = config as VariantSet;
  if (!variantSet || variantSet[pokemon.variant] !== 1) {
    return;
  }
  const cacheKey = pokemon.getBattleSpriteKey(isBackSprite);
  if (!variantColorCache.hasOwnProperty(cacheKey)) {
    await populateVariantColorCache(cacheKey, useExpSprite, battleSpritePath);
  }
}

/**
 * Gracefully handle errors loading a variant sprite. Log if it fails and attempt to fall back on
 * non-experimental sprites before giving up.
 *
 * @param cacheKey - The cache key for the variant color sprite
 * @param attemptedSpritePath - The sprite path that failed to load
 * @param useExpSprite - Was the attempted sprite experimental
 * @param battleSpritePath - The filename of the sprite
 * @param optionalParams - Any additional params to log
 */
async function fallbackVariantColor(
  cacheKey: string,
  attemptedSpritePath: string,
  useExpSprite: boolean,
  battleSpritePath: string,
  ...optionalParams: any[]
): Promise<void> {
  console.warn(`Could not load ${attemptedSpritePath}!`, ...optionalParams);
  if (useExpSprite) {
    await populateVariantColorCache(cacheKey, false, battleSpritePath);
  }
}

/**
 * Fetch a variant color sprite from the key and store it in the variant color cache.
 *
 * @param cacheKey - The cache key for the variant color sprite
 * @param useExpSprite - Should the experimental sprite be used
 * @param battleSpritePath - The filename of the sprite
 */
export async function populateVariantColorCache(
  cacheKey: string,
  useExpSprite: boolean,
  battleSpritePath: string,
): Promise<void> {
  const spritePath = `./images/pokemon/variant/${useExpSprite ? "exp/" : ""}${battleSpritePath}.json`;
  return globalScene
    .cachedFetch(spritePath)
    .then(res => {
      // Prevent the JSON from processing if it failed to load
      if (!res.ok) {
        return fallbackVariantColor(cacheKey, res.url, useExpSprite, battleSpritePath, res.status, res.statusText);
      }
      return res.json();
    })
    .catch(error => {
      return fallbackVariantColor(cacheKey, spritePath, useExpSprite, battleSpritePath, error);
    })
    .then(c => {
      if (!isNullOrUndefined(c)) {
        variantColorCache[cacheKey] = c;
      }
    });
}
