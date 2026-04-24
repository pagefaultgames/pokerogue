import { Gender } from "#data/gender";
import type { Pokemon } from "#field/pokemon";
import { hasExpSprite } from "#sprites/sprite-utils";
import type { Variant, VariantSet } from "#sprites/variant";
import { variantColorCache, variantData } from "#sprites/variant";
import { settings } from "#system/settings-manager";
import { cachedFetch } from "#utils/fetch-utils";

// Regex patterns

/** Regex matching double underscores */
const DUNDER_REGEX = /_{2}/g;

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
 * Load the variant assets for the given sprite and store it in {@linkcode variantColorCache}.
 * @param spriteKey - The key of the sprite to load
 * @param fileRoot - The root path of the sprite file
 * @param variant - The variant to load
 * @param scene - The scene to load the assets in (defaults to the global scene)
 */
export async function loadPokemonVariantAssets(spriteKey: string, fileRoot: string, variant: Variant): Promise<void> {
  if (Object.hasOwn(variantColorCache, spriteKey)) {
    return;
  }

  const useExpSprite = settings.expSpritesEnabled && hasExpSprite(spriteKey);
  if (useExpSprite) {
    fileRoot = `exp/${fileRoot}`;
  }

  // TODO: this code is confusing
  let variantConfig = variantData;
  fileRoot.split("/").forEach(p => {
    if (variantConfig) {
      variantConfig = variantConfig[p];
    }
  });
  const variantSet = variantConfig as VariantSet;
  if (!variantConfig || variantSet[variant] !== 1) {
    return;
  }

  const response = await cachedFetch(`./images/pokemon/variant/${fileRoot}.json`);
  variantColorCache[spriteKey] = await response.json();
}
