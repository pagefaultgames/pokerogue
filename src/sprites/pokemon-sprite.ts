import { globalScene } from "#app/global-scene";
import { isNullOrUndefined } from "#app/utils";
import { variantColorCache, variantData } from "#app/data/variant";
import { Gender } from "#app/data/gender";
import { hasExpSprite } from "./sprite-utilts";
import type { Variant, VariantSet } from "#app/data/variant";
import type Pokemon from "#app/field/pokemon";
import type BattleScene from "#app/battle-scene";

// Regex patterns

/** Regex matching double underscores */
const DUNDER_REGEX = /\_{2}/g;

/**
 * Gracefully handle errors loading a variant sprite. Log if it fails and attempt to fall back on
 * non-experimental sprites before giving up.
 *
 * @param cacheKey the cache key for the variant color sprite
 * @param attemptedSpritePath the sprite path that failed to load
 * @param useExpSprite was the attempted sprite experimental
 * @param battleSpritePath the filename of the sprite
 * @param optionalParams any additional params to log
 */
async function fallbackVariantColor(
  cacheKey: string,
  attemptedSpritePath: string,
  useExpSprite: boolean,
  battleSpritePath: string,
  ...optionalParams: any[]
) {
  console.warn(`Could not load ${attemptedSpritePath}!`, ...optionalParams);
  if (useExpSprite) {
    await populateVariantColorCache(cacheKey, false, battleSpritePath);
  }
}

/**
 * Attempt to process variant sprite.
 *
 * @param cacheKey the cache key for the variant color sprite
 * @param useExpSprite should the experimental sprite be used
 * @param battleSpritePath the filename of the sprite
 */
export async function populateVariantColorCache(cacheKey: string, useExpSprite: boolean, battleSpritePath: string) {
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

/**
 * Calculate the sprite ID from a pokemon form.
 */
export function getSpriteId(pokemon: Pokemon, ignoreOverride?: boolean): string {
  return pokemon
    .getSpeciesForm(ignoreOverride)
    .getSpriteId(
      pokemon.getGender(ignoreOverride) === Gender.FEMALE,
      pokemon.formIndex,
      pokemon.shiny,
      pokemon.variant,
    );
}

export function getBattleSpriteId(pokemon: Pokemon, back?: boolean, ignoreOverride = false): string {
  if (back === undefined) {
    back = pokemon.isPlayer();
  }
  return pokemon
    .getSpeciesForm(ignoreOverride)
    .getSpriteId(
      pokemon.getGender(ignoreOverride) === Gender.FEMALE,
      pokemon.formIndex,
      pokemon.shiny,
      pokemon.variant,
      back,
    );
}

/** Compute the path to the sprite atlas by converting double underscores to path components (/)
 */
export function getSpriteAtlasPath(pokemon: Pokemon, ignoreOverride = false): string {
  const spriteId = getSpriteId(pokemon, ignoreOverride).replace(DUNDER_REGEX, "/");
  return `${/_[1-3]$/.test(spriteId) ? "variant/" : ""}${spriteId}`;
}

/**
 * Load the variant assets for the given sprite and stores them in {@linkcode variantColorCache}.
 * @param spriteKey the key of the sprite to load
 * @param fileRoot the root path of the sprite file
 * @param variant the variant to load
 * @param scene the scene to load the assets in (defaults to the global scene)
 */
export async function loadPokemonVariantAssets(
  spriteKey: string,
  fileRoot: string,
  variant: Variant,
  scene: BattleScene = globalScene,
) {
  if (variantColorCache.hasOwnProperty(spriteKey)) {
    return;
  }
  const useExpSprite = scene.experimentalSprites && hasExpSprite(spriteKey);
  if (useExpSprite) {
    fileRoot = `exp/${fileRoot}`;
  }
  let variantConfig = variantData;
  fileRoot.split("/").map(p => (variantConfig ? (variantConfig = variantConfig[p]) : null));
  const variantSet = variantConfig as VariantSet;
  if (!variantConfig || variantSet[variant] !== 1) {
    return;
  }
  variantColorCache[spriteKey] = await scene
    .cachedFetch(`./images/pokemon/variant/${fileRoot}.json`)
    .then(res => res.json());
}
