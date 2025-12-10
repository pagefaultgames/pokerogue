import { globalScene } from "#app/global-scene";
import { BattleSpec } from "#enums/battle-spec";
import { BiomeId } from "#enums/biome-id";
import type { Pokemon } from "#field/pokemon";
import type { Variant } from "#sprites/variant";
import { toCamelCase } from "#utils/string-utils";
import i18next from "i18next";
import { randSeedItem } from "./rng-utils";

/**
 * Select a random i18n entry from all nested keys in the given object.
 * @param key - The i18n key to retrieve a random value of.
 * The key's value should be an object containing numerical keys (starting from 1).
 * @returns A tuple containing the key and value pair.
 * @privateRemarks
 * The reason such "array-like" keys are not stored as actual arrays is due to the
 * translation software used by the Translation Team (Mozilla Pontoon)
 * not supporting arrays in any capacity.
 */
export function getRandomLocaleEntry(key: string): [key: string, value: string] {
  const keyName = `${key}.${randSeedItem(Object.keys(i18next.t(key, { returnObjects: true })))}`;
  return [keyName, i18next.t(keyName)];
}

/**
 * Retrieves the Pokemon's name, potentially with an affix indicating its role (wild or foe) in the current battle context, translated
 * @param pokemon - The {@linkcode Pokemon} to retrieve the name of. Will return 'Missingno' as a fallback if null/undefined
 * @param useIllusion - Whether we want the name of the illusion or not; default `true`
 * @returns The localized name of `pokemon` complete with affix. Ex: "Wild Gengar", "Ectoplasma sauvage"
 */
// TODO: Remove this and switch to using i18n context selectors based on pokemon trainer class - this causes incorrect locales
// TODO: don't accept `undefined` for the `pokemon` parameter?
export function getPokemonNameWithAffix(pokemon: Pokemon | undefined, useIllusion = true): string {
  if (!pokemon) {
    return "MissingNo.";
  }

  switch (globalScene.currentBattle.battleSpec) {
    case BattleSpec.DEFAULT:
      return pokemon.isEnemy()
        ? pokemon.hasTrainer()
          ? i18next.t("battle:foePokemonWithAffix", {
              pokemonName: pokemon.getNameToRender(useIllusion),
            })
          : i18next.t("battle:wildPokemonWithAffix", {
              pokemonName: pokemon.getNameToRender(useIllusion),
            })
        : pokemon.getNameToRender(useIllusion);
    case BattleSpec.FINAL_BOSS:
      return pokemon.isEnemy()
        ? i18next.t("battle:foePokemonWithAffix", { pokemonName: pokemon.getNameToRender(useIllusion) })
        : pokemon.getNameToRender(useIllusion);
    default:
      return pokemon.getNameToRender(useIllusion);
  }
}

/**
 * Determines if all the necessary sprites exist for the given language.
 * @remarks
 * If the given language is not in the function, it means the English version will be used as a fallback.
 *
 * English itself counts as not available.
 * @returns Whether all localized images used by the game have been added for the given language
 */
export function hasAllLocalizedSprites(lang?: string): boolean {
  // IMPORTANT - ONLY ADD YOUR LANG HERE IF YOU'VE ALREADY ADDED ALL THE NECESSARY IMAGES
  if (!lang) {
    lang = i18next.resolvedLanguage;
  }

  switch (lang) {
    case "es-ES":
    case "es-419":
    case "fr":
    case "da":
    case "de":
    case "it":
    case "zh-Hans":
    case "zh-Hant":
    case "pt-BR":
    case "ro":
    case "tr":
    case "ko":
    case "ja":
    case "ca":
    case "ru":
    case "tl":
    case "nb-NO":
      return true;
    default:
      return false;
  }
}

/**
 * Helper method to localize a sprite key (e.g. for types)
 * @param baseKey the base key of the sprite (e.g. `type`)
 * @returns the localized sprite key
 */
export function getLocalizedSpriteKey(baseKey: string) {
  return `${baseKey}${hasAllLocalizedSprites(i18next.resolvedLanguage) ? `_${i18next.resolvedLanguage}` : ""}`;
}

export function formatLargeNumber(count: number, threshold: number): string {
  if (count < threshold) {
    return count.toString();
  }
  const ret = count.toString();
  let suffix = "";
  switch (Math.ceil(ret.length / 3) - 1) {
    case 1:
      suffix = i18next.t("common:abrThousand");
      break;
    case 2:
      suffix = i18next.t("common:abrMillion");
      break;
    case 3:
      suffix = i18next.t("common:abrBillion");
      break;
    case 4:
      suffix = i18next.t("common:abrTrillion");
      break;
    case 5:
      suffix = i18next.t("common:abrQuadrillion");
      break;
    default:
      return "?";
  }
  const digits = ((ret.length + 2) % 3) + 1;
  let decimalNumber = ret.slice(digits, digits + 2);
  while (decimalNumber.endsWith("0")) {
    decimalNumber = decimalNumber.slice(0, -1);
  }
  return `${ret.slice(0, digits)}${decimalNumber ? `.${decimalNumber}` : ""}${suffix}`;
}

// Abbreviations from 10^0 to 10^33
export function getAbbreviationsLargeNumber(): string[] {
  return [
    "",
    i18next.t("common:abrThousand"),
    i18next.t("common:abrMillion"),
    i18next.t("common:abrBillion"),
    i18next.t("common:abrTrillion"),
    i18next.t("common:abrQuadrillion"),
    i18next.t("common:abrQuintillion"),
    i18next.t("common:abrSextillion"),
    i18next.t("common:abrSeptillion"),
    i18next.t("common:abrOctillion"),
    i18next.t("common:abrNonillion"),
    i18next.t("common:abrDecillion"),
  ];
}

/** Get the localized shiny descriptor for the provided variant
 * @param variant - The variant to get the shiny descriptor for
 * @returns The localized shiny descriptor
 */
export function getShinyDescriptor(variant: Variant): string {
  switch (variant) {
    case 2:
      return i18next.t("common:epicShiny");
    case 1:
      return i18next.t("common:rareShiny");
    case 0:
      return i18next.t("common:commonShiny");
  }
}

export function getBiomeName(biome: BiomeId | -1) {
  if (biome === -1) {
    return i18next.t("biome:unknownLocation");
  }
  switch (biome) {
    case BiomeId.GRASS:
      return i18next.t("biome:grass");
    case BiomeId.RUINS:
      return i18next.t("biome:ruins");
    case BiomeId.END:
      return i18next.t("biome:end");
    default:
      return i18next.t(`biome:${toCamelCase(BiomeId[biome])}`);
  }
}
