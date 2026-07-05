import { PokemonType } from "#enums/pokemon-type";
import { randSeedItem } from "#utils/common";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

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
 * Retrieve the locale key used to display the given {@linkcode PokemonType}'s localized name.
 * @param type - The `PokemonType` whose locales key should be retrieved
 * @returns The locale key used to display the name of `type`.
 * @remarks
 * Should **always** be passed directly to {@linkcode i18next.t}.
 */
export function getPokemonTypeLocaleKey(type: PokemonType): string {
  return `pokemonInfo:type.${toCamelCase(PokemonType[type])}`;
}
