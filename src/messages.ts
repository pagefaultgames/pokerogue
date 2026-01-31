import { globalScene } from "#app/global-scene";
import { BattleSpec } from "#enums/battle-spec";
import type { Pokemon } from "#field/pokemon";
import i18next from "i18next";

/**
 * Retrieves the Pokemon's name, potentially with an affix indicating its role (wild or foe) in the current battle context, translated
 * @param pokemon - The {@linkcode Pokemon} to retrieve the name of. Will return `"MissingNo."` as a fallback if `undefined`
 * @param useIllusion - (Default `true`) Whether we want the name of the illusion or not
 * @returns The localized name of `pokemon` complete with affix. Ex: "Wild Gengar", "Ectoplasma sauvage"
 */
// TODO: this shouldn't accept `undefined`
// TODO: Remove this and switch to using i18n context selectors based on pokemon trainer class - this causes incorrect locales
export function getPokemonNameWithAffix(pokemon: Pokemon | undefined, useIllusion = true): string {
  if (!pokemon) {
    return "MissingNo.";
  }

  const pokemonName = pokemon.getNameToRender({ useIllusion });
  if (!pokemon.isEnemy()) {
    return pokemonName;
  }

  // Even though the final boss is a "wild"/"trainerless" Pokemon, it uses "Foe" instead of "Wild"
  const useFoePrefix = globalScene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS || pokemon.hasTrainer();
  const i18nkey = useFoePrefix ? "battle:foePokemonWithAffix" : "battle:wildPokemonWithAffix";
  return i18next.t(i18nkey, { pokemonName });
}
